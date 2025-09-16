import React, { useRef } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface ReferenceImageUploaderProps {
    onImageUpload: (file: File) => void;
    onImageRemove: (id: string) => void;
    referenceImages: { id: string, url: string }[];
    referencePrompt?: string;
    onReferencePromptChange?: (value: string) => void;
    isDisabled?: boolean;
}

const ReferenceImageUploader: React.FC<ReferenceImageUploaderProps> = ({ 
    onImageUpload, 
    onImageRemove, 
    referenceImages,
    referencePrompt,
    onReferencePromptChange,
    isDisabled = false,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            onImageUpload(file);
        }
        // Reset file input to allow uploading the same file again
        if (event.target) {
            event.target.value = '';
        }
    };
    
    const handleAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        fileInputRef.current?.click();
    };

    const handleRemoveClick = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        onImageRemove(id);
    };

    const wrapperClasses = `w-full transition-opacity duration-300 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`;

    return (
        <div className={wrapperClasses}>
             <div>
                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                    اضافة صور مرجعية (اختياري)
                </label>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    disabled={isDisabled}
                />
                <div className="flex items-center gap-2 overflow-x-auto pb-2 min-h-[5rem]">
                    {/* Add new image button */}
                    <button
                        onClick={handleAddClick}
                        className="w-16 h-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors flex-shrink-0 border-green-200 dark:border-green-700 text-green-400 dark:text-green-500 hover:border-green-300 dark:hover:border-green-600 hover:text-green-500 dark:hover:text-green-400"
                        aria-label="Add a reference image"
                        disabled={isDisabled}
                        title="إضافة صورة مرجعية"
                    >
                        <PlusIcon className="w-8 h-8" />
                    </button>

                    {/* Map over reference images to display thumbnails */}
                    {referenceImages.map(image => (
                        <div key={image.id} className="relative w-16 h-16 group flex-shrink-0">
                            <img src={image.url} alt="Reference" className="w-full h-full object-cover rounded-lg" />
                             <button
                                onClick={(e) => handleRemoveClick(e, image.id)}
                                className="absolute -top-1 -right-1 p-0.5 rounded-full bg-black/70 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                                aria-label="Remove reference image"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            {referenceImages.length > 0 && onReferencePromptChange && referencePrompt !== undefined && (
                <div className="mt-2 w-full animate-fade-in">
                    <label htmlFor="reference-prompt" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                        وصف الصور المرجعية
                    </label>
                    <input
                        id="reference-prompt"
                        type="text"
                        value={referencePrompt}
                        onChange={(e) => onReferencePromptChange(e.target.value)}
                        className="w-full bg-light-primary dark:bg-dark-primary border-2 border-light-border dark:border-dark-border rounded-lg p-2.5 text-light-text dark:text-dark-text focus:ring-2 focus:ring-accent focus:border-accent"
                        placeholder="مثال: استخدم الألوان والملمس..."
                        disabled={isDisabled}
                    />
                </div>
           )}
        </div>
    );
};

export default ReferenceImageUploader;