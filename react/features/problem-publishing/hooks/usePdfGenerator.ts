import { useState, useCallback, RefObject } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PdfGeneratorProps {
    previewAreaRef: RefObject<HTMLDivElement | null>;
    getExamTitle: () => string;
    getSelectedProblemCount: () => number;
}

export function usePdfGenerator({ previewAreaRef, getExamTitle, getSelectedProblemCount }: PdfGeneratorProps) {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfMessage, setPdfMessage] = useState('');

    const handleDownloadPdf = useCallback(async () => {
        const livePreviewElement = previewAreaRef.current;
        if (!livePreviewElement || getSelectedProblemCount() === 0) {
            alert('PDF로 변환할 시험지 내용이 없습니다.');
            return;
        }

        // 1. 즉시 로딩 상태로 전환하여 UI를 먼저 업데이트합니다.
        setIsGeneratingPdf(true);
        setPdfMessage('시험지 이미지 준비 중...');

        // 2. setTimeout을 사용해 브라우저가 UI를 렌더링할 시간을 준 뒤, 무거운 작업을 시작합니다.
        setTimeout(async () => {
            const pageElements = livePreviewElement.querySelectorAll<HTMLElement>('.exam-page-component');
            if (pageElements.length === 0) {
                alert('PDF로 변환할 페이지(.exam-page-component)를 찾을 수 없습니다.');
                setIsGeneratingPdf(false);
                setPdfMessage('');
                return;
            }
            
            const printContainer = document.createElement('div');
            Object.assign(printContainer.style, {
                position: 'absolute',
                left: '-9999px',
                top: '0px',
                width: `${livePreviewElement.offsetWidth}px`,
            });
            document.body.appendChild(printContainer);
            
            try {
                pageElements.forEach(page => {
                    const clone = page.cloneNode(true) as HTMLElement;

                    // --- [핵심 수정] 복제된 요소에서 직접 불필요한 UI들을 제거합니다. ---
                    clone.querySelectorAll('.editable-trigger-button .edit-icon-overlay').forEach(el => el.remove());
                    clone.querySelectorAll('.problem-deselect-button').forEach(el => el.remove());
                    clone.querySelectorAll('.measured-height').forEach(el => el.remove());
                    clone.querySelectorAll('.global-index').forEach(el => el.remove());
                    
                    // 점선 테두리를 제거하여 PDF를 깔끔하게 만듭니다.
                    clone.querySelectorAll<HTMLElement>('.problem-container').forEach(el => {
                        el.style.border = 'none';
                    });
                    // ----------------------------------------------------------------

                    printContainer.appendChild(clone);
                });
                
                const scale = 2;
                const firstClonedPage = printContainer.querySelector<HTMLElement>('.exam-page-component');
                if (!firstClonedPage) throw new Error("복제된 요소를 찾을 수 없습니다.");

                const singlePageWidth = firstClonedPage.offsetWidth;
                const singlePageHeight = firstClonedPage.offsetHeight;
                const singlePageOffsetX = firstClonedPage.offsetLeft;

                const canvas = await html2canvas(printContainer, {
                    scale: scale,
                    useCORS: true,
                    logging: false,
                    width: printContainer.scrollWidth,
                    height: printContainer.scrollHeight,
                });

                setPdfMessage('PDF 파일로 변환 중입니다...');
                
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const VERTICAL_MARGIN_MM = 10;

                for (let i = 0; i < pageElements.length; i++) {
                    if (i > 0) pdf.addPage();
                    
                    const sourceY = (singlePageHeight * i) * scale;
                    
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = singlePageWidth * scale;
                    tempCanvas.height = singlePageHeight * scale;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    if (tempCtx) {
                        tempCtx.drawImage(
                            canvas,
                            singlePageOffsetX * scale, sourceY,
                            singlePageWidth * scale, singlePageHeight * scale,
                            0, 0,
                            singlePageWidth * scale, singlePageHeight * scale
                        );
                        
                        const pageImgData = tempCanvas.toDataURL('image/png');
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
                }
                
                const examTitle = getExamTitle() || '시험지';
                pdf.save(`${examTitle}.pdf`);

            } catch (error) {
                console.error("PDF 생성 중 오류 발생:", error);
                alert("PDF를 생성하는 데 실패했습니다. 콘솔을 확인해주세요.");
            } finally {
                document.body.removeChild(printContainer);
                setIsGeneratingPdf(false);
                setPdfMessage('');
            }
        }, 50); // 50ms 정도의 짧은 지연으로 렌더링 보장

    }, [previewAreaRef, getExamTitle, getSelectedProblemCount]);

    return {
        isGeneratingPdf,
        pdfProgress: { current: isGeneratingPdf ? 1 : 0, total: isGeneratingPdf ? 1 : 0, message: pdfMessage },
        onDownloadPdf: handleDownloadPdf,
        onCancelPdfGeneration: () => {},
    };
}