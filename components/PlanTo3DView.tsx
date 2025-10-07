import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import ImageUploader from './ImageUploader';
import ResultDisplay from './ResultDisplay';
import ImageZoomModal from './ImageZoomModal';
import ImageComparisonModal from './ImageComparisonModal';
import DictationButton from './DictationButton';
import InpaintingView from './InpaintingView';
import VariationsDisplay from './VariationsDisplay';
import { WandSparklesIcon } from './icons/WandSparklesIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { generateDesign, generateDesignVariations, enhancePrompt, correctText } from '../services/geminiService';
import { DEFAULT_AI_MODEL, INTERIOR_STYLE_OPTIONS, CUSTOM_STYLE_PROMPT, FROM_IMAGE_STYLE_PROMPT } from '../constants';
import { BuildingIcon } from './icons/BuildingIcon';
import { CityIcon } from './icons/CityIcon';
import { PerspectiveViewIcon } from './icons/PerspectiveViewIcon';
import { TopDownViewIcon } from './icons/TopDownViewIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { FacadesIcon } from './icons/FacadesIcon';
import { Section3DIcon } from './icons/Section3DIcon';
import { HorizontalSectionIcon } from './icons/HorizontalSectionIcon';
import { VerticalSectionIcon } from './icons/VerticalSectionIcon';
import { fileToBase64, resizeAndCompressImage, dataURLtoFile } from '../utils/imageHelpers';
import { ImageIcon } from './icons/ImageIcon';
import ReferenceImageUploader from './ReferenceImageUploader';
import { notify } from '../utils/notification';
import { PlanMode, CustomStyleDetails, DesignType } from '../types';
import PlanModeSwitcher from './PlanModeSwitcher';
import StyleGrid from './StyleGrid';
import CustomStyleModal from './CustomStyleModal';
import { HomeIcon } from './icons/HomeIcon';


pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/build/pdf.worker.min.mjs`;

interface Option {
    label: string;
    value: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const defaultCustomStyle: CustomStyleDetails = {
    colors: '',
    features: '',
    lighting: '',
    mood: '',
    textures: '',
};

const PLAN_TYPE_OPTIONS: Option[] = [
    { label: 'غرفة', value: 'room', icon: HomeIcon },
    { label: 'مبنى', value: 'building', icon: BuildingIcon },
    { label: 'مدينة', value: 'city', icon: CityIcon },
];

const BUILDING_OUTPUT_TYPE_OPTIONS: Option[] = [
    { label: 'منظور ثلاثي الأبعاد', value: '3d-view', icon: PerspectiveViewIcon },
    { label: 'مقطع منظور ثلاثي الأبعاد', value: '3d-section', icon: Section3DIcon },
    { label: 'عرض علوي', value: 'top-view', icon: TopDownViewIcon },
    { label: 'واجهات', value: 'elevation', icon: FacadesIcon },
    { label: 'مقطع أفقي', value: 'horizontal-section', icon: HorizontalSectionIcon },
    { label: 'مقطع رأسي', value: 'vertical-section', icon: VerticalSectionIcon },
    { label: 'من صورة', value: 'from-image', icon: ImageIcon },
];

const ROOM_OUTPUT_TYPE_OPTIONS: Option[] = [
    ...BUILDING_OUTPUT_TYPE_OPTIONS.filter(
        opt => opt.value !== 'elevation' && opt.value !== 'from-image'
    ),
    { label: 'منظور مقطوع (Isometric)', value: 'isometric-view', icon: Section3DIcon },
];

const CITY_OUTPUT_TYPE_OPTIONS: Option[] = [
    { label: 'عين الصقر', value: 'perspective', icon: PerspectiveViewIcon },
    { label: 'توب فيو', value: 'top-down', icon: TopDownViewIcon },
    { label: 'من صورة', value: 'from-image', icon: ImageIcon },
];

const SCENE_TYPE_OPTIONS: Option[] = [
    { label: 'نهاري', value: 'daytime', icon: SunIcon },
    { label: 'ليلي', value: 'nighttime', icon: MoonIcon },
];

interface OptionGridProps {
    options: Option[];
    selectedValue: string;
    onSelect: (value: string) => void;
}

const OptionGrid: React.FC<OptionGridProps> = ({ options, selectedValue, onSelect }) => {
    return (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {options.map((option) => {
                const isSelected = selectedValue === option.value;
                const Icon = option.icon;
                const cardClasses = `
                    group aspect-square w-full bg-light-primary dark:bg-dark-primary rounded-xl 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-secondary focus:ring-accent
                    transition-all duration-200 transform hover:scale-105
                    ${isSelected ? 'ring-2 ring-accent' : 'ring-1 ring-light-border dark:ring-dark-border'}
                `;

                return (
                    <button 
                        key={option.value} 
                        onClick={() => onSelect(option.value)} 
                        className={cardClasses}
                        title={option.label}
                    >
                        <div className="flex flex-col h-full p-2 md:p-3 text-center items-center justify-center gap-1">
                            <Icon className={`w-7 h-7 md:w-8 md:h-8 transition-colors duration-200 ${isSelected ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text'}`} />
                            <span className={`block text-xs md:text-sm font-semibold leading-tight w-full ${isSelected ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text'}`}>
                                {option.label}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

const RoomOutputToggle: React.FC<{
    options: Option[];
    selectedValues: string[];
    onToggle: (value: string) => void;
}> = ({ options, selectedValues, onToggle }) => (
    <div className="flex flex-wrap gap-2">
        {options.map(option => {
            const isSelected = selectedValues.includes(option.value);
            const Icon = option.icon;
            return (
                <button
                    key={option.value}
                    onClick={() => onToggle(option.value)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                        isSelected
                            ? 'bg-accent text-white'
                            : 'bg-dark-primary text-dark-text-secondary hover:bg-dark-border'
                    }`}
                >
                    <Icon className="w-5 h-5" />
                    <span>{option.label}</span>
                </button>
            );
        })}
    </div>
);


function PlanToView() {
    const [planImage, setPlanImage] = useState<{ file: File; url: string; base64: { data: string; mimeType: string } } | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [variationImages, setVariationImages] = useState<string[]>([]);
    const [editablePrompt, setEditablePrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
    const [isCorrectingText, setIsCorrectingText] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewingImage, setViewingImage] = useState<{ url: string; isEditable: boolean } | null>(null);
    const [imageToEdit, setImageToEdit] = useState<string | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const textBeforeDictation = useRef('');

    const [planMode, setPlanMode] = useState<PlanMode>(PlanMode.PlanTo3D);
    const [planType, setPlanType] = useState('room');
    const [outputType, setOutputType] = useState(BUILDING_OUTPUT_TYPE_OPTIONS[0].value);
    const [sceneType, setSceneType] = useState('daytime');
    const [referenceImages, setReferenceImages] = useState<Array<{ id: string; file: File; url: string; base64: { data: string; mimeType: string } }>>([]);
    
    // State for 'room' mode
    const [roomOutputTypes, setRoomOutputTypes] = useState<string[]>([ROOM_OUTPUT_TYPE_OPTIONS[0].value]);
    const [roomStyle, setRoomStyle] = useState<string>(INTERIOR_STYLE_OPTIONS[0].prompt);
    const [isCustomStyleModalOpen, setIsCustomStyleModalOpen] = useState(false);
    const [customStyleDetails, setCustomStyleDetails] = useState<CustomStyleDetails>(defaultCustomStyle);

    // State for collapsible sections
    const [isPlanTypeOpen, setIsPlanTypeOpen] = useState(true);
    const [isOutputTypeOpen, setIsOutputTypeOpen] = useState(true);
    const [isStyleSectionOpen, setIsStyleSectionOpen] = useState(true);
    const [isSceneTypeOpen, setIsSceneTypeOpen] = useState(true);
    const [editingSource, setEditingSource] = useState<'before' | 'after' | null>(null);

    useEffect(() => {
        if (planType === 'building') {
            const isValid = BUILDING_OUTPUT_TYPE_OPTIONS.some(opt => opt.value === outputType);
            if (!isValid) {
                setOutputType(BUILDING_OUTPUT_TYPE_OPTIONS[0].value);
            }
        } else if (planType === 'city') {
            const isValid = CITY_OUTPUT_TYPE_OPTIONS.some(opt => opt.value === outputType);
            if (!isValid) {
                setOutputType(CITY_OUTPUT_TYPE_OPTIONS[0].value);
            }
        }
    }, [planType, outputType]);

    const outputTypeOptions = useMemo(() => {
        return planType === 'building' ? BUILDING_OUTPUT_TYPE_OPTIONS : CITY_OUTPUT_TYPE_OPTIONS;
    }, [planType]);

    const selectedPlanTypeLabel = useMemo(() => PLAN_TYPE_OPTIONS.find(opt => opt.value === planType)?.label, [planType]);
    const selectedOutputTypeLabel = useMemo(() => outputTypeOptions.find(opt => opt.value === outputType)?.label, [outputType, outputTypeOptions]);
    const selectedSceneTypeLabel = useMemo(() => SCENE_TYPE_OPTIONS.find(opt => opt.value === sceneType)?.label, [sceneType]);
    const selectedRoomStyleLabel = useMemo(() => INTERIOR_STYLE_OPTIONS.find(opt => opt.prompt === roomStyle)?.label, [roomStyle]);


    const outputTypeDescription = useMemo(() => {
        if (planType === 'room') return 'اختر عرضًا واحدًا أو أكثر ليتم إنشاؤه من مخطط غرفتك.';
        return planType === 'building'
            ? 'اختر بين عرض مقطع ثلاثي الأبعاد أو واجهات المبنى.'
            : 'حدد ما إذا كنت تريد عرضًا جويًا أو مخططًا علويًا للمدينة.';
    }, [planType]);
    
    const generatedPrompt = useMemo(() => {
        const sourceType = planMode === PlanMode.SketchTo3D ? 'sketch' : 'plan';
    
        // Main objective and scene description
        let prompt = `Create a photorealistic 3D render from the provided 2D ${sourceType}. `;
        prompt += `This is a ${planType}. Use ${sceneType} lighting. `;
    
        // View and Style
        if (planType === 'room') {
            const viewLabels = roomOutputTypes
                .map(val => ROOM_OUTPUT_TYPE_OPTIONS.find(opt => opt.value === val)?.label)
                .filter(Boolean)
                .join(', ');
            prompt += `Generate the following view(s): ${viewLabels}. `;
    
            if (roomStyle === CUSTOM_STYLE_PROMPT) {
                const customParts = [
                    customStyleDetails.colors && `Color Palette: ${customStyleDetails.colors}`,
                    customStyleDetails.features && `Furniture/Decor: ${customStyleDetails.features}`,
                    customStyleDetails.textures && `Materials/Textures: ${customStyleDetails.textures}`,
                    customStyleDetails.mood && `Mood: ${customStyleDetails.mood}`,
                ].filter(Boolean);
                if (customParts.length > 0) {
                     prompt += `Furnish with a custom style: ${customParts.join('; ')}. `;
                }
            } else if (roomStyle === FROM_IMAGE_STYLE_PROMPT) {
                prompt += 'The interior design style must match the provided reference image. ';
            } else {
                const selectedStyle = INTERIOR_STYLE_OPTIONS.find(s => s.prompt === roomStyle);
                if (selectedStyle) {
                    // "in a modern style" -> "modern"
                    const styleName = selectedStyle.prompt.replace('in a ', '').replace(' style', '');
                    prompt += `Furnish in a ${styleName} style. `;
                }
            }
        } else { // Building or City
            const selectedOutput = outputTypeOptions.find(opt => opt.value === outputType);
            if (selectedOutput) {
                 prompt += `The requested view is a ${selectedOutput.label}. `;
            }
            if (outputType === 'from-image') {
                prompt += 'The architectural style must match the provided reference image. ';
            }
        }
    
        // Add quality keywords
        prompt += 'The final image should be hyperrealistic, highly detailed, 8K, like an Unreal Engine render. ';
    
        // Add critical instructions
        prompt += `**CRITICAL, NON-NEGOTIABLE RULES:** Your output MUST be a millimeter-precise 3D replica of the provided 2D ${sourceType}. Adherence is mandatory. 1. **UNIFIED SPACE (HIGHEST PRIORITY):** You MUST treat the entire 2D plan as a single, interconnected architectural unit. It is strictly forbidden to separate rooms or render them as isolated, disconnected boxes. All rooms connected in the plan must be rendered as connected. 2. **STRUCTURAL ACCURACY:** Replicate the exact layout, angles, and thickness of ALL walls. This includes curved or angled walls. Do not simplify or alter the building's footprint. This is your primary task. 3. **ELEMENT REPLICATION:** Replicate the exact quantity, placement, and size of ALL architectural elements shown in the plan, especially windows and doors. If the plan has two windows on a wall, you must render exactly two windows in those precise locations. 4. **FIXTURE ACCURACY:** Replicate the exact type, quantity, and placement of all sanitary fixtures (toilets, sinks, showers) as shown by their symbols. Do not add fixtures that are not present (e.g., do not add a bathtub if only a shower is shown). 5. **FURNISHING (SECONDARY TASK):** ONLY AFTER the structure is perfectly replicated, furnish the space according to its function as identified by text labels (e.g., 'غرفة نوم ماستر') and the user's selected style. A 'Master Bedroom' must be fully furnished. A 'Bathroom' must contain its specified fixtures. Do not leave labeled rooms empty. 6. **CONTEXT, NOT COMMANDS:** Read text labels ('Bedroom', 'حمام') for room function context ONLY. You MUST IGNORE all numerical dimensions and construction lines. 7. **NO INVENTION:** You are strictly forbidden from inventing or adding any structural elements (walls, windows, doors, columns) not explicitly drawn in the plan. 8. **FINAL OUTPUT:** The output must be ONLY the photorealistic image. No text.`;
    
        return prompt;
    
    }, [planMode, planType, roomOutputTypes, outputType, sceneType, roomStyle, customStyleDetails, outputTypeOptions]);


    useEffect(() => {
        setEditablePrompt(generatedPrompt);
    }, [generatedPrompt]);


    const handleFileUpload = async (file: File) => {
        setError(null);
        setGeneratedImage(null);
        setVariationImages([]);
        if (planImage) {
            URL.revokeObjectURL(planImage.url);
        }

        try {
            let imageFile = file;
            if (file.type === 'application/pdf') {
                const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const context = canvas.getContext('2d');
                if (!context) throw new Error("Could not get canvas context for PDF rendering.");

                await page.render({ canvasContext: context, viewport: viewport, canvas: canvas } as any).promise;

                const dataUrl = canvas.toDataURL('image/png');
                const blob = await (await fetch(dataUrl)).blob();
                imageFile = new File([blob], 'plan.png', { type: 'image/png' });
            }
            
            const compressedFile = await resizeAndCompressImage(imageFile);
            const url = URL.createObjectURL(compressedFile);
            const base64 = await fileToBase64(compressedFile);
            setPlanImage({ file: compressedFile, url, base64 });

        } catch (e) {
            console.error("File processing error:", e);
            const errorMessage = e instanceof Error ? e.message : "Please provide a valid file.";
            setError(`Failed to process file. ${errorMessage}`);
        }
    };

    const handleClearAll = () => {
        if (planImage) URL.revokeObjectURL(planImage.url);
        if (referenceImages.length > 0) {
            referenceImages.forEach(img => URL.revokeObjectURL(img.url));
        }
        setReferenceImages([]);
        setPlanImage(null);
        setEditablePrompt('');
        setGeneratedImage(null);
        setVariationImages([]);
        setIsLoading(false);
        setError(null);
        setPlanType('room');
        setOutputType('3d-view');
        setSceneType('daytime');
        setRoomStyle(INTERIOR_STYLE_OPTIONS[0].prompt);
        setRoomOutputTypes([ROOM_OUTPUT_TYPE_OPTIONS[0].value]);
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
    
    const handleRoomOutputTypeToggle = (value: string) => {
        setRoomOutputTypes(prev => {
            if (prev.includes(value)) {
                if (prev.length === 1) return prev; // Must have at least one selected
                return prev.filter(v => v !== value);
            } else {
                return [...prev, value];
            }
        });
    };
    
    const handleRoomStyleChange = (newStyle: string) => {
        if (newStyle === CUSTOM_STYLE_PROMPT) {
            setIsCustomStyleModalOpen(true);
        } else {
            setRoomStyle(newStyle);
        }
    };

    const handleSaveCustomStyle = (details: CustomStyleDetails) => {
        setCustomStyleDetails(details);
        setRoomStyle(CUSTOM_STYLE_PROMPT);
        setIsCustomStyleModalOpen(false);
    };

    const handleSubmit = async () => {
        if (!planImage) {
            setError('Please upload a plan file first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setVariationImages([]);

        try {
            const isFromImage = (planType === 'room' && roomStyle === FROM_IMAGE_STYLE_PROMPT) || (planType !== 'room' && outputType === 'from-image');
            const refImageBase64s = isFromImage ? referenceImages.map(img => img.base64) : null;
            
            if (isFromImage && (!refImageBase64s || refImageBase64s.length === 0)) {
                setError('Please upload a reference image when using "From image" style.');
                setIsLoading(false);
                return;
            }
            const resultBase64 = await generateDesign(editablePrompt, planImage.base64, refImageBase64s, DEFAULT_AI_MODEL);
            setGeneratedImage(`data:image/png;base64,${resultBase64}`);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`There was an unexpected error during generation. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateVariations = async () => {
        if (!planImage || !editablePrompt) {
            setError('Cannot generate variations without a plan and prompt.');
            return;
        }

        setIsGeneratingVariations(true);
        setVariationImages([]);
        setError(null);

        try {
            const isFromImage = (planType === 'room' && roomStyle === FROM_IMAGE_STYLE_PROMPT) || (planType !== 'room' && outputType === 'from-image');
            const refImageBase64s = isFromImage ? referenceImages.map(img => img.base64) : null;

            const resultsBase64 = await generateDesignVariations(editablePrompt, planImage.base64, refImageBase64s, DEFAULT_AI_MODEL, 3);
            const variationUrls = resultsBase64.map(base64 => `data:image/png;base64,${base64}`);
            setVariationImages(variationUrls);

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate variations. ${errorMessage}`);
        } finally {
            setIsGeneratingVariations(false);
        }
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

        if (!finalTranscript.trim()) return;

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

    const isClearAllActive = !!planImage || !!generatedImage || referenceImages.length > 0;

    const handleInpaintingComplete = async (newImageUrl: string) => {
        if (editingSource === 'before') {
            const newFile = await dataURLtoFile(newImageUrl, 'edited-plan.png');
            if (newFile) {
                try {
                    const compressedFile = await resizeAndCompressImage(newFile);
                    if (planImage) URL.revokeObjectURL(planImage.url);
                    const url = URL.createObjectURL(compressedFile);
                    const base64 = await fileToBase64(compressedFile);
                    setPlanImage({ file: compressedFile, url, base64 });
                    setError(null);
                } catch (e) {
                    setError("Failed to process the edited image.");
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
                    <PlanModeSwitcher selected={planMode} onSelect={setPlanMode} />
                    
                    <div>
                        <button 
                            onClick={() => setIsPlanTypeOpen(!isPlanTypeOpen)}
                            className="w-full flex justify-between items-center py-2 text-right"
                            aria-expanded={isPlanTypeOpen}
                        >
                            <div className="flex-grow">
                                <h3 className="text-lg font-bold text-light-text dark:text-dark-text">اختر نوع المخطط</h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">حدد ما إذا كان المخطط لغرفة، مبنى، أو مدينة.</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-sm font-semibold text-accent">{selectedPlanTypeLabel}</span>
                                <ChevronDownIcon className={`w-5 h-5 text-dark-text-secondary transition-transform duration-300 ${isPlanTypeOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isPlanTypeOpen ? 'max-h-96' : 'max-h-0'}`}>
                            <div className="pt-3">
                                <OptionGrid options={PLAN_TYPE_OPTIONS} selectedValue={planType} onSelect={(val) => { setPlanType(val); setIsOutputTypeOpen(true); setIsStyleSectionOpen(true); }} />
                            </div>
                        </div>
                    </div>

                    {planType === 'room' ? (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <button onClick={() => setIsOutputTypeOpen(!isOutputTypeOpen)} className="w-full flex justify-between items-center py-2 text-right">
                                    <div className="flex-grow">
                                        <h3 className="text-lg font-bold text-dark-text">اختر العروض المطلوبة</h3>
                                        <p className="text-sm text-dark-text-secondary">{outputTypeDescription}</p>
                                    </div>
                                    <ChevronDownIcon className={`w-5 h-5 text-dark-text-secondary transition-transform duration-300 ${isOutputTypeOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOutputTypeOpen ? 'max-h-96' : 'max-h-0'}`}>
                                    <div className="pt-3">
                                        <RoomOutputToggle options={ROOM_OUTPUT_TYPE_OPTIONS} selectedValues={roomOutputTypes} onToggle={handleRoomOutputTypeToggle} />
                                    </div>
                                </div>
                            </div>
                             <div>
                                <button onClick={() => setIsStyleSectionOpen(!isStyleSectionOpen)} className="w-full flex justify-between items-center py-2 text-right">
                                     <div className="flex-grow">
                                        <h3 className="text-lg font-bold text-dark-text">اختر اسلوب التصميم</h3>
                                        <p className="text-sm text-dark-text-secondary">اختر النمط المطلوب لتصميم غرفتك.</p>
                                    </div>
                                     <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-sm font-semibold text-accent">{selectedRoomStyleLabel}</span>
                                        <ChevronDownIcon className={`w-5 h-5 text-dark-text-secondary transition-transform duration-300 ${isStyleSectionOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isStyleSectionOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
                                    <div className="pt-3">
                                        <StyleGrid options={INTERIOR_STYLE_OPTIONS} selectedValue={roomStyle} onSelect={handleRoomStyleChange} />
                                    </div>
                                    {roomStyle === FROM_IMAGE_STYLE_PROMPT && (
                                        <div className="animate-fade-in pt-4">
                                            <ReferenceImageUploader referenceImages={referenceImages.map(img => ({ id: img.id, url: img.url }))} onImageUpload={handleReferenceImageUpload} onImageRemove={handleReferenceImageRemove} isDisabled={isLoading} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <button onClick={() => setIsOutputTypeOpen(!isOutputTypeOpen)} className="w-full flex justify-between items-center py-2 text-right">
                                <div className="flex-grow">
                                    <h3 className="text-lg font-bold text-dark-text">اختر نوع الإخراج</h3>
                                    <p className="text-sm text-dark-text-secondary">{outputTypeDescription}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-sm font-semibold text-accent">{selectedOutputTypeLabel}</span>
                                    <ChevronDownIcon className={`w-5 h-5 text-dark-text-secondary transition-transform duration-300 ${isOutputTypeOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOutputTypeOpen ? 'max-h-96' : 'max-h-0'}`}>
                                <div className="pt-3">
                                    <OptionGrid options={outputTypeOptions} selectedValue={outputType} onSelect={setOutputType} />
                                </div>
                            </div>
                             {outputType === 'from-image' && (
                                <div className="animate-fade-in pt-4">
                                    <ReferenceImageUploader referenceImages={referenceImages.map(img => ({ id: img.id, url: img.url }))} onImageUpload={handleReferenceImageUpload} onImageRemove={handleReferenceImageRemove} isDisabled={isLoading} />
                                </div>
                            )}
                        </div>
                    )}
                    
                     <div>
                        <button 
                            onClick={() => setIsSceneTypeOpen(!isSceneTypeOpen)}
                            className="w-full flex justify-between items-center py-2 text-right"
                            aria-expanded={isSceneTypeOpen}
                        >
                            <div className="flex-grow">
                                <h3 className="text-lg font-bold text-light-text dark:text-dark-text">اختر نوع المشهد</h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">اختر نمط الإضاءة الذي تريده للنموذج ثلاثي الأبعاد.</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-sm font-semibold text-accent">{selectedSceneTypeLabel}</span>
                                <ChevronDownIcon className={`w-5 h-5 text-dark-text-secondary transition-transform duration-300 ${isSceneTypeOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isSceneTypeOpen ? 'max-h-96' : 'max-h-0'}`}>
                            <div className="pt-3">
                                <OptionGrid options={SCENE_TYPE_OPTIONS} selectedValue={sceneType} onSelect={setSceneType} />
                            </div>
                        </div>
                    </div>


                    <div>
                        <label htmlFor="edit-prompt" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                             موجه الذكاء الاصطناعي (قابل للتعديل)
                        </label>
                        <div className="bg-light-primary dark:bg-dark-primary border-2 border-light-border dark:border-dark-border rounded-lg focus-within:ring-2 focus-within:ring-accent focus-within:border-accent flex flex-col transition-all duration-200">
                           <div className="p-3 pb-1 relative">
                                <textarea
                                    id="edit-prompt"
                                    value={editablePrompt}
                                    onChange={(e) => setEditablePrompt(e.target.value)}
                                    className="w-full h-40 bg-transparent text-light-text dark:text-dark-text focus:outline-none resize-none placeholder:text-dark-text-secondary"
                                />
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
                                    disabled={isLoading || isCorrectingText}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                         <button
                            onClick={handleSubmit}
                            disabled={isLoading || !planImage || isCorrectingText}
                            className="flex-grow bg-accent hover:bg-accent-hover disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105"
                        >
                          {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    جاري الإنشاء...
                                </>
                            ) : (
                                <>
                                    <WandSparklesIcon className="w-5 h-5 mr-2" />
                                    إنشاء عرض
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:items-start">
                    <ImageUploader 
                        onImageUpload={handleFileUpload}
                        beforeImage={planImage?.url || null}
                        onImageClick={() => planImage && setViewingImage({ url: planImage.url, isEditable: true })}
                        accept="image/png, image/jpeg, image/webp, application/pdf"
                        uploadText={planMode === PlanMode.SketchTo3D ? "اسحب وأفلت رسمًا هنا" : "اسحب وأفلت مخططًا هنا"}
                        uploadSubText={planMode === PlanMode.SketchTo3D ? "أو انقر للاختيار (PNG, JPG)" : "أو انقر للاختيار (PDF, PNG, JPG)"}
                    />
                    <div className="space-y-6">
                        <ResultDisplay 
                            afterImage={generatedImage}
                            isLoading={isLoading}
                            onImageClick={() => generatedImage && planImage && setIsComparing(true)}
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
             {planType === 'room' && (
                <CustomStyleModal
                    isOpen={isCustomStyleModalOpen}
                    onClose={() => setIsCustomStyleModalOpen(false)}
                    onSave={handleSaveCustomStyle}
                    initialValue={customStyleDetails}
                    designType={DesignType.Interior}
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
            {isComparing && generatedImage && planImage && (
                <ImageComparisonModal
                    beforeImageUrl={planImage.url}
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

export default PlanToView;