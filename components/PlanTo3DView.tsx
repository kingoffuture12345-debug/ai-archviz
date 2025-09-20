import React, { useState, useMemo, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import ImageUploader from './ImageUploader';
import ResultDisplay from './ResultDisplay';
import ImageZoomModal from './ImageZoomModal';
import DictationButton from './DictationButton';
import { WandSparklesIcon } from './icons/WandSparklesIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { generateDesign, enhancePrompt } from '../services/geminiService';
import { DEFAULT_AI_MODEL } from '../constants';
import { BuildingIcon } from './icons/BuildingIcon';
import { CityIcon } from './icons/CityIcon';
import { PerspectiveViewIcon } from './icons/PerspectiveViewIcon';
import { TopDownViewIcon } from './icons/TopDownViewIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { FacadesIcon } from './icons/FacadesIcon';
import { Section3DIcon } from './icons/Section3DIcon';


pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/build/pdf.worker.min.mjs`;

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
                    0.85 
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

interface Option {
    label: string;
    value: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const PLAN_TYPE_OPTIONS: Option[] = [
    { label: 'مبنى', value: 'building', icon: BuildingIcon },
    { label: 'مدينة', value: 'city', icon: CityIcon },
];

const CITY_OUTPUT_TYPE_OPTIONS: Option[] = [
    { label: 'عين الصقر', value: 'perspective', icon: PerspectiveViewIcon },
    { label: 'توب فيو', value: 'top-down', icon: TopDownViewIcon },
];

const BUILDING_OUTPUT_TYPE_OPTIONS: Option[] = [
    { label: 'مقطع ثلاثي الأبعاد', value: '3d-section', icon: Section3DIcon },
    { label: 'واجهات', value: 'facades', icon: FacadesIcon },
];

const SCENE_TYPE_OPTIONS: Option[] = [
    { label: 'نهاري', value: 'daytime', icon: SunIcon },
    { label: 'ليلي', value: 'nighttime', icon: MoonIcon },
];

interface OptionGridProps {
    options: Option[];
    selectedValue: string;
    onSelect: (value: string) => void;
    columns?: number;
}

const OptionGrid: React.FC<OptionGridProps> = ({ options, selectedValue, onSelect, columns = 2 }) => {
    const gridColsClass = `grid-cols-${columns}`;
    
    return (
        <div className="max-w-48 mx-auto">
            <div className={`grid ${gridColsClass} gap-3`}>
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
                            <div className="flex flex-col h-full p-2 text-center items-center justify-center">
                                <div className="flex-grow flex items-center justify-center">
                                    <Icon className={`w-7 h-7 transition-colors duration-200 ${isSelected ? 'text-accent' : 'text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text'}`} />
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


function PlanToView() {
    const [planImage, setPlanImage] = useState<{ file: File; url: string; base64: { data: string; mimeType: string } } | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [editablePrompt, setEditablePrompt] = useState('');
    const [originalPromptBeforeEnhance, setOriginalPromptBeforeEnhance] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [textBeforeDictation, setTextBeforeDictation] = useState('');

    const [planType, setPlanType] = useState('building');
    const [outputType, setOutputType] = useState('3d-section');
    const [sceneType, setSceneType] = useState('daytime');

    const [isPlanTypeOpen, setIsPlanTypeOpen] = useState(false);
    const [isOutputTypeOpen, setIsOutputTypeOpen] = useState(false);
    const [isSceneTypeOpen, setIsSceneTypeOpen] = useState(false);

    useEffect(() => {
        if (planType === 'building') {
            setOutputType(BUILDING_OUTPUT_TYPE_OPTIONS[0].value);
        } else {
            setOutputType(CITY_OUTPUT_TYPE_OPTIONS[0].value);
        }
    }, [planType]);

    const outputTypeOptions = useMemo(() => {
        return planType === 'building' ? BUILDING_OUTPUT_TYPE_OPTIONS : CITY_OUTPUT_TYPE_OPTIONS;
    }, [planType]);

    const selectedPlanTypeLabel = useMemo(() => PLAN_TYPE_OPTIONS.find(opt => opt.value === planType)?.label, [planType]);
    const selectedOutputTypeLabel = useMemo(() => outputTypeOptions.find(opt => opt.value === outputType)?.label, [outputType, outputTypeOptions]);
    const selectedSceneTypeLabel = useMemo(() => SCENE_TYPE_OPTIONS.find(opt => opt.value === sceneType)?.label, [sceneType]);

    const outputTypeDescription = useMemo(() => {
        return planType === 'building'
            ? 'اختر بين عرض مقطع ثلاثي الأبعاد أو واجهات المبنى.'
            : 'حدد ما إذا كنت تريد عرضًا جويًا أو مخططًا علويًا للمدينة.';
    }, [planType]);
    
    const placeholderText = useMemo(() => {
        let example = 'مثال: ';
        if (planType === 'building') {
            if (outputType === '3d-section') {
                example += 'مقطع يوضح التصميم الداخلي بأسلوب عصري';
            } else {
                example += 'واجهة زجاجية بلمسات خشبية';
            }
        } else {
            example += 'مخطط حضري لمدينة مستقبلية';
            if (outputType === 'perspective') {
                example += '، بمنظور جوي';
            } else {
                example += '، بمنظور علوي';
            }
        }

        if (sceneType === 'nighttime') {
            example += '، بإضاءة ليلية';
        } else {
            example += '، بإضاءة نهارية طبيعية';
        }

        example += '...';
        return example;
    }, [planType, outputType, sceneType]);

    const generatedPrompt = useMemo(() => {
        const userPromptMarker = " Add the following user-specified styles and details: ";

        const baseInstruction = `**IMPORTANT: Your output must ONLY be the final photorealistic image, with no text.** **CRITICAL: The generated 3D model must be an exact, realistic match to the 2D plan's layout, showing precise building masses, streets, and plots. Strictly adhere to the plan and do not invent elements. The final image must be clean and professional; IGNORE and REMOVE any text, numbers, dimension lines, or annotations from the source plan, rendering ONLY the physical architecture.**`;
        const plan = planType === 'building' ? 'building' : 'urban city';

        let view = '';
        switch (outputType) {
            case '3d-section':
                view = 'Create a detailed 3D cross-section showing the fully furnished interior layout and structure.';
                break;
            case 'facades':
                view = 'Generate a photorealistic exterior facade elevation.';
                break;
            case 'perspective':
                view = 'Render from a cinematic bird\'s-eye aerial perspective.';
                break;
            case 'top-down':
                view = 'Produce a detailed top-down orthographic view.';
                break;
        }

        const lighting = sceneType === 'daytime'
            ? 'Use bright, natural daytime lighting with soft, realistic shadows and a clear blue sky.'
            : 'Use dramatic nighttime illumination with glowing windows, atmospheric streetlights, and a dark clear sky.';

        const basePrompt = `${view} ${lighting}`;

        return `${baseInstruction} For the provided 2D ${plan} plan, ${basePrompt}${userPromptMarker}`;
    }, [planType, outputType, sceneType]);


    useEffect(() => {
        const userPromptMarker = " Add the following user-specified styles and details: ";
        const promptParts = generatedPrompt.split(userPromptMarker);
        const basePrompt = promptParts.length > 0 ? promptParts[0] + userPromptMarker : userPromptMarker;
        
        const currentEditableParts = editablePrompt.split(userPromptMarker);
        const currentUserInput = currentEditableParts.length > 1 ? currentEditableParts[1] : '';

        setEditablePrompt(basePrompt + currentUserInput);
        setOriginalPromptBeforeEnhance(null);
    }, [generatedPrompt]);


    const handleFileUpload = async (file: File) => {
        setError(null);
        setGeneratedImage(null);
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
        setPlanImage(null);
        setEditablePrompt('');
        setGeneratedImage(null);
        setIsLoading(false);
        setError(null);
        setOriginalPromptBeforeEnhance(null);
        setPlanType('building');
        setOutputType('3d-section');
        setSceneType('daytime');
    };

    const handleSubmit = async () => {
        if (!planImage) {
            setError('Please upload a plan file first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const resultBase64 = await generateDesign(editablePrompt, planImage.base64, null, DEFAULT_AI_MODEL);
            setGeneratedImage(`data:image/png;base64,${resultBase64}`);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`There was an unexpected error during generation. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEnhancePrompt = async () => {
        const userPromptMarker = " Add the following user-specified styles and details: ";
        const currentEditableParts = editablePrompt.split(userPromptMarker);
        const currentUserInput = currentEditableParts.length > 1 ? currentEditableParts[1].trim() : '';
        
        if (!planImage) {
            setError("Please upload a plan before enhancing the prompt.");
            return;
        }

        if (!currentUserInput) {
            setError('Please add some style details to enhance.');
            return;
        }
        setIsEnhancing(true);
        setError(null);
        setOriginalPromptBeforeEnhance(editablePrompt);
        try {
            const context = {
                planType,
                outputType,
                sceneType,
            };
            const enhanced = await enhancePrompt(currentUserInput, 'plan-to-view', context, planImage.base64);
            setEditablePrompt(enhanced);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to enhance prompt: ${errorMessage}`);
            setOriginalPromptBeforeEnhance(null);
        } finally {
            setIsEnhancing(false);
        }
    };

    const isEnhanceDisabled = useMemo(() => {
        if (isLoading || isEnhancing || !planImage) return true;
        const userPromptMarker = " Add the following user-specified styles and details: ";
        const parts = editablePrompt.split(userPromptMarker);
        const userInput = parts.length > 1 ? parts[1] : '';
        return !userInput.trim();
    }, [isLoading, isEnhancing, editablePrompt, planImage]);
    
    const handleRevertPrompt = () => {
        if (originalPromptBeforeEnhance !== null) {
            setEditablePrompt(originalPromptBeforeEnhance);
            setOriginalPromptBeforeEnhance(null);
        }
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

    const isClearAllActive = !!planImage || !!generatedImage;

    return (
        <React.Fragment>
            <div className="space-y-6 animate-fade-in">
                 <div className="bg-light-secondary dark:bg-dark-secondary p-4 rounded-2xl shadow-lg space-y-4">
                    
                    {/* Plan Type Section */}
                    <div>
                        <button 
                            onClick={() => setIsPlanTypeOpen(!isPlanTypeOpen)}
                            className="w-full flex justify-between items-center py-2 text-right"
                            aria-expanded={isPlanTypeOpen}
                        >
                            <div className="flex-grow">
                                <h3 className="text-lg font-bold text-light-text dark:text-dark-text">اختر نوع المخطط</h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">حدد ما إذا كان المخطط لمبنى واحد أو لمدينة كاملة.</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-sm font-semibold text-accent">{selectedPlanTypeLabel}</span>
                                <ChevronDownIcon className={`w-5 h-5 text-dark-text-secondary transition-transform duration-300 ${isPlanTypeOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isPlanTypeOpen ? 'max-h-96' : 'max-h-0'}`}>
                            <div className="pt-3">
                                <OptionGrid options={PLAN_TYPE_OPTIONS} selectedValue={planType} onSelect={setPlanType} />
                            </div>
                        </div>
                    </div>

                    {/* Output Type Section */}
                    <div>
                        <button 
                            onClick={() => setIsOutputTypeOpen(!isOutputTypeOpen)}
                            className="w-full flex justify-between items-center py-2 text-right"
                            aria-expanded={isOutputTypeOpen}
                        >
                            <div className="flex-grow">
                                <h3 className="text-lg font-bold text-light-text dark:text-dark-text">اختر نوع الإخراج</h3>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{outputTypeDescription}</p>
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
                    </div>

                    {/* Scene Type Section */}
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
                                    placeholder={placeholderText}
                                />
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
                                    disabled={isEnhanceDisabled}
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
                    </div>

                    <div className="flex items-center gap-2">
                         <button
                            onClick={handleSubmit}
                            disabled={isLoading || !planImage || isEnhancing}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px] md:h-[600px]">
                    <ImageUploader 
                        onImageUpload={handleFileUpload}
                        beforeImage={planImage?.url || null}
                        onImageClick={() => planImage && setZoomedImage(planImage.url)}
                        accept="image/png, image/jpeg, image/webp, application/pdf"
                        uploadText="اسحب وأفلت مخططًا هنا"
                        uploadSubText="أو انقر للاختيار (PDF, PNG, JPG)"
                    />
                    <ResultDisplay 
                        afterImage={generatedImage}
                        isLoading={isLoading}
                        onImageClick={() => generatedImage && setZoomedImage(generatedImage)}
                    />
                </div>
            </div>
            <ImageZoomModal 
                imageUrl={zoomedImage}
                onClose={() => setZoomedImage(null)}
            />
        </React.Fragment>
    );
}

export default PlanToView;