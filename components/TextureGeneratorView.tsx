import React, { useState, useRef } from 'react';
import ResultDisplay from './ResultDisplay';
import { generateTexture, generateTextureFromImage, generateTextureFromImageVariations, correctText } from '../services/geminiService';
import { WandSparklesIcon } from './icons/WandSparklesIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import ImageUploader from './ImageUploader';
import CropModal from './CropModal';
import TilingPreviewModal from './TilingPreviewModal';
import VariationsDisplay from './VariationsDisplay';
import { fileToBase64, resizeAndCompressImage, dataURLtoFile } from '../utils/imageHelpers';
import DictationButton from './DictationButton';
import { notify } from '../utils/notification';

const PRESET_PROMPTS = [
    "Ancient stone wall, weathered and mossy",
    "Polished marble with gold veins",
    "Rough, dark oak wood planks",
    "Brushed gold metal surface",
    "Luxurious red velvet fabric",
    "Carbon fiber weave pattern",
    "Cracked desert ground, arid",
    "Colorful terrazzo flooring",
];

const TextureGeneratorView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [sourceImage, setSourceImage] = useState<{ url: string; base64: { data: string; mimeType: string } } | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [variationImages, setVariationImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
    const [isCorrectingText, setIsCorrectingText] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [isTilingModalOpen, setIsTilingModalOpen] = useState(false);
    const textBeforeDictation = useRef('');

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

    const handleImageUpload = async (file: File) => {
        try {
            const compressedFile = await resizeAndCompressImage(file, 512);
            if (sourceImage) {
                URL.revokeObjectURL(sourceImage.url);
            }
            const url = URL.createObjectURL(compressedFile);
            const base64 = await fileToBase64(compressedFile);
            setSourceImage({ url, base64 });
            setError(null);
            setGeneratedImage(null);
            setVariationImages([]);
        } catch (e) {
            setError("Failed to process image. Please try another file.");
            console.error("Image processing error:", e);
        }
    };
    
    const handlePresetClick = (preset: string) => {
        setPrompt(preset);
        if (sourceImage) {
            URL.revokeObjectURL(sourceImage.url);
        }
        setSourceImage(null); // Clear image when a text preset is clicked
        setGeneratedImage(null);
        setVariationImages([]);
    };

    const handleSubmit = async () => {
        if (!prompt.trim() && !sourceImage) {
            setError('Please describe a material or upload an image.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setVariationImages([]);

        try {
            let results: string[];
            if (sourceImage) {
                const result = await generateTextureFromImage(sourceImage.base64, prompt);
                results = [result];
            } else {
                results = await generateTexture(prompt, 1);
            }
            if (results.length > 0) {
                setGeneratedImage(`data:image/jpeg;base64,${results[0]}`);
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate texture. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateVariations = async () => {
        if (!prompt.trim() && !sourceImage) {
            setError('Original prompt or image is needed to generate variations.');
            return;
        }

        setIsGeneratingVariations(true);
        setVariationImages([]);
        setError(null);

        try {
            if (sourceImage) {
                const resultsBase64 = await generateTextureFromImageVariations(sourceImage.base64, prompt, 3);
                const variationUrls = resultsBase64.map(base64 => `data:image/jpeg;base64,${base64}`);
                setVariationImages(variationUrls);
            } else {
                // Text-to-texture supports generating multiple images at once.
                const results = await generateTexture(prompt, 4);
                setVariationImages(results.map(r => `data:image/jpeg;base64,${r}`));
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate variations. ${errorMessage}`);
        } finally {
            setIsGeneratingVariations(false);
        }
    };

    const handleClear = () => {
        setPrompt('');
        if (sourceImage) URL.revokeObjectURL(sourceImage.url);
        setSourceImage(null);
        setGeneratedImage(null);
        setVariationImages([]);
        setError(null);
        setIsLoading(false);
    };

    const handleCropComplete = async (croppedDataUrl: string) => {
        const newFile = await dataURLtoFile(croppedDataUrl, 'cropped-image.jpeg');
        if (newFile) {
            try {
                const base64 = await fileToBase64(newFile);
                if (sourceImage) URL.revokeObjectURL(sourceImage.url);
                setSourceImage({ url: croppedDataUrl, base64 });
                setError(null);
            } catch (e) {
                 setError("Failed to process cropped image.");
                 console.error("Error processing cropped image:", e);
            }
        }
        setIsCropModalOpen(false);
    };

    const canSubmit = !isLoading && (!!prompt.trim() || !!sourceImage) && !isCorrectingText;
    const canClear = !!prompt.trim() || !!sourceImage || !!generatedImage;

    return (
        <React.Fragment>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:items-start">
                    <div className="bg-light-secondary dark:bg-dark-secondary p-4 rounded-2xl shadow-lg flex flex-col space-y-4">
                        <h2 className="text-xl font-bold text-center text-light-text dark:text-dark-text">Texture Controls</h2>
                        
                        <div>
                            <label htmlFor="texture-prompt" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                                Describe the material (or guide the image)
                            </label>
                            <div className="bg-light-primary dark:bg-dark-primary border-2 border-light-border dark:border-dark-border rounded-lg focus-within:ring-2 focus-within:ring-accent focus-within:border-accent flex flex-col transition-all duration-200">
                                <div className="p-2.5 pb-0">
                                    <textarea
                                        id="texture-prompt"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        rows={3}
                                        className="w-full bg-transparent text-light-text dark:text-dark-text focus:outline-none resize-none"
                                        placeholder="e.g., seamless old oak wood planks..."
                                        disabled={isLoading || isCorrectingText}
                                    />
                                </div>
                                <div className="flex items-center justify-end p-2 gap-2">
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
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                                Or start with a preset
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_PROMPTS.map((preset, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handlePresetClick(preset)}
                                        disabled={isLoading}
                                        className="text-xs font-medium bg-light-primary dark:bg-dark-primary border border-light-border dark:border-dark-border rounded-full px-3 py-1.5 hover:bg-accent/10 hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-dark-border"></div>
                            <span className="flex-shrink mx-4 text-dark-text-secondary text-sm">OR</span>
                            <div className="flex-grow border-t border-dark-border"></div>
                        </div>

                        <div className="flex-grow">
                            <ImageUploader
                                onImageUpload={handleImageUpload}
                                beforeImage={sourceImage?.url || null}
                                onImageClick={() => sourceImage && setIsCropModalOpen(true)}
                                uploadText="Upload image to make seamless"
                                uploadSubText="Click or drag & drop"
                            />
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                className="flex-grow bg-accent hover:bg-accent-hover disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <WandSparklesIcon className="w-5 h-5 mr-2" />
                                        Generate Texture
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
                                onClick={handleClear}
                                disabled={!canClear}
                                className={`flex-shrink-0 p-3 rounded-lg transition-colors duration-200 ${
                                    canClear
                                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                        : 'bg-light-primary dark:bg-dark-primary text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                }`}
                                aria-label="Clear"
                            >
                                <TrashIcon className="w-6 h-6" />
                            </button>
                        </div>
                        {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
                    </div>
                    
                    <div className="space-y-6">
                        <ResultDisplay 
                            afterImage={generatedImage}
                            isLoading={isLoading}
                            onImageClick={() => generatedImage && setIsTilingModalOpen(true)}
                        />
                        {(isGeneratingVariations || variationImages.length > 0) && (
                            <VariationsDisplay
                                images={variationImages}
                                onSelectVariation={setGeneratedImage}
                                isLoading={isGeneratingVariations}
                                loadingCount={sourceImage ? 3 : 4}
                            />
                        )}
                    </div>
                </div>
            </div>
            
            {isCropModalOpen && sourceImage && (
                <CropModal
                    imageUrl={sourceImage.url}
                    onClose={() => setIsCropModalOpen(false)}
                    onCropComplete={handleCropComplete}
                />
            )}

            {isTilingModalOpen && generatedImage && (
                <TilingPreviewModal
                    imageUrl={generatedImage}
                    onClose={() => setIsTilingModalOpen(false)}
                />
            )}
        </React.Fragment>
    );
};

export default TextureGeneratorView;