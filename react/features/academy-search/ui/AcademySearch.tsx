import React, { useState, useMemo, useEffect, useRef } from 'react';
// [수정됨] useAllAcademiesQuery로 이름이 변경되었습니다.
import { useAllAcademiesQuery } from '../../../entities/academy/model/useAcademiesQuery';
import type { Academy } from '../../../entities/academy/model/types';
import { LuSearch, LuChevronDown } from 'react-icons/lu';
import './AcademySearch.css';

interface AcademySearchProps {
    onAcademySelect: (academy: Academy) => void;
}

export const AcademySearch: React.FC<AcademySearchProps> = ({ onAcademySelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // [수정됨] useAcademiesQuery -> useAllAcademiesQuery
    const { data: academies = [], isLoading: isLoadingAcademies } = useAllAcademiesQuery();

    const filteredAcademies = useMemo(() => {
        if (!searchTerm.trim()) return academies;
        const lowercasedTerm = searchTerm.toLowerCase();
        // [수정됨] academy.academyName -> academy.name
        return academies.filter(academy =>
            academy.name.toLowerCase().includes(lowercasedTerm) ||
            academy.region.toLowerCase().includes(lowercasedTerm)
        );
    }, [academies, searchTerm]);

    const handleSelect = (academy: Academy) => {
        onAcademySelect(academy);
        setSearchTerm('');
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
                            // [수정됨] key와 표시되는 이름 모두 academy.name 사용
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
};