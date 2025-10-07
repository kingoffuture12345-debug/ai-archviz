import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from './icons/XMarkIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { ViewfinderCircleIcon } from './icons/ViewfinderCircleIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { ScissorsIcon } from './icons/ScissorsIcon';
import { MoveIcon } from './icons/MoveIcon';
import { PolylineSelectIcon } from './icons/PolylineSelectIcon';
import { Bars3Icon } from './icons/Bars3Icon';
import { WandSparklesIcon } from './icons/WandSparklesIcon';
import { Asset, GeneratedAsset } from '../types';

interface Point {
    x: number;
    y: number;
}

type Path = Point[];

interface AssetEditorModalProps {
    asset: Asset;
    onClose: () => void;
    onComplete: (sourceAssetId: string, generatedAssets: GeneratedAsset[]) => void;
}

type Tool = 'scissors' | 'pan' | 'polyline';

const AssetEditorModal: React.FC<AssetEditorModalProps> = ({ asset, onClose, onComplete }) => {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [viewTransform, setViewTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
    const [history, setHistory] = useState<Path[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [activeTool, setActiveTool] = useState<Tool>('scissors');
    const [isPanning, setIsPanning] = useState(false);
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>(asset._generatedAssetsCache || []);
    const [isGenerating, setIsGenerating] = useState(false);


    const containerRef = useRef<HTMLDivElement>(null);
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const interactionCanvasRef = useRef<HTMLCanvasElement>(null);

    const isDrawingRef = useRef(false);
    const currentPathRef = useRef<Path>([]);
    const panStartRef = useRef<{ x: number; y: number } | null>(null);
    const pinchStartDistanceRef = useRef<number | null>(null);
    
    // For Polyline Tool
    const strokePointsRef = useRef<Path>([]);
    const interactionStartPosRef = useRef<Point | null>(null);

    const isMaskEmpty = useMemo(() => (history[historyIndex] || []).length === 0, [history, historyIndex]);

    const handleGenerateAsset = useCallback(async () => {
        if (!image || isMaskEmpty || generatedAssets.length >= 5) return;
        
        setIsGenerating(true);
        await new Promise(resolve => setTimeout(resolve, 10));

        try {
            const currentPaths = history[historyIndex];
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            currentPaths.forEach(path => {
                path.forEach(point => {
                    minX = Math.min(minX, point.x);
                    minY = Math.min(minY, point.y);
                    maxX = Math.max(maxX, point.x);
                    maxY = Math.max(maxY, point.y);
                });
            });
            
            if (maxX === -Infinity) {
                 setIsGenerating(false);
                 return;
            }

            const boxWidth = maxX - minX;
            const boxHeight = maxY - minY;

            const assetCanvas = document.createElement('canvas');
            assetCanvas.width = boxWidth;
            assetCanvas.height = boxHeight;
            const assetCtx = assetCanvas.getContext('2d');
            if (!assetCtx) {
                throw new Error("Could not get canvas context for asset generation.");
            }

            assetCtx.beginPath();
            currentPaths.forEach(path => {
                if (path.length > 0) {
                    assetCtx.moveTo(path[0].x - minX, path[0].y - minY);
                    path.slice(1).forEach(point => {
                        assetCtx.lineTo(point.x - minX, point.y - minY);
                    });
                    assetCtx.closePath();
                }
            });
            assetCtx.clip();

            assetCtx.drawImage(
                image,
                minX, minY, boxWidth, boxHeight,
                0, 0, boxWidth, boxHeight
            );
            
            const dataUrl = assetCanvas.toDataURL('image/png');
            const base64Data = dataUrl.substring(dataUrl.indexOf(',') + 1);
            const newAsset: GeneratedAsset = {
                id: `gen_asset_${Date.now()}_${Math.random()}`,
                url: dataUrl,
                base64: { data: base64Data, mimeType: 'image/png' },
            };
            setGeneratedAssets(prev => [...prev, newAsset]);
            setHistory([[]]);
            setHistoryIndex(0);

        } catch (err) {
            console.error("Failed to generate asset:", err);
        } finally {
            setIsGenerating(false);
        }
    }, [image, history, historyIndex, isMaskEmpty, generatedAssets.length]);

    const handleRemoveGeneratedAsset = (idToRemove: string) => {
        setGeneratedAssets(prev => prev.filter((asset) => asset.id !== idToRemove));
    };

    const isGenerateDisabled = isGenerating || isMaskEmpty || generatedAssets.length >= 5;

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = originalOverflow; };
    }, []);
    
    useEffect(() => {
        if (activeTool !== 'polyline') {
            strokePointsRef.current = [];
            const intCtx = interactionCanvasRef.current?.getContext('2d');
            if (intCtx) intCtx.clearRect(0, 0, intCtx.canvas.width, intCtx.canvas.height);
        }
    }, [activeTool]);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = asset.url;
        img.onload = () => setImage(img);
    }, [asset.url]);

    const fitToScreen = useCallback(() => {
        if (!image || !containerRef.current) return;
        const { clientWidth, clientHeight } = containerRef.current;
        const scale = Math.min(clientWidth / image.naturalWidth, clientHeight / image.naturalHeight) * 0.9;
        setViewTransform({
            scale,
            offsetX: (clientWidth - image.naturalWidth * scale) / 2,
            offsetY: (clientHeight - image.naturalHeight * scale) / 2,
        });
    }, [image]);

    useEffect(() => {
        const resizeHandler = () => fitToScreen();
        window.addEventListener('resize', resizeHandler);
        return () => window.removeEventListener('resize', resizeHandler);
    }, [fitToScreen]);

    useEffect(() => {
        if (image) fitToScreen();
    }, [image, fitToScreen]);

    const drawPaths = useCallback((ctx: CanvasRenderingContext2D, paths: Path[]) => {
        ctx.fillStyle = 'rgba(124, 58, 237, 0.4)'; // Semi-transparent purple fill
        ctx.strokeStyle = 'rgba(124, 58, 237, 1)'; // Solid purple line
        ctx.lineWidth = 2 / viewTransform.scale;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        paths.forEach(path => {
            if (path.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            path.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });
    }, [viewTransform.scale]);

    const redraw = useCallback(() => {
        const canvases = [imageCanvasRef.current, interactionCanvasRef.current];
        const container = containerRef.current;
        if (!image || !container || canvases.some(c => !c)) return;

        const { clientWidth, clientHeight } = container;
        canvases.forEach(c => {
            if (c) { c.width = clientWidth; c.height = clientHeight; }
        });

        const imageCtx = imageCanvasRef.current!.getContext('2d')!;
        imageCtx.clearRect(0, 0, clientWidth, clientHeight);
        imageCtx.save();
        imageCtx.translate(viewTransform.offsetX, viewTransform.offsetY);
        imageCtx.scale(viewTransform.scale, viewTransform.scale);
        imageCtx.drawImage(image, 0, 0);
        
        const currentPaths = history[historyIndex] || [];
        drawPaths(imageCtx, currentPaths);
        imageCtx.restore();

    }, [image, viewTransform, history, historyIndex, drawPaths]);

    useEffect(() => redraw(), [redraw]);

    const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): Point | null => {
        const canvas = interactionCanvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        
        let point: { clientX: number, clientY: number } | undefined;

        if ('touches' in e && e.touches.length > 0) {
            point = e.touches[0];
        } else if ('changedTouches' in e && e.changedTouches.length > 0) {
            point = e.changedTouches[0];
        } else if ('clientX' in e) {
            point = e;
        }

        if (!point) return null;
        
        return {
            x: (point.clientX - rect.left - viewTransform.offsetX) / viewTransform.scale,
            y: (point.clientY - rect.top - viewTransform.offsetY) / viewTransform.scale,
        };
    };

    const handleUndo = () => historyIndex > 0 && setHistoryIndex(prev => prev - 1);
    const handleRedo = () => historyIndex < history.length - 1 && setHistoryIndex(prev => prev + 1);

    const commitPath = (newPath: Path) => {
        if (newPath.length < 3) return;
        const currentPaths = history[historyIndex] || [];
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push([...currentPaths, newPath]);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e && e.touches.length === 2) {
            e.preventDefault();
            const [touch1, touch2] = e.touches;
            const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            pinchStartDistanceRef.current = dist;
            isDrawingRef.current = false;
            setIsPanning(false);
            return;
        }

        const point = 'touches' in e ? e.touches[0] : e;
        if (!point) return;

        const canvasPoint = getCanvasPoint(e);
        if (!canvasPoint) return;
        interactionStartPosRef.current = canvasPoint;

        if (activeTool === 'pan') {
            e.preventDefault();
            setIsPanning(true);
            panStartRef.current = { x: point.clientX - viewTransform.offsetX, y: point.clientY - viewTransform.offsetY };
        } else if (activeTool === 'scissors') { // lasso
            e.preventDefault();
            isDrawingRef.current = true;
            currentPathRef.current = [canvasPoint];
        }
    };

    const handleInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (activeTool === 'polyline' && interactionCanvasRef.current) {
            const intCtx = interactionCanvasRef.current.getContext('2d')!;
            intCtx.clearRect(0, 0, intCtx.canvas.width, intCtx.canvas.height);
            
            const currentPoint = getCanvasPoint(e);
            if (!currentPoint) return;

            intCtx.save();
            intCtx.translate(viewTransform.offsetX, viewTransform.offsetY);
            intCtx.scale(viewTransform.scale, viewTransform.scale);
            
            intCtx.strokeStyle = 'rgba(124, 58, 237, 1)';
            intCtx.lineWidth = 2 / viewTransform.scale;

            if (strokePointsRef.current.length > 0) {
                intCtx.beginPath();
                intCtx.moveTo(strokePointsRef.current[0].x, strokePointsRef.current[0].y);
                for (let i = 1; i < strokePointsRef.current.length; i++) {
                    intCtx.lineTo(strokePointsRef.current[i].x, strokePointsRef.current[i].y);
                }
                intCtx.stroke();
                
                const lastPoint = strokePointsRef.current[strokePointsRef.current.length - 1];
                intCtx.beginPath();
                intCtx.moveTo(lastPoint.x, lastPoint.y);
                intCtx.lineTo(currentPoint.x, currentPoint.y);
                intCtx.stroke();

                const firstPoint = strokePointsRef.current[0];
                const dist = Math.hypot(currentPoint.x - firstPoint.x, currentPoint.y - firstPoint.y);
                if (dist < 10 / viewTransform.scale) {
                    intCtx.beginPath();
                    intCtx.arc(firstPoint.x, firstPoint.y, 5 / viewTransform.scale, 0, 2 * Math.PI);
                    intCtx.fillStyle = 'rgba(124, 58, 237, 0.8)';
                    intCtx.fill();
                }
            }
            intCtx.restore();
        }

        if ('touches' in e && e.touches.length === 2) {
            e.preventDefault();
            if (pinchStartDistanceRef.current === null) return;
    
            const [touch1, touch2] = e.touches;
            const newDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            const scaleFactor = newDist / pinchStartDistanceRef.current;
            const newScale = viewTransform.scale * scaleFactor;
            const clampedScale = Math.max(0.1, Math.min(newScale, 10));
    
            const rect = interactionCanvasRef.current!.getBoundingClientRect();
            const midX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
            const midY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
    
            const newOffsetX = midX - (midX - viewTransform.offsetX) * (clampedScale / viewTransform.scale);
            const newOffsetY = midY - (midY - viewTransform.offsetY) * (clampedScale / viewTransform.scale);
    
            setViewTransform({ scale: clampedScale, offsetX: newOffsetX, offsetY: newOffsetY });
            pinchStartDistanceRef.current = newDist;
            return;
        }


        if (isPanning) {
            e.preventDefault();
            const point = 'touches' in e ? e.touches[0] : e;
            if (!panStartRef.current || !point) return;
            setViewTransform(prev => ({
                ...prev,
                offsetX: point.clientX - panStartRef.current!.x,
                offsetY: point.clientY - panStartRef.current!.y,
            }));
        } else if (isDrawingRef.current) {
            e.preventDefault();
            const point = getCanvasPoint(e);
            if (!point) return;
    
            currentPathRef.current.push(point);
    
            const intCtx = interactionCanvasRef.current!.getContext('2d')!;
            intCtx.clearRect(0, 0, intCtx.canvas.width, intCtx.canvas.height);
            intCtx.save();
            intCtx.translate(viewTransform.offsetX, viewTransform.offsetY);
            intCtx.scale(viewTransform.scale, viewTransform.scale);
            drawPaths(intCtx, [currentPathRef.current]);
            intCtx.restore();
        }
    };

    const handleInteractionEnd = (e: React.MouseEvent | React.TouchEvent) => {
        if (activeTool === 'polyline') {
            const startPoint = interactionStartPosRef.current;
            const endPoint = getCanvasPoint(e);
            if (!startPoint || !endPoint) return;
    
            if (Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y) > 5 / viewTransform.scale) {
                return;
            }
    
            const clickPoint = startPoint;
            const points = strokePointsRef.current;
            
            if (points.length > 2) {
                const firstPoint = points[0];
                if (Math.hypot(clickPoint.x - firstPoint.x, clickPoint.y - firstPoint.y) < 10 / viewTransform.scale) {
                    commitPath(points);
                    strokePointsRef.current = [];
                    const intCtx = interactionCanvasRef.current?.getContext('2d');
                    if (intCtx) intCtx.clearRect(0, 0, intCtx.canvas.width, intCtx.canvas.height);
                    return;
                }
            }
            
            points.push(clickPoint);
    
            const intCtx = interactionCanvasRef.current?.getContext('2d');
            const canvas = interactionCanvasRef.current;
            if (!intCtx || !canvas) return;
    
            intCtx.clearRect(0, 0, canvas.width, canvas.height);
            intCtx.save();
            intCtx.translate(viewTransform.offsetX, viewTransform.offsetY);
            intCtx.scale(viewTransform.scale, viewTransform.scale);
            
            intCtx.strokeStyle = 'rgba(124, 58, 237, 1)';
            intCtx.lineWidth = 2 / viewTransform.scale;
    
            if (points.length > 0) {
                intCtx.beginPath();
                intCtx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    intCtx.lineTo(points[i].x, points[i].y);
                }
                intCtx.stroke();
            }
            intCtx.restore();
    
            return;
        }

        if ('touches' in e && e.touches.length < 2) {
            pinchStartDistanceRef.current = null;
        }

        if (isPanning) {
            setIsPanning(false);
            panStartRef.current = null;
        }
        
        if (isDrawingRef.current) {
            isDrawingRef.current = false;
            
            const intCtx = interactionCanvasRef.current?.getContext('2d');
            if (intCtx) intCtx.clearRect(0, 0, intCtx.canvas.width, intCtx.canvas.height);

            commitPath(currentPathRef.current);
            currentPathRef.current = [];
        }
    };
    
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = viewTransform.scale * (1 + scaleAmount);
        const clampedScale = Math.max(0.1, Math.min(newScale, 10));

        const rect = interactionCanvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newOffsetX = mouseX - (mouseX - viewTransform.offsetX) * (clampedScale / viewTransform.scale);
        const newOffsetY = mouseY - (mouseY - viewTransform.offsetY) * (clampedScale / viewTransform.scale);
        
        setViewTransform({ scale: clampedScale, offsetX: newOffsetX, offsetY: newOffsetY });
    };

    const handleZoom = (direction: 'in' | 'out') => {
        const factor = 1.2;
        const newScale = direction === 'in' ? viewTransform.scale * factor : viewTransform.scale / factor;
        const clampedScale = Math.max(0.1, Math.min(newScale, 10));

        const container = containerRef.current;
        if (!container) return;
        const centerX = container.clientWidth / 2;
        const centerY = container.clientHeight / 2;

        const newOffsetX = centerX - (centerX - viewTransform.offsetX) * (clampedScale / viewTransform.scale);
        const newOffsetY = centerY - (centerY - viewTransform.offsetY) * (clampedScale / viewTransform.scale);
        
        setViewTransform({ scale: clampedScale, offsetX: newOffsetX, offsetY: newOffsetY });
    };
    
    const cursorClass = useMemo(() => {
        if (activeTool === 'pan') {
            return isPanning ? 'cursor-grabbing' : 'cursor-grab';
        }
        return 'cursor-crosshair';
    }, [activeTool, isPanning]);

    const handleCompleteAndClose = () => {
        onComplete(asset.id, generatedAssets);
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/80 flex flex-col justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="relative w-full h-full max-w-5xl max-h-[85vh] flex flex-col bg-dark-secondary rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 flex items-center justify-between p-2 border-b border-dark-border">
                    <div className="flex-1 flex justify-start">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-dark-text">توليد الأصول</h2>
                            <button
                                onClick={() => setIsSidePanelOpen(true)}
                                className="p-2 rounded-lg hover:bg-dark-border text-dark-text-secondary"
                                title="خيارات إضافية"
                            >
                                <Bars3Icon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-lg hover:bg-dark-border disabled:opacity-50" title="Undo"><UndoIcon className="w-5 h-5" /></button>
                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-lg hover:bg-dark-border disabled:opacity-50" title="Redo"><RedoIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-1 flex justify-end">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-dark-border"><XMarkIcon className="w-6 h-6" /></button>
                    </div>
                </header>

                <div 
                    ref={containerRef} 
                    className={`flex-grow relative overflow-hidden ${cursorClass}`}
                    onMouseDown={handleInteractionStart}
                    onMouseMove={handleInteractionMove}
                    onMouseUp={handleInteractionEnd}
                    onMouseLeave={handleInteractionEnd}
                    onTouchStart={handleInteractionStart}
                    onTouchMove={handleInteractionMove}
                    onTouchEnd={handleInteractionEnd}
                    onWheel={handleWheel}
                >
                    <canvas ref={imageCanvasRef} className="absolute inset-0 pointer-events-none" />
                    <canvas ref={interactionCanvasRef} className="absolute inset-0 pointer-events-none" />
                </div>
                
                <footer className="flex-shrink-0 p-3 bg-dark-primary/50 rounded-b-xl flex items-center justify-between gap-4">
                     <div className="flex items-center gap-2">
                        <button onClick={() => handleZoom('out')} className="p-2 rounded-full hover:bg-dark-border"><ZoomOutIcon className="w-5 h-5" /></button>
                        <button onClick={fitToScreen} className="p-2 rounded-full hover:bg-dark-border"><ViewfinderCircleIcon className="w-5 h-5" /></button>
                        <button onClick={() => handleZoom('in')} className="p-2 rounded-full hover:bg-dark-border"><ZoomInIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-dark-primary rounded-lg">
                        <button onClick={() => setActiveTool('scissors')} className={`p-2 rounded-md ${activeTool === 'scissors' ? 'bg-accent text-white' : 'hover:bg-dark-border'}`} title="Cut Tool (Lasso)"><ScissorsIcon className="w-5 h-5"/></button>
                        <button onClick={() => setActiveTool('polyline')} className={`p-2 rounded-md ${activeTool === 'polyline' ? 'bg-accent text-white' : 'hover:bg-dark-border'}`} title="Polyline Tool"><PolylineSelectIcon className="w-5 h-5"/></button>
                        <button onClick={() => setActiveTool('pan')} className={`p-2 rounded-md ${activeTool === 'pan' ? 'bg-accent text-white' : 'hover:bg-dark-border'}`} title="Pan Tool"><MoveIcon className="w-5 h-5"/></button>
                    </div>
                    <button onClick={handleCompleteAndClose} className="px-5 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover font-semibold transition-colors">تطبيق التعديلات</button>
                </footer>
                
                {isSidePanelOpen && (
                    <>
                        <div
                            className="absolute inset-0 bg-black/50 z-10 animate-fade-in"
                            onClick={() => setIsSidePanelOpen(false)}
                            aria-hidden="true"
                        ></div>
                        <div
                            className="absolute top-0 right-0 bottom-0 w-80 bg-dark-secondary z-20 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-slide-in-right"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="side-panel-title"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-dark-border">
                                <h3 id="side-panel-title" className="text-lg font-bold">لوحة الخيارات</h3>
                                <button onClick={() => setIsSidePanelOpen(false)} className="p-1 rounded-full hover:bg-dark-border" aria-label="Close options panel">
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-4 flex flex-col h-full">
                                <button 
                                    onClick={handleGenerateAsset}
                                    disabled={isGenerateDisabled}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg bg-accent text-white hover:bg-accent-hover font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <WandSparklesIcon className="w-5 h-5" />
                                            <span>Generate Asset</span>
                                        </>
                                    )}
                                </button>

                                <div className="mt-4 flex-grow overflow-y-auto space-y-2 pr-1">
                                    <h4 className="text-sm font-semibold text-dark-text-secondary">
                                        Generated Assets ({generatedAssets.length} / 5)
                                    </h4>
                                    {generatedAssets.length === 0 ? (
                                        <div className="text-xs text-dark-text-secondary text-center py-6 px-2 border-2 border-dashed border-dark-border rounded-lg">
                                            <p>Use the scissors or polyline tool to select an object.</p>
                                            <p className="mt-1">Then click "Generate Asset" to extract it.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {generatedAssets.map((genAsset) => (
                                                <div key={genAsset.id} className="relative group aspect-square bg-dark-primary rounded-md">
                                                    <img src={genAsset.url} className="w-full h-full object-contain p-1" alt={`Generated asset`} />
                                                    <button 
                                                        onClick={() => handleRemoveGeneratedAsset(genAsset.id)}
                                                        className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-opacity"
                                                        title="Remove asset"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};

export default AssetEditorModal;