import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { EraserIcon } from './icons/EraserIcon';
import { UndoIcon } from './icons/UndoIcon';
import { WandSparklesIcon } from './icons/WandSparklesIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { LassoIcon } from './icons/LassoIcon';
import { generateDesign, correctText } from '../services/geminiService';
import { DEFAULT_AI_MODEL } from '../constants';
import { RedoIcon } from './icons/RedoIcon';
import { ApplyIcon } from './icons/ApplyIcon';
import { MoveIcon } from './icons/MoveIcon';
import { ManualSelectIcon } from './icons/ManualSelectIcon';
import { ViewfinderCircleIcon } from './icons/ViewfinderCircleIcon';
import { RectangleSelectIcon } from './icons/RectangleSelectIcon';
import { PolylineSelectIcon } from './icons/PolylineSelectIcon';
import { FilterIcon } from './icons/FilterIcon';
import { PainterBrushIcon } from './icons/PainterBrushIcon';
import { BackwardStepIcon } from './icons/BackwardStepIcon';
import { fileToBase64 } from '../utils/imageHelpers';
import DictationButton from './DictationButton';
import { notify } from '../utils/notification';
import { Bars3Icon } from './icons/Bars3Icon';
import { XMarkIcon } from './icons/XMarkIcon';


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

type Tool = 'pan' | 'brush' | 'eraser' | 'lasso' | 'rectangle' | 'polyline' | 'pin';
type MaskingMode = 'normal' | 'strict' | 'smart';

const InpaintingView: React.FC<InpaintingViewProps> = ({ imageUrl, onClose, onComplete }) => {
    const [currentImageSrc, setCurrentImageSrc] = useState(imageUrl);
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCorrectingText, setIsCorrectingText] = useState(false);
    const [activeTool, setActiveTool] = useState<Tool>('brush');
    const [brushSize, setBrushSize] = useState(40);
    
    const [maskHistory, setMaskHistory] = useState<ImageData[]>([]);
    const [maskHistoryIndex, setMaskHistoryIndex] = useState(-1);
    
    const [imageHistory, setImageHistory] = useState<string[]>([]);
    const [imageHistoryIndex, setImageHistoryIndex] = useState(0);

    const [maskingMode, setMaskingMode] = useState<MaskingMode>('normal');
    
    const [viewTransform, setViewTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

    const imageRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null); // For permanent mask strokes
    const interactionCanvasRef = useRef<HTMLCanvasElement>(null); // For temporary visuals like cursors, lasso lines
    const workingMaskDataRef = useRef<ImageData | null>(null);
    const textBeforeDictation = useRef('');

    const isInteractingRef = useRef(false);
    const interactionStartPosRef = useRef<{ x: number, y: number } | null>(null);
    const lastPosRef = useRef<{ x: number, y: number } | null>(null);
    const mousePositionRef = useRef<{ x: number, y: number } | null>(null);
    const lastEventCoordsRef = useRef<{ clientX: number, clientY: number } | null>(null);
    const strokePointsRef = useRef<{ x: number, y: number }[]>([]);

    // FIX: Add an effect to lock body scroll when the inpainting view is active.
    // This prevents any background scrolling while the user is in this full-screen editor.
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []); // Empty dependency array ensures this runs only on mount and unmount.

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

    const handleDictationStart = () => {
        const currentPrompt = prompt;
        if (currentPrompt.length > 0 && !/\s$/.test(currentPrompt)) {
            textBeforeDictation.current = currentPrompt + ' ';
        } else {
            textBeforeDictation.current = currentPrompt;
        }
    };

    const handleDictationUpdate = (transcript: string) => {
        setPrompt(textBeforeDictation.current + transcript);
    };

    const handleDictationStop = async (finalTranscript: string) => {
        const rawAppendedPrompt = textBeforeDictation.current + finalTranscript;
        setPrompt(rawAppendedPrompt);

        if (!finalTranscript.trim()) {
            return;
        }

        setIsCorrectingText(true);
        try {
            const correctedTranscript = await correctText(finalTranscript);
            setPrompt(currentPrompt => {
                if (currentPrompt.endsWith(finalTranscript)) {
                    const base = currentPrompt.slice(0, currentPrompt.length - finalTranscript.length);
                    return base + correctedTranscript;
                }
                return currentPrompt;
            });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            notify(`Failed to correct text: ${errorMessage}`);
            console.error("Text correction error:", e);
        } finally {
            setIsCorrectingText(false);
        }
    };

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

        redrawMask(maskHistory[maskHistoryIndex] || null);

    }, [viewTransform, maskHistory, maskHistoryIndex, redrawMask]);
    
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

    useEffect(() => {
        setImageHistory([imageUrl]);
        setImageHistoryIndex(0);

        const handleResize = () => {
            if (containerRef.current) {
                [imageCanvasRef, maskCanvasRef, interactionCanvasRef].forEach(ref => {
                    if (ref.current) {
                        ref.current.width = containerRef.current.clientWidth;
                        ref.current.height = containerRef.current.clientHeight;
                    }
                });
                fitToScreen();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [imageUrl, fitToScreen]);

    useEffect(() => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = currentImageSrc;
        imageRef.current = image;

        image.onload = () => {
            const container = containerRef.current;
            if (!container || !imageRef.current) return;
            
            [imageCanvasRef, maskCanvasRef, interactionCanvasRef].forEach(ref => {
                if (ref.current) {
                    ref.current.width = container.clientWidth;
                    ref.current.height = container.clientHeight;
                }
            });

            const initialMask = new ImageData(imageRef.current.naturalWidth, imageRef.current.naturalHeight);
            setMaskHistory([initialMask]);
            setMaskHistoryIndex(0);
            fitToScreen();
        };

        if (image.complete) {
            image.onload(new Event('load'));
        }
    }, [currentImageSrc, fitToScreen]);

    useEffect(() => {
        redrawAll();
        drawCursor();
    }, [redrawAll, drawCursor]);

    const commitToHistory = (newMaskData: ImageData) => {
        const newHistory = maskHistory.slice(0, maskHistoryIndex + 1);
        setMaskHistory([...newHistory, newMaskData]);
        setMaskHistoryIndex(newHistory.length);
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
            const currentMask = maskHistory[maskHistoryIndex];
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

        if (activeTool === 'pin') {
            interactionCtx.lineWidth = brushSize;
            interactionCtx.lineCap = 'round';
            interactionCtx.beginPath();
            interactionCtx.moveTo(startPos.x, startPos.y);
            interactionCtx.lineTo(currentImagePos.x, currentImagePos.y);
            interactionCtx.stroke();
        } else if (activeTool === 'rectangle') {
            interactionCtx.lineWidth = 2 / viewTransform.scale;
            interactionCtx.beginPath();
            interactionCtx.rect(startPos.x, startPos.y, currentImagePos.x - startPos.x, currentImagePos.y - startPos.y);
            interactionCtx.fill();
            interactionCtx.stroke();
        } else if (activeTool === 'lasso') {
            interactionCtx.lineWidth = 2 / viewTransform.scale;
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

                    if (maskHistory[maskHistoryIndex]) {
                        tempCtx.putImageData(maskHistory[maskHistoryIndex], 0, 0);
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
    
        if (maskHistory[maskHistoryIndex]) {
            tempCtx.putImageData(maskHistory[maskHistoryIndex], 0, 0);
        }
        
        tempCtx.fillStyle = 'rgba(255,255,255,1)';
        tempCtx.strokeStyle = 'rgba(255,255,255,1)';
        tempCtx.lineWidth = brushSize;
        tempCtx.lineCap = 'round';
        tempCtx.lineJoin = 'round';
    
        if (activeTool === 'pin') {
            tempCtx.globalCompositeOperation = 'source-over';
            tempCtx.beginPath();
            tempCtx.moveTo(startPos.x, startPos.y);
            tempCtx.lineTo(lastPos.x, lastPos.y);
            tempCtx.stroke();
        } else if (activeTool === 'rectangle') {
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
    
    const handleUndo = () => maskHistoryIndex > 0 && setMaskHistoryIndex(maskHistoryIndex - 1);
    const handleRedo = () => maskHistoryIndex < maskHistory.length - 1 && setMaskHistoryIndex(maskHistoryIndex + 1);

    const handleStepBack = () => {
        if (imageHistory.length <= 1) {
            return; // Can't cycle if there's only one or zero images
        }
        // Cycle backwards through history.
        // The modulo operator handles wrapping from 0 to the last index.
        const newIndex = (imageHistoryIndex - 1 + imageHistory.length) % imageHistory.length;
        setImageHistoryIndex(newIndex);
        setCurrentImageSrc(imageHistory[newIndex]);
    };

    const handleGenerate = async () => {
        if (isMaskEmpty(maskHistory[maskHistoryIndex])) {
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
                if (tempCtx && maskHistory[maskHistoryIndex]) {
                    const maskData = maskHistory[maskHistoryIndex];
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
                    fullPrompt = `Perform a precise inpainting task. The first image is the source, the second is the mask. The user's request is: "${userPrompt}". Apply this edit ONLY within the white area of the mask. Pixels outside the mask MUST remain unchanged. Blend the seam perfectly. Your output must ONLY be the final edited image.`;
                    break;
                case 'smart':
                    fullPrompt = `Perform a smart inpainting task. The first image is the source, the second image is a mask indicating an object of interest. The user's request is: "${userPrompt}". Intelligently apply this edit to the entire object highlighted by the mask, even if the mask is imprecise. The result should be seamless and photorealistic. Your output must ONLY be the final edited image.`;
                    break;
                case 'normal':
                default:
                    fullPrompt = `Transform the original image based on the following request: "${userPrompt}". The edit should be applied to the area defined by the second image, which is a mask. Blend the result naturally with the surrounding context. Your output must ONLY be the final edited image.`;
                    break;
            }

            const response = await generateDesign(fullPrompt, originalImageBase64, [{ data: maskBase64.data, mimeType: maskBase64.mimeType }], DEFAULT_AI_MODEL);
            
            const newImageSrc = `data:image/png;base64,${response}`;
            
            const newHistory = imageHistory.slice(0, imageHistoryIndex + 1);
            newHistory.push(newImageSrc);
    
            while (newHistory.length > 5) { // Original + 4 edits
                newHistory.shift();
            }
    
            setImageHistory(newHistory);
            setImageHistoryIndex(newHistory.length - 1);
            setCurrentImageSrc(newImageSrc);
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
            case 'pin':
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

    const verticalButtonClasses = "p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-dark-text-secondary hover:text-dark-text hover:bg-dark-primary";
    const headerButtonClasses = "p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-dark-text-secondary hover:text-dark-text hover:bg-dark-border";

    return (
        <div className="fixed inset-0 bg-dark-primary flex flex-col h-full w-full z-10 animate-fade-in">
            {/* Header */}
            <header className="flex-shrink-0 bg-dark-secondary flex items-center justify-between p-2 text-dark-text">
                <div className="flex-1 flex justify-start items-center gap-2">
                     <button onClick={onClose} className={headerButtonClasses} title="Back">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setIsSidePanelOpen(true)}
                        className={headerButtonClasses}
                        title="خيارات إضافية"
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                </div>
                 <div className="flex-shrink-0">
                    <h2 className="text-lg font-bold">Advanced Editor</h2>
                </div>
                <div className="flex-1 flex justify-end items-center gap-2">
                    <button onClick={handleStepBack} disabled={imageHistory.length <= 1} className={headerButtonClasses} title="التعديل السابق (دائري)"><BackwardStepIcon className="w-6 h-6" /></button>
                    <div className="h-6 w-px mx-1 bg-dark-border"></div>
                    <button onClick={() => onComplete(currentImageSrc)} className="p-2 rounded-lg hover:bg-dark-border text-accent" title="Apply Changes">
                        <ApplyIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>
            
            <div className="flex-grow flex flex-row-reverse overflow-hidden">
                {/* Main Vertical Toolbar */}
                <aside className="w-20 flex-shrink-0 bg-dark-secondary flex flex-col items-center justify-center gap-2 p-2 border-r border-dark-border">
                    <button onClick={() => setActiveTool('pan')} className={`${verticalButtonClasses} ${activeTool === 'pan' ? 'bg-accent text-white' : ''}`} title="Pan">
                        <MoveIcon className="w-6 h-6" />
                    </button>
                    
                    <div className="h-px w-full my-1 bg-dark-border"></div>
                    
                    <button onClick={handleUndo} disabled={maskHistoryIndex <= 0} className={verticalButtonClasses} title="Undo"><UndoIcon className="w-6 h-6" /></button>
                    <button onClick={handleRedo} disabled={maskHistoryIndex >= maskHistory.length - 1} className={verticalButtonClasses} title="Redo"><RedoIcon className="w-6 h-6" /></button>

                    <div className="h-px w-full my-1 bg-dark-border"></div>

                    <button onClick={() => handleZoom('in')} className={verticalButtonClasses} title="Zoom In"><ZoomInIcon className="w-6 h-6" /></button>
                    <button onClick={() => handleZoom('out')} className={verticalButtonClasses} title="Zoom Out"><ZoomOutIcon className="w-6 h-6" /></button>
                    <button onClick={fitToScreen} className={verticalButtonClasses} title="Fit to Screen"><ViewfinderCircleIcon className="w-6 h-6" /></button>
                </aside>

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
            </div>

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
                        <div className="relative flex-grow">
                            <input 
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full bg-dark-primary border-2 border-dark-border rounded-lg p-3 pr-12 text-dark-text placeholder:text-dark-text-secondary focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                                placeholder="Describe edit, or leave blank to remove..."
                                disabled={isLoading || isCorrectingText}
                                dir="auto"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
                                {isCorrectingText && (
                                    <div title="Correcting dictation...">
                                        <svg className="animate-spin h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                )}
                                <DictationButton
                                    onStart={handleDictationStart}
                                    onUpdate={handleDictationUpdate}
                                    onStop={handleDictationStop}
                                    disabled={isLoading || isCorrectingText}
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || isMaskEmpty(maskHistory[maskHistoryIndex])}
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
                    {(activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'pin') && (
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
                    <ToolButton tool="brush" label="Brush"><PainterBrushIcon className="w-6 h-6" /></ToolButton>
                    <ToolButton tool="pin" label="Pin"><ManualSelectIcon className="w-6 h-6" /></ToolButton>
                    <ToolButton tool="eraser" label="Eraser"><EraserIcon className="w-6 h-6" /></ToolButton>
                    <ToolButton tool="lasso" label="Lasso"><LassoIcon className="w-6 h-6" /></ToolButton>
                    <ToolButton tool="rectangle" label="Rectangle"><RectangleSelectIcon className="w-6 h-6" /></ToolButton>
                    <ToolButton tool="polyline" label="Polyline"><PolylineSelectIcon className="w-6 h-6" /></ToolButton>
                </div>
            </footer>

            {isSidePanelOpen && (
                <>
                    <div
                        className="absolute inset-0 bg-black/50 z-20 animate-fade-in"
                        onClick={() => setIsSidePanelOpen(false)}
                        aria-hidden="true"
                    ></div>
                    <div
                        className="absolute top-0 right-0 bottom-0 w-80 bg-dark-secondary z-30 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-slide-in-right"
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
                        <div className="p-4 flex-grow overflow-y-auto">
                            <p className="text-dark-text-secondary text-sm">سيتم إضافة الخيارات هنا قريبًا.</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default InpaintingView;