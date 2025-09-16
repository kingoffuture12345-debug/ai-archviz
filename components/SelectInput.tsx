import React, { useState, useRef, useEffect } from 'react';
import { DesignOption } from '../types';

interface SelectInputProps {
    label: string;
    options: DesignOption[];
    value: string;
    onChange: (value: string) => void;
    id: string;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const SelectInput: React.FC<SelectInputProps> = ({ label, options, value, onChange, id, isOpen, setIsOpen }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.prompt === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef, setIsOpen]);

    const handleOptionClick = (prompt: string) => {
        onChange(prompt);
        setIsOpen(false);
    };

    return (
        <div className="w-full" ref={wrapperRef}>
            <label id={`${id}-label`} className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                {label}
            </label>
            <div className="relative">
                <button
                    type="button"
                    id={id}
                    onClick={() => setIsOpen(!isOpen)}
                    // FIX: Adjusted padding for RTL layout.
                    className="w-full pr-3 pl-10 py-2 text-base border-2 border-light-border dark:border-dark-border bg-light-primary dark:bg-dark-primary text-light-text dark:text-dark-text rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent flex items-center justify-between text-right"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-labelledby={`${id}-label`}
                >
                    <span className="truncate">{selectedOption?.label || 'اختر أسلوب...'}</span>
                    {/* FIX: Moved dropdown icon to the left for RTL layout. */}
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                         <svg className={`h-5 w-5 text-light-text-secondary dark:text-dark-text-secondary transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </span>
                </button>

                {isOpen && (
                    <div
                        className="absolute z-10 mt-1 w-full bg-light-primary dark:bg-dark-secondary shadow-lg rounded-lg max-h-80 overflow-auto focus:outline-none border border-light-border dark:border-dark-border"
                        role="listbox"
                        tabIndex={-1}
                    >
                        {options.map((option) => (
                             <div
                                key={option.prompt}
                                onClick={() => handleOptionClick(option.prompt)}
                                className={`cursor-pointer select-none relative py-2 pl-10 pr-4 text-light-text dark:text-dark-text hover:bg-light-secondary dark:hover:bg-dark-primary ${value === option.prompt ? 'bg-accent/10' : ''}`}
                                role="option"
                                aria-selected={value === option.prompt}
                            >
                                <span className="block truncate font-medium">{option.label}</span>
                                {value === option.prompt && (
                                     // FIX: Moved checkmark icon to the left for RTL layout.
                                     <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SelectInput;