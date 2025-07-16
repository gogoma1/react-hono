import React, { useMemo, useState, useCallback } from 'react';
import { LuCopy, LuCopyCheck } from 'react-icons/lu';
import type { ProcessedProblem } from '../../problem-publishing/model/problemPublishingStore';
import ActionButton from '../../../shared/ui/actionbutton/ActionButton';
import './JsonViewerPanel.css';

interface JsonViewerPanelProps {
    problems: ProcessedProblem[];
}

const JsonViewerPanel: React.FC<JsonViewerPanelProps> = ({ problems }) => {
    const [isCopied, setIsCopied] = useState(false);

    const problemsForJson = useMemo(() => {
        return problems.map(p => {
            return {
                problem_id: p.problem_id,
                question_number: p.question_number,
                problem_type: p.problem_type,
                question_text: p.question_text,
                answer: p.answer,
                solution_text: p.solution_text,
                page: p.page,
                grade: p.grade,
                semester: p.semester,
                subtitle: p.subtitle, // [수정] source -> subtitle
                major_chapter_id: p.major_chapter_id,
                middle_chapter_id: p.middle_chapter_id,
                core_concept_id: p.core_concept_id,
                problem_category: p.problem_category,
                difficulty: p.difficulty,
                score: p.score,
            };
        });
    }, [problems]);

    const jsonString = useMemo(() => {
        if (problemsForJson.length === 0) {
            return "{\n  \"problems\": []\n}";
        }
        return JSON.stringify({ problems: problemsForJson }, null, 2);
    }, [problemsForJson]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(jsonString).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy JSON: ', err);
            alert('클립보드 복사에 실패했습니다.');
        });
    }, [jsonString]);

    return (
        <div className="json-viewer-panel">
            <div className="json-viewer-header">
                <h4 className="json-viewer-title">필터링된 문제 JSON 변환</h4>
                <ActionButton onClick={handleCopy} className="primary">
                    {isCopied ? <LuCopyCheck size={16} /> : <LuCopy size={16} />}
                    {isCopied ? '복사 완료!' : 'JSON 복사'}
                </ActionButton>
            </div>
            <div className="json-viewer-content">
                <pre><code>{jsonString}</code></pre>
            </div>
        </div>
    );
};

export default JsonViewerPanel;