import React from 'react';
import { AppMode } from '../types';
import AppModeSwitcher from './AppModeSwitcher';

interface HeaderProps {
    appMode: AppMode;
    onModeChange: (mode: AppMode) => void;
}

const Header: React.FC<HeaderProps> = ({ appMode, onModeChange }) => {
    return (
        <header className="flex justify-between items-center py-2">
            {/* Title on the right for RTL */}
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                المصمم الذكي
            </h1>

            {/* Controls on the left for RTL */}
            <div className="flex items-center gap-4">
                <AppModeSwitcher currentMode={appMode} onModeChange={onModeChange} />
            </div>
        </header>
    );
};

export default Header;