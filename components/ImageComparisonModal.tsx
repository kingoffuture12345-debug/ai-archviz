import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from './icons/XMarkIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { ViewfinderCircleIcon } from './icons/ViewfinderCircleIcon';
import { EditIcon } from './icons/EditIcon';
import { EyeIcon } from './icons/EyeIcon';
import { ArrowsRightLeftIcon } from './icons/ArrowsRightLeftIcon';
import { SliderHorizontalIcon } from './icons/SliderHorizontalIcon';

interface ImageComparisonModalProps {
    beforeImageUrl: string;
    afterImageUrl: string;
    onClose: () => void;
    onEdit: (imageUrl: string) => void;
}

const ImageComparisonModal: React.FC<ImageComparisonModalProps> = ({ beforeImageUrl, afterImageUrl, onClose, onEdit }) => {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [sliderPosition, setSliderPosition] = useState(50); // Percentage
    const [isPeeking, setIsPeeking] = useState(false);
    const [isSliderModeActive, setIsSliderModeActive] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [isDraggingSlider, setIsDraggingSlider] = useState(false);
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
        const initialScale = Math.min(scaleX, scaleY) * 0.95; // 95% zoom to have padding

        setScale(initialScale);
        
        const scaledWidth = imageDimensions.width * initialScale;
        const scaledHeight = imageDimensions.height * initialScale;
        const offsetX = (containerWidth - scaledWidth) / 2;
        const offsetY = (containerHeight - scaledHeight) / 2;

        setOffset({ x: offsetX, y: offsetY });
    }, [imageDimensions]);

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    useEffect(() => {
        setIsImageLoaded(false);
        const loadImage = (src: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(img);
                img.onerror = (err) => reject(err);
            });
        };

        Promise.all([loadImage(beforeImageUrl), loadImage(afterImageUrl)])
            .then(([beforeImg]) => {
                setImageDimensions({ width: beforeImg.naturalWidth, height: beforeImg.naturalHeight });
                setIsImageLoaded(true);
            })
            .catch(console.error);
    }, [beforeImageUrl, afterImageUrl]);

    useEffect(() => {
        if (isImageLoaded) {
            resetView();
        }
    }, [isImageLoaded, resetView]);
    
    useEffect(() => {
        window.addEventListener('resize', resetView);
        return () => window.removeEventListener('resize', resetView);
    }, [resetView]);
    
    useEffect(() => {
        const handleSliderMove = (e: MouseEvent | TouchEvent) => {
            if (!imageWrapperRef.current) return;
    
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            
            const rect = imageWrapperRef.current.getBoundingClientRect();
            const x = clientX - rect.left;
            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    
            setSliderPosition(percentage);
        };
    
        const handleSliderUp = () => {
            setIsDraggingSlider(false);
        };

        if (isDraggingSlider) {
            document.addEventListener('mousemove', handleSliderMove);
            document.addEventListener('touchmove', handleSliderMove, { passive: false });
            document.addEventListener('mouseup', handleSliderUp);
            document.addEventListener('touchend', handleSliderUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleSliderMove);
            document.removeEventListener('touchmove', handleSliderMove);
            document.removeEventListener('mouseup', handleSliderUp);
            document.removeEventListener('touchend', handleSliderUp);
        };
    }, [isDraggingSlider]);

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
        if ((e.target as HTMLElement).closest('[data-slider-handle="true"]')) {
            return;
        }
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

    const handleSliderMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsDraggingSlider(true);
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
                        جاري تحميل الصور...
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
                            src={beforeImageUrl}
                            alt="Before view"
                            className="absolute inset-0 w-full h-full"
                            draggable="false"
                        />
                         <div
                            className="absolute inset-0 w-full h-full overflow-hidden"
                            style={{
                                clipPath: isSliderModeActive ? `inset(0 ${100 - sliderPosition}% 0 0)` : 'inset(0 0% 0 0)',
                                opacity: isPeeking ? 0 : 1,
                                transition: isSliderModeActive ? 'none' : 'opacity 0.2s ease-in-out',
                            }}
                        >
                             <img
                                src={afterImageUrl}
                                alt="After view"
                                className="absolute inset-0 w-full h-full"
                                draggable="false"
                            />
                        </div>
                         {isSliderModeActive && (
                            <div 
                                className="absolute top-0 bottom-0 -translate-x-4 w-8 cursor-ew-resize z-10 group"
                                style={{
                                    left: `${sliderPosition}%`,
                                }}
                                onMouseDown={handleSliderMouseDown}
                                onTouchStart={handleSliderMouseDown}
                                data-slider-handle="true"
                            >
                                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-white opacity-90 shadow-lg group-hover:shadow-[0_0_8px_white] transition-shadow duration-200"></div>
                                <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-white text-dark-primary rounded-full p-1 shadow-lg group-hover:scale-110 transition-transform duration-200">
                                    <ArrowsRightLeftIcon className="w-5 h-5" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* --- UI Controls --- */}
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(afterImageUrl); }}
                    className="absolute top-4 left-4 bg-accent text-white py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-accent-hover transition-all duration-200 z-20 animate-fade-in"
                    aria-label="Go to advanced editor"
                >
                    <EditIcon className="w-5 h-5" />
                    <span>المحرر المتقدم</span>
                </button>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-20"
                    aria-label="Close comparison view"
                >
                    <XMarkIcon className="w-8 h-8" />
                </button>
                
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm p-1 rounded-full z-20">
                     <button
                        onMouseDown={() => setIsPeeking(true)}
                        onMouseUp={() => setIsPeeking(false)}
                        onMouseLeave={() => setIsPeeking(false)}
                        onTouchStart={() => setIsPeeking(true)}
                        onTouchEnd={() => setIsPeeking(false)}
                        disabled={isSliderModeActive}
                        className={`p-3 text-white rounded-full hover:bg-white/20 transition-colors ${isSliderModeActive ? 'opacity-50 cursor-not-allowed' : ''}`} aria-label="Peek at original (hold)"
                    >
                        <EyeIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setIsSliderModeActive(prev => !prev)}
                        className={`p-3 text-white rounded-full hover:bg-white/20 transition-colors ${isSliderModeActive ? 'bg-accent/50' : ''}`}
                        aria-label="Toggle slider comparison mode"
                    >
                        <SliderHorizontalIcon className="w-6 h-6" />
                    </button>
                </div>
                
                {isSliderModeActive && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-64 z-20 animate-fade-in">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={sliderPosition}
                            onChange={(e) => setSliderPosition(Number(e.target.value))}
                            className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-accent"
                            aria-label="Comparison slider"
                        />
                    </div>
                )}


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

export default ImageComparisonModal;