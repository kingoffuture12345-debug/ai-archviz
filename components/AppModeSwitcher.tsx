import React, { useState, useRef, useEffect } from 'react';
import { AppMode } from '../types';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { MapIcon } from './icons/MapIcon';
import { ClockIcon } from './icons/ClockIcon';

interface AppModeSwitcherProps {
    currentMode: AppMode;
    onModeChange: (mode: AppMode) => void;
}

const modeDetails = {
    [AppMode.Architecture]: {
        label: 'الهندسة المعمارية',
        icon: BuildingOfficeIcon,
    },
    [AppMode.ImageEditing]: {
        label: 'تعديل الصور',
        icon: PencilSquareIcon,
    },
    [AppMode.PlanToView]: {
        label: 'تحويل المخطط',
        icon: MapIcon,
    },
    [AppMode.History]: {
        label: 'السجل',
        icon: ClockIcon,
    }
};

const AppModeSwitcher: React.FC<AppModeSwitcherProps> = ({ currentMode, onModeChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const CurrentIcon = modeDetails[currentMode].icon;

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
    }, [wrapperRef]);
    
    const handleSelect = (mode: AppMode) => {
        onModeChange(mode);
        setIsOpen(false);
    };

    const availableModes = Object.values(AppMode).filter(mode => mode !== AppMode.History);

    return (
        <div className="relative" ref={wrapperRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-lg font-semibold text-light-text dark:text-dark-text p-2 rounded-lg hover:bg-light-secondary dark:hover:bg-dark-secondary transition-colors"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <CurrentIcon className="w-5 h-5" />
                <span>{modeDetails[currentMode].label}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-20 mt-2 w-64 left-0 origin-top-left bg-light-primary dark:bg-dark-secondary rounded-lg shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in-scale" role="listbox">
                    <div className="py-1">
                        {availableModes.map(mode => {
                            const { label, icon: Icon } = modeDetails[mode];
                            return (
                                <button
                                    key={mode}
                                    onClick={() => handleSelect(mode)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-right ${
                                        currentMode === mode 
                                        ? 'bg-accent/10 text-accent font-semibold' 
                                        : 'text-light-text dark:text-dark-text'
                                    } hover:bg-light-secondary dark:hover:bg-dark-border transition-colors`}
                                    role="option"
                                    aria-selected={currentMode === mode}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppModeSwitcher;
