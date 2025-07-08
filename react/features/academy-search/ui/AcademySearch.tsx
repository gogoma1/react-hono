import { useState, useMemo, useEffect, useRef, forwardRef } from 'react';
import { useAllAcademiesQuery } from '../../../entities/academy/model/useAcademiesQuery';
import type { Academy } from '../../../entities/academy/model/types';
import { LuSearch, LuChevronDown } from 'react-icons/lu';
import { useFuseSearch } from '../../../shared/hooks/useFuseSearch';
import './AcademySearch.css';

interface AcademySearchProps {
    onAcademySelect: (academy: Academy) => void;
    hideLabel?: boolean; // [신규] 레이블 숨김 옵션 추가
}

export const AcademySearch = forwardRef<HTMLInputElement, AcademySearchProps>(({ onAcademySelect, hideLabel = false }, ref) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: academies = [], isLoading: isLoadingAcademies } = useAllAcademiesQuery();

    const searchableAcademies = useMemo(() => {
        return academies.map(academy => ({
            ...academy,
            searchableText: `${academy.region} ${academy.name}`
        }));
    }, [academies]);

    const fuseOptions = useMemo(() => ({
        keys: ['searchableText'],
        threshold: 0.4,
        ignoreLocation: true,
    }), []);

    const filteredAcademies = useFuseSearch(searchableAcademies, searchTerm, fuseOptions);

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

    const dropdownContent = useMemo(() => {
        const listToShow = searchTerm.trim() ? filteredAcademies : academies.slice(0, 100);

        if (listToShow.length > 0) {
            return listToShow.map(academy => (
                <li key={academy.id} onClick={() => handleSelect(academy)}>
                    <strong>{academy.name}</strong>
                    <span>{academy.region}</span>
                </li>
            ));
        }

        return <li className="no-results">{isLoadingAcademies ? "로딩 중..." : "검색 결과가 없습니다."}</li>;
    }, [searchTerm, filteredAcademies, academies, isLoadingAcademies, handleSelect]);

    return (
        <div className="form-group academy-search-container" ref={dropdownRef}>
            {/* [수정] hideLabel prop에 따라 레이블을 조건부 렌더링 */}
            {!hideLabel && <label htmlFor="academySearch" className="form-label">학원 검색</label>}
            <div className="academy-search-wrapper">
                <LuSearch className="search-icon" />
                <input
                    ref={ref}
                    type="text"
                    id="academySearch"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }}
                    onClick={() => setIsDropdownOpen(true)}
                    placeholder={isLoadingAcademies ? "학원 목록 로딩 중..." : "지역과 학원명으로 검색 (예: 강남 공율)"}
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
                    {dropdownContent}
                </ul>
            )}
        </div>
    );
});

AcademySearch.displayName = 'AcademySearch';