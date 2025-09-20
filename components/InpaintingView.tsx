import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { EraserIcon } from './icons/EraserIcon';
import { UndoIcon } from './icons/UndoIcon';
import { WandSparklesIcon } from './icons/WandSparklesIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { LassoIcon } from './icons/LassoIcon';
import { generateDesign } from '../services/geminiService';
import { DEFAULT_AI_MODEL } from '../constants';
import { RedoIcon } from './icons/RedoIcon';
import { ApplyIcon } from './icons/ApplyIcon';
import { MoveIcon } from './icons/MoveIcon';
import { CropIcon } from './icons/CropIcon';
import { SmartSelectIcon } from './icons/SmartSelectIcon';
import { ManualSelectIcon } from './icons/ManualSelectIcon';


const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const mimeType = result.split(':')[1].split(';')[0];
            const base64Data = result.split(',')[1];
            resolve({ data: base64Data, mimeType });
        };
        reader.onerror = (error) => reject(error);
    });
};

interface InpaintingViewProps {
  imageUrl: string;
  onClose: () => void;
  onComplete: (newImageUrl: string) => void;
}

type Tool = 'brush' | 'eraser' | 'magic-wand' | 'lasso' | 'pan';

const InpaintingView: React.FC<InpaintingViewProps> = ({ imageUrl, onClose, onComplete }) => {
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTool, setActiveTool] = useState<Tool>('brush');
    const [brushSize, setBrushSize] = useState(40);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    const [viewTransform, setViewTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [magicWandTolerance, setMagicWandTolerance] = useState(20);

    const imageRef = useRef<HTMLImageElement | null>(null);
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef<{ x: number, y: number } | null>(null);
    const lassoPointsRef = useRef<Array<{ x: number, y: number }>>([]);
    
    const drawCanvases = useCallback(() => {
        const imageCanvas = imageCanvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        const image = imageRef.current;
        if (!imageCanvas || !maskCanvas || !image) return;

        const imageCtx = imageCanvas.getContext('2d');
        const maskCtx = maskCanvas.getContext('2d');
        if (!imageCtx || !maskCtx) return;

        // Clear canvases
        imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

        // Apply transformations
        imageCtx.save();
        maskCtx.save();
        imageCtx.translate(viewTransform.offsetX, viewTransform.offsetY);
        maskCtx.translate(viewTransform.offsetX, viewTransform.offsetY);
        imageCtx.scale(viewTransform.scale, viewTransform.scale);
        maskCtx.scale(viewTransform.scale, viewTransform.scale);

        // Draw image and current mask
        imageCtx.drawImage(image, 0, 0);
        if (history[historyIndex]) {
            // Create a temporary canvas to draw the history ImageData
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = image.width;
            tempCanvas.height = image.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                tempCtx.putImageData(history[historyIndex], 0, 0);
                maskCtx.drawImage(tempCanvas, 0, 0);
            }
        }
        
        imageCtx.restore();
        maskCtx.restore();

    }, [viewTransform, history, historyIndex]);

    const resetView = useCallback((image: HTMLImageElement) => {
        const container = containerRef.current;
        if (!container || !image.width || !image.height) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const scaleX = containerWidth / image.width;
        const scaleY = containerHeight / image.height;
        const scale = Math.min(scaleX, scaleY, 1);

        const offsetX = (containerWidth - image.width * scale) / 2;
        const offsetY = (containerHeight - image.height * scale) / 2;

        setViewTransform({ scale, offsetX, offsetY });
    }, []);
    
    useEffect(() => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = imageUrl;
        image.onload = () => {
            imageRef.current = image;
            const imageCanvas = imageCanvasRef.current;
            const maskCanvas = maskCanvasRef.current;
            const container = containerRef.current;
            if (!imageCanvas || !maskCanvas || !container) return;
            
            imageCanvas.width = container.clientWidth;
            imageCanvas.height = container.clientHeight;
            maskCanvas.width = container.clientWidth;
            maskCanvas.height = container.clientHeight;
            
            resetView(image);

            const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
            if (!maskCtx) return;
            const initialImageData = maskCtx.createImageData(image.width, image.height);
            setHistory([initialImageData]);
            setHistoryIndex(0);
        };
    }, [imageUrl, resetView]);

    useEffect(() => {
        drawCanvases();
    }, [drawCanvases, viewTransform]);
    
    const getPointOnCanvas = (clientX: number, clientY: number) => {
        const canvas = maskCanvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left - viewTransform.offsetX) / viewTransform.scale,
            y: (clientY - rect.top - viewTransform.offsetY) / viewTransform.scale,
        };
    };
    
    const handleMagicWandClick = (startPos: { x: number, y: number }) => {
        const image = imageRef.current;
        if (!image) return;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.width;
        tempCanvas.height = image.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCtx.drawImage(image, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, image.width, image.height);
        const maskData = new Uint8ClampedArray(imageData.data.length).fill(0);
        
        const startX = Math.floor(startPos.x);
        const startY = Math.floor(startPos.y);

        const startIndex = (startY * image.width + startX) * 4;
        const startR = imageData.data[startIndex];
        const startG = imageData.data[startIndex + 1];
        const startB = imageData.data[startIndex + 2];
        
        const toleranceSq = magicWandTolerance * magicWandTolerance;
        
        const queue: [number, number][] = [[startX, startY]];
        const visited = new Set<number>();
        visited.add(startY * image.width + startX);

        while (queue.length > 0) {
            const [x, y] = queue.shift()!;
            
            const idx = (y * image.width + x) * 4;
            maskData[idx] = 124; 
            maskData[idx + 1] = 58; 
            maskData[idx + 2] = 237; 
            maskData[idx + 3] = 180; 

            for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const newX = x + dx;
                const newY = y + dy;
                
                if (newX >= 0 && newX < image.width && newY >= 0 && newY < image.height) {
                    const newIndex = (newY * image.width + newX);
                    if (!visited.has(newIndex)) {
                        visited.add(newIndex);
                        const pixelIndex = newIndex * 4;
                        const r = imageData.data[pixelIndex];
                        const g = imageData.data[pixelIndex + 1];
                        const b = imageData.data[pixelIndex + 2];
                        
                        const distSq = (r - startR) ** 2 + (g - startG) ** 2 + (b - startB) ** 2;
                        
                        if (distSq <= toleranceSq) {
                            queue.push([newX, newY]);
                        }
                    }
                }
            }
        }
        
        const currentMask = history[historyIndex];
        const combinedData = new Uint8ClampedArray(currentMask.data.length);

        for (let i = 0; i < currentMask.data.length; i += 4) {
            const isNew = maskData[i+3] > 0;
            const isOld = currentMask.data[i+3] > 0;
            
            if (isNew || isOld) {
                combinedData[i] = 124;
                combinedData[i + 1] = 58;
                combinedData[i + 2] = 237;
                combinedData[i + 3] = 180;
            }
        }
        const newImageData = new ImageData(combinedData, image.width, image.height);
        
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, newImageData]);
        setHistoryIndex(newHistory.length);
    };

    const startAction = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;

        if (activeTool === 'pan') {
            setIsPanning(true);
            setPanStart({ x: clientX - viewTransform.offsetX, y: clientY - viewTransform.offsetY });
            return;
        }

        const pos = getPointOnCanvas(clientX, clientY);
        if (!pos) return;
        
        if (activeTool === 'magic-wand') {
            handleMagicWandClick(pos);
            return;
        }

        if (activeTool === 'lasso') {
            isDrawingRef.current = true;
            lassoPointsRef.current = [pos];
            return;
        }

        isDrawingRef.current = true;
        const maskCtx = maskCanvasRef.current?.getContext('2d');
        if (!maskCtx) return;

        maskCtx.lineWidth = brushSize;
        maskCtx.lineCap = 'round';
        maskCtx.lineJoin = 'round';

        if (activeTool === 'brush') {
            maskCtx.globalCompositeOperation = 'source-over';
            maskCtx.strokeStyle = 'rgba(124, 58, 237, 0.7)';
        } else { // eraser
            maskCtx.globalCompositeOperation = 'destination-out';
        }
        
        lastPosRef.current = pos;
        draw(e);
    };

    const draw = (e: React.MouseEvent) => {
        if (isPanning) {
             setViewTransform(prev => ({
                ...prev,
                offsetX: e.clientX - panStart.x,
                offsetY: e.clientY - panStart.y,
            }));
            return;
        }
        
        if (!isDrawingRef.current) return;
        const pos = getPointOnCanvas(e.clientX, e.clientY);
        if (!pos) return;

        const maskCtx = maskCanvasRef.current?.getContext('2d');
        if (!maskCtx) return;

        if (activeTool === 'lasso') {
            lassoPointsRef.current.push(pos);
            drawCanvases(); // Redraws image and current mask history
            maskCtx.save();
            maskCtx.translate(viewTransform.offsetX, viewTransform.offsetY);
            maskCtx.scale(viewTransform.scale, viewTransform.scale);
            
            maskCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            maskCtx.lineWidth = 2 / viewTransform.scale;
            maskCtx.setLineDash([6 / viewTransform.scale, 4 / viewTransform.scale]);
            maskCtx.beginPath();
            maskCtx.moveTo(lassoPointsRef.current[0].x, lassoPointsRef.current[0].y);
            for (let i = 1; i < lassoPointsRef.current.length; i++) {
                maskCtx.lineTo(lassoPointsRef.current[i].x, lassoPointsRef.current[i].y);
            }
            maskCtx.stroke();
            
            maskCtx.restore();
            return;
        }


        maskCtx.save();
        maskCtx.translate(viewTransform.offsetX, viewTransform.offsetY);
        maskCtx.scale(viewTransform.scale, viewTransform.scale);
        
        maskCtx.beginPath();
        if (lastPosRef.current) {
            maskCtx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        }
        maskCtx.lineTo(pos.x, pos.y);
        maskCtx.stroke();
        maskCtx.restore();
        
        lastPosRef.current = pos;
    };
    
    const stopAction = () => {
        if(isPanning) {
            setIsPanning(false);
            return;
        }
        
        if (activeTool === 'lasso' && isDrawingRef.current) {
            isDrawingRef.current = false;
            
            const image = imageRef.current;
            if (!image || lassoPointsRef.current.length < 3) {
                lassoPointsRef.current = [];
                drawCanvases();
                return;
            }

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = image.width;
            tempCanvas.height = image.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;

            if (history[historyIndex]) {
                tempCtx.putImageData(history[historyIndex], 0, 0);
            }

            tempCtx.fillStyle = 'rgba(124, 58, 237, 0.7)';
            tempCtx.globalCompositeOperation = 'source-over';
            tempCtx.beginPath();
            tempCtx.moveTo(lassoPointsRef.current[0].x, lassoPointsRef.current[0].y);
            for (let i = 1; i < lassoPointsRef.current.length; i++) {
                tempCtx.lineTo(lassoPointsRef.current[i].x, lassoPointsRef.current[i].y);
            }
            tempCtx.closePath();
            tempCtx.fill();
            
            const newImageData = tempCtx.getImageData(0, 0, image.width, image.height);
            const newHistory = history.slice(0, historyIndex + 1);
            setHistory([...newHistory, newImageData]);
            setHistoryIndex(newHistory.length);

            lassoPointsRef.current = [];
            return;
        }

        if (isDrawingRef.current) {
             isDrawingRef.current = false;
             lastPosRef.current = null;
             
             const finalMaskCanvas = document.createElement('canvas');
             const image = imageRef.current;
             if (!finalMaskCanvas || !image) return;
             finalMaskCanvas.width = image.width;
             finalMaskCanvas.height = image.height;
             const finalCtx = finalMaskCanvas.getContext('2d');
             if (!finalCtx) return;

             if (history[historyIndex]) {
                 finalCtx.putImageData(history[historyIndex], 0, 0);
             }
             
             finalCtx.drawImage(maskCanvasRef.current!, 0, 0, image.width, image.height);

             const newImageData = finalCtx.getImageData(0, 0, image.width, image.height);
             const newHistory = history.slice(0, historyIndex + 1);
             setHistory([...newHistory, newImageData]);
             setHistoryIndex(newHistory.length);
        }
    };
    
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const scaleAmount = 0.1;
        const newScale = e.deltaY > 0 ? viewTransform.scale * (1 - scaleAmount) : viewTransform.scale * (1 + scaleAmount);
        const clampedScale = Math.max(0.1, Math.min(newScale, 10));

        const rect = maskCanvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newOffsetX = mouseX - (mouseX - viewTransform.offsetX) * (clampedScale / viewTransform.scale);
        const newOffsetY = mouseY - (mouseY - viewTransform.offsetY) * (clampedScale / viewTransform.scale);

        setViewTransform({
            scale: clampedScale,
            offsetX: newOffsetX,
            offsetY: newOffsetY,
        });
    };

    const handleZoom = (direction: 'in' | 'out') => {
        const scaleAmount = 0.2;
        const newScale = direction === 'in' ? viewTransform.scale * (1 + scaleAmount) : viewTransform.scale / (1 + scaleAmount);
        const clampedScale = Math.max(0.1, Math.min(newScale, 10));

        const container = containerRef.current;
        if (!container) return;
        const centerX = container.clientWidth / 2;
        const centerY = container.clientHeight / 2;
        
        const newOffsetX = centerX - (centerX - viewTransform.offsetX) * (clampedScale / viewTransform.scale);
        const newOffsetY = centerY - (centerY - viewTransform.offsetY) * (clampedScale / viewTransform.scale);

        setViewTransform({
            scale: clampedScale,
            offsetX: newOffsetX,
            offsetY: newOffsetY,
        });
    };
    
    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt to describe your edit.");
            return;
        }
        if (!imageRef.current) {
            setError("Image not loaded yet.");
            return;
        }
        setIsLoading(true);
        setError(null);
        
        try {
            const { width, height } = imageRef.current;
            const maskBlob = await new Promise<Blob | null>(resolve => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = width;
                tempCanvas.height = height;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx && history[historyIndex]) {
                    tempCtx.putImageData(history[historyIndex], 0, 0);
                    tempCanvas.toBlob(resolve, 'image/png');
                } else {
                    resolve(null);
                }
            });

            if (!maskBlob) throw new Error("Could not generate mask.");

            const originalImageBlob = await (await fetch(imageUrl)).blob();
            const originalImageFile = new File([originalImageBlob], "original.png", { type: originalImageBlob.type });
            const originalImageBase64 = await fileToBase64(originalImageFile);
            
            const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });
            const maskBase64 = await fileToBase64(maskFile);
            
            const fullPrompt = `${prompt}. The output must ONLY be the final photorealistic image.`;

            const parts = [
                { inlineData: { data: originalImageBase64.data, mimeType: originalImageBase64.mimeType } },
                { text: fullPrompt },
                { inlineData: { data: maskBase64.data, mimeType: maskBase64.mimeType } },
            ];

            const response = await generateDesign(fullPrompt, originalImageBase64, [{ data: maskBase64.data, mimeType: maskBase64.mimeType }], DEFAULT_AI_MODEL);
            onComplete(`data:image/png;base64,${response}`);
        } catch (e) {
             const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate edit: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const ToolButton: React.FC<{ tool: Tool, label: string, children: React.ReactNode }> = ({ tool, label, children }) => {
        const isActive = activeTool === tool;
        return (
            <button
                onClick={() => setActiveTool(tool)}
                className={`p-3 rounded-lg flex flex-col items-center justify-center transition-colors ${isActive ? 'bg-accent text-white' : 'hover:bg-dark-border'}`}
                aria-label={label}
                title={label}
            >
                {children}
            </button>
        );
    };
    
    const canvasCursor = () => {
        switch (activeTool) {
            case 'pan':
                return isPanning ? 'cursor-grabbing' : 'cursor-grab';
            default:
                return 'cursor-crosshair';
        }
    };

    return (
        <div className="fixed inset-0 bg-dark-primary flex flex-col h-full w-full z-10 animate-fade-in">
            <header className="flex-shrink-0 bg-dark-secondary flex items-center justify-between p-3">
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-border">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-bold">تعديل الصورة</h2>
                <div className="w-10"></div>
            </header>
            
            <div 
                ref={containerRef} 
                className="flex-grow flex items-center justify-center p-4 relative overflow-hidden"
                onWheel={handleWheel}
            >
                <canvas ref={imageCanvasRef} className="absolute pointer-events-none" />
                <canvas 
                    ref={maskCanvasRef} 
                    className={`absolute ${canvasCursor()}`}
                    onMouseDown={startAction}
                    onMouseMove={draw}
                    onMouseUp={stopAction}
                    onMouseLeave={stopAction}
                />
            </div>

             <div className="flex-shrink-0 p-4 bg-dark-secondary/80 backdrop-blur-sm space-y-3">
                 <input 
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-dark-primary border-2 border-dark-border rounded-lg p-3 text-dark-text placeholder:text-dark-text-secondary focus:ring-2 focus:ring-accent focus:border-accent"
                    placeholder="صف التعديل في المنطقة المحددة..."
                    disabled={isLoading}
                 />
                 {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                 <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full bg-accent hover:bg-accent-hover disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
                 >
                     {isLoading ? 'جاري التعديل...' : <><WandSparklesIcon className="w-5 h-5 mr-2" /> تعديل</>}
                 </button>
            </div>

            <footer className="flex-shrink-0 bg-dark-secondary flex justify-center items-center gap-1 p-2 overflow-x-auto">
                <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-3 rounded-lg hover:bg-dark-border disabled:opacity-50" title="Undo">
                    <UndoIcon className="w-6 h-6" />
                </button>
                <ToolButton tool="magic-wand" label="Favorites"><SmartSelectIcon className="w-6 h-6" /></ToolButton>
                <ToolButton tool="brush" label="Painting Tool"><ManualSelectIcon className="w-6 h-6" /></ToolButton>
                <ToolButton tool="lasso" label="Comment"><LassoIcon className="w-6 h-6" /></ToolButton>
                <ToolButton tool="eraser" label="Eraser"><EraserIcon className="w-6 h-6" /></ToolButton>
                <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-3 rounded-lg hover:bg-dark-border disabled:opacity-50" title="Redo">
                    <RedoIcon className="w-6 h-6" />
                </button>
                <button disabled className="p-3 rounded-lg hover:bg-dark-border disabled:opacity-50" title="Confirm">
                    <ApplyIcon className="w-6 h-6" />
                </button>
                <ToolButton tool="pan" label="Move Tool"><MoveIcon className="w-6 h-6" /></ToolButton>
                <button disabled className="p-3 rounded-lg hover:bg-dark-border disabled:opacity-50" title="Crop">
                    <CropIcon className="w-6 h-6" />
                </button>
                <button onClick={() => handleZoom('in')} className="p-3 rounded-lg hover:bg-dark-border" title="Zoom In"><ZoomInIcon className="w-6 h-6" /></button>
                <button onClick={() => handleZoom('out')} className="p-3 rounded-lg hover:bg-dark-border" title="Zoom Out"><ZoomOutIcon className="w-6 h-6" /></button>
            </footer>
        </div>
    );
};

export default InpaintingView;