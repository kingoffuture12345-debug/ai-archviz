import React, { useRef, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { CropIcon } from './icons/CropIcon'; // Import the CropIcon

interface ImageUploaderProps {
    onImageUpload: (file: File) => void;
    beforeImage: string | null;
    onImageClick: () => void;
    accept?: string;
    uploadText?: string;
    uploadSubText?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
    onImageUpload, 
    beforeImage, 
    onImageClick,
    accept = "image/png, image/jpeg, image/webp",
    uploadText = "اسحب وأفلت الصورة هنا",
    uploadSubText = "أو انقر للاختيار من جهازك"
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const acceptedTypes = accept.split(',').map(t => t.trim());
    const isValidFileType = (file: File): boolean => {
        return acceptedTypes.some(acceptedType => {
            if (acceptedType.endsWith('/*')) {
                const baseType = acceptedType.slice(0, -1);
                return file.type.startsWith(baseType);
            }
            return file.type === acceptedType;
        });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && isValidFileType(file)) {
            onImageUpload(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDraggingOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file && isValidFileType(file)) {
            onImageUpload(file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDraggingOver(true);
    };
    
    const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDraggingOver(false);
    };

    const dropzoneClasses = `w-full border-2 border-dashed rounded-xl flex items-center justify-center transition-colors duration-300 relative overflow-hidden bg-dark-primary ${
        isDraggingOver 
            ? 'border-accent bg-accent/10'
            : 'border-light-border dark:border-dark-border hover:border-accent'
    } ${beforeImage ? '' : 'cursor-pointer aspect-video'}`;

    return (
        <div className="bg-light-secondary dark:bg-dark-secondary p-4 rounded-2xl shadow-lg flex flex-col">
            <h2 className="text-xl font-bold text-center text-light-text dark:text-dark-text mb-4">قبل</h2>
            <div 
                className={dropzoneClasses}
                onClick={beforeImage ? onImageClick : () => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={accept}
                    className="hidden"
                />
                {beforeImage ? (
                    <div 
                        className="relative w-full cursor-pointer"
                    >
                        <img src={beforeImage} alt="Before" className="w-full h-auto block rounded-lg" />
                    </div>
                ) : (
                    <div className={`text-center text-light-text-secondary dark:text-dark-text-secondary p-4 pointer-events-none transition-all duration-300 ease-in-out transform ${isDraggingOver ? 'scale-105 opacity-80' : 'scale-100'}`}>
                        <UploadIcon className="w-12 h-12 mx-auto mb-2" />
                        <p className="font-semibold">{uploadText}</p>
                        <p className="text-sm">{uploadSubText}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUploader;
