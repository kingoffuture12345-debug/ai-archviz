import React from 'react';
import { ImageIcon } from './icons/ImageIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { GridPatternIcon } from './icons/GridPatternIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

interface ResultDisplayProps {
    afterImage: string | null;
    isLoading: boolean;
    onImageClick: () => void;
    onUseAsSource?: () => void;
}

const LoadingSkeleton: React.FC = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 animate-pulse rounded-xl">
        <ImageIcon className="w-16 h-16 text-gray-600 mb-4" />
        <div className="w-3/4 h-4 bg-gray-700 rounded-md mb-2"></div>
        <div className="w-1/2 h-4 bg-gray-700 rounded-md"></div>
    </div>
);

const ResultDisplay: React.FC<ResultDisplayProps> = ({ afterImage, isLoading, onImageClick, onUseAsSource }) => {
    const handleDownload = () => {
        if (!afterImage) return;
        
        // Create a temporary anchor element to trigger the download.
        // This is the most robust method for downloading a data URL.
        const link = document.createElement('a');
        link.href = afterImage;
        link.download = 'ai-design-result.png';
        
        // Append to the document, trigger the click, and then remove it.
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-light-secondary dark:bg-dark-secondary p-4 rounded-2xl shadow-lg flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-light-text dark:text-dark-text">بعد</h2>
                {afterImage && onUseAsSource && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUseAsSource();
                        }}
                        className="p-2 rounded-full text-dark-text-secondary hover:bg-dark-border hover:text-accent transition-colors"
                        aria-label="استخدام كصورة أساسية"
                        title="استخدام كصورة أساسية"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
            <div className="relative w-full border-2 border-light-border dark:border-dark-border rounded-xl flex items-center justify-center overflow-hidden bg-light-primary dark:bg-dark-primary">
                {isLoading ? (
                    <div className="w-full aspect-video">
                        <LoadingSkeleton />
                    </div>
                ) : afterImage ? (
                    <div 
                        className="w-full relative cursor-pointer"
                        onClick={onImageClick}
                    >
                        <img src={afterImage} alt="After" className="w-full h-auto block rounded-lg" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload();
                            }}
                            // FIX: Moved download button to the left for RTL layout.
                            className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-black/80 transition-all duration-200"
                            aria-label="Download image"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            <span>تحميل</span>
                        </button>
                    </div>
                ) : (
                    <div className="w-full aspect-video flex flex-col items-center justify-center text-center text-light-text-secondary dark:text-dark-text-secondary p-4">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                        <p>ستظهر الصورة المُصممة هنا</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultDisplay;