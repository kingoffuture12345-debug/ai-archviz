import React, { useState, useEffect, useMemo } from 'react';
import Tabs from './Tabs';
import StyleGrid from './StyleGrid';
import PaletteSelector from './PaletteSelector';
import ImageUploader from './ImageUploader';
import ResultDisplay from './ResultDisplay';
import CustomStyleModal from './CustomStyleModal';
import ImageZoomModal from './ImageZoomModal';
import DictationButton from './DictationButton';
import InpaintingView from './InpaintingView';
import { WandSparklesIcon } from './icons/WandSparklesIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { DesignType, CustomStyleDetails, DesignOption, RoomOption, BuildingOption } from '../types';
import { INTERIOR_STYLE_OPTIONS, EXTERIOR_STYLE_OPTIONS, ROOM_TYPE_OPTIONS, BUILDING_TYPE_OPTIONS, CUSTOM_STYLE_PROMPT, PALETTE_OPTIONS, DEFAULT_AI_MODEL } from '../constants';
import { generateDesign, enhancePrompt } from '../services/geminiService';

// Helper to convert file to base64
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

// Helper to resize and compress images client-side to prevent oversized payloads
const resizeAndCompressImage = (file: File, maxDimension: number = 1024): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read file."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > height) {
                    if (width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const newFile = new File([blob], "compressed_image.jpeg", {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    },
                    'image/jpeg',
                    0.85 // Compression quality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

const dataURLtoFile = (dataurl: string, filename: string): File | null => {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;

    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};


const defaultCustomStyle: CustomStyleDetails = {
    colors: '',
    features: '',
    lighting: '',
    mood: '',
    textures: '',
};

interface RoomGridProps {
    options: RoomOption[];
    selectedValue: string;
    onSelect: (value: string) => void;
}

const RoomGrid: React.FC<RoomGridProps> = ({ options, selectedValue, onSelect }) => {
    return (
        <div className="w-full">
            <div className="grid grid-cols-4 gap-3">
                {options.map((option) => {
                    const isSelected = selectedValue === option.prompt;
                    const Icon = option.icon;
                    const cardClasses = `
                        group aspect-square w-full bg-light-primary dark:bg-dark-primary rounded-xl 
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-secondary focus:ring-accent
                        transition-all duration-200 transform hover:scale-105
                        ${isSelected ? 'ring-2 ring-accent' : 'ring-1 ring-light-border dark:ring-dark-border'}
                    `;

                    return (
                        <button
                            key={option.prompt}
                            onClick={() => onSelect(option.prompt)}
                            className={cardClasses}
                        >
                            <div className="flex flex-col h-full p-2 text-center items-center justify-center">
                                <div className="flex-grow flex items-center justify-center">
                                    <Icon className={`w-7 h-7 transition-colors ${isSelected ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text'}`} />
                                </div>
                                <span className={`block text-xs font-semibold leading-tight w-full ${isSelected ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text'}`}>
                                    {option.label}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

interface BuildingGridProps {
    options: BuildingOption[];
    selectedValue: string;
    onSelect: (value: string) => void;
}

const BuildingGrid: React.FC<BuildingGridProps> = ({ options, selectedValue, onSelect }) => {
    return (
        <div className="w-full">
            <div className="grid grid-cols-4 gap-3">
                {options.map((option) => {
                    const isSelected = selectedValue === option.prompt;
                    const Icon = option.icon;
                    const cardClasses = `
                        group aspect-square w-full bg-light-primary dark:bg-dark-primary rounded-xl 
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-secondary focus:ring-accent
                        transition-all duration-200 transform hover:scale-105
                        ${isSelected ? 'ring-2 ring-accent' : 'ring-1 ring-light-border dark:ring-dark-border'}
                    `;

                    return (
                        <button
                            key={option.prompt}
                            onClick={() => onSelect(option.prompt)}
                            className={cardClasses}
                        >
                            <div className="flex flex-col h-full p-2 text-center items-center justify-center">
                                <div className="flex-grow flex items-center justify-center">
                                    <Icon className={`w-7 h-7 transition-colors ${isSelected ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text'}`} />
                                </div>
                                <span className={`block text-xs font-semibold leading-tight w-full ${isSelected ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text'}`}>
                                    {option.label}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};


function ArchitectureView() {
    const [designType, setDesignType] = useState<DesignType>(DesignType.Interior);
    const [roomType, setRoomType] = useState<string>(ROOM_TYPE_OPTIONS[1].prompt);
    const [buildingType, setBuildingType] = useState<string>(BUILDING_TYPE_OPTIONS[0].prompt);
    const [style, setStyle] = useState<string>(INTERIOR_STYLE_OPTIONS[1].prompt); // Default to 'Modern'
    const [customStyleDetails, setCustomStyleDetails] = useState<CustomStyleDetails>(defaultCustomStyle);
    const [selectedPalette, setSelectedPalette] = useState<string>(PALETTE_OPTIONS[0].promptValue);
    
    const [mainImage, setMainImage] = useState<{ file: File; url: string; base64: { data: string; mimeType: string } } | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [imageToEdit, setImageToEdit] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editablePrompt, setEditablePrompt] = useState('');
    const [originalPromptBeforeEnhance, setOriginalPromptBeforeEnhance] = useState<string | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [textBeforeDictation, setTextBeforeDictation] = useState('');
    const [isRoomGridOpen, setIsRoomGridOpen] = useState(false);
    const [isStyleGridOpen, setIsStyleGridOpen] = useState(false);
    const [isPaletteSectionOpen, setIsPaletteSectionOpen] = useState(false);

    const styleOptions = useMemo<DesignOption[]>(() => {
        return designType === DesignType.Interior ? INTERIOR_STYLE_OPTIONS : EXTERIOR_STYLE_OPTIONS;
    }, [designType]);

    const selectedRoomLabel = useMemo(() => ROOM_TYPE_OPTIONS.find(opt => opt.prompt === roomType)?.label, [roomType]);
    const selectedBuildingLabel = useMemo(() => BUILDING_TYPE_OPTIONS.find(opt => opt.prompt === buildingType)?.label, [buildingType]);
    const selectedStyleLabel = useMemo(() => styleOptions.find(opt => opt.prompt === style)?.label, [style, styleOptions]);
    const selectedPaletteLabel = useMemo(() => PALETTE_OPTIONS.find(opt => opt.promptValue === selectedPalette)?.name, [selectedPalette]);
    
    // Memoize the generated prompt based on user selections
    const generatedPrompt = useMemo(() => {
        const selectedRoom = ROOM_TYPE_OPTIONS.find(r => r.prompt === roomType);
        const roomName = selectedRoom?.prompt || 'interior space';

        const selectedBuilding = BUILDING_TYPE_OPTIONS.find(b => b.prompt === buildingType);
        const buildingName = selectedBuilding?.prompt || 'building';

        const designTypeText = designType === DesignType.Interior ? `the ${roomName}` : `the ${buildingName} exterior`;
        // A more direct instruction to prevent conversational text responses.
        const instruction = "The output must ONLY be the final photorealistic image.";

        let basePrompt = '';

        if (style === CUSTOM_STYLE_PROMPT) {
            const parts = [];
            parts.push(`Professionally redesign ${designTypeText} in the main 'before' image using the following custom style attributes:`);
            if (customStyleDetails.colors) parts.push(`- Color Palette: ${customStyleDetails.colors}.`);
            if (customStyleDetails.features) {
                const featureLabel = designType === DesignType.Interior ? 'Furniture and Decor' : 'Architectural Details';
                parts.push(`- ${featureLabel}: ${customStyleDetails.features}.`);
            }
            if (customStyleDetails.textures) parts.push(`- Materials and Textures: ${customStyleDetails.textures}.`);
            if (customStyleDetails.lighting) parts.push(`- Lighting Style: ${customStyleDetails.lighting}.`);
            if (customStyleDetails.mood) parts.push(`- Overall Mood and Atmosphere: ${customStyleDetails.mood}.`);
            basePrompt = parts.join(' ');
        } else {
            // Standard style prompt
            const selectedStyle = (designType === DesignType.Interior ? INTERIOR_STYLE_OPTIONS : EXTERIOR_STYLE_OPTIONS).find(s => s.prompt === style);
            const stylePrompt = selectedStyle?.prompt || 'in a beautiful style';
            basePrompt = `Professionally redesign ${designTypeText} in the main 'before' image to be ${stylePrompt}.`;
        }

        const palette = PALETTE_OPTIONS.find(p => p.promptValue === selectedPalette);
        if (palette && palette.colors && palette.colors.length > 0) {
            basePrompt += ` The color palette should be primarily inspired by these colors: ${palette.colors.join(', ')}.`;
        }

        return `${basePrompt} ${instruction}`;

    }, [style, designType, customStyleDetails, roomType, buildingType, selectedPalette]);
    
    // Update the editable prompt whenever the generated one changes
    useEffect(() => {
        setEditablePrompt(generatedPrompt);
        setOriginalPromptBeforeEnhance(null); // Reset revert state when prompt auto-updates
    }, [generatedPrompt]);

    // Handlers
    const handleDesignTypeChange = (type: DesignType) => {
        setDesignType(type);
        const newOptions = type === DesignType.Interior ? INTERIOR_STYLE_OPTIONS : EXTERIOR_STYLE_OPTIONS;
        // Default to the second style (usually 'Modern') as the first is 'Custom'
        const newStyle = newOptions.length > 1 ? newOptions[1].prompt : newOptions[0].prompt;
        setStyle(newStyle);
    };
    
    const handleStyleChange = (newStyle: string) => {
        if (newStyle === CUSTOM_STYLE_PROMPT) {
            setIsModalOpen(true);
        } else {
            setStyle(newStyle);
        }
    };

    const handleMainImageUpload = async (file: File) => {
        try {
            const compressedFile = await resizeAndCompressImage(file);
            if (mainImage) {
                URL.revokeObjectURL(mainImage.url);
            }
            const url = URL.createObjectURL(compressedFile);
            const base64 = await fileToBase64(compressedFile);
            setMainImage({ file: compressedFile, url, base64 });
            setGeneratedImage(null);
            setError(null);
        } catch (e) {
            setError("Failed to process image. Please try another file.");
            console.error("Image processing error:", e);
        }
    };
    
    const handleSaveCustomStyle = (details: CustomStyleDetails) => {
        setCustomStyleDetails(details);
        setStyle(CUSTOM_STYLE_PROMPT);
        setIsModalOpen(false);
    };

    const handleSubmit = async () => {
        if (!mainImage) {
            setError('Please upload an image first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const resultBase64 = await generateDesign(editablePrompt, mainImage.base64, null, DEFAULT_AI_MODEL);
            setGeneratedImage(`data:image/png;base64,${resultBase64}`);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`There was an unexpected error. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnhancePrompt = async () => {
        if (!editablePrompt.trim()) {
            setError('Please enter a prompt to enhance.');
            return;
        }
        setIsEnhancing(true);
        setError(null);
        setOriginalPromptBeforeEnhance(editablePrompt); // Save the current state
        try {
            const mode = designType === DesignType.Interior ? 'architecture-interior' : 'architecture-exterior';
            const enhanced = await enhancePrompt(editablePrompt, mode);
            setEditablePrompt(enhanced);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to enhance prompt: ${errorMessage}`);
            setOriginalPromptBeforeEnhance(null); // Clear on failure
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleRevertPrompt = () => {
        if (originalPromptBeforeEnhance !== null) {
            setEditablePrompt(originalPromptBeforeEnhance);
            setOriginalPromptBeforeEnhance(null);
        }
    };
    
    const handleClearAll = () => {
        if (mainImage) URL.revokeObjectURL(mainImage.url);

        setDesignType(DesignType.Interior);
        setStyle(INTERIOR_STYLE_OPTIONS[1].prompt);
        setSelectedPalette(PALETTE_OPTIONS[0].promptValue);
        setCustomStyleDetails(defaultCustomStyle);
        setMainImage(null);
        setGeneratedImage(null);
        setIsLoading(false);
        setError(null);
        setIsModalOpen(false);
        setOriginalPromptBeforeEnhance(null);
    };
    
    const handleDictationStart = () => {
        setTextBeforeDictation(editablePrompt.trim());
    };

    const handleDictationUpdate = (transcript: string) => {
        const separator = textBeforeDictation ? ' ' : '';
        setEditablePrompt(textBeforeDictation + separator + transcript);
    };

    const handleDictationStop = (finalTranscript: string) => {
        const separator = textBeforeDictation ? ' ' : '';
        setEditablePrompt(textBeforeDictation + separator + finalTranscript);
    };

    const isClearAllActive = !!mainImage || !!generatedImage;

    const placeholderText = "أدخل وصفًا تفصيليًا للتصميم المطلوب...";

    const handleInpaintingComplete = (newImageUrl: string) => {
        const newFile = dataURLtoFile(newImageUrl, 'edited-before.png');
        if (newFile) {
            handleMainImageUpload(newFile);
        } else {
            setError("Failed to process edited image.");
        }
        setImageToEdit(null);
    };

    if (imageToEdit) {
        return (
            <InpaintingView 
                imageUrl={imageToEdit}
                onClose={() => setImageToEdit(null)}
                onComplete={handleInpaintingComplete}
            />
        );
    }

    return (
        <React.Fragment>
            <div className="space-y-6 animate-fade-in">
                <div className="bg-light-secondary dark:bg-dark-secondary p-4 rounded-2xl shadow-lg space-y-4">
                    <Tabs selected={designType} onSelect={handleDesignTypeChange} />
                    
                    {designType === DesignType.Interior ? (
                        <div className="animate-fade-in">
                            <button 
                                onClick={() => setIsRoomGridOpen(!isRoomGridOpen)}
                                className="w-full flex justify-between items-center py-2 text-right"
                                aria-expanded={isRoomGridOpen}
                                aria-controls="room-grid-container"
                            >
                                <div className="flex-grow">
                                    <h3 className="text-lg font-bold text-light-text dark:text-dark-text">اختر نوع الغرفة أو المكان</h3>
                                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                        حدد نوع المساحة التي تريد تصميمها.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-sm font-semibold text-accent">{selectedRoomLabel}</span>
                                    <ChevronDownIcon className={`w-5 h-5 text-dark-text-secondary transition-transform duration-300 flex-shrink-0 ${isRoomGridOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            <div 
                                id="room-grid-container"
                                className={`transition-all duration-500 ease-in-out overflow-hidden ${isRoomGridOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="pt-3">
                                    <RoomGrid
                                        options={ROOM_TYPE_OPTIONS}
                                        selectedValue={roomType}
                                        onSelect={setRoomType}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <button 
                                onClick={() => setIsRoomGridOpen(!isRoomGridOpen)}
                                className="w-full flex justify-between items-center py-2 text-right"
                                aria-expanded={isRoomGridOpen}
                                aria-controls="building-grid-container"
                            >
                                <div className="flex-grow">
                                    <h3 className="text-lg font-bold text-light-text dark:text-dark-text">اختر نوع المبنى</h3>
                                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                        حدد نوع المبنى الذي تريد تصميمه.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-sm font-semibold text-accent">{selectedBuildingLabel}</span>
                                    <ChevronDownIcon className={`w-5 h-5 text-dark-text-secondary transition-transform duration-300 flex-shrink-0 ${isRoomGridOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            <div 
                                id="building-grid-container"
                                className={`transition-all duration-500 ease-in-out overflow-hidden ${isRoomGridOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="pt-3">
                                    <BuildingGrid
                                        options={BUILDING_TYPE_OPTIONS}
                                        selectedValue={buildingType}
                                        onSelect={setBuildingType}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <button 
                            onClick={() => setIsStyleGridOpen(!isStyleGridOpen)}
                            className="w-full flex justify-between items-center py-2 text-right"
                            aria-expanded={isStyleGridOpen}
                            aria-controls="style-grid-container"
                        >
                            <div className="flex-grow">
                                <h3 className="text-lg font-bold text-light-text dark:text-dark-text">اختر اسلوب التصميم</h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                    اختر نمط التصميم الذي تريده لبدء إنشاء تصميمك الداخلي المثالي.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-sm font-semibold text-accent">{selectedStyleLabel}</span>
                                <ChevronDownIcon className={`w-5 h-5 text-dark-text-secondary transition-transform duration-300 flex-shrink-0 ${isStyleGridOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                        <div 
                            id="style-grid-container"
                            className={`transition-all duration-500 ease-in-out overflow-hidden ${isStyleGridOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                            <div className="pt-3">
                                <StyleGrid
                                    options={styleOptions}
                                    selectedValue={style}
                                    onSelect={handleStyleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button 
                            onClick={() => setIsPaletteSectionOpen(!isPaletteSectionOpen)}
                            className="w-full flex justify-between items-center py-2 text-right"
                            aria-expanded={isPaletteSectionOpen}
                            aria-controls="palette-selector-container"
                        >
                            <div className="flex-grow">
                                <h3 className="text-lg font-bold text-light-text dark:text-dark-text">Select Palette</h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                    Choose a color palette to bring your vision to life!
                                </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-sm font-semibold text-accent">{selectedPaletteLabel}</span>
                                <ChevronDownIcon className={`w-5 h-5 text-dark-text-secondary transition-transform duration-300 flex-shrink-0 ${isPaletteSectionOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                         <div 
                            id="palette-selector-container"
                            className={`transition-all duration-500 ease-in-out overflow-hidden ${isPaletteSectionOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                            <div className="pt-3">
                                <PaletteSelector
                                    options={PALETTE_OPTIONS}
                                    selectedValue={selectedPalette}
                                    onSelect={setSelectedPalette}
                                />
                            </div>
                        </div>
                    </div>


                    <div>
                        <label htmlFor="ai-prompt" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                            موجه الذكاء الاصطناعي (قابل للتعديل)
                        </label>
                        <div className="bg-light-primary dark:bg-dark-primary border-2 border-light-border dark:border-dark-border rounded-lg focus-within:ring-2 focus-within:ring-accent focus-within:border-accent flex flex-col transition-all duration-200">
                             <div className="p-3 pb-1 relative">
                                <textarea
                                    id="ai-prompt"
                                    value={editablePrompt}
                                    onChange={(e) => setEditablePrompt(e.target.value)}
                                    className="w-full h-40 bg-transparent text-light-text dark:text-dark-text focus:outline-none resize-none placeholder:text-dark-text-secondary"
                                    placeholder={editablePrompt ? '' : placeholderText}
                                />
                                 {!editablePrompt && (
                                    <div className="absolute inset-0 flex items-center justify-center text-dark-text-secondary pointer-events-none p-3">
                                        {placeholderText}
                                    </div>
                                )}
                             </div>
                             <div className="flex items-center gap-2 p-3 pt-1">
                                <div className="flex-grow" />
                                <DictationButton 
                                    onStart={handleDictationStart}
                                    onUpdate={handleDictationUpdate}
                                    onStop={handleDictationStop}
                                    disabled={isLoading || isEnhancing}
                                />
                                {originalPromptBeforeEnhance !== null && (
                                    <button
                                        onClick={handleRevertPrompt}
                                        disabled={isLoading || isEnhancing}
                                        className="bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 disabled:bg-gray-700/50 disabled:text-gray-500 disabled:cursor-not-allowed font-semibold p-2 rounded-lg flex items-center justify-center transition-colors duration-200 text-sm animate-fade-in"
                                        title="العودة إلى النص الأصلي"
                                    >
                                        <ArrowPathIcon className="w-5 h-5" />
                                    </button>
                                )}
                                <button
                                    onClick={handleEnhancePrompt}
                                    disabled={isLoading || isEnhancing || !editablePrompt.trim()}
                                    className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:bg-gray-700/50 disabled:text-gray-500 disabled:cursor-not-allowed font-semibold p-2 rounded-lg flex items-center justify-center transition-colors duration-200 text-sm"
                                    title="تحسين النص باستخدام الذكاء الاصطناعي"
                                >
                                    {isEnhancing ? (
                                        <svg className="animate-spin h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                         <SparklesIcon className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || !mainImage || isEnhancing}
                                className="flex-grow bg-accent hover:bg-accent-hover disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        جاري التصميم...
                                    </>
                                ) : (
                                    <>
                                        <WandSparklesIcon className="w-5 h-5 mr-2" />
                                        توليد الصور
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleClearAll}
                                disabled={!isClearAllActive}
                                className={`flex-shrink-0 p-3 rounded-lg transition-colors duration-200 ${
                                    isClearAllActive
                                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                        : 'bg-light-primary dark:bg-dark-primary text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                }`}
                                aria-label="Clear all inputs"
                            >
                                <TrashIcon className="w-6 h-6" />
                            </button>
                        </div>
                        {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px] md:h-[600px]">
                    <ImageUploader 
                        onImageUpload={handleMainImageUpload}
                        beforeImage={mainImage?.url || null}
                        onImageClick={() => mainImage && setImageToEdit(mainImage.url)}
                    />
                    <ResultDisplay 
                        afterImage={generatedImage}
                        isLoading={isLoading}
                        onImageClick={() => generatedImage && setZoomedImage(generatedImage)}
                    />
                </div>
            </div>
            
            <CustomStyleModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveCustomStyle}
                initialValue={customStyleDetails}
                designType={designType}
            />
            
            <ImageZoomModal 
                imageUrl={zoomedImage}
                onClose={() => setZoomedImage(null)}
            />
        </React.Fragment>
    );
}

export default ArchitectureView;