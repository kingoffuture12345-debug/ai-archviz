import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from './icons/XMarkIcon';

interface TilingPreviewModalProps {
    imageUrl: string;
    onClose: () => void;
    tileSize?: number;
}

const TilingPreviewModal: React.FC<TilingPreviewModalProps> = ({ imageUrl, onClose, tileSize = 200 }) => {
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const modalContent = (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="relative w-full h-full rounded-lg shadow-xl"
                style={{
                    backgroundImage: `url(${imageUrl})`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: `${tileSize}px ${tileSize}px`,
                    imageRendering: 'pixelated', // For crisp pixels on zoom
                }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-20"
                    aria-label="Close preview"
                >
                    <XMarkIcon className="w-8 h-8" />
                </button>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default TilingPreviewModal;