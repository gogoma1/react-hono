import React, { useState } from 'react';
import { useGroupedProblemSetsQuery, useCurriculumViewQuery } from '../model/useProblemSetQuery';
import { 
    LuLoader, LuCircleAlert, LuChevronDown, LuChevronRight, 
    LuBookCopy, LuGraduationCap, LuComponent, LuFolder, LuBook, LuFileText
} from 'react-icons/lu';
import SegmentedControl from '../../../shared/ui/segmented-control/SegmentedControl';
import './MyLibrary.css';

// --- 타입 및 상수 정의 ---
type ViewMode = 'problemSet' | 'grade' | 'curriculum';

const viewOptions = [
    { value: 'problemSet' as ViewMode, label: '문제집', icon: <LuBookCopy /> },
    { value: 'grade' as ViewMode, label: '학년별', icon: <LuGraduationCap /> },
    { value: 'curriculum' as ViewMode, label: '단원별', icon: <LuComponent /> },
];

// --- 재사용 가능한 자식 컴포넌트 ---
interface TreeItemProps {
    label: string;
    nodeKey: string;
    count?: number;
    level: number;
    icon?: React.ReactNode;
    isExpanded: boolean;
    isSelected: boolean;
    isAncestorOfSelected: boolean;
    onToggle: (key: string) => void;
    onSelect?: () => void;
    children?: React.ReactNode;
}

const TreeItem: React.FC<TreeItemProps> = React.memo(({ 
    label, nodeKey, count, level, icon, isExpanded, isSelected, isAncestorOfSelected, onToggle, onSelect, children 
}) => {
    const isLeaf = !children;
    const itemClassName = `tree-item ${isLeaf ? 'leaf' : 'branch'}`;
    const contentClassName = `tree-item-content ${isLeaf ? 'clickable-leaf' : 'clickable-branch'} ${isSelected ? 'selected' : ''} ${isAncestorOfSelected ? 'ancestor-selected' : ''}`;

    // [핵심] 행 전체에 대한 단일 클릭 이벤트 핸들러
    const handleContentClick = () => {
        if (isLeaf && onSelect) {
            onSelect(); // 최하위 노드(파일)는 선택 동작
        } else if (!isLeaf) {
            onToggle(nodeKey); // 중간 노드(폴더)는 확장/축소 동작
        }
    };

    const indentStyle = { paddingLeft: `${(level - 1) * 18 + 8}px` }; // 기본 패딩 8px + 레벨당 18px

    return (
        <li className={itemClassName}>
            <div className={contentClassName} onClick={handleContentClick} style={indentStyle}>
                <div className="expand-icon-wrapper">
                    {isLeaf ? <span className="icon-placeholder"/> : (isExpanded ? <LuChevronDown className="expand-icon"/> : <LuChevronRight className="expand-icon" />)}
                </div>
                {icon && <span className="item-type-icon">{icon}</span>}
                <span className="tree-item-label">{label}</span>
                {count !== undefined && <span className="tree-item-count">({count})</span>}
            </div>
            {isExpanded && children && <ul className="tree-group">{children}</ul>}
        </li>
    );
});
TreeItem.displayName = 'TreeItem';


// --- 메인 컴포넌트 ---
interface MyLibraryProps {
    onSelectionChange: (selection: any) => void;
    selectedKey: string | null;
}

const MyLibrary: React.FC<MyLibraryProps> = ({ onSelectionChange, selectedKey }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('problemSet');
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

    const { data: groupedProblemSetData, isLoading: isLoadingProblemSet, isError: isErrorProblemSet } = useGroupedProblemSetsQuery();
    const { data: curriculumData, isLoading: isLoadingCurriculum, isError: isErrorCurriculum } = useCurriculumViewQuery();
    
    const handleToggle = (key: string) => {
        setExpandedKeys(prev => {
            const newSet = new Set(prev);
            newSet.has(key) ? newSet.delete(key) : newSet.add(key);
            return newSet;
        });
    };

    const handleLeafClick = (selection: any, key: string) => {
        onSelectionChange({ ...selection, key });
    };

    const renderContent = () => {
        // ... (이 부분은 이전 답변과 동일하므로 생략)
        if (viewMode === 'problemSet' || viewMode === 'grade') {
            if (isLoadingProblemSet) return <div className="my-library-status"><LuLoader className="spinner" /> <span>데이터 로딩 중...</span></div>;
            if (isErrorProblemSet) return <div className="my-library-status error"><LuCircleAlert /> <span>오류가 발생했습니다.</span></div>;
            if (!groupedProblemSetData || groupedProblemSetData.length === 0) return <div className="my-library-status"><p>생성된 문제집(브랜드)이 없습니다.</p></div>;

            if (viewMode === 'problemSet') {
                return (
                    <ul className="tree-group">
                        {groupedProblemSetData.map(ps => {
                             const psKey = `ps-${ps.problem_set_id}`;
                             return (
                                <TreeItem key={psKey} nodeKey={psKey} label={ps.problem_set_name} level={1} icon={<LuBook />} isExpanded={expandedKeys.has(psKey)} onToggle={handleToggle} isSelected={false} isAncestorOfSelected={!!(selectedKey && selectedKey.startsWith(psKey))}>
                                    {ps.grades.map(grade => {
                                        const gradeKey = `${psKey}-grade-${grade.grade_id}`;
                                        return (
                                            <TreeItem key={gradeKey} nodeKey={gradeKey} label={grade.grade_name} level={2} icon={<LuFolder />} isExpanded={expandedKeys.has(gradeKey)} onToggle={handleToggle} isSelected={false} isAncestorOfSelected={!!(selectedKey && selectedKey.startsWith(gradeKey))}>
                                                {grade.sources.map(source => {
                                                    const sourceKey = `${gradeKey}-source-${source.source_id}`;
                                                    return <TreeItem key={sourceKey} nodeKey={sourceKey} label={source.source_name} count={source.problem_count} level={3} icon={<LuFileText />} isExpanded={false} onToggle={()=>{}} isSelected={selectedKey === sourceKey} isAncestorOfSelected={false}
                                                        onSelect={() => handleLeafClick({type: 'source', problemSetId: ps.problem_set_id, gradeId: grade.grade_id, sourceId: source.source_id}, sourceKey)} />
                                                })}
                                            </TreeItem>
                                        )
                                    })}
                                </TreeItem>
                            )
                        })}
                    </ul>
                );
            }
            
            if (viewMode === 'grade') {
                const byGrade = groupedProblemSetData.reduce<Record<string, { grade_id: string; grade_order: number; items: any[] }>>((acc, ps) => {
                    ps.grades.forEach(grade => {
                        if (!acc[grade.grade_name]) acc[grade.grade_name] = { grade_id: grade.grade_id, grade_order: grade.grade_order, items: [] };
                        acc[grade.grade_name].items.push({ ...ps, grade });
                    });
                    return acc;
                }, {});
                const sortedGrades = Object.entries(byGrade).sort(([, a], [, b]) => a.grade_order - b.grade_order);
                
                return (
                     <ul className="tree-group">
                        {sortedGrades.map(([gradeName, {grade_id, items}]) => {
                             const gradeKey = `grade-${grade_id}`;
                             return (
                                <TreeItem key={gradeKey} nodeKey={gradeKey} label={gradeName} level={1} icon={<LuFolder />} isExpanded={expandedKeys.has(gradeKey)} onToggle={handleToggle} isSelected={false} isAncestorOfSelected={!!(selectedKey && selectedKey.startsWith(gradeKey))}>
                                   {items.map(item => {
                                       const psKey = `${gradeKey}-ps-${item.problem_set_id}`;
                                       return (
                                           <TreeItem key={psKey} nodeKey={psKey} label={item.problem_set_name} level={2} icon={<LuBook />} isExpanded={expandedKeys.has(psKey)} onToggle={handleToggle} isSelected={false} isAncestorOfSelected={!!(selectedKey && selectedKey.startsWith(psKey))}>
                                               {item.grade.sources.map((source: any) => {
                                                    const sourceKey = `${psKey}-source-${source.source_id}`;
                                                    return <TreeItem key={sourceKey} nodeKey={sourceKey} label={source.source_name} count={source.problem_count} level={3} icon={<LuFileText />} isExpanded={false} onToggle={()=>{}} isSelected={selectedKey === sourceKey} isAncestorOfSelected={false}
                                                        onSelect={() => handleLeafClick({type: 'source', problemSetId: item.problem_set_id, gradeId: item.grade.grade_id, sourceId: source.source_id}, sourceKey)} />
                                               })}
                                           </TreeItem>
                                       )
                                   })}
                                </TreeItem>
                            )
                        })}
                    </ul>
                );
            }
        }

        if (viewMode === 'curriculum') {
            if (isLoadingCurriculum) return <div className="my-library-status"><LuLoader className="spinner" /> <span>데이터 로딩 중...</span></div>;
            if (isErrorCurriculum) return <div className="my-library-status error"><LuCircleAlert /> <span>오류가 발생했습니다.</span></div>;
            if (!curriculumData || curriculumData.length === 0) return <div className="my-library-status"><p>등록된 문제가 없습니다.</p></div>;

            return (
                <ul className="tree-group">
                    {curriculumData.map(grade => {
                        const gradeKey = `curriculum-grade-${grade.grade_id}`;
                        return (
                            <TreeItem key={gradeKey} nodeKey={gradeKey} label={grade.grade_name} level={1} icon={<LuFolder />} isExpanded={expandedKeys.has(gradeKey)} onToggle={handleToggle} isSelected={false} isAncestorOfSelected={!!(selectedKey && selectedKey.startsWith(gradeKey))}>
                                {grade.majorChapters.map(major => {
                                    const majorKey = `${gradeKey}-major-${major.major_chapter_id}`;
                                    return (
                                        <TreeItem key={majorKey} nodeKey={majorKey} label={major.major_chapter_name} level={2} icon={<LuFolder />} isExpanded={expandedKeys.has(majorKey)} onToggle={handleToggle} isSelected={false} isAncestorOfSelected={!!(selectedKey && selectedKey.startsWith(majorKey))}>
                                            {major.middleChapters.map(middle => {
                                                const middleKey = `${majorKey}-middle-${middle.middle_chapter_id}`;
                                                return <TreeItem key={middleKey} nodeKey={middleKey} label={middle.middle_chapter_name} count={middle.problem_count} level={3} icon={<LuFileText />} isExpanded={false} onToggle={()=>{}} isSelected={selectedKey === middleKey} isAncestorOfSelected={false}
                                                    onSelect={() => handleLeafClick({type: 'curriculum', gradeId: grade.grade_id, majorChapterId: major.major_chapter_id, middleChapterId: middle.middle_chapter_id}, middleKey)} />
                                            })}
                                        </TreeItem>
                                    )
                                })}
                            </TreeItem>
                        )
                    })}
                </ul>
            );
        }
        return null;
    }

    return (
        <div className="my-library-widget self-contained">
            <div className="widget-content">
                <div className="view-mode-selector">
                    <SegmentedControl options={viewOptions} value={viewMode} onChange={setViewMode} />
                </div>
                <div className="library-list-wrapper">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default MyLibrary;