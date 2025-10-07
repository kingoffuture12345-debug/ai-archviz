import React from 'react';
import { PlanMode } from '../types';
import { MapIcon } from './icons/MapIcon';
import { PencilIcon } from './icons/PencilIcon';

interface PlanModeSwitcherProps {
    selected: PlanMode;
    onSelect: (mode: PlanMode) => void;
}

const modeDetails = {
    [PlanMode.PlanTo3D]: {
        label: 'مخطط إلى ثلاثي الأبعاد',
        icon: MapIcon,
    },
    [PlanMode.SketchTo3D]: {
        label: 'رسم إلى ثلاثي الأبعاد',
        icon: PencilIcon,
    }
};

const PlanModeSwitcher: React.FC<PlanModeSwitcherProps> = ({ selected, onSelect }) => {
    const activeClasses = 'bg-accent text-white';
    const inactiveClasses = 'bg-light-primary dark:bg-dark-primary text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-border';

    return (
        <div className="flex bg-light-primary dark:bg-dark-primary p-1 rounded-xl w-full">
            {Object.values(PlanMode).map((mode) => {
                const { label, icon: Icon } = modeDetails[mode];
                return (
                    <button
                        key={mode}
                        onClick={() => onSelect(mode)}
                        className={`w-1/2 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 ${selected === mode ? activeClasses : inactiveClasses}`}
                    >
                        <Icon className="w-5 h-5" />
                        {label}
                    </button>
                );
            })}
        </div>
    );
};

export default PlanModeSwitcher;
