import { useState, useMemo, useEffect, useRef, forwardRef } from 'react';
import { useAllAcademiesQuery } from '../../../entities/academy/model/useAcademiesQuery';
import type { Academy } from '../../../entities/academy/model/types';
import { LuSearch, LuChevronDown } from 'react-icons/lu';
import './AcademySearch.css';

interface AcademySearchProps {
    onAcademySelect: (academy: Academy) => void;
}

// [핵심 수정] forwardRef로 컴포넌트를 감싸고, props와 함께 ref를 두 번째 인자로 받습니다.
export const AcademySearch = forwardRef<HTMLInputElement, AcademySearchProps>(({ onAcademySelect }, ref) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: academies = [], isLoading: isLoadingAcademies } = useAllAcademiesQuery();

    const filteredAcademies = useMemo(() => {
        if (!searchTerm.trim()) return academies;
        const lowercasedTerm = searchTerm.toLowerCase();
        return academies.filter(academy =>
            academy.name.toLowerCase().includes(lowercasedTerm) ||
            academy.region.toLowerCase().includes(lowercasedTerm)
        );
    }, [academies, searchTerm]);

    const handleSelect = (academy: Academy) => {
        onAcademySelect(academy);
        setSearchTerm(''); // 선택 후 검색어 초기화
        setIsDropdownOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="form-group academy-search-container" ref={dropdownRef}>
            <label htmlFor="academySearch" className="form-label">학원 검색</label>
            <div className="academy-search-wrapper">
                <LuSearch className="search-icon" />
                <input
                    ref={ref} // [핵심 수정] 전달받은 ref를 실제 input 요소에 연결합니다.
                    type="text"
                    id="academySearch"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }}
                    onClick={() => setIsDropdownOpen(true)}
                    placeholder={isLoadingAcademies ? "학원 목록 로딩 중..." : "학원 또는 지역명으로 검색"}
                    className="form-input"
                    autoComplete="off"
                    disabled={isLoadingAcademies}
                />
                <button type="button" className="dropdown-arrow" onClick={() => setIsDropdownOpen(p => !p)} aria-label="드롭다운 열기/닫기">
                    <LuChevronDown />
                </button>
            </div>
            
            {isDropdownOpen && (
                <ul className="academy-dropdown-list">
                    {filteredAcademies.length > 0 ? (
                        filteredAcademies.map(academy => (
                            <li key={academy.name + academy.region} onClick={() => handleSelect(academy)}>
                                <strong>{academy.name}</strong>
                                <span>{academy.region}</span>
                            </li>
                        ))
                    ) : (
                        <li className="no-results">{isLoadingAcademies ? "로딩 중..." : "검색 결과가 없습니다."}</li>
                    )}
                </ul>
            )}
        </div>
    );
});

AcademySearch.displayName = 'AcademySearch';