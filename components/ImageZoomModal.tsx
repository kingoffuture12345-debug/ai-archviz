import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from './icons/XMarkIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { ViewfinderCircleIcon } from './icons/ViewfinderCircleIcon';
import { EditIcon } from './icons/EditIcon';

interface ImageZoomModalProps {
    imageUrl: string | null;
    onClose: () => void;
    onGoToAdvancedEditor?: () => void;
    showAdvancedEditorButton?: boolean;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ imageUrl, onClose, onGoToAdvancedEditor, showAdvancedEditorButton = false }) => {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const imageWrapperRef = useRef<HTMLDivElement>(null);

    const resetView = useCallback(() => {
        if (!imageDimensions.width || !containerRef.current) {
            return;
        }
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const scaleX = containerWidth / imageDimensions.width;
        const scaleY = containerHeight / imageDimensions.height;
        const initialScale = Math.min(scaleX, scaleY) * 0.95; // 95% zoom for padding

        setScale(initialScale);
        
        const scaledWidth = imageDimensions.width * initialScale;
        const scaledHeight = imageDimensions.height * initialScale;
        const offsetX = (containerWidth - scaledWidth) / 2;
        const offsetY = (containerHeight - scaledHeight) / 2;

        setOffset({ x: offsetX, y: offsetY });
    }, [imageDimensions]);

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        if (imageUrl) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [imageUrl]);

    useEffect(() => {
        if (!imageUrl) {
            setIsImageLoaded(false);
            return;
        }

        setIsImageLoaded(false);
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            setIsImageLoaded(true);
        };
        img.onerror = () => console.error("Failed to load image for zoom modal.");
    }, [imageUrl]);

    useEffect(() => {
        if (isImageLoaded) {
            resetView();
        }
    }, [isImageLoaded, resetView]);
    
    useEffect(() => {
        window.addEventListener('resize', resetView);
        return () => window.removeEventListener('resize', resetView);
    }, [resetView]);

    if (!imageUrl) {
        return null;
    }

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = Math.max(0.1, Math.min(scale * (1 + scaleAmount), 10));
        
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const imageX = (mouseX - offset.x) / scale;
        const imageY = (mouseY - offset.y) / scale;
        
        const newOffsetX = mouseX - imageX * newScale;
        const newOffsetY = mouseY - imageY * newScale;

        setScale(newScale);
        setOffset({ x: newOffsetX, y: newOffsetY });
    };

    const handleZoom = (direction: 'in' | 'out') => {
        const scaleAmount = 0.2;
        const newScale = direction === 'in' 
            ? scale * (1 + scaleAmount) 
            : scale / (1 + scaleAmount);
        const clampedScale = Math.max(0.1, Math.min(newScale, 10));
        
        const container = containerRef.current;
        if (!container) return;
        const centerX = container.clientWidth / 2;
        const centerY = container.clientHeight / 2;
        
        const imageX = (centerX - offset.x) / scale;
        const imageY = (centerY - offset.y) / scale;
        
        const newOffsetX = centerX - imageX * newScale;
        const newOffsetY = centerY - imageY * newScale;

        setScale(clampedScale);
        setOffset({ x: newOffsetX, y: newOffsetY });
    };

    const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
        if ('button' in e && e.button !== 0) return;
        if ('touches' in e && e.touches.length > 1) return;
        e.preventDefault();
        const point = 'touches' in e ? e.touches[0] : e;
        if (!point) return;

        setIsPanning(true);
        setPanStart({
            x: point.clientX - offset.x,
            y: point.clientY - offset.y,
        });
    };
    
    const handlePanMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isPanning) return;
        e.preventDefault();

        if ('touches' in e && e.touches.length > 1) {
            setIsPanning(false);
            return;
        }

        const point = 'touches' in e ? e.touches[0] : e;
        if (!point) return;
        
        setOffset({
            x: point.clientX - panStart.x,
            y: point.clientY - panStart.y,
        });
    };
    
    const handlePanEnd = () => {
        setIsPanning(false);
    };

    const modalContent = (
        <div
            className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                ref={containerRef}
                className="relative w-full h-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                onWheel={handleWheel}
                onMouseDown={handlePanStart}
                onMouseMove={handlePanMove}
                onMouseUp={handlePanEnd}
                onMouseLeave={handlePanEnd}
                onTouchStart={handlePanStart}
                onTouchMove={handlePanMove}
                onTouchEnd={handlePanEnd}
                onTouchCancel={handlePanEnd}
            >
                {!isImageLoaded ? (
                    <div className="text-white animate-pulse" role="status">
                        جاري تحميل الصورة...
                    </div>
                ) : (
                    <div
                        ref={imageWrapperRef}
                        className={`absolute ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                        style={{
                            top: 0,
                            left: 0,
                            width: imageDimensions.width,
                            height: imageDimensions.height,
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                            transformOrigin: 'top left',
                        }}
                    >
                        <img
                            src={imageUrl}
                            alt="Zoomed view"
                            className="block w-full h-full shadow-2xl"
                            draggable="false"
                        />
                    </div>
                )}
                
                {showAdvancedEditorButton && onGoToAdvancedEditor && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onGoToAdvancedEditor(); }}
                        className="absolute top-4 left-4 bg-accent text-white py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-accent-hover transition-all duration-200 z-20 animate-fade-in"
                        aria-label="Go to advanced editor"
                    >
                        <EditIcon className="w-5 h-5" />
                        <span>المحرر المتقدم</span>
                    </button>
                )}

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-20"
                    aria-label="Close zoomed image"
                >
                    <XMarkIcon className="w-8 h-8" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm p-2 rounded-full z-20">
                     <button onClick={() => handleZoom('out')} className="p-3 text-white rounded-full hover:bg-white/20 transition-colors" aria-label="Zoom out">
                        <ZoomOutIcon className="w-6 h-6" />
                    </button>
                    <button onClick={resetView} className="p-3 text-white rounded-full hover:bg-white/20 transition-colors" aria-label="Fit to screen">
                        <ViewfinderCircleIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => handleZoom('in')} className="p-3 text-white rounded-full hover:bg-white/20 transition-colors" aria-label="Zoom in">
                        <ZoomInIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ImageZoomModal;