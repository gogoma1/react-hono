import { useState, useCallback, RefObject, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PdfGeneratorProps {
    previewAreaRef: RefObject<HTMLDivElement | null>;
    getExamTitle: () => string;
    getSelectedProblemCount: () => number;
}

export interface PdfExportOptions {
    includeProblems: boolean;
    includeAnswers: boolean;
    includeSolutions: boolean;
}

export function usePdfGenerator({ previewAreaRef, getExamTitle, getSelectedProblemCount }: PdfGeneratorProps) {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0, message: '' });
    
    const isProcessingRef = useRef(false);

    const generatePdf = useCallback(async (options: PdfExportOptions) => {
        if (isProcessingRef.current) return;
        
        const livePreviewElement = previewAreaRef.current;
        if (!livePreviewElement || getSelectedProblemCount() === 0) {
            alert('PDF로 변환할 시험지 내용이 없습니다.');
            return;
        }

        const selectors = [];
        if (options.includeProblems) selectors.push('.problem-page-type');
        if (options.includeAnswers) selectors.push('.answer-page-type');
        if (options.includeSolutions) selectors.push('.solution-page-type');

        if (selectors.length === 0) {
            alert('PDF로 출력할 항목을 하나 이상 선택해주세요.');
            return;
        }
        
        const selectorString = selectors.join(', ');

        isProcessingRef.current = true;
        setIsGeneratingPdf(true);
        setPdfProgress({ current: 0, total: 1, message: '준비 중...' });

        setTimeout(async () => {
            const pageElements = livePreviewElement.querySelectorAll<HTMLElement>(selectorString);

            if (pageElements.length === 0) {
                alert('선택된 항목에 해당하는 페이지가 없습니다. PDF를 생성할 수 없습니다.');
                setIsGeneratingPdf(false);
                setPdfProgress({ current: 0, total: 0, message: '' });
                isProcessingRef.current = false;
                return;
            }

            setPdfProgress({ current: 0, total: pageElements.length, message: '시험지 정리 중...' });
            
            const printContainer = document.createElement('div');
            Object.assign(printContainer.style, {
                position: 'absolute', left: '-9999px', top: '0px',
                width: `${livePreviewElement.offsetWidth}px`,
            });
            document.body.appendChild(printContainer);
            
            try {
                pageElements.forEach(page => {
                    const clone = page.cloneNode(true) as HTMLElement;
                    clone.querySelectorAll('.editable-trigger-button .edit-icon-overlay, .problem-deselect-button, .measured-height, .global-index').forEach(el => el.remove());
                    clone.querySelectorAll<HTMLElement>('.problem-container').forEach(el => { el.style.border = 'none'; });
                    printContainer.appendChild(clone);
                });
                
                const scale = 2;
                const firstClonedPage = printContainer.querySelector<HTMLElement>('.exam-page-component');
                if (!firstClonedPage) throw new Error("복제된 요소를 찾을 수 없습니다.");

                // --- [핵심 복원] 기존의 안정적인 오프셋 및 크기 계산 로직 유지 ---
                const singlePageWidth = firstClonedPage.offsetWidth;
                const singlePageHeight = firstClonedPage.offsetHeight;
                const singlePageOffsetX = firstClonedPage.offsetLeft;
                
                setPdfProgress(prev => ({ ...prev, message: '시험지 이미지 생성 중...' }));
                
                // [핵심 복원] 캔버스 생성 시 printContainer의 scrollWidth와 scrollHeight를 사용
                const canvas = await html2canvas(printContainer, {
                    scale: scale,
                    useCORS: true,
                    logging: false,
                    width: printContainer.scrollWidth,
                    height: printContainer.scrollHeight,
                });
                
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const VERTICAL_MARGIN_MM = 10;

                for (let i = 0; i < pageElements.length; i++) {
                    const percentage = Math.round(((i + 1) / pageElements.length) * 100);
                    setPdfProgress(prev => ({ ...prev, current: i + 1, message: `${percentage}% 변환 중...` }));

                    if (i > 0) pdf.addPage();
                    
                    // --- [핵심 복원] 기존의 이미지 자르기 로직을 그대로 사용 ---
                    const sourceY = (singlePageHeight * i) * scale;
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = singlePageWidth * scale;
                    tempCanvas.height = singlePageHeight * scale;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    if (tempCtx) {
                        // [핵심 복원] drawImage 호출 시 singlePageOffsetX를 사용하여 정확한 위치에서 잘라냄
                        tempCtx.drawImage(canvas, singlePageOffsetX * scale, sourceY, singlePageWidth * scale, singlePageHeight * scale, 0, 0, singlePageWidth * scale, singlePageHeight * scale);
                        const pageImgData = tempCtx.canvas.toDataURL('image/png');
                        const availableHeight = pdfHeight - (VERTICAL_MARGIN_MM * 2);
                        const imageAspectRatio = singlePageWidth / singlePageHeight;
                        let imgHeight = availableHeight;
                        let imgWidth = imgHeight * imageAspectRatio;
                        if (imgWidth > pdfWidth) {
                            imgWidth = pdfWidth;
                            imgHeight = imgWidth / imageAspectRatio;
                        }
                        const xOffset = (pdfWidth - imgWidth) / 2;
                        const yOffset = (pdfHeight - imgHeight) / 2;
                        pdf.addImage(pageImgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
                    }
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
                
                const examTitle = getExamTitle() || '시험지';
                pdf.save(`${examTitle}.pdf`);

            } catch (error) {
                console.error("PDF 생성 중 오류 발생:", error);
                alert("PDF를 생성하는 데 실패했습니다. 콘솔을 확인해주세요.");
            } finally {
                document.body.removeChild(printContainer);
                setIsGeneratingPdf(false);
                setPdfProgress({ current: 0, total: 0, message: '' });
                isProcessingRef.current = false;
            }
        }, 50);

    }, [previewAreaRef, getExamTitle, getSelectedProblemCount]);

    const progressPercentage = pdfProgress.total > 0 ? Math.round((pdfProgress.current / pdfProgress.total) * 100) : 0;
    const loadingMessage = pdfProgress.message || (isGeneratingPdf ? '변환 중...' : '');
    const finalLoadingText = isGeneratingPdf && pdfProgress.total > 0 && progressPercentage > 0 ? `${loadingMessage} (${progressPercentage}%)` : loadingMessage;
    
    return {
        isGeneratingPdf,
        pdfProgress: { ...pdfProgress, message: finalLoadingText || pdfProgress.message },
        generatePdf,
    };
}