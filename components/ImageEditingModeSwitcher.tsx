import React from 'react';
import { ImageEditingMode } from '../types';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { ImageToPromptIcon } from './icons/ImageToPromptIcon';
import { TextureIcon } from './icons/TextureIcon';

interface ImageEditingModeSwitcherProps {
    selected: ImageEditingMode;
    onSelect: (mode: ImageEditingMode) => void;
}

const modeDetails = {
    [ImageEditingMode.Edit]: {
        label: 'محرر قياسي',
        icon: PencilSquareIcon,
    },
    [ImageEditingMode.ImageToPrompt]: {
        label: 'صورة إلى برومت',
        icon: ImageToPromptIcon,
    },
    [ImageEditingMode.Texture]: {
        label: 'صانع الخامات',
        icon: TextureIcon,
    }
};

const ImageEditingModeSwitcher: React.FC<ImageEditingModeSwitcherProps> = ({ selected, onSelect }) => {
    const activeClasses = 'bg-accent text-white';
    const inactiveClasses = 'bg-light-primary dark:bg-dark-primary text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-border';

    return (
        <div className="flex bg-light-primary dark:bg-dark-primary p-1 rounded-xl w-full">
            {Object.values(ImageEditingMode).map((mode) => {
                const { label, icon: Icon } = modeDetails[mode];
                return (
                    <button
                        key={mode}
                        onClick={() => onSelect(mode)}
                        className={`w-1/3 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 ${selected === mode ? activeClasses : inactiveClasses}`}
                    >
                        <Icon className="w-5 h-5" />
                        {label}
                    </button>
                );
            })}
        </div>
    );
};

export default ImageEditingModeSwitcher;
