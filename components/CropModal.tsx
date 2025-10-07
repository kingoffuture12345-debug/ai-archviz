import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from './icons/XMarkIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { ViewfinderCircleIcon } from './icons/ViewfinderCircleIcon';

interface CropModalProps {
    imageUrl: string;
    onClose: () => void;
    onCropComplete: (croppedDataUrl: string) => void;
    outputSize?: number;
}

const CropModal: React.FC<CropModalProps> = ({ imageUrl, onClose, onCropComplete, outputSize = 512 }) => {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cropSizeRef = useRef({ width: 0, height: 0 });

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => setImage(img);
    }, [imageUrl]);

    const resetView = useCallback(() => {
        if (!image || !containerRef.current) return;
        const container = containerRef.current;
        const { clientWidth: containerWidth, clientHeight: containerHeight } = container;
        const cropWidth = Math.min(containerWidth, containerHeight) * 0.8;
        cropSizeRef.current = { width: cropWidth, height: cropWidth };

        const scaleX = cropWidth / image.naturalWidth;
        const scaleY = cropWidth / image.naturalHeight;
        const initialScale = Math.max(scaleX, scaleY);

        setScale(initialScale);
        setOffset({
            x: (containerWidth - image.naturalWidth * initialScale) / 2,
            y: (containerHeight - image.naturalHeight * initialScale) / 2,
        });
    }, [image]);

    useEffect(() => {
        if (image) resetView();
    }, [image, resetView]);
    
    useEffect(() => {
        window.addEventListener('resize', resetView);
        return () => window.removeEventListener('resize', resetView);
    }, [resetView]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !image) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        // Draw image
        ctx.save();
        ctx.translate(offset.x, offset.y);
        ctx.scale(scale, scale);
        ctx.drawImage(image, 0, 0);
        ctx.restore();

        // Draw crop overlay
        const { width: cropWidth, height: cropHeight } = cropSizeRef.current;
        const cropX = (canvas.width - cropWidth) / 2;
        const cropY = (canvas.height - cropHeight) / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.rect(cropX, cropY, cropWidth, cropHeight);
        ctx.closePath();
        ctx.fill('evenodd');
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);
        ctx.restore();

    }, [image, scale, offset]);
    
    useEffect(() => {
        draw();
    }, [draw]);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = Math.max(0.1, Math.min(scale * (1 + scaleAmount), 10));

        const rect = canvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newOffsetX = mouseX - (mouseX - offset.x) * (newScale / scale);
        const newOffsetY = mouseY - (mouseY - offset.y) * (newScale / scale);

        setScale(newScale);
        setOffset({ x: newOffsetX, y: newOffsetY });
    };
    
    const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const point = 'touches' in e ? e.touches[0] : e;
        setIsPanning(true);
        setPanStart({ x: point.clientX - offset.x, y: point.clientY - offset.y });
    };

    const handlePanMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isPanning) return;
        e.preventDefault();
        const point = 'touches' in e ? e.touches[0] : e;
        setOffset({ x: point.clientX - panStart.x, y: point.clientY - panStart.y });
    };

    const handlePanEnd = () => setIsPanning(false);

    const handleZoom = (direction: 'in' | 'out') => {
        const scaleAmount = 0.2;
        const newScale = direction === 'in' ? scale * (1 + scaleAmount) : scale / (1 + scaleAmount);
        setScale(Math.max(0.1, Math.min(newScale, 10)));
    };
    
    const handleCrop = () => {
        if (!image || !canvasRef.current) return;

        const { width: cropWidth, height: cropHeight } = cropSizeRef.current;
        const canvas = canvasRef.current;
        const cropX = (canvas.width - cropWidth) / 2;
        const cropY = (canvas.height - cropHeight) / 2;

        const sx = (cropX - offset.x) / scale;
        const sy = (cropY - offset.y) / scale;
        const sWidth = cropWidth / scale;
        const sHeight = cropHeight / scale;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = outputSize;
        tempCanvas.height = outputSize;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCtx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, outputSize, outputSize);
        onCropComplete(tempCanvas.toDataURL('image/jpeg', 0.9));
    };

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="relative w-full h-full max-w-4xl max-h-[80vh] flex flex-col bg-dark-secondary rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div 
                    ref={containerRef}
                    className="flex-grow relative overflow-hidden cursor-grab"
                    onMouseDown={handlePanStart}
                    onMouseMove={handlePanMove}
                    onMouseUp={handlePanEnd}
                    onMouseLeave={handlePanEnd}
                    onTouchStart={handlePanStart}
                    onTouchMove={handlePanMove}
                    onTouchEnd={handlePanEnd}
                    onWheel={handleWheel}
                    style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
                >
                    <canvas ref={canvasRef} className="absolute inset-0" />
                </div>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm p-2 rounded-full z-20">
                <button onClick={() => handleZoom('out')} className="p-3 text-white rounded-full hover:bg-white/20 transition-colors" aria-label="Zoom out"><ZoomOutIcon className="w-6 h-6" /></button>
                <button onClick={resetView} className="p-3 text-white rounded-full hover:bg-white/20 transition-colors" aria-label="Fit to screen"><ViewfinderCircleIcon className="w-6 h-6" /></button>
                <button onClick={() => handleZoom('in')} className="p-3 text-white rounded-full hover:bg-white/20 transition-colors" aria-label="Zoom in"><ZoomInIcon className="w-6 h-6" /></button>
            </div>

            <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-20"><XMarkIcon className="w-8 h-8" /></button>
            
            <div className="mt-4 flex gap-4">
                <button onClick={onClose} className="px-6 py-2 rounded-lg bg-dark-secondary text-dark-text hover:bg-dark-border font-semibold transition-colors">Cancel</button>
                <button onClick={handleCrop} className="px-6 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover font-semibold transition-colors">Apply Crop</button>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default CropModal;