import React from 'react';
import { DesignOption } from '../types';
import { CustomStyleIcon } from './icons/CustomStyleIcon';

interface StyleGridProps {
    options: DesignOption[];
    selectedValue: string;
    onSelect: (value: string) => void;
}

const StyleGrid: React.FC<StyleGridProps> = ({ options, selectedValue, onSelect }) => {
    return (
        <div className="w-full">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {options.map((option) => {
                    const isSelected = selectedValue === option.prompt;
                    const cardClasses = `
                        group aspect-square w-full bg-light-primary dark:bg-dark-primary rounded-xl 
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-secondary focus:ring-accent
                        transition-all duration-200 transform hover:scale-105
                        ${isSelected ? 'ring-2 ring-accent' : 'ring-1 ring-light-border dark:ring-dark-border'}
                    `;

                    return (
                        <button key={option.prompt} onClick={() => onSelect(option.prompt)} className={cardClasses}>
                            <div className="flex flex-col items-center justify-between h-full p-2">
                                <div className="flex-grow w-full flex items-center justify-center overflow-hidden rounded-md">
                                    {option.imageUrl ? (
                                        <img 
                                            src={option.imageUrl} 
                                            alt={option.label}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                                            loading="lazy"
                                        />
                                    ) : (
                                        // Special case for Custom style
                                        <div className="w-full h-full flex items-center justify-center bg-light-secondary dark:bg-dark-secondary rounded-md">
                                            <CustomStyleIcon className="w-8 h-8 text-accent" />
                                        </div>
                                    )}
                                </div>
                                <span className={`block text-xs font-semibold mt-2 text-center truncate w-full ${isSelected ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text'}`}>
                                    {option.label}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default StyleGrid;