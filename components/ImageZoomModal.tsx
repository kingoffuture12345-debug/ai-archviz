import React from 'react';
import { XMarkIcon } from './icons/XMarkIcon';

interface ImageZoomModalProps {
    imageUrl: string | null;
    onClose: () => void;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ imageUrl, onClose }) => {
    if (!imageUrl) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="relative max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
            >
                <img
                    src={imageUrl}
                    alt="Zoomed view"
                    className="block max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                />
                <button
                    onClick={onClose}
                    className="absolute -top-4 -right-4 sm:top-2 sm:right-2 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                    aria-label="Close zoomed image"
                >
                    <XMarkIcon className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
};

export default ImageZoomModal;
