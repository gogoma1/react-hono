import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useUploadImageMutation, useDeleteImageMutation } from './useImageUploadWithRQ';

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * URL 문자열에서 마지막 경로 세그먼트를 파일 키로 추출합니다.
 * @param url - R2 공개 URL
 * @returns 추출된 키 또는 null
 */
function extractKeyFromUrl(url: string): string | null {
    if (!url) return null;
    try {
        // 정식 URL 객체를 사용하여 파싱 시도
        const urlObject = new URL(url);
        const pathSegments = urlObject.pathname.split('/').filter(Boolean);
        return pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
    } catch (e) {
        // URL 파싱 실패 시 (예: 상대 경로), 마지막 슬래시 기준으로 추출
        console.warn(`Could not parse URL, falling back to substring: ${url}`, e);
        const lastSlashIndex = url.lastIndexOf('/');
        if (lastSlashIndex !== -1 && lastSlashIndex < url.length - 1) {
            return url.substring(lastSlashIndex + 1);
        }
        return null;
    }
}

/**
 * Markdown 텍스트 내의 이미지 참조를 관리하고,
 * R2에 이미지를 업로드/교체/정렬하는 로직을 담당하는 커스텀 훅.
 * @param markdownInput - 현재 에디터의 Markdown 텍스트
 */
export function useImageUploadManager(markdownInput: string) {
    // 1. React Query Mutations: API 통신 로직
    const uploadMutation = useUploadImageMutation();
    const deleteMutation = useDeleteImageMutation();

    // 2. Local State: UI 상호작용 및 동기화에 필요한 최소한의 상태
    const [extractedImages, setExtractedImages] = useState<string[]>([]);
    const [localUrls, setLocalUrls] = useState<Record<string, string | undefined>>({});
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentUploadingTag, setCurrentUploadingTag] = useState<string | null>(null);
    const [isUploadingAll, setIsUploadingAll] = useState(false);
    
    const [draggingTag, setDraggingTag] = useState<string | null>(null);
    const [dragOverTag, setDragOverTag] = useState<string | null>(null);

    // 3. Effect: Markdown 텍스트가 변경될 때마다 이미지 태그를 다시 추출
    useEffect(() => {
        const imageRegex = /\*\*\*이미지\d+\*\*\*/g;
        const matches = markdownInput.match(imageRegex);
        const uniqueMatches = matches ? [...new Set(matches)].sort() : [];

        // 태그 목록에 변화가 있을 때만 상태 업데이트
        if (JSON.stringify(extractedImages) !== JSON.stringify(uniqueMatches)) {
            setExtractedImages(uniqueMatches);
            
            // 새 태그 목록에 맞춰 localUrls 상태를 정리 (기존 URL은 유지)
            setLocalUrls(prev => {
                const next: Record<string, string | undefined> = {};
                uniqueMatches.forEach(tag => {
                    next[tag] = prev[tag] || undefined;
                });
                return next;
            });
        }
    }, [markdownInput, extractedImages]);

    // 4. Core Logic: 이미지 업로드 및 교체 처리 함수
    const uploadImage = useCallback(async (file: File, imageTag: string): Promise<void> => {
        const oldUrl = localUrls[imageTag];
        setCurrentUploadingTag(imageTag); // 현재 어떤 태그가 업로드 중인지 표시

        try {
            // API 통신을 mutation에 위임
            const { url: newUrl, key: newKey } = await uploadMutation.mutateAsync(file);

            // 업로드 성공 후, 이전 이미지가 있었다면 삭제
            if (oldUrl) {
                const oldKey = extractKeyFromUrl(oldUrl);
                if (oldKey && oldKey !== newKey) {
                    // 삭제는 백그라운드에서 진행. 실패해도 전체 로직에 영향을 주지 않음.
                    deleteMutation.mutate(oldKey, {
                        onError: (deleteError) => {
                            console.error(`Failed to delete old image (key: ${oldKey}):`, deleteError);
                        }
                    });
                }
            }
            // 로컬 URL 상태 업데이트
            setLocalUrls(prev => ({ ...prev, [imageTag]: newUrl }));
        } catch (error) {
            console.error(`Upload failed for tag ${imageTag}:`, error);
            // 에러를 다시 던져서 Promise.all 등에서 잡을 수 있게 함
            throw error;
        } finally {
            setCurrentUploadingTag(null); // 업로드 프로세스(성공/실패) 종료
        }
    }, [localUrls, uploadMutation, deleteMutation]);

    // 5. Event Handlers: UI 이벤트를 처리하는 콜백 함수들
    const cleanupAfterSelection = useCallback(() => {
        setIsUploadingAll(false);
        // currentUploadingTag는 uploadImage 함수 내에서 제어하므로 여기선 초기화하지 않음.
        if (fileInputRef.current) {
            fileInputRef.current.removeAttribute('multiple');
            fileInputRef.current.value = ''; // 선택된 파일 초기화
        }
    }, []);
    
    const handleFileSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            cleanupAfterSelection();
            return;
        }

        if (isUploadingAll) {
            const pendingTags = extractedImages.filter(tag => !localUrls[tag]);
            const filesToUpload = Array.from(files).slice(0, pendingTags.length);
            
            const uploadPromises = filesToUpload.map((file, i) => uploadImage(file, pendingTags[i]));
            
            try {
                await Promise.all(uploadPromises);
            } catch (error) {
                console.error('One or more uploads failed during bulk upload.', error);
                // 사용자에게 부분 실패에 대한 알림을 줄 수 있음
                alert('일부 파일 업로드에 실패했습니다. 확인해주세요.');
            }
        } else if (currentUploadingTag) {
            await uploadImage(files[0], currentUploadingTag);
        }
        cleanupAfterSelection();
    }, [isUploadingAll, currentUploadingTag, extractedImages, localUrls, uploadImage, cleanupAfterSelection]);
    
    const handleUploadSingleClick = useCallback((imageTag: string) => {
        setIsUploadingAll(false);
        setCurrentUploadingTag(imageTag);
        fileInputRef.current?.click();
    }, []);

    const handleUploadAll = useCallback(() => {
        const pendingTagsCount = extractedImages.filter(tag => !localUrls[tag]).length;
        if (pendingTagsCount === 0) {
            alert('업로드할 이미지가 없습니다.');
            return;
        }
        setIsUploadingAll(true);
        setCurrentUploadingTag(null);
        if (fileInputRef.current) {
            fileInputRef.current.setAttribute('multiple', 'true');
            fileInputRef.current.click();
        }
    }, [extractedImages, localUrls]);

    // 6. Drag and Drop Handlers
    const handleDragStart = useCallback((e: React.DragEvent<HTMLElement>, tag: string) => {
        if (!localUrls[tag]) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', tag);
        e.dataTransfer.effectAllowed = 'move';
        setDraggingTag(tag);
    }, [localUrls]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLElement>, targetTag: string) => {
        e.preventDefault();
        const sourceTag = e.dataTransfer.getData('text/plain');
        if (sourceTag && targetTag && sourceTag !== targetTag) {
            setLocalUrls(prev => {
                const newUrls = { ...prev };
                // URL 스왑
                [newUrls[sourceTag], newUrls[targetTag]] = [newUrls[targetTag], newUrls[sourceTag]];
                return newUrls;
            });
        }
        setDraggingTag(null);
        setDragOverTag(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>, tag: string) => {
        e.preventDefault();
        if (tag !== draggingTag) {
            setDragOverTag(tag);
        }
    }, [draggingTag]);
    
    const handleDragLeave = useCallback(() => setDragOverTag(null), []);
    const handleDragEnd = useCallback(() => {
        setDraggingTag(null);
        setDragOverTag(null);
    }, []);

    // 7. Derived State: 로컬 상태와 React-Query 상태를 조합하여 UI에 필요한 최종 상태 계산
    const { uploadStatuses, uploadedUrls, uploadErrors } = useMemo(() => {
        const statuses: Record<string, UploadStatus> = {};
        const errors: Record<string, string | null> = {};

        extractedImages.forEach(tag => {
            if (currentUploadingTag === tag && uploadMutation.isPending) {
                statuses[tag] = 'loading';
            } else if (localUrls[tag]) {
                statuses[tag] = 'success';
            } else if (currentUploadingTag === tag && uploadMutation.isError) {
                statuses[tag] = 'error';
                errors[tag] = uploadMutation.error?.message || 'Unknown upload error';
            } else {
                statuses[tag] = 'idle';
            }
        });

        return { uploadStatuses: statuses, uploadedUrls: localUrls, uploadErrors: errors };
    }, [extractedImages, localUrls, currentUploadingTag, uploadMutation.isPending, uploadMutation.isError, uploadMutation.error]);

    const pendingUploadCount = useMemo(() => extractedImages.filter(tag => !localUrls[tag]).length, [extractedImages, localUrls]);
    const canApply = useMemo(() => extractedImages.length > 0 && extractedImages.every(tag => !!localUrls[tag]), [extractedImages, localUrls]);

    // 8. Return: UI 컴포넌트(ImageManager)에 필요한 모든 상태와 핸들러를 반환
    return {
        extractedImages,
        uploadStatuses,
        uploadedUrls,
        uploadErrors,
        fileInputRef,
        draggingTag,
        dragOverTag,
        pendingUploadCount,
        canApply,
        handleFileSelected,
        onUploadSingle: handleUploadSingleClick,
        onUploadAll: handleUploadAll,
        onDragStart: handleDragStart,
        onDrop: handleDrop,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDragEnd: handleDragEnd,
    };
}