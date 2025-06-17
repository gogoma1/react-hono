import React from 'react';
import './CategoryInput.css';

interface CategoryInputProps {
    label: string;
    value: string;
    suggestions: (string | number)[];
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
                {suggestions.map((suggestion) => (
                    <button
                        type="button"
                        key={suggestion}
                        className={`suggestion-button ${String(value) === String(suggestion) ? 'active' : ''}`}
                        onClick={() => onChange(String(suggestion))}
                    >
                        {label === '수강료' && typeof suggestion === 'number' ? suggestion.toLocaleString() : suggestion}
                    </button>
                ))}
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