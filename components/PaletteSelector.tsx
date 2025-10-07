import React from 'react';
import { PaletteOption } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { NoSymbolIcon } from './icons/NoSymbolIcon';

interface PaletteSelectorProps {
    options: PaletteOption[];
    selectedValue: string;
    onSelect: (value: string) => void;
}

const PaletteSelector: React.FC<PaletteSelectorProps> = ({ options, selectedValue, onSelect }) => {
    return (
        <div className="w-full">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {options.map((option) => {
                    const isSelected = selectedValue === option.promptValue;
                    const cardClasses = `
                        group aspect-square w-full bg-light-primary dark:bg-dark-primary rounded-xl 
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-secondary focus:ring-accent
                        transition-all duration-200 transform hover:scale-105
                        ${isSelected ? 'ring-2 ring-accent' : 'ring-1 ring-light-border dark:ring-dark-border'}
                    `;

                    return (
                        <button key={option.promptValue} onClick={() => onSelect(option.promptValue)} className={cardClasses}>
                            <div className="flex flex-col items-center justify-between h-full p-2 md:p-3">
                                <div className="flex-grow w-full flex items-center justify-center overflow-hidden rounded-md">
                                    {option.promptValue === 'none' ? (
                                        <div className="w-full h-full flex items-center justify-center rounded-md bg-dark-primary">
                                            <NoSymbolIcon className="w-8 h-8 text-dark-text-secondary" />
                                        </div>
                                    ) : option.promptValue === 'surprise-me' ? (
                                        <div className="w-full h-full flex items-center justify-center rounded-md bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500">
                                            <SparklesIcon className="w-8 h-8 text-white" />
                                        </div>
                                    ) : option.imageUrl ? (
                                        <img 
                                            src={option.imageUrl} 
                                            alt={option.name}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-row rounded-md overflow-hidden">
                                            {option.colors?.map((color, index) => (
                                                <div
                                                    key={index}
                                                    className="w-full h-full"
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <span className={`block text-xs md:text-sm font-semibold mt-2 text-center truncate w-full ${isSelected ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text'}`}>
                                    {option.name}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default PaletteSelector;