import React from 'react';
import './CategoryInput.css';

// [수정] suggestion의 타입을 객체 형태도 포함하도록 확장합니다.
type Suggestion = string | number | { value: string; label: string };

interface CategoryInputProps {
    label: string;
    value: string;
    // [수정] 확장된 Suggestion 타입을 사용합니다.
    suggestions: Suggestion[]; 
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'number' | 'tel';
    required?: boolean;
    hideInput?: boolean; 
}

const CategoryInput: React.FC<CategoryInputProps> = ({
    label,
    value,
    suggestions,
    onChange,
    placeholder,
    type = 'text',
    required = false,
    hideInput = false, 
}) => {
    return (
        <div className="category-input-group">
            <label className="form-label">{label} {required && '*'}</label>
            <div className="category-suggestions">
                {suggestions.map((suggestion) => {
                    // [수정] suggestion의 타입에 따라 value와 label을 결정합니다.
                    const itemValue = typeof suggestion === 'object' ? suggestion.value : String(suggestion);
                    const itemLabel = typeof suggestion === 'object' ? suggestion.label : String(suggestion);

                    return (
                        <button
                            type="button"
                            key={itemValue}
                            className={`suggestion-button ${String(value) === itemValue ? 'active' : ''}`}
                            onClick={() => onChange(itemValue)}
                        >
                            {/* 수강료와 같은 숫자 포맷팅은 유지합니다. */}
                            {label === '수강료' && typeof suggestion === 'number' ? suggestion.toLocaleString() : itemLabel}
                        </button>
                    );
                })}
            </div>
            
            {!hideInput && (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="form-input"
                    required={required}
                />
            )}
        </div>
    );
};

export default CategoryInput;