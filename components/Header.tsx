import React from 'react';
import { AppMode } from '../types';
import AppModeSwitcher from './AppModeSwitcher';
import { ClockIcon } from './icons/ClockIcon';

interface HeaderProps {
    appMode: AppMode;
    onModeChange: (mode: AppMode) => void;
}

const Header: React.FC<HeaderProps> = ({ appMode, onModeChange }) => {
    return (
        <header className="flex justify-between items-center py-2">
            {/* Title on the right for RTL */}
            <div className="flex items-center gap-4">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                    المصمم الذكي
                </h1>
                <button 
                    onClick={() => onModeChange(AppMode.History)}
                    className={`p-2 rounded-full transition-colors duration-200 ${appMode === AppMode.History ? 'bg-accent text-white' : 'hover:bg-dark-secondary'}`}
                    title="سجل التصاميم"
                    aria-label="Designs History"
                >
                    <ClockIcon className="w-7 h-7" />
                </button>
            </div>


            {/* Controls on the left for RTL */}
            <div className="flex items-center gap-4">
                <AppModeSwitcher currentMode={appMode} onModeChange={onModeChange} />
            </div>
        </header>
    );
};

export default Header;
