// ./react/features/image-upload/model/useImageUploadManager.ts

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
        const urlObject = new URL(url);
        const pathSegments = urlObject.pathname.split('/').filter(Boolean);
        return pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
    } catch (e) {
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
    const uploadMutation = useUploadImageMutation();
    const deleteMutation = useDeleteImageMutation();

    const [extractedImages, setExtractedImages] = useState<string[]>([]);
    const [localUrls, setLocalUrls] = useState<Record<string, string | undefined>>({});
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentUploadingTag, setCurrentUploadingTag] = useState<string | null>(null);
    const [isUploadingAll, setIsUploadingAll] = useState(false);
    
    const [draggingTag, setDraggingTag] = useState<string | null>(null);
    const [dragOverTag, setDragOverTag] = useState<string | null>(null);

    useEffect(() => {
        const imageRegex = /\*\*\*이미지\d+\*\*\*/g;
        const matches = markdownInput.match(imageRegex);
        const uniqueMatches = matches ? [...new Set(matches)].sort() : [];

        if (JSON.stringify(extractedImages) !== JSON.stringify(uniqueMatches)) {
            setExtractedImages(uniqueMatches);
            
            setLocalUrls(prev => {
                const next: Record<string, string | undefined> = {};
                uniqueMatches.forEach(tag => {
                    next[tag] = prev[tag] || undefined;
                });
                return next;
            });
        }
    }, [markdownInput, extractedImages]);

    // [핵심 수정 1] 이미지 교체 로직 강화
    const uploadImage = useCallback(async (file: File, imageTag: string): Promise<void> => {
        const oldUrl = localUrls[imageTag];
        setCurrentUploadingTag(imageTag);

        try {
            // 1. 새 이미지 업로드 (실패 시 여기서 에러 발생)
            const { url: newUrl, key: newKey } = await uploadMutation.mutateAsync(file);

            // 2. 업로드 성공 시, 즉시 UI 상태 업데이트
            setLocalUrls(prev => ({ ...prev, [imageTag]: newUrl }));

            // 3. 기존 이미지가 있었다면, 백그라운드에서 삭제 처리 (fire-and-forget)
            if (oldUrl) {
                const oldKey = extractKeyFromUrl(oldUrl);
                if (oldKey && oldKey !== newKey) {
                    // 삭제 실패는 사용자 경험을 막지 않되, 콘솔에는 에러를 남김
                    deleteMutation.mutate(oldKey, {
                        onSuccess: () => {
                            console.log(`Successfully deleted old image (key: ${oldKey})`);
                        },
                        onError: (deleteError) => {
                            console.error(`Failed to delete old image (key: ${oldKey}):`, deleteError);
                            // 필요하다면 사용자에게 알림을 줄 수도 있습니다.
                            // alert(`이전 이미지(${oldKey}) 삭제에 실패했습니다. 수동으로 확인해주세요.`);
                        }
                    });
                }
            }
        } catch (uploadError) {
            console.error(`Upload failed for tag ${imageTag}:`, uploadError);
            // 에러를 다시 던져서 호출한 쪽(handleFileSelected)에서 잡을 수 있도록 함
            throw uploadError;
        } finally {
            // 성공/실패 여부와 관계없이 개별 업로드 상태는 초기화
            setCurrentUploadingTag(null);
        }
    }, [localUrls, uploadMutation, deleteMutation]);

    const cleanupAfterSelection = useCallback(() => {
        setIsUploadingAll(false);
        if (fileInputRef.current) {
            fileInputRef.current.removeAttribute('multiple');
            fileInputRef.current.value = ''; // 선택된 파일 초기화
        }
    }, []);
    
    // [핵심 수정 2] 파일 선택 핸들러에 try/catch/finally 추가하여 안정성 확보
    const handleFileSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            cleanupAfterSelection();
            return;
        }

        try {
            if (isUploadingAll) {
                const pendingTags = extractedImages.filter(tag => !localUrls[tag]);
                const filesToUpload = Array.from(files).slice(0, pendingTags.length);
                
                // Promise.all로 여러 파일 업로드 처리
                const uploadPromises = filesToUpload.map((file, i) => uploadImage(file, pendingTags[i]));
                await Promise.all(uploadPromises);

            } else if (currentUploadingTag) {
                // 단일 파일 업로드 처리
                await uploadImage(files[0], currentUploadingTag);
            }
        } catch (error) {
            // uploadImage에서 던져진 에러를 여기서 잡음
            console.error('An error occurred during file upload process:', error);
            alert('파일 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            // 성공/실패와 관계없이 항상 뒷정리 로직을 실행하여 UI가 멈추지 않도록 함
            cleanupAfterSelection();
        }
    }, [isUploadingAll, currentUploadingTag, extractedImages, localUrls, uploadImage, cleanupAfterSelection]);
    
    const handleUploadSingleClick = useCallback((imageTag: string) => {
        setIsUploadingAll(false);
        setCurrentUploadingTag(imageTag); // 어떤 태그에 대한 업로드인지 먼저 설정
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

    // [핵심 수정 3] 드래그앤드롭 로직은 그대로 사용 (UI 연결만 변경)
    const handleDragStart = useCallback((e: React.DragEvent<HTMLElement>, tag: string) => {
        // 이미지가 없는 항목은 드래그할 수 없음
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
        // 자기 자신에게 드롭하거나, 소스 태그가 없는 경우는 무시
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
        e.preventDefault(); // 드롭을 허용하기 위해 필수
        if (tag !== draggingTag) {
            setDragOverTag(tag);
        }
    }, [draggingTag]);
    
    const handleDragLeave = useCallback(() => setDragOverTag(null), []);

    const handleDragEnd = useCallback(() => {
        // 드래그가 취소되거나 완료될 때 상태 초기화
        setDraggingTag(null);
        setDragOverTag(null);
    }, []);

    const { uploadStatuses, uploadedUrls, uploadErrors } = useMemo(() => {
        const statuses: Record<string, UploadStatus> = {};
        const errors: Record<string, string | null> = {};

        extractedImages.forEach(tag => {
            if (currentUploadingTag === tag || (isUploadingAll && !localUrls[tag] && uploadMutation.isPending)) {
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
    }, [extractedImages, localUrls, currentUploadingTag, isUploadingAll, uploadMutation.isPending, uploadMutation.isError, uploadMutation.error]);

    const pendingUploadCount = useMemo(() => extractedImages.filter(tag => !localUrls[tag]).length, [extractedImages, localUrls]);
    const canApply = useMemo(() => extractedImages.length > 0 && extractedImages.every(tag => !!localUrls[tag]), [extractedImages, localUrls]);

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