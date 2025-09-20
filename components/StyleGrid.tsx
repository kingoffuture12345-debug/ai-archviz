import React from 'react';
import { DesignOption } from '../types';

interface StyleGridProps {
    options: DesignOption[];
    selectedValue: string;
    onSelect: (value: string) => void;
    columns?: number;
}

const StyleGrid: React.FC<StyleGridProps> = ({ options, selectedValue, onSelect, columns = 4 }) => {
    const gridColsClass = {
        2: 'grid-cols-2',
        4: 'grid-cols-4',
    }[columns] || 'grid-cols-4';
    
    return (
        <div className="w-full">
            <div className={`grid ${gridColsClass} gap-3`}>
                {options.map((option) => {
                    const isSelected = selectedValue === option.prompt;
                    const Icon = option.icon;
                    const cardClasses = `
                        group aspect-square w-full bg-light-primary dark:bg-dark-primary rounded-xl 
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-secondary focus:ring-accent
                        transition-all duration-200 transform hover:scale-105
                        ${isSelected ? 'ring-2 ring-accent' : 'ring-1 ring-light-border dark:ring-dark-border'}
                    `;

                    return (
                        <button
                            key={option.prompt}
                            onClick={() => onSelect(option.prompt)}
                            className={cardClasses}
                        >
                            <div className="flex flex-col h-full p-2 text-center">
                                <div className="flex-grow flex items-center justify-center">
                                    {Icon && (
                                        <Icon className={`w-8 h-8 transition-colors duration-200 ${isSelected ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text'}`} />
                                    )}
                                </div>
                                <span className={`block text-xs font-semibold leading-tight w-full ${isSelected ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text'}`}>
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