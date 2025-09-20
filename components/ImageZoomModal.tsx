import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from './icons/XMarkIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { ViewfinderCircleIcon } from './icons/ViewfinderCircleIcon';

interface ImageZoomModalProps {
    imageUrl: string | null;
    onClose: () => void;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ imageUrl, onClose }) => {
    const [transform, setTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const calculateFitTransform = useCallback(() => {
        if (!imageRef.current || !containerRef.current) {
            return { scale: 1, offsetX: 0, offsetY: 0 };
        }
        const image = imageRef.current;
        const container = containerRef.current;
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const imageWidth = image.naturalWidth;
        const imageHeight = image.naturalHeight;

        if (imageWidth === 0 || imageHeight === 0) {
             return { scale: 1, offsetX: 0, offsetY: 0 };
        }

        const scaleX = containerWidth / imageWidth;
        const scaleY = containerHeight / imageHeight;
        const scale = Math.min(scaleX, scaleY, 1);

        const offsetX = (containerWidth - imageWidth * scale) / 2;
        const offsetY = (containerHeight - imageHeight * scale) / 2;

        return { scale, offsetX, offsetY };
    }, []);

    const resetView = useCallback(() => {
        const fitTransform = calculateFitTransform();
        setTransform(fitTransform);
    }, [calculateFitTransform]);

    useEffect(() => {
        const image = imageRef.current;
        if (imageUrl && image) {
            const handleLoad = () => resetView();
            image.addEventListener('load', handleLoad);
            // If image is already cached/loaded
            if (image.complete) {
                handleLoad();
            }
            return () => image.removeEventListener('load', handleLoad);
        }
    }, [imageUrl, resetView]);
    
    // Handle window resize
    useEffect(() => {
        window.addEventListener('resize', resetView);
        return () => window.removeEventListener('resize', resetView);
    }, [resetView]);

    if (!imageUrl) {
        return null;
    }

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = transform.scale * (1 + scaleAmount);
        const clampedScale = Math.max(0.1, Math.min(newScale, 10));

        const rect = containerRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newOffsetX = mouseX - (mouseX - transform.offsetX) * (clampedScale / transform.scale);
        const newOffsetY = mouseY - (mouseY - transform.offsetY) * (clampedScale / transform.scale);
        
        setTransform({ scale: clampedScale, offsetX: newOffsetX, offsetY: newOffsetY });
    };

    const handleZoom = (direction: 'in' | 'out') => {
        const scaleAmount = 0.2;
        const newScale = direction === 'in' 
            ? transform.scale * (1 + scaleAmount) 
            : transform.scale / (1 + scaleAmount);
        const clampedScale = Math.max(0.1, Math.min(newScale, 10));

        const container = containerRef.current!;
        const centerX = container.clientWidth / 2;
        const centerY = container.clientHeight / 2;
        
        const newOffsetX = centerX - (centerX - transform.offsetX) * (clampedScale / transform.scale);
        const newOffsetY = centerY - (centerY - transform.offsetY) * (clampedScale / transform.scale);

        setTransform({ scale: clampedScale, offsetX: newOffsetX, offsetY: newOffsetY });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({
            x: e.clientX - transform.offsetX,
            y: e.clientY - transform.offsetY,
        });
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning) return;
        e.preventDefault();
        setTransform(prev => ({
            ...prev,
            offsetX: e.clientX - panStart.x,
            offsetY: e.clientY - panStart.y,
        }));
    };
    
    const handleMouseUpOrLeave = () => {
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
            >
                <div
                    className={`absolute w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                    style={{
                        transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`,
                        transformOrigin: '0 0',
                    }}
                >
                    <img
                        ref={imageRef}
                        src={imageUrl}
                        alt="Zoomed view"
                        className="block max-w-none max-h-none shadow-2xl"
                        draggable="false"
                    />
                </div>
                
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