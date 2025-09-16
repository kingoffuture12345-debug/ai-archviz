import React from 'react';
import { ImageIcon } from './icons/ImageIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface ResultDisplayProps {
    afterImage: string | null;
    isLoading: boolean;
    onImageClick: () => void;
}

const LoadingSkeleton: React.FC = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-800 animate-pulse">
        <ImageIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
        <div className="w-3/4 h-4 bg-gray-300 dark:bg-gray-700 rounded-md mb-2"></div>
        <div className="w-1/2 h-4 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
    </div>
);

const ResultDisplay: React.FC<ResultDisplayProps> = ({ afterImage, isLoading, onImageClick }) => {
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
        <div className="bg-light-secondary dark:bg-dark-secondary p-4 rounded-2xl shadow-lg flex flex-col h-full">
            <h2 className="text-xl font-bold text-center text-light-text dark:text-dark-text mb-4">بعد</h2>
            <div className="relative flex-grow border-2 border-light-border dark:border-dark-border rounded-xl flex items-center justify-center overflow-hidden bg-light-primary dark:bg-dark-primary">
                {isLoading ? (
                    <LoadingSkeleton />
                ) : afterImage ? (
                    <div 
                        className="w-full h-full relative cursor-zoom-in"
                        onClick={onImageClick}
                    >
                        <img src={afterImage} alt="After" className="w-full h-full object-cover" />
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
                    <div className="text-center text-light-text-secondary dark:text-dark-text-secondary p-4">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                        <p>ستظهر الصورة المُصممة هنا</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultDisplay;