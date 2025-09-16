import React from 'react';
import { DesignType } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';

interface TabsProps {
    selected: DesignType;
    onSelect: (type: DesignType) => void;
}

const Tabs: React.FC<TabsProps> = ({ selected, onSelect }) => {
    const activeClasses = 'bg-accent text-white';
    const inactiveClasses = 'bg-light-primary dark:bg-dark-primary text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700';

    return (
        <div className="flex bg-light-primary dark:bg-dark-primary p-1 rounded-xl w-full">
            <button
                onClick={() => onSelect(DesignType.Interior)}
                className={`w-1/2 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 ${selected === DesignType.Interior ? activeClasses : inactiveClasses}`}
            >
                <HomeIcon className="w-5 h-5" />
                تصميم داخلي
            </button>
            <button
                onClick={() => onSelect(DesignType.Exterior)}
                className={`w-1/2 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 ${selected === DesignType.Exterior ? activeClasses : inactiveClasses}`}
            >
                <BuildingOfficeIcon className="w-5 h-5" />
                تصميم خارجي
            </button>
        </div>
    );
};

export default Tabs;