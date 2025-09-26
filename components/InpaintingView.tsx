import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import { ManualSelectIcon } from './icons/ManualSelectIcon';
import { ViewfinderCircleIcon } from './icons/ViewfinderCircleIcon';
import { RectangleSelectIcon } from './icons/RectangleSelectIcon';
import { PolylineSelectIcon } from './icons/PolylineSelectIcon';
import { FilterIcon } from './icons/FilterIcon';


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

const isMaskEmpty = (imageData: ImageData | undefined): boolean => {
    if (!imageData) return true;
    const data = imageData.data;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) return false; // Found a non-transparent pixel
    }
    return true;
};

interface InpaintingViewProps {
  imageUrl: string;
  onClose: () => void;
  onComplete: (newImageUrl: string) => void;
}

type Tool = 'pan' | 'brush' | 'eraser' | 'lasso' | 'rectangle' | 'polyline';
type MaskingMode = 'normal' | 'strict' | 'smart';

const InpaintingView: React.FC<InpaintingViewProps> = ({ imageUrl, onClose, onComplete }) => {
    const [currentImageSrc, setCurrentImageSrc] = useState(imageUrl);
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTool, setActiveTool] = useState<Tool>('brush');
    const [brushSize, setBrushSize] = useState(40);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [maskingMode, setMaskingMode] = useState<MaskingMode>('normal');
    
    const [viewTransform, setViewTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });

    const imageRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null); // For permanent mask strokes
    const interactionCanvasRef = useRef<HTMLCanvasElement>(null); // For temporary visuals like cursors, lasso lines
    const workingMaskDataRef = useRef<ImageData | null>(null);

    const isInteractingRef = useRef(false);
    const interactionStartPosRef = useRef<{ x: number, y: number } | null>(null);
    const lastPosRef = useRef<{ x: number, y: number } | null>(null);
    const mousePositionRef = useRef<{ x: number, y: number } | null>(null);
    const lastEventCoordsRef = useRef<{ clientX: number, clientY: number } | null>(null);
    const strokePointsRef = useRef<{ x: number, y: number }[]>([]);

    const handleToggleMaskingMode = () => {
        setMaskingMode(currentMode => {
            if (currentMode === 'normal') return 'strict';
            if (currentMode === 'strict') return 'smart';
            return 'normal'; // 'smart' loops back to 'normal'
        });
    };
    
    const { maskingModeClassName, maskingModeTitle } = useMemo(() => {
        switch (maskingMode) {
            case 'strict':
                return {
                    maskingModeClassName: 'text-blue-400',
                    maskingModeTitle: 'ماسك دقيق: يتم تطبيق التعديلات داخل الماسك فقط.',
                };
            case 'smart':
                return {
                    maskingModeClassName: 'text-purple-400 shadow-[0_0_8px_theme(colors.purple.500)]',
                    maskingModeTitle: 'ماسك ذكي: يفسر الذكاء الاصطناعي منطقة الماسك بذكاء.',
                };
            case 'normal':
            default:
                return {
                    maskingModeClassName: 'text-dark-text-secondary',
                    maskingModeTitle: 'الوضع العادي: تندمج التعديلات بشكل طبيعي مع المحيط.',
                };
        }
    }, [maskingMode]);

    useEffect(() => {
        if (activeTool !== 'polyline') {
            strokePointsRef.current = [];
            if (interactionCanvasRef.current) {
                const ctx = interactionCanvasRef.current.getContext('2d');
                ctx?.clearRect(0, 0, interactionCanvasRef.current.width, interactionCanvasRef.current.height);
            }
        }
    }, [activeTool]);

    const getEventCoordinates = (e: React.MouseEvent | React.TouchEvent): { clientX: number, clientY: number } | null => {
        if ('touches' in e) { // TouchEvent
            if (e.touches.length > 0) {
                return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
            }
        } else { // MouseEvent
            return { clientX: e.clientX, clientY: e.clientY };
        }
        return null;
    };

    const getImagePoint = (clientX: number, clientY: number): { x: number, y: number } | null => {
        const canvas = interactionCanvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;
        return {
            x: (screenX - viewTransform.offsetX) / viewTransform.scale,
            y: (screenY - viewTransform.offsetY) / viewTransform.scale,
        };
    };

    const drawCursor = useCallback(() => {
        const interactionCanvas = interactionCanvasRef.current;
        const interactionCtx = interactionCanvas?.getContext('2d');
        const mousePos = mousePositionRef.current;
        if (!interactionCtx || !interactionCanvas) return;

        interactionCtx.clearRect(0, 0, interactionCanvas.width, interactionCanvas.height);

        if (mousePos && (activeTool === 'brush' || activeTool === 'eraser')) {
            const cursorX = mousePos.x;
            const cursorY = mousePos.y;
            const radius = (brushSize / 2) * viewTransform.scale;
            
            interactionCtx.save();
            interactionCtx.beginPath();
            interactionCtx.arc(cursorX, cursorY, radius, 0, 2 * Math.PI);
            interactionCtx.strokeStyle = 'white';
            interactionCtx.lineWidth = 1;
            interactionCtx.setLineDash([4, 4]);
            interactionCtx.stroke();
            interactionCtx.restore();
        }
    }, [activeTool, brushSize, viewTransform.scale]);

    const redrawMask = useCallback((maskData: ImageData | null) => {
        const image = imageRef.current;
        const maskCanvas = maskCanvasRef.current;
        if (!image || !maskCanvas) return;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) return;

        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        if (!maskData) return;

        maskCtx.save();
        maskCtx.translate(viewTransform.offsetX, viewTransform.offsetY);
        maskCtx.scale(viewTransform.scale, viewTransform.scale);
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.naturalWidth;
        tempCanvas.height = image.naturalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if(tempCtx) {
            tempCtx.putImageData(maskData, 0, 0);
            maskCtx.globalAlpha = 0.7; 
            maskCtx.globalCompositeOperation = 'source-over';
            maskCtx.fillStyle = 'rgba(124, 58, 237, 1)';
            maskCtx.fillRect(0, 0, image.naturalWidth, image.naturalHeight);
            maskCtx.globalCompositeOperation = 'destination-in';
            maskCtx.drawImage(tempCanvas, 0, 0);
        }

        maskCtx.restore();
    }, [viewTransform]);
    
    const redrawAll = useCallback(() => {
        const image = imageRef.current;
        const imageCanvas = imageCanvasRef.current;
        
        if (!image || !imageCanvas) return;
        const imageCtx = imageCanvas.getContext('2d');
        if (!imageCtx) return;

        imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
        
        imageCtx.save();
        imageCtx.translate(viewTransform.offsetX, viewTransform.offsetY);
        imageCtx.scale(viewTransform.scale, viewTransform.scale);
        imageCtx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
        imageCtx.restore();

        redrawMask(history[historyIndex] || null);

    }, [viewTransform, history, historyIndex, redrawMask]);
    
    // Fit image to view
    const fitToScreen = useCallback(() => {
        const image = imageRef.current;
        const container = containerRef.current;
        if (!image || !container || image.naturalWidth === 0) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const scale = Math.min(containerWidth / image.naturalWidth, containerHeight / image.naturalHeight) * 0.95;
        const offsetX = (containerWidth - image.naturalWidth * scale) / 2;
        const offsetY = (containerHeight - image.naturalHeight * scale) / 2;

        setViewTransform({ scale, offsetX, offsetY });
    }, []);

    // Load image and initialize canvases
    useEffect(() => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = currentImageSrc;
        imageRef.current = image;
        image.onload = () => {
            const container = containerRef.current;
            if (!container) return;
            
            [imageCanvasRef, maskCanvasRef, interactionCanvasRef].forEach(ref => {
                if (ref.current) {
                    ref.current.width = container.clientWidth;
                    ref.current.height = container.clientHeight;
                }
            });

            const initialMask = new ImageData(image.naturalWidth, image.naturalHeight);
            setHistory([initialMask]);
            setHistoryIndex(0);
            fitToScreen();
        };

        const handleResize = () => {
             [imageCanvasRef, maskCanvasRef, interactionCanvasRef].forEach(ref => {
                if (ref.current && containerRef.current) {
                    ref.current.width = containerRef.current.clientWidth;
                    ref.current.height = containerRef.current.clientHeight;
                }
            });
            fitToScreen();
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

    }, [currentImageSrc, fitToScreen]);

    // Redraw when state changes
    useEffect(() => {
        redrawAll();
        drawCursor();
    }, [redrawAll, drawCursor]);

    const commitToHistory = (newMaskData: ImageData) => {
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, newMaskData]);
        setHistoryIndex(newHistory.length);
    };

    const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e && e.touches.length > 1) return;
        if (activeTool === 'polyline') {
            if ('touches' in e) e.preventDefault();
            isInteractingRef.current = true;
            const coords = getEventCoordinates(e);
            if (!coords) return;
            const pos = getImagePoint(coords.clientX, coords.clientY);
            if (!pos) return;
            interactionStartPosRef.current = pos;
            lastPosRef.current = pos;
            return;
        }

        if ('touches' in e && e.touches.length === 1) e.preventDefault();
        isInteractingRef.current = true;
        const coords = getEventCoordinates(e);
        if (!coords) return;

        const pos = getImagePoint(coords.clientX, coords.clientY);
        if (!pos) return;

        lastEventCoordsRef.current = coords;
        interactionStartPosRef.current = pos;
        lastPosRef.current = pos;
        strokePointsRef.current = [pos];

        if (activeTool === 'brush' || activeTool === 'eraser') {
            const currentMask = history[historyIndex];
            if (currentMask) {
                workingMaskDataRef.current = new ImageData(
                    new Uint8ClampedArray(currentMask.data),
                    currentMask.width,
                    currentMask.height
                );
            }
        }
    };
    
    const handleInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
        const coords = getEventCoordinates(e);
        
        if (activeTool === 'polyline') {
            const interactionCtx = interactionCanvasRef.current?.getContext('2d');
            if (!interactionCtx || !interactionCanvasRef.current || !coords) return;

            const currentImagePos = getImagePoint(coords.clientX, coords.clientY);
            if (!currentImagePos) return;

            const rect = interactionCanvasRef.current.getBoundingClientRect();
            mousePositionRef.current = { x: coords.clientX - rect.left, y: coords.clientY - rect.top };

            interactionCtx.clearRect(0, 0, interactionCanvasRef.current.width, interactionCanvasRef.current.height);
            interactionCtx.save();
            interactionCtx.translate(viewTransform.offsetX, viewTransform.offsetY);
            interactionCtx.scale(viewTransform.scale, viewTransform.scale);
            
            interactionCtx.strokeStyle = 'rgba(124, 58, 237, 0.9)';
            interactionCtx.lineWidth = 2 / viewTransform.scale;
            interactionCtx.fillStyle = 'rgba(124, 58, 237, 0.5)';

            if (strokePointsRef.current.length > 0) {
                interactionCtx.beginPath();
                interactionCtx.moveTo(strokePointsRef.current[0].x, strokePointsRef.current[0].y);
                for (let i = 1; i < strokePointsRef.current.length; i++) {
                    interactionCtx.lineTo(strokePointsRef.current[i].x, strokePointsRef.current[i].y);
                }
                interactionCtx.stroke();

                const lastPoint = strokePointsRef.current[strokePointsRef.current.length - 1];
                interactionCtx.beginPath();
                interactionCtx.moveTo(lastPoint.x, lastPoint.y);
                interactionCtx.lineTo(currentImagePos.x, currentImagePos.y);
                interactionCtx.stroke();
                
                const firstPoint = strokePointsRef.current[0];
                const dist = Math.hypot(currentImagePos.x - firstPoint.x, currentImagePos.y - firstPoint.y);
                if (dist < 10 / viewTransform.scale) {
                    interactionCtx.beginPath();
                    interactionCtx.arc(firstPoint.x, firstPoint.y, 5 / viewTransform.scale, 0, 2 * Math.PI);
                    interactionCtx.fillStyle = 'rgba(124, 58, 237, 0.8)';
                    interactionCtx.fill();
                }
            }
            interactionCtx.restore();
            return;
        }

        if ('touches' in e && e.touches.length === 1) e.preventDefault();
        
        const canvas = interactionCanvasRef.current;
        
        if (coords && canvas) {
            const rect = canvas.getBoundingClientRect();
            mousePositionRef.current = { x: coords.clientX - rect.left, y: coords.clientY - rect.top };
        } else {
            mousePositionRef.current = null;
        }

        if (!isInteractingRef.current) {
            drawCursor();
            return;
        }

        if (!coords) return;
        const currentImagePos = getImagePoint(coords.clientX, coords.clientY);
        if (!currentImagePos) return;

        if (activeTool === 'pan') {
            if (!lastEventCoordsRef.current) return;
            const deltaX = coords.clientX - lastEventCoordsRef.current.clientX;
            const deltaY = coords.clientY - lastEventCoordsRef.current.clientY;
            setViewTransform(prev => ({
                ...prev,
                offsetX: prev.offsetX + deltaX,
                offsetY: prev.offsetY + deltaY,
            }));
            lastEventCoordsRef.current = coords;
            return;
        }

        const lastPoint = lastPosRef.current;
        lastPosRef.current = currentImagePos;
        strokePointsRef.current.push(currentImagePos);

        if ((activeTool === 'brush' || activeTool === 'eraser') && lastPoint) {
            const image = imageRef.current;
            if (!image || !workingMaskDataRef.current) return;
    
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = image.naturalWidth;
            tempCanvas.height = image.naturalHeight;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;
    
            tempCtx.putImageData(workingMaskDataRef.current, 0, 0);
    
            const isEraser = activeTool === 'eraser';
            tempCtx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
            tempCtx.strokeStyle = 'rgba(255,255,255,1)';
            tempCtx.lineWidth = brushSize;
            tempCtx.lineCap = 'round';
            tempCtx.lineJoin = 'round';
    
            tempCtx.beginPath();
            tempCtx.moveTo(lastPoint.x, lastPoint.y);
            tempCtx.lineTo(currentImagePos.x, currentImagePos.y);
            tempCtx.stroke();
            
            workingMaskDataRef.current = tempCtx.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
            redrawMask(workingMaskDataRef.current);
            drawCursor(); // Also draw cursor on top while brushing
            return;
        }
    
        const startPos = interactionStartPosRef.current;
        if (!startPos) return;
    
        const interactionCtx = interactionCanvasRef.current?.getContext('2d');
        if (!interactionCtx) return;
    
        interactionCtx.clearRect(0, 0, interactionCtx.canvas.width, interactionCtx.canvas.height);
        interactionCtx.save();
        interactionCtx.translate(viewTransform.offsetX, viewTransform.offsetY);
        interactionCtx.scale(viewTransform.scale, viewTransform.scale);
        
        interactionCtx.fillStyle = 'rgba(124, 58, 237, 0.5)';
        interactionCtx.strokeStyle = 'rgba(124, 58, 237, 0.9)';
        interactionCtx.lineWidth = 2 / viewTransform.scale;
    
        if (activeTool === 'rectangle') {
            interactionCtx.beginPath();
            interactionCtx.rect(startPos.x, startPos.y, currentImagePos.x - startPos.x, currentImagePos.y - startPos.y);
            interactionCtx.fill();
            interactionCtx.stroke();
        } else if (activeTool === 'lasso') {
            interactionCtx.beginPath();
            interactionCtx.moveTo(strokePointsRef.current[0].x, strokePointsRef.current[0].y);
            strokePointsRef.current.forEach(p => interactionCtx.lineTo(p.x, p.y));
            interactionCtx.stroke();
        }
        interactionCtx.restore();
    };
    
    const handleInteractionEnd = async () => {
        if (activeTool === 'polyline') {
            if (!isInteractingRef.current) return;
            isInteractingRef.current = false;
            
            const startPos = interactionStartPosRef.current;
            if (!startPos) return;

            const endPos = lastPosRef.current;
            if (endPos && Math.hypot(endPos.x - startPos.x, endPos.y - startPos.y) > 5 / viewTransform.scale) {
                return;
            }
            
            const points = strokePointsRef.current;
            if (points.length > 2) {
                const firstPoint = points[0];
                const dist = Math.hypot(startPos.x - firstPoint.x, startPos.y - firstPoint.y);
                if (dist < 10 / viewTransform.scale) {
                    const image = imageRef.current;
                    if (!image) return;

                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = image.naturalWidth;
                    tempCanvas.height = image.naturalHeight;
                    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
                    if (!tempCtx) return;

                    if (history[historyIndex]) {
                        tempCtx.putImageData(history[historyIndex], 0, 0);
                    }
                    
                    tempCtx.fillStyle = 'rgba(255,255,255,1)';
                    
                    tempCtx.beginPath();
                    tempCtx.moveTo(points[0].x, points[0].y);
                    points.forEach(p => tempCtx.lineTo(p.x, p.y));
                    tempCtx.closePath();
                    tempCtx.fill();

                    commitToHistory(tempCtx.getImageData(0, 0, image.naturalWidth, image.naturalHeight));
                    
                    strokePointsRef.current = [];
                    const interactionCtx = interactionCanvasRef.current?.getContext('2d');
                    interactionCtx?.clearRect(0, 0, interactionCtx.canvas.width, interactionCtx.canvas.height);
                    return;
                }
            }

            points.push(startPos);
            
            const interactionCtx = interactionCanvasRef.current?.getContext('2d');
            if (!interactionCtx || !interactionCanvasRef.current) return;

            interactionCtx.clearRect(0, 0, interactionCanvasRef.current.width, interactionCanvasRef.current.height);
            interactionCtx.save();
            interactionCtx.translate(viewTransform.offsetX, viewTransform.offsetY);
            interactionCtx.scale(viewTransform.scale, viewTransform.scale);
            
            interactionCtx.strokeStyle = 'rgba(124, 58, 237, 0.9)';
            interactionCtx.lineWidth = 2 / viewTransform.scale;

            interactionCtx.beginPath();
            interactionCtx.moveTo(points[0].x, points[0].y);
            points.forEach(p => interactionCtx.lineTo(p.x, p.y));
            interactionCtx.stroke();
            
            interactionCtx.restore();
            return;
        }

        if (!isInteractingRef.current) return;
        isInteractingRef.current = false;
        lastEventCoordsRef.current = null;
    
        if (activeTool === 'pan') {
            drawCursor();
            return;
        }
    
        if (activeTool === 'brush' || activeTool === 'eraser') {
            if (strokePointsRef.current.length === 1 && workingMaskDataRef.current) {
                const image = imageRef.current;
                const startPos = interactionStartPosRef.current;
                if (image && startPos) {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = image.naturalWidth;
                    tempCanvas.height = image.naturalHeight;
                    const tempCtx = tempCanvas.getContext('2d');
                    if (tempCtx) {
                        tempCtx.putImageData(workingMaskDataRef.current, 0, 0);
                        const isEraser = activeTool === 'eraser';
                        tempCtx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
                        tempCtx.fillStyle = 'rgba(255,255,255,1)';
                        tempCtx.beginPath();
                        tempCtx.arc(startPos.x, startPos.y, brushSize / 2, 0, Math.PI * 2);
                        tempCtx.fill();
                        workingMaskDataRef.current = tempCtx.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
                        redrawMask(workingMaskDataRef.current);
                    }
                }
            }
    
            if (workingMaskDataRef.current) {
                commitToHistory(workingMaskDataRef.current);
            }
            workingMaskDataRef.current = null;
            strokePointsRef.current = [];
            interactionStartPosRef.current = null;
            drawCursor();
            return;
        }
    
        const image = imageRef.current;
        const interactionCanvas = interactionCanvasRef.current;
        const interactionCtx = interactionCanvas?.getContext('2d');
        const startPos = interactionStartPosRef.current;
        const lastPos = lastPosRef.current;
        
        if (!image || !interactionCanvas || !interactionCtx || !startPos || !lastPos) return;
        interactionCtx.clearRect(0, 0, interactionCanvas.width, interactionCtx.canvas.height);
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.naturalWidth;
        tempCanvas.height = image.naturalHeight;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        if (!tempCtx) return;
    
        if (history[historyIndex]) {
            tempCtx.putImageData(history[historyIndex], 0, 0);
        }
        
        tempCtx.fillStyle = 'rgba(255,255,255,1)';
        tempCtx.strokeStyle = 'rgba(255,255,255,1)';
        tempCtx.lineWidth = brushSize;
        tempCtx.lineCap = 'round';
        tempCtx.lineJoin = 'round';
    
        if (activeTool === 'rectangle') {
            tempCtx.fillRect(startPos.x, startPos.y, lastPos.x - startPos.x, lastPos.y - startPos.y);
        } else if (activeTool === 'lasso') {
            if (strokePointsRef.current.length > 2) {
                tempCtx.beginPath();
                tempCtx.moveTo(strokePointsRef.current[0].x, strokePointsRef.current[0].y);
                strokePointsRef.current.forEach(p => tempCtx.lineTo(p.x, p.y));
                tempCtx.closePath();
                tempCtx.fill();
            }
        }
        
        commitToHistory(tempCtx.getImageData(0, 0, image.naturalWidth, image.naturalHeight));
        interactionStartPosRef.current = null;
        strokePointsRef.current = [];
        drawCursor();
    };

    const handleMouseLeave = () => {
        mousePositionRef.current = null;
        drawCursor();
        
        if (isInteractingRef.current) {
            handleInteractionEnd();
        }
        lastPosRef.current = null;
    };
    
    const handleUndo = () => historyIndex > 0 && setHistoryIndex(historyIndex - 1);
    const handleRedo = () => historyIndex < history.length - 1 && setHistoryIndex(historyIndex + 1);

    const handleGenerate = async () => {
        if (isMaskEmpty(history[historyIndex])) {
            setError("Please select an area to edit by drawing a mask first.");
            return;
        }
        if (!imageRef.current) {
            setError("Image not loaded yet.");
            return;
        }
        setIsLoading(true);
        setError(null);
        
        try {
            const { naturalWidth, naturalHeight } = imageRef.current;
            const maskBlob = await new Promise<Blob | null>(resolve => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = naturalWidth;
                tempCanvas.height = naturalHeight;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx && history[historyIndex]) {
                    const maskData = history[historyIndex];
                    const newData = new Uint8ClampedArray(maskData.data);
                    for (let i = 0; i < newData.length; i += 4) {
                        if (newData[i+3] > 0) {
                            newData[i] = 255; newData[i+1] = 255; newData[i+2] = 255; newData[i+3] = 255;
                        }
                    }
                    tempCtx.putImageData(new ImageData(newData, maskData.width, maskData.height), 0, 0);
                    tempCanvas.toBlob(resolve, 'image/png');
                } else {
                    resolve(null);
                }
            });

            if (!maskBlob) throw new Error("Could not generate mask.");

            const originalImageBlob = await (await fetch(currentImageSrc)).blob();
            const originalImageFile = new File([originalImageBlob], "original.png", { type: originalImageBlob.type });
            const originalImageBase64 = await fileToBase64(originalImageFile);
            
            const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });
            const maskBase64 = await fileToBase64(maskFile);
            
            let userPrompt = prompt.trim();
            if (!userPrompt) {
                userPrompt = "Remove the selected object or fill the selected area seamlessly and photorealistically, matching the surrounding context, lighting, and textures.";
            }
            
            let fullPrompt = '';
            switch (maskingMode) {
                case 'strict':
                    fullPrompt = `**HYPER-STRICT INPAINTING PROTOCOL:**
**MANDATORY SPATIAL BINDING:** The user's request, \`"${userPrompt}"\`, is spatially bound to the object(s) under the mask. You are required to identify the object indicated by the mask and apply the edit **exclusively** to it.

**CORE DIRECTIVES (NON-NEGOTIABLE):**
1.  **ZERO DEVIATION:** Your output MUST be an identical, pixel-for-pixel copy of the original image for ALL pixels outside the provided mask. There is ZERO tolerance for any alteration, color shift, or blurring outside the masked zone.
2.  **PRECISION BLENDING:** Analyze the boundary of the masked area. The new content you generate inside the mask must seamlessly and flawlessly blend with the surrounding, unaltered pixels. Match lighting, texture, and color perfectly to create an invisible seam.
3.  **EXECUTE REQUEST:** Execute the user's request ONLY within the white masked zone on the object identified by the spatial binding rule.
4.  **OUTPUT FORMAT:** Your output MUST be the final, full-frame, edited image with the exact same dimensions as the original. Do not output text or explanations.`;
                    break;
                case 'smart':
                    fullPrompt = `**SMART MASKING PROTOCOL:**
**MANDATORY SPATIAL BINDING:** The user's request, \`"${userPrompt}"\`, is spatially bound to the object(s) indicated by the mask. You MUST apply the edit to the object(s) under or immediately associated with the mask. You are STRICTLY forbidden from editing similar objects located elsewhere in the image.

**INSTRUCTIONS:**
1.  Analyze the image context within and around the provided mask.
2.  Apply the user's edit to the spatially bound object.
3.  You have creative freedom to intelligently adjust the boundaries of the edit based on the scene's objects and lighting to create the most seamless and photorealistic result. For example, if the mask partially covers an object, you should edit the entire object.
4.  Preserve unrelated areas far from the mask.
5.  Your output must ONLY be the final photorealistic image.`;
                    break;
                case 'normal':
                default:
                    fullPrompt = `**NORMAL MASKING PROTOCOL:**
**CRITICAL DIRECTIVE - SPATIAL BINDING:** The following user request, \`"${userPrompt}"\`, describes a change that must be applied ONLY to the object or area highlighted by the provided mask. Do not edit other parts of the image.

**INSTRUCTIONS:**
1.  Identify the object or area under the mask.
2.  Apply the user's edit.
3.  The edit should primarily affect the masked area but can blend naturally into the immediate surroundings for a more realistic result.
4.  Your output must ONLY be the final photorealistic image.`;
                    break;
            }


            const response = await generateDesign(fullPrompt, originalImageBase64, [{ data: maskBase64.data, mimeType: maskBase64.mimeType }], DEFAULT_AI_MODEL);
            
            setCurrentImageSrc(`data:image/png;base64,${response}`);
            setPrompt('');

        } catch (e) {
             const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate edit: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleWheel = (e: React.WheelEvent) => {
        const scaleAmount = e.deltaY * -0.001;
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
        const scaleAmount = 0.2;
        const newScale = direction === 'in' 
            ? viewTransform.scale * (1 + scaleAmount) 
            : viewTransform.scale / (1 + scaleAmount);
        const clampedScale = Math.max(0.1, Math.min(newScale, 10));

        const container = containerRef.current;
        if (!container) return;
        const centerX = container.clientWidth / 2;
        const centerY = container.clientHeight / 2;
        
        const newOffsetX = centerX - (centerX - viewTransform.offsetX) * (clampedScale / viewTransform.scale);
        const newOffsetY = centerY - (centerY - viewTransform.offsetY) * (clampedScale / viewTransform.scale);

        setViewTransform({ scale: clampedScale, offsetX: newOffsetX, offsetY: newOffsetY });
    };
    
    const getCursor = () => {
        switch(activeTool) {
            case 'pan':
                return isInteractingRef.current ? 'cursor-grabbing' : 'cursor-grab';
            case 'brush':
            case 'eraser':
                return 'cursor-none';
            case 'lasso':
            case 'rectangle':
            case 'polyline':
                return 'cursor-crosshair';
            default:
                return 'cursor-default';
        }
    }


    const ToolButton: React.FC<{ tool: Tool, label: string, children: React.ReactNode }> = ({ tool, label, children }) => (
        <button
            onClick={() => setActiveTool(tool)}
            className={`p-2.5 rounded-lg flex flex-col items-center justify-center transition-colors text-dark-text-secondary ${activeTool === tool ? 'bg-accent text-white' : 'hover:bg-dark-border'}`}
            title={label}
        >
            {children}
            <span className="text-xs mt-1">{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-dark-primary flex flex-col h-full w-full z-10 animate-fade-in">
            {/* Header */}
            <header className="flex-shrink-0 bg-dark-secondary flex items-center justify-between p-2 text-dark-text relative">
                {/* Left side: Back Button */}
                <div className="flex-shrink-0">
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-border" title="Back">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Center: Actions */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                         <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-lg hover:bg-dark-border disabled:opacity-50" title="Undo"><UndoIcon className="w-6 h-6" /></button>
                         <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-lg hover:bg-dark-border disabled:opacity-50" title="Redo"><RedoIcon className="w-6 h-6" /></button>
                    </div>
                     <div className="w-px h-6 bg-dark-border"></div>
                     <div className="flex items-center gap-1">
                        <button onClick={() => handleZoom('out')} className="p-2 rounded-lg hover:bg-dark-border" title="Zoom Out"><ZoomOutIcon className="w-6 h-6" /></button>
                        <button onClick={fitToScreen} className="p-2 rounded-lg hover:bg-dark-border" title="Fit to Screen"><ViewfinderCircleIcon className="w-6 h-6" /></button>
                        <button onClick={() => handleZoom('in')} className="p-2 rounded-lg hover:bg-dark-border" title="Zoom In"><ZoomInIcon className="w-6 h-6" /></button>
                    </div>
                </div>

                {/* Right side: Title and Apply */}
                <div className="flex-shrink-0 flex items-center gap-4">
                    <h2 className="text-lg font-bold hidden sm:block">Advanced Editor</h2>
                    <button onClick={() => onComplete(currentImageSrc)} className="p-2 rounded-lg hover:bg-dark-border text-accent" title="Apply Changes">
                        <ApplyIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>
            
            {/* Canvas Area */}
            <main 
                ref={containerRef} 
                className="flex-grow relative overflow-hidden bg-black/20"
                onMouseDown={handleInteractionStart}
                onTouchStart={handleInteractionStart}
                onMouseMove={handleInteractionMove}
                onTouchMove={handleInteractionMove}
                onMouseUp={handleInteractionEnd}
                onTouchEnd={handleInteractionEnd}
                onMouseLeave={handleMouseLeave}
                onTouchCancel={handleInteractionEnd}
                onWheel={handleWheel}
            >
                <canvas ref={imageCanvasRef} className="absolute inset-0 pointer-events-none" />
                <canvas ref={maskCanvasRef} className="absolute inset-0 pointer-events-none" />
                <canvas ref={interactionCanvasRef} className={`absolute inset-0 ${getCursor()}`} />
            </main>

            {/* Footer */}
            <footer className="flex-shrink-0 bg-dark-secondary/90 backdrop-blur-sm shadow-lg">
                <div className="p-3 space-y-3">
                    {error && <p className="text-red-400 text-sm text-center animate-fade-in">{error}</p>}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleMaskingMode}
                            className="p-3 rounded-lg bg-dark-primary border-2 border-dark-border hover:border-accent transition-colors flex-shrink-0"
                            title={maskingModeTitle}
                        >
                            <FilterIcon className={`w-6 h-6 transition-all duration-300 ${maskingModeClassName}`} />
                        </button>
                        <input 
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="flex-grow bg-dark-primary border-2 border-dark-border rounded-lg p-3 text-dark-text placeholder:text-dark-text-secondary focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                            placeholder="Describe edit, or leave blank to remove..."
                            disabled={isLoading}
                            dir="auto"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || isMaskEmpty(history[historyIndex])}
                            className="bg-accent hover:bg-accent-hover disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
                        >
                            {isLoading 
                                ? <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                : <WandSparklesIcon className="w-5 h-5 mr-2" />
                            }
                            <span>Generate</span>
                        </button>
                    </div>
                     {/* Contextual Tool Options */}
                    {(activeTool === 'brush' || activeTool === 'eraser') && (
                        <div className="bg-dark-primary p-2 rounded-lg flex items-center gap-4 text-sm animate-fade-in">
                            <label className="text-dark-text-secondary whitespace-nowrap">
                                Brush Size
                            </label>
                            <input
                                type="range"
                                min={5}
                                max={200}
                                value={brushSize}
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer accent-accent"
                            />
                        </div>
                    )}
                </div>

                {/* Main Toolbar */}
                <div className="flex justify-center items-center gap-2 p-2 bg-black/20 overflow-x-auto">
                    <ToolButton tool="pan" label="Pan"><MoveIcon className="w-6 h-6" /></ToolButton>
                    <ToolButton tool="brush" label="Brush"><ManualSelectIcon className="w-6 h-6" /></ToolButton>
                    <ToolButton tool="eraser" label="Eraser"><EraserIcon className="w-6 h-6" /></ToolButton>
                    <ToolButton tool="lasso" label="Lasso"><LassoIcon className="w-6 h-6" /></ToolButton>
                    <ToolButton tool="rectangle" label="Rectangle"><RectangleSelectIcon className="w-6 h-6" /></ToolButton>
                    <ToolButton tool="polyline" label="Polyline"><PolylineSelectIcon className="w-6 h-6" /></ToolButton>
                </div>
            </footer>
        </div>
    );
};

export default InpaintingView;