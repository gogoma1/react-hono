import React from 'react';
import './LatexHelpPanel.css';

const helpData = [
    {
        category: '기본 문법',
        items: [
            { syntax: '$...$', description: '인라인 수학 수식' },
            { syntax: '$$...$$', description: '블록 수학 수식 (가운데 정렬)' },
            { syntax: '\\\\', description: '줄바꿈' },
            { syntax: '\\{ \\}', description: '중괄호 { } 표시' },
        ]
    },
    {
        category: '분수 및 지수/첨자',
        items: [
            { syntax: '\\dfrac{a}{b}', description: '분수 (크게 표시)' },
            { syntax: '\\frac{a}{b}', description: '분수 (작게 표시)' },
            { syntax: 'x^{...}', description: '윗첨자 (지수)' },
            { syntax: 'x_{...}', description: '아래첨자' },
        ]
    },
    {
        category: '기호 및 연산자',
        items: [
            { syntax: '\\pm', description: '± 기호' },
            { syntax: '\\times', description: '× 곱셈 기호' },
            { syntax: '\\div', description: '÷ 나눗셈 기호' },
            { syntax: '\\le', description: '≤ (작거나 같다)' },
            { syntax: '\\ge', description: '≥ (크거나 같다)' },
            { syntax: '\\neq', description: '≠ (같지 않다)' },
            { syntax: '\\approx', description: '≈ (근사값)' },
        ]
    },
    {
        category: '루트, 합/곱, 극한, 적분',
        items: [
            { syntax: '\\sqrt{...}', description: '제곱근' },
            { syntax: '\\sqrt[n]{...}', description: 'n제곱근' },
            { syntax: '\\sum_{i=1}^{n}', description: '합 (시그마)' },
            { syntax: '\\prod_{i=1}^{n}', description: '곱 (프로덕트)' },
            { syntax: '\\lim_{x \\to \\infty}', description: '극한' },
            { syntax: '\\int_{a}^{b}', description: '적분' },
        ]
    },
    {
        category: '행렬 (matrix)',
        items: [
            { syntax: '\\begin{matrix} a & b \\\\ c & d \\end{matrix}', description: '기본 행렬 (괄호 없음)' },
            { syntax: '\\begin{pmatrix} ... \\end{pmatrix}', description: '괄호 () 행렬' },
            { syntax: '\\begin{bmatrix} ... \\end{bmatrix}', description: '대괄호 [] 행렬' },
            { syntax: '\\begin{vmatrix} ... \\end{vmatrix}', description: '수직선 | | 행렬' },
        ]
    }
];

const LatexHelpPanel: React.FC = () => {
    return (
        <div className="latex-help-panel">
            <h4 className="latex-help-title">LaTeX 문법 도움말</h4>
            <div className="latex-help-content">
                {helpData.map(section => (
                    <div key={section.category} className="help-section">
                        <h5 className="help-category-title">{section.category}</h5>
                        <table className="help-table">
                            <tbody>
                                {section.items.map(item => (
                                    <tr key={item.syntax}>
                                        <td className="syntax-cell"><code>{item.syntax}</code></td>
                                        <td className="description-cell">{item.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LatexHelpPanel;