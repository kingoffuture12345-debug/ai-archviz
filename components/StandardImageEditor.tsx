import React, { useState, useEffect, useRef } from 'react';
import ImageUploader from './ImageUploader';
import ResultDisplay from './ResultDisplay';
import ImageZoomModal from './ImageZoomModal';
import ImageComparisonModal from './ImageComparisonModal';
import DictationButton from './DictationButton';
import ReferenceImageUploader from './ReferenceImageUploader';
import InpaintingView from './InpaintingView';
import VariationsDisplay from './VariationsDisplay';
import { WandSparklesIcon } from './icons/WandSparklesIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { generateDesign, generateDesignVariations, enhancePrompt, correctText } from '../services/geminiService';
import { DEFAULT_AI_MODEL } from '../constants';
import { fileToBase64, resizeAndCompressImage, dataURLtoFile } from '../utils/imageHelpers';
import { notify } from '../utils/notification';

function StandardImageEditor() {
    const [mainImage, setMainImage] = useState<{ file: File; url: string; base64: { data: string; mimeType: string } } | null>(null);
    const [referenceImages, setReferenceImages] = useState<Array<{ id: string; file: File; url: string; base64: { data: string; mimeType: string } }>>([]);
    const [prompt, setPrompt] = useState('');
    const [originalPromptBeforeEnhance, setOriginalPromptBeforeEnhance] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [variationImages, setVariationImages] = useState<string[]>([]);
    const [imageToEdit, setImageToEdit] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isCorrectingText, setIsCorrectingText] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewingImage, setViewingImage] = useState<{ url: string; isEditable: boolean } | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const textBeforeDictation = useRef('');
    const [editingSource, setEditingSource] = useState<'before' | 'after' | null>(null);

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

    const handleClearAll = () => {
        if (mainImage) URL.revokeObjectURL(mainImage.url);
        if (referenceImages.length > 0) {
            referenceImages.forEach(img => URL.revokeObjectURL(img.url));
        }
        setMainImage(null);
        setReferenceImages([]);
        setPrompt('');
        setGeneratedImage(null);
        setVariationImages([]);
        setIsLoading(false);
        setError(null);
        setOriginalPromptBeforeEnhance(null);
    };
    
    const handleSubmit = async () => {
        if (!mainImage) {
            setError('Please upload an image first.');
            return;
        }
        if (!prompt.trim()) {
            setError('Please enter a prompt to describe the edit.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setVariationImages([]);

        try {
            let fullPrompt = prompt.trim();
            if (referenceImages.length > 0) {
                 fullPrompt = `Using the provided reference image(s) for style, content, or element inspiration, perform this edit on the main 'before' image: "${prompt.trim()}"`;
            }
            // Add a strong instruction to prevent conversational text responses from the AI.
            fullPrompt += ". The output must ONLY be the edited image.";

            const refImageBase64s = referenceImages.map(img => img.base64);
            const resultBase64 = await generateDesign(fullPrompt, mainImage.base64, refImageBase64s.length > 0 ? refImageBase64s : null, DEFAULT_AI_MODEL);
            setGeneratedImage(`data:image/png;base64,${resultBase64}`);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`There was an unexpected error. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateVariations = async () => {
        if (!mainImage || !prompt.trim()) {
            setError('Cannot generate variations without an initial image and prompt.');
            return;
        }

        setIsGeneratingVariations(true);
        setVariationImages([]);
        setError(null);

        try {
            let fullPrompt = prompt.trim();
            if (referenceImages.length > 0) {
                fullPrompt = `Using the provided reference image(s) for style, content, or element inspiration, perform this edit on the main 'before' image: "${prompt.trim()}"`;
            }
            fullPrompt += ". The output must ONLY be the edited image.";

            const refImageBase64s = referenceImages.map(img => img.base64);

            const resultsBase64 = await generateDesignVariations(fullPrompt, mainImage.base64, refImageBase64s.length > 0 ? refImageBase64s : null, DEFAULT_AI_MODEL, 3);
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
        if (!prompt.trim()) {
            setError('Please enter a prompt to enhance.');
            return;
        }
        setIsEnhancing(true);
        setError(null);
        setOriginalPromptBeforeEnhance(prompt); // Save the current state
        try {
            const enhanced = await enhancePrompt(prompt, 'image-editing');
            setPrompt(enhanced);
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
            setPrompt(originalPromptBeforeEnhance);
            setOriginalPromptBeforeEnhance(null);
        }
    };

    const handleDictationStart = () => {
        const currentPrompt = prompt;
        // If the prompt is not empty and doesn't already end with whitespace, add a space.
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
        setPrompt(rawAppendedPrompt); // Show raw transcript immediately

        if (!finalTranscript.trim()) {
            return;
        }

        setIsCorrectingText(true);
        try {
            const correctedTranscript = await correctText(finalTranscript);
            
            // Safely replace the text, avoiding race conditions if the user types during correction.
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

    const isClearAllActive = !!mainImage || !!generatedImage || referenceImages.length > 0;
    const placeholderText = "مثال: أضف قبعة رعاة البقر، غير الخلفية إلى شاطئ مشمس...";
    
    const handleInpaintingComplete = async (newImageUrl: string) => {
        if (editingSource === 'before') {
            // We are updating the 'before' image (mainImage)
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
                    // The 'generatedImage' state remains untouched, as per user request.
                } catch (e) {
                    setError("Failed to process the edited image.");
                    console.error("Edited image processing error:", e);
                }
            } else {
                setError("Failed to process edited image.");
            }
        } else if (editingSource === 'after') {
            // We are updating the 'after' image (generatedImage)
            setGeneratedImage(newImageUrl);
            // The 'mainImage' state remains untouched.
        }
        setImageToEdit(null); // Close the editor
        setEditingSource(null); // Reset the source
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
            <div className="space-y-6">
                 <div className="bg-light-secondary dark:bg-dark-secondary p-4 rounded-2xl shadow-lg space-y-4">
                    <ReferenceImageUploader 
                        referenceImages={referenceImages.map(img => ({ id: img.id, url: img.url }))}
                        onImageUpload={handleReferenceImageUpload}
                        onImageRemove={handleReferenceImageRemove}
                        isDisabled={isLoading || isEnhancing}
                    />
                    
                    <div>
                        <label htmlFor="edit-prompt" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                             وصف التعديل المطلوب
                        </label>
                        <div className="bg-light-primary dark:bg-dark-primary border-2 border-light-border dark:border-dark-border rounded-lg focus-within:ring-2 focus-within:ring-accent focus-within:border-accent flex flex-col transition-all duration-200">
                           <div className="p-3 pb-1 relative">
                                <textarea
                                    id="edit-prompt"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="w-full h-40 bg-transparent text-light-text dark:text-dark-text focus:outline-none resize-none placeholder:text-dark-text-secondary"
                                    placeholder={prompt ? '' : placeholderText}
                                />
                                {!prompt && (
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
                                    disabled={isLoading || isEnhancing || !prompt.trim() || isCorrectingText}
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
                            disabled={isLoading || !mainImage || !prompt.trim() || isEnhancing || isCorrectingText}
                            className="flex-grow bg-accent hover:bg-accent-hover disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105"
                        >
                          {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    جاري التعديل...
                                </>
                            ) : (
                                <>
                                    <WandSparklesIcon className="w-5 h-5 mr-2" />
                                    تعديل الصورة
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

export default StandardImageEditor;