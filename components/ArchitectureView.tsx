import React, { useState, useEffect, useMemo, useRef } from 'react';
import Tabs from './Tabs';
import StyleGrid from './StyleGrid';
import PaletteSelector from './PaletteSelector';
import ImageUploader from './ImageUploader';
import ResultDisplay from './ResultDisplay';
import CustomStyleModal from './CustomStyleModal';
import ImageZoomModal from './ImageZoomModal';
import ImageComparisonModal from './ImageComparisonModal';
import DictationButton from './DictationButton';
import InpaintingView from './InpaintingView';
import ReferenceImageUploader from './ReferenceImageUploader';
import VariationsDisplay from './VariationsDisplay';
import AssetEditorModal from './AssetEditorModal';
import { WandSparklesIcon } from './icons/WandSparklesIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { DesignType, CustomStyleDetails, DesignOption, RoomOption, BuildingOption, AppMode, Asset, GeneratedAsset } from '../types';
import { INTERIOR_STYLE_OPTIONS, EXTERIOR_STYLE_OPTIONS, ROOM_TYPE_OPTIONS, BUILDING_TYPE_OPTIONS, CUSTOM_STYLE_PROMPT, DECOR_PALETTE_OPTIONS, EXTERIOR_PALETTE_OPTIONS, DEFAULT_AI_MODEL, FROM_IMAGE_STYLE_PROMPT, FURNITURE_PALETTE_OPTIONS, DAYTIME_LIGHTING_OPTIONS, NIGHTTIME_LIGHTING_OPTIONS } from '../constants';
import { generateDesign, generateDesignVariations, enhancePrompt, correctText } from '../services/geminiService';
import { fileToBase64, resizeAndCompressImage, dataURLtoFile } from '../utils/imageHelpers';
import { saveHistoryItem } from '../services/historyService';
import { notify } from '../utils/notification';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { StyleIcon } from './icons/StyleIcon';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { SunIcon } from './icons/SunIcon';
import { HomeIcon } from './icons/HomeIcon';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { MoonIcon } from './icons/MoonIcon';
import { PaletteIcon } from './icons/PaletteIcon';


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
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
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
                            <div className="flex flex-col h-full p-2 md:p-3 text-center items-center justify-center">
                                <div className="flex-grow flex items-center justify-center">
                                    <Icon className={`w-7 h-7 md:w-8 md:h-8 transition-colors ${isSelected ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text'}`} />
                                </div>
                                <span className={`block text-xs md:text-sm font-semibold leading-tight w-full ${isSelected ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text'}`}>
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
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
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
                            <div className="flex flex-col h-full p-2 md:p-3 text-center items-center justify-center">
                                <div className="flex-grow flex items-center justify-center">
                                    <Icon className={`w-7 h-7 md:w-8 md:h-8 transition-colors ${isSelected ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text'}`} />
                                </div>
                                <span className={`block text-xs md:text-sm font-semibold leading-tight w-full ${isSelected ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text'}`}>
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
    const [style, setStyle] = useState<string>(INTERIOR_STYLE_OPTIONS[0].prompt); 
    const [customStyleDetails, setCustomStyleDetails] = useState<CustomStyleDetails>(defaultCustomStyle);
    
    const [decorPalette, setDecorPalette] = useState<string>('none');
    const [furniturePalette, setFurniturePalette] = useState<string>('none');
    const [exteriorPalette, setExteriorPalette] = useState<string>('none');
    const [lightingScenario, setLightingScenario] = useState<string>('none');

    const [mainImage, setMainImage] = useState<{ file: File; url: string; base64: { data: string; mimeType: string } } | null>(null);
    const [referenceImages, setReferenceImages] = useState<Array<{ id: string; file: File; url: string; base64: { data: string; mimeType: string } }>>([]);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [imageToEdit, setImageToEdit] = useState<string | null>(null);
    const [variationImages, setVariationImages] = useState<string[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isCorrectingText, setIsCorrectingText] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editablePrompt, setEditablePrompt] = useState('');
    const [originalPromptBeforeEnhance, setOriginalPromptBeforeEnhance] = useState<string | null>(null);
    const [viewingImage, setViewingImage] = useState<{ url: string; isEditable: boolean } | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const textBeforeDictation = useRef('');
    const [isRoomGridOpen, setIsRoomGridOpen] = useState(false);
    const [isStyleGridOpen, setIsStyleGridOpen] = useState(false);
    const [isPaletteSectionOpen, setIsPaletteSectionOpen] = useState(false);
    const [editingSource, setEditingSource] = useState<'before' | 'after' | null>(null);
    const [interiorPaletteMode, setInteriorPaletteMode] = useState<'decor' | 'furniture'>('decor');
    
    const [styleTab, setStyleTab] = useState<'style' | 'lighting' | 'palette' | 'assets'>('style');
    const [lightingSubTab, setLightingSubTab] = useState<'daytime' | 'nighttime'>('daytime');
    const [assets, setAssets] = useState<Asset[]>([]);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const assetFileInputRef = useRef<HTMLInputElement>(null);

    const styleOptions = useMemo<DesignOption[]>(() => {
        return designType === DesignType.Interior ? INTERIOR_STYLE_OPTIONS : EXTERIOR_STYLE_OPTIONS;
    }, [designType]);

    const selectedRoomLabel = useMemo(() => ROOM_TYPE_OPTIONS.find(opt => opt.prompt === roomType)?.label, [roomType]);
    const selectedBuildingLabel = useMemo(() => BUILDING_TYPE_OPTIONS.find(opt => opt.prompt === buildingType)?.label, [buildingType]);
    const selectedStyleLabel = useMemo(() => styleOptions.find(opt => opt.prompt === style)?.label, [style, styleOptions]);
    
    const selectedDecorPaletteLabel = useMemo(() => DECOR_PALETTE_OPTIONS.find(opt => opt.promptValue === decorPalette)?.name, [decorPalette]);
    const selectedFurniturePaletteLabel = useMemo(() => FURNITURE_PALETTE_OPTIONS.find(p => p.promptValue === furniturePalette)?.name, [furniturePalette]);
    const selectedExteriorPaletteLabel = useMemo(() => EXTERIOR_PALETTE_OPTIONS.find(opt => opt.promptValue === exteriorPalette)?.name, [exteriorPalette]);
    
    // Memoize the generated prompt based on user selections
    const generatedPrompt = useMemo(() => {
        const selectedRoom = ROOM_TYPE_OPTIONS.find(r => r.prompt === roomType);
        const roomName = selectedRoom?.prompt || 'interior space';

        const selectedBuilding = BUILDING_TYPE_OPTIONS.find(b => b.prompt === buildingType);
        const buildingName = selectedBuilding?.prompt || 'building';

        const designTypeText = designType === DesignType.Interior ? `the ${roomName}` : `the ${buildingName} exterior`;
        const instruction = "The output must ONLY be the final photorealistic image.";

        let basePrompt = '';

        if (style === FROM_IMAGE_STYLE_PROMPT) {
            basePrompt = `Professionally redesign ${designTypeText} in the main 'before' image to be in the style of the provided reference image(s). for texture and color palette.`;
        } else if (style === CUSTOM_STYLE_PROMPT) {
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
            const selectedStyle = (designType === DesignType.Interior ? INTERIOR_STYLE_OPTIONS : EXTERIOR_STYLE_OPTIONS).find(s => s.prompt === style);
            const stylePrompt = selectedStyle?.prompt || 'in a beautiful style';
            basePrompt = `Professionally redesign ${designTypeText} in the main 'before' image to be ${stylePrompt}.`;
        }
        
        if (designType === DesignType.Interior) {
            const decorPaletteSelection = DECOR_PALETTE_OPTIONS.find(p => p.promptValue === decorPalette);
            if (decorPaletteSelection) {
                if (decorPaletteSelection.promptValue === 'surprise-me') {
                    basePrompt += ` For the walls, ceiling, and fixed decor, intelligently analyze the 'before' image and select a harmonious and visually appealing color palette that complements the existing space and lighting.`;
                } else if (decorPaletteSelection.promptValue !== 'none' && decorPaletteSelection.colors) {
                    basePrompt += ` The color palette for the walls, ceiling, and fixed decor (like wood alternatives and trim) should be inspired by ${decorPaletteSelection.name}: ${decorPaletteSelection.colors.join(', ')}.`;
                }
            }
        
            const furniturePaletteSelection = FURNITURE_PALETTE_OPTIONS.find(p => p.promptValue === furniturePalette);
            if (furniturePaletteSelection) {
                if (furniturePaletteSelection.promptValue === 'surprise-me') {
                    basePrompt += ` For the furniture and textiles (sofa, chairs, carpet, curtains, pillows), intelligently analyze the 'before' image and select a harmonious and visually appealing color palette that complements the existing space and lighting.`;
                } else if (furniturePaletteSelection.promptValue !== 'none' && furniturePaletteSelection.colors) {
                    basePrompt += ` The color palette for the furniture (sofa, chairs), textiles (carpet, curtains, pillows), and other soft furnishings should be inspired by ${furniturePaletteSelection.name}: ${furniturePaletteSelection.colors.join(', ')}.`;
                }
            }
        } else { // Exterior
            const palette = EXTERIOR_PALETTE_OPTIONS.find(p => p.promptValue === exteriorPalette);
            if (palette) {
                if (palette.promptValue === 'surprise-me') {
                    basePrompt += ` For the exterior color palette, intelligently analyze the 'before' image and select a harmonious and visually appealing color scheme that complements the architectural style and surroundings.`;
                } else if (palette.promptValue !== 'none' && palette.colors && palette.colors.length > 0) {
                    basePrompt += ` The color palette should be primarily inspired by these colors: ${palette.colors.join(', ')}.`;
                }
            }
        }

        let finalPrompt = `${basePrompt} ${instruction}`;
        
        if (assets.length > 0) {
            let assetInstruction = ` Additionally, you must incorporate the following assets. Integrate them seamlessly and realistically into the scene, scaling them appropriately, without altering the main image's dimensions, perspective, or camera angle:`;
            let imageCounter = referenceImages.length; 
        
            assets.forEach((asset, index) => {
                imageCounter++;
                let instructionForAsset = ` For asset #${index + 1} (reference image ${imageCounter}): take the provided object and`;
        
                if (asset.description) {
                    instructionForAsset += ` place it naturally within the scene according to this description: "${asset.description}".`;
                } else {
                    instructionForAsset += ` place it where it would logically fit in the scene.`;
                }
                assetInstruction += instructionForAsset;
            });
            finalPrompt += assetInstruction;
        }

        return finalPrompt;

    }, [style, designType, customStyleDetails, roomType, buildingType, decorPalette, furniturePalette, exteriorPalette, assets, referenceImages]);
    
    // Update the editable prompt whenever the generated one changes
    useEffect(() => {
        setEditablePrompt(generatedPrompt);
        setOriginalPromptBeforeEnhance(null); // Reset revert state when prompt auto-updates
    }, [generatedPrompt]);

    // Handlers
    const handleDesignTypeChange = (type: DesignType) => {
        setDesignType(type);
        setLightingScenario('none');
        if (type === DesignType.Interior) {
            setStyle(INTERIOR_STYLE_OPTIONS[0].prompt);
            setDecorPalette('none');
            setFurniturePalette('none');
        } else {
            setStyle(EXTERIOR_STYLE_OPTIONS[0].prompt);
            setExteriorPalette('none');
        }
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
            setVariationImages([]);
            setError(null);
        } catch (e) {
            setError("Failed to process image. Please try another file.");
            console.error("Image processing error:", e);
        }
    };

    const handleReferenceImageUpload = async (file: File) => {
        try {
            const compressedFile = await resizeAndCompressImage(file);
            const url = URL.createObjectURL(compressedFile);
            const base64 = await fileToBase64(compressedFile);
            const newImage = { 
                id: `${Date.now()}-${Math.random()}`,
                file: compressedFile, 
                url, 
                base64 
            };
            setReferenceImages(prevImages => [...prevImages, newImage]);
        } catch (e) {
            setError("Failed to process reference image. Please try another file.");
            console.error("Image processing error:", e);
        }
    };

    const handleReferenceImageRemove = (idToRemove: string) => {
        const imageToRemove = referenceImages.find(img => img.id === idToRemove);
        if (imageToRemove) {
            URL.revokeObjectURL(imageToRemove.url);
        }
        setReferenceImages(currentImages => currentImages.filter(img => img.id !== idToRemove));
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
        setVariationImages([]);

        try {
            const refImageBase64s = style === FROM_IMAGE_STYLE_PROMPT 
                ? referenceImages.map(img => img.base64) 
                : [];
            
            const assetImageParts = assets.map(asset => asset.base64);
            const allReferenceImages = [...refImageBase64s, ...assetImageParts];
            
            if (style === FROM_IMAGE_STYLE_PROMPT && (!refImageBase64s || refImageBase64s.length === 0)) {
                setError('Please upload a reference image when using "From image" style.');
                setIsLoading(false);
                return;
            }

            let hiddenInstruction = '';
            if (designType === DesignType.Interior) {
                hiddenInstruction = "CRITICAL INSTRUCTION: The output image must strictly preserve the original image's structural layout, including all walls, windows, doors, ceiling, and the floor plan. The camera angle, perspective, and aspect ratio must remain identical to the 'before' image. All changes should only apply to the decor, materials, and furnishings within the existing space.";
            } else { // DesignType.Exterior
                hiddenInstruction = "CRITICAL INSTRUCTION: The output image must strictly preserve the original image's architectural structure, including all walls, windows, doors, roofline, and overall form. The camera angle, perspective, and aspect ratio must remain identical to the 'before' image. All changes should only apply to materials, colors, landscaping, and facade details on the existing structure.";
            }
            
            let finalPrompt = `${hiddenInstruction} ${editablePrompt}`;
            if (lightingScenario !== 'none') {
                finalPrompt += ` ${lightingScenario}`;
            }

            const resultBase64 = await generateDesign(finalPrompt, mainImage.base64, allReferenceImages.length > 0 ? allReferenceImages : null, DEFAULT_AI_MODEL);
            const resultUrl = `data:image/png;base64,${resultBase64}`;
            setGeneratedImage(resultUrl);

            // Save to history
            await saveHistoryItem({
                id: `history_${Date.now()}`,
                timestamp: Date.now(),
                beforeImageUrl: mainImage.url,
                afterImageUrl: resultUrl,
                settings: {
                    appMode: AppMode.Architecture,
                    designType,
                    roomType: designType === DesignType.Interior ? roomType : undefined,
                    buildingType: designType === DesignType.Exterior ? buildingType : undefined,
                    style,
                    customStyleDetails: style === CUSTOM_STYLE_PROMPT ? customStyleDetails : undefined,
                    decorPalette: designType === DesignType.Interior ? decorPalette : undefined,
                    furniturePalette: designType === DesignType.Interior ? furniturePalette : undefined,
                    selectedPalette: designType === DesignType.Exterior ? exteriorPalette : undefined,
                    editablePrompt,
                    referenceImageUrls: referenceImages.map(img => img.url),
                }
            });
            notify("تصميمك جاهز!", resultUrl);


        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`There was an unexpected error. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateVariations = async () => {
        if (!mainImage || !editablePrompt) {
            setError('Cannot generate variations without an initial image and prompt.');
            return;
        }
    
        setIsGeneratingVariations(true);
        setVariationImages([]);
        setError(null);
    
        try {
            const refImageBase64s = style === FROM_IMAGE_STYLE_PROMPT 
                ? referenceImages.map(img => img.base64) 
                : [];

            const assetImageParts = assets.map(asset => asset.base64);
            const allReferenceImages = [...refImageBase64s, ...assetImageParts];
            
            let hiddenInstruction = '';
            if (designType === DesignType.Interior) {
                hiddenInstruction = "CRITICAL INSTRUCTION: The output image must strictly preserve the original image's structural layout, including all walls, windows, doors, ceiling, and the floor plan. The camera angle, perspective, and aspect ratio must remain identical to the 'before' image. All changes should only apply to the decor, materials, and furnishings within the existing space.";
            } else {
                hiddenInstruction = "CRITICAL INSTRUCTION: The output image must strictly preserve the original image's architectural structure, including all walls, windows, doors, roofline, and overall form. The camera angle, perspective, and aspect ratio must remain identical to the 'before' image. All changes should only apply to materials, colors, landscaping, and facade details on the existing structure.";
            }
            
            let finalPrompt = `${hiddenInstruction} ${editablePrompt}`;
            if (lightingScenario !== 'none') {
                finalPrompt += ` ${lightingScenario}`;
            }
    
            const resultsBase64 = await generateDesignVariations(finalPrompt, mainImage.base64, allReferenceImages.length > 0 ? allReferenceImages : null, DEFAULT_AI_MODEL, 3);
            const variationUrls = resultsBase64.map(base64 => `data:image/png;base64,${base64}`);
            setVariationImages(variationUrls);
    
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate variations. ${errorMessage}`);
        } finally {
            setIsGeneratingVariations(false);
        }
    };

    const handleEnhancePrompt = async () => {
        setIsEnhancing(true);
        setError(null);
        setOriginalPromptBeforeEnhance(editablePrompt);

        try {
            if (style === FROM_IMAGE_STYLE_PROMPT) {
                if (referenceImages.length === 0) {
                    throw new Error('Please upload at least one reference image to analyze its style.');
                }
                const refImageBase64s = referenceImages.map(img => img.base64);

                // Get AI-generated description
                const instructionForAI = 'Analyze the style from the provided image(s) and generate a detailed prompt describing it.';
                const aiGeneratedDescription = await enhancePrompt(instructionForAI, 'style-from-image', undefined, refImageBase64s);

                // Get the prefix
                const selectedRoom = ROOM_TYPE_OPTIONS.find(r => r.prompt === roomType);
                const roomName = selectedRoom?.prompt || 'interior space';
                const selectedBuilding = BUILDING_TYPE_OPTIONS.find(b => b.prompt === buildingType);
                const buildingName = selectedBuilding?.prompt || 'building';
                const designTypeText = designType === DesignType.Interior ? `the ${roomName}` : `the ${buildingName} exterior`;
                
                const prefixPrompt = `Professionally redesign ${designTypeText} in the main 'before' image to be in the style of the provided reference image(s). for texture and color palette.`;
                const finalInstruction = "The output must ONLY be the final photorealistic image.";

                // Combine them
                const finalEnhancedPrompt = `${prefixPrompt} The style is described as: ${aiGeneratedDescription}. ${finalInstruction}`;
                
                setEditablePrompt(finalEnhancedPrompt);

            } else {
                if (!editablePrompt.trim()) {
                    throw new Error('Please enter a prompt to enhance.');
                }
                const mode = designType === DesignType.Interior ? 'architecture-interior' : 'architecture-exterior';
                const enhanced = await enhancePrompt(editablePrompt, mode);
                setEditablePrompt(enhanced);
            }
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
        if (referenceImages.length > 0) {
            referenceImages.forEach(img => URL.revokeObjectURL(img.url));
        }
        if (assets.length > 0) {
            assets.forEach(asset => URL.revokeObjectURL(asset.url));
        }

        setDesignType(DesignType.Interior);
        setStyle(INTERIOR_STYLE_OPTIONS[0].prompt);
        setDecorPalette('none');
        setFurniturePalette('none');
        setExteriorPalette('none');
        setLightingScenario('none');
        setCustomStyleDetails(defaultCustomStyle);
        setMainImage(null);
        setReferenceImages([]);
        setAssets([]);
        setGeneratedImage(null);
        setVariationImages([]);
        setIsLoading(false);
        setError(null);
        setIsModalOpen(false);
        setOriginalPromptBeforeEnhance(null);
    };
    
    const handleDictationStart = () => {
        const currentPrompt = editablePrompt;
        if (currentPrompt.length > 0 && !/\s$/.test(currentPrompt)) {
            textBeforeDictation.current = currentPrompt + ' ';
        } else {
            textBeforeDictation.current = currentPrompt;
        }
    };

    const handleDictationUpdate = (transcript: string) => {
        setEditablePrompt(textBeforeDictation.current + transcript);
    };

    const handleDictationStop = async (finalTranscript: string) => {
        const rawAppendedPrompt = textBeforeDictation.current + finalTranscript;
        setEditablePrompt(rawAppendedPrompt);

        if (!finalTranscript.trim()) {
            return;
        }

        setIsCorrectingText(true);
        try {
            const correctedTranscript = await correctText(finalTranscript);
            
            setEditablePrompt(currentPrompt => {
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
    
    const handleAssetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const compressedFile = await resizeAndCompressImage(file, 512);
            const url = URL.createObjectURL(compressedFile);
            const base64 = await fileToBase64(compressedFile);
            const newAsset: Asset = {
                id: `${Date.now()}-${Math.random()}`,
                url,
                base64,
                description: '',
            };
            setAssets(prev => [...prev, newAsset]);
        } catch (e) {
            setError("Failed to process asset image.");
            console.error("Asset image processing error:", e);
        }
        if (event.target) event.target.value = '';
    };

    const handleAssetDescriptionChange = (id: string, description: string) => {
        setAssets(prev => prev.map(asset => asset.id === id ? { ...asset, description } : asset));
    };

    const handleRemoveAsset = (idToRemove: string) => {
        const assetToRemove = assets.find(a => a.id === idToRemove);
        if (assetToRemove) {
            URL.revokeObjectURL(assetToRemove.url);
        }
        setAssets(prev => prev.filter(a => a.id !== idToRemove));
    };

    const handleAssetEditorComplete = (sourceAssetId: string, newGeneratedAssets: GeneratedAsset[]) => {
        setAssets(prevAssets => {
            const updatedAssets = [...prevAssets];
    
            // 1. Update cache on source asset
            const sourceAssetIndex = updatedAssets.findIndex(a => a.id === sourceAssetId);
            if (sourceAssetIndex !== -1) {
                updatedAssets[sourceAssetIndex] = {
                    ...updatedAssets[sourceAssetIndex],
                    _generatedAssetsCache: newGeneratedAssets,
                };
            }
    
            // 2. Add new generated assets to the main list if they don't exist
            const existingAssetIds = new Set(prevAssets.map(a => a.id));
            const assetsToAdd: Asset[] = [];
    
            newGeneratedAssets.forEach(genAsset => {
                if (!existingAssetIds.has(genAsset.id)) {
                    assetsToAdd.push({
                        ...genAsset,
                        description: '', 
                    });
                }
            });
    
            return [...updatedAssets, ...assetsToAdd];
        });
    
        setEditingAsset(null);
    };

    const isClearAllActive = !!mainImage || !!generatedImage || referenceImages.length > 0 || assets.length > 0;

    const placeholderText = "أدخل وصفًا تفصيليًا للتصميم المطلوب...";

    const handleInpaintingComplete = async (newImageUrl: string) => {
        if (editingSource === 'before') {
            const newFile = await dataURLtoFile(newImageUrl, 'edited-original.png');
            if (newFile) {
                try {
                    const compressedFile = await resizeAndCompressImage(newFile);
                    if (mainImage) {
                        URL.revokeObjectURL(mainImage.url);
                    }
                    const url = URL.createObjectURL(compressedFile);
                    const base64 = await fileToBase64(compressedFile);
                    setMainImage({ file: compressedFile, url, base64 });
                    setError(null);
                } catch (e) {
                    setError("Failed to process the edited image.");
                    console.error("Edited image processing error:", e);
                }
            } else {
                setError("Failed to process edited image.");
            }
        } else if (editingSource === 'after') {
            setGeneratedImage(newImageUrl);
        }
        setImageToEdit(null);
        setEditingSource(null);
    };

    const handleUseAsSource = async () => {
        if (!generatedImage) return;
    
        try {
            const newSourceFile = await dataURLtoFile(generatedImage, 'generated_source.png');
            if (newSourceFile) {
                const compressedFile = await resizeAndCompressImage(newSourceFile);
                if (mainImage) {
                    URL.revokeObjectURL(mainImage.url);
                }
                const url = URL.createObjectURL(compressedFile);
                const base64 = await fileToBase64(compressedFile);
                setMainImage({ file: compressedFile, url, base64 });
                setGeneratedImage(null);
                setVariationImages([]);
                setError(null);
                notify("تم تعيين الصورة الجديدة كصورة أساسية.");
            } else {
                throw new Error("Could not convert image data.");
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to use image as source: ${errorMessage}`);
        }
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
                                <h3 className="text-lg font-bold text-light-text dark:text-dark-text">أسلوب التصميم</h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                    اختر نمط التصميم أو أضف أصولًا مخصصة.
                                </p>
                            </div>
                             <div className="flex items-center gap-3 flex-shrink-0">
                                {(styleTab === 'style') && <span className="text-sm font-semibold text-accent">{selectedStyleLabel}</span>}
                                {(styleTab === 'palette') && (
                                    <span className="text-sm font-semibold text-accent truncate max-w-xs">
                                        {designType === DesignType.Interior 
                                            ? `${selectedDecorPaletteLabel} / ${selectedFurniturePaletteLabel}`
                                            : selectedExteriorPaletteLabel
                                        }
                                    </span>
                                )}
                                <ChevronDownIcon className={`w-5 h-5 text-dark-text-secondary transition-transform duration-300 flex-shrink-0 ${isStyleGridOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                        <div 
                            id="style-grid-container"
                            className={`transition-all duration-500 ease-in-out overflow-hidden ${isStyleGridOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                            <div className="pt-3">
                                <div className="flex bg-dark-primary p-1 rounded-xl w-full mb-4">
                                    <button onClick={() => setStyleTab('style')} className={`w-1/4 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 ${styleTab === 'style' ? 'bg-accent text-white' : 'text-dark-text-secondary hover:bg-dark-border'}`}>
                                        <StyleIcon className="w-5 h-5" /> ستايل
                                    </button>
                                    <button onClick={() => setStyleTab('lighting')} className={`w-1/4 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 ${styleTab === 'lighting' ? 'bg-accent text-white' : 'text-dark-text-secondary hover:bg-dark-border'}`}>
                                        <SunIcon className="w-5 h-5" /> الإضاءة
                                    </button>
                                    <button onClick={() => setStyleTab('palette')} className={`w-1/4 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 ${styleTab === 'palette' ? 'bg-accent text-white' : 'text-dark-text-secondary hover:bg-dark-border'}`}>
                                        <PaletteIcon className="w-5 h-5" /> الألوان
                                    </button>
                                    <button onClick={() => setStyleTab('assets')} className={`w-1/4 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 ${styleTab === 'assets' ? 'bg-accent text-white' : 'text-dark-text-secondary hover:bg-dark-border'}`}>
                                        <ArchiveBoxIcon className="w-5 h-5" /> Assets
                                    </button>
                                </div>
                                <div hidden={styleTab !== 'style'}>
                                    <StyleGrid options={styleOptions} selectedValue={style} onSelect={handleStyleChange} />
                                    {style === FROM_IMAGE_STYLE_PROMPT && (
                                        <div className="animate-fade-in pt-4">
                                            <ReferenceImageUploader referenceImages={referenceImages.map(img => ({ id: img.id, url: img.url }))} onImageUpload={handleReferenceImageUpload} onImageRemove={handleReferenceImageRemove} isDisabled={isLoading || isEnhancing} />
                                        </div>
                                    )}
                                </div>
                                <div hidden={styleTab !== 'lighting'} className="animate-fade-in">
                                    <div className="flex bg-dark-primary p-1 rounded-xl w-full mb-4">
                                        <button onClick={() => setLightingSubTab('daytime')} className={`w-1/2 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 ${lightingSubTab === 'daytime' ? 'bg-accent text-white' : 'text-dark-text-secondary hover:bg-dark-border'}`}>
                                            <SunIcon className="w-5 h-5" /> نهاري
                                        </button>
                                        <button onClick={() => setLightingSubTab('nighttime')} className={`w-1/2 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 ${lightingSubTab === 'nighttime' ? 'bg-accent text-white' : 'text-dark-text-secondary hover:bg-dark-border'}`}>
                                            <MoonIcon className="w-5 h-5" /> ليلي
                                        </button>
                                    </div>
                                    <div hidden={lightingSubTab !== 'daytime'}>
                                        <StyleGrid options={DAYTIME_LIGHTING_OPTIONS} selectedValue={lightingScenario} onSelect={setLightingScenario} />
                                    </div>
                                    <div hidden={lightingSubTab !== 'nighttime'}>
                                        <StyleGrid options={NIGHTTIME_LIGHTING_OPTIONS} selectedValue={lightingScenario} onSelect={setLightingScenario} />
                                    </div>
                                </div>
                                <div hidden={styleTab !== 'palette'} className="animate-fade-in">
                                    {designType === DesignType.Interior ? (
                                        <div className="space-y-4">
                                            <div className="flex bg-dark-primary p-1 rounded-xl w-full">
                                                <button
                                                    onClick={() => setInteriorPaletteMode('decor')}
                                                    className={`w-1/2 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 ${
                                                        interiorPaletteMode === 'decor' 
                                                        ? 'bg-accent text-white' 
                                                        : 'text-dark-text-secondary hover:bg-dark-border'
                                                    }`}
                                                >
                                                    للديكورات
                                                </button>
                                                <button
                                                    onClick={() => setInteriorPaletteMode('furniture')}
                                                    className={`w-1/2 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 ${
                                                        interiorPaletteMode === 'furniture' 
                                                        ? 'bg-accent text-white' 
                                                        : 'text-dark-text-secondary hover:bg-dark-border'
                                                    }`}
                                                >
                                                    للأثاث
                                                </button>
                                            </div>

                                            <div className={`${interiorPaletteMode === 'decor' ? 'block' : 'hidden'}`}>
                                                <p className="text-sm text-dark-text-secondary mb-3 text-center">
                                                    تطبق الألوان على الجدران والديكورات مثل بديل الخشب وبديل الشيبورد.
                                                </p>
                                                <PaletteSelector
                                                    options={DECOR_PALETTE_OPTIONS}
                                                    selectedValue={decorPalette}
                                                    onSelect={setDecorPalette}
                                                />
                                            </div>

                                            <div className={`${interiorPaletteMode === 'furniture' ? 'block' : 'hidden'}`}>
                                                <p className="text-sm text-dark-text-secondary mb-3 text-center">
                                                    تطبق الألوان على الأريكة، السجاد، الوسائد، الستائر، وغيرها.
                                                </p>
                                                <PaletteSelector
                                                    options={FURNITURE_PALETTE_OPTIONS}
                                                    selectedValue={furniturePalette}
                                                    onSelect={setFurniturePalette}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <PaletteSelector
                                            options={EXTERIOR_PALETTE_OPTIONS}
                                            selectedValue={exteriorPalette}
                                            onSelect={setExteriorPalette}
                                        />
                                    )}
                                </div>
                                <div hidden={styleTab !== 'assets'} className="animate-fade-in">
                                    <input type="file" ref={assetFileInputRef} onChange={handleAssetUpload} accept="image/*" className="hidden" />
                                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                                        {assets.map(asset => (
                                            <div key={asset.id} className="space-y-2">
                                                <div className="group relative aspect-square w-full">
                                                    <img src={asset.url} alt="Asset" className="w-full h-full object-cover rounded-lg" />
                                                    <button 
                                                        onClick={() => setEditingAsset(asset)} 
                                                        title="Edit asset"
                                                        aria-label="Edit asset"
                                                        className="absolute top-1 right-1 p-1.5 bg-black/60 text-white rounded-full hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRemoveAsset(asset.id)} 
                                                        title="Remove asset"
                                                        aria-label="Remove asset"
                                                        className="absolute top-1 left-1 p-1.5 bg-black/60 text-white rounded-full hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <textarea 
                                                        value={asset.description}
                                                        onChange={(e) => handleAssetDescriptionChange(asset.id, e.target.value)}
                                                        rows={2}
                                                        placeholder="وصف..."
                                                        className="w-full text-xs bg-dark-primary border border-dark-border rounded-md p-1 resize-none focus:ring-1 focus:ring-accent focus:border-accent"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => assetFileInputRef.current?.click()} className="aspect-square flex flex-col items-center justify-center bg-dark-primary rounded-lg border-2 border-dashed border-dark-border hover:border-accent text-dark-text-secondary hover:text-accent transition-colors">
                                            <PlusIcon className="w-8 h-8" />
                                            <span className="text-xs mt-1">Add Asset</span>
                                        </button>
                                    </div>
                                </div>
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
                                {isCorrectingText && (
                                    <div className="p-2" title="جاري تصحيح الإملاء...">
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
                                    disabled={isLoading || isEnhancing || isCorrectingText}
                                />
                                {originalPromptBeforeEnhance !== null && (
                                    <button
                                        onClick={handleRevertPrompt}
                                        disabled={isLoading || isEnhancing || isCorrectingText}
                                        className="bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 disabled:bg-gray-700/50 disabled:text-gray-500 disabled:cursor-not-allowed font-semibold p-2 rounded-lg flex items-center justify-center transition-colors duration-200 text-sm animate-fade-in"
                                        title="العودة إلى النص الأصلي"
                                    >
                                        <ArrowPathIcon className="w-5 h-5" />
                                    </button>
                                )}
                                <button
                                    onClick={handleEnhancePrompt}
                                    disabled={isLoading || isEnhancing || isCorrectingText}
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
                                disabled={isLoading || !mainImage || isEnhancing || isCorrectingText}
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
                                onClick={handleGenerateVariations}
                                disabled={!generatedImage || isLoading || isGeneratingVariations}
                                className="flex-shrink-0 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:bg-gray-700/50 disabled:text-gray-500 disabled:cursor-not-allowed font-semibold p-3 rounded-lg flex items-center justify-center transition-colors duration-200"
                                title="إنشاء تنويعات"
                            >
                                {isGeneratingVariations ? (
                                    <svg className="animate-spin h-6 w-6 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <DocumentDuplicateIcon className="w-6 h-6" />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:items-start">
                    <ImageUploader 
                        onImageUpload={handleMainImageUpload}
                        beforeImage={mainImage?.url || null}
                        onImageClick={() => mainImage && setViewingImage({ url: mainImage.url, isEditable: true })}
                    />
                    <div className="space-y-6">
                        <ResultDisplay 
                            afterImage={generatedImage}
                            isLoading={isLoading}
                            onImageClick={() => generatedImage && mainImage && setIsComparing(true)}
                            onUseAsSource={handleUseAsSource}
                        />
                        {(isGeneratingVariations || variationImages.length > 0) && (
                            <VariationsDisplay
                                images={variationImages}
                                onSelectVariation={setGeneratedImage}
                                isLoading={isGeneratingVariations}
                                loadingCount={3}
                            />
                        )}
                    </div>
                </div>
            </div>
            
            <CustomStyleModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveCustomStyle}
                initialValue={customStyleDetails}
                designType={designType}
            />
            
             {editingAsset && (
                <AssetEditorModal
                    asset={editingAsset}
                    onClose={() => setEditingAsset(null)}
                    onComplete={handleAssetEditorComplete}
                />
            )}

            <ImageZoomModal 
                imageUrl={viewingImage?.url || null}
                onClose={() => setViewingImage(null)}
                showAdvancedEditorButton={viewingImage?.isEditable}
                onGoToAdvancedEditor={() => {
                    if (viewingImage?.isEditable) {
                        setEditingSource('before');
                        setImageToEdit(viewingImage.url);
                        setViewingImage(null);
                    }
                }}
            />

            {isComparing && generatedImage && mainImage && (
                <ImageComparisonModal
                    beforeImageUrl={mainImage.url}
                    afterImageUrl={generatedImage}
                    onClose={() => setIsComparing(false)}
                    onEdit={(imageUrl) => {
                        setEditingSource('after');
                        setImageToEdit(imageUrl);
                        setIsComparing(false);
                    }}
                />
            )}
        </React.Fragment>
    );
}

export default ArchitectureView;