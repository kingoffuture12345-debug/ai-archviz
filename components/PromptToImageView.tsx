import React, { useState, useRef } from 'react';
import ResultDisplay from './ResultDisplay';
import ImageZoomModal from './ImageZoomModal';
import VariationsDisplay from './VariationsDisplay';
import { generateImageFromPrompt, correctText } from '../services/geminiService';
import { WandSparklesIcon } from './icons/WandSparklesIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { AspectRatio11Icon } from './icons/AspectRatio11Icon';
import { AspectRatio43Icon } from './icons/AspectRatio43Icon';
import { AspectRatio34Icon } from './icons/AspectRatio34Icon';
import { AspectRatio169Icon } from './icons/AspectRatio169Icon';
import { AspectRatio916Icon } from './icons/AspectRatio916Icon';
import DictationButton from './DictationButton';
import { notify } from '../utils/notification';

type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16';

const ASPECT_RATIO_OPTIONS: { value: AspectRatio, label: string, icon: React.FC<any> }[] = [
    { value: '1:1', label: 'مربع', icon: AspectRatio11Icon },
    { value: '4:3', label: 'أفقي', icon: AspectRatio43Icon },
    { value: '3:4', label: 'عمودي', icon: AspectRatio34Icon },
    { value: '16:9', label: 'شاشة عريضة', icon: AspectRatio169Icon },
    { value: '9:16', label: 'قصة', icon: AspectRatio916Icon },
];

const PromptToImageView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [variationImages, setVariationImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
    const [isCorrectingText, setIsCorrectingText] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
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

    const handleSubmit = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt to generate an image.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setVariationImages([]);
        try {
            const results = await generateImageFromPrompt(prompt, aspectRatio, 1);
            if (results.length > 0) {
                setGeneratedImage(`data:image/jpeg;base64,${results[0]}`);
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate image. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateVariations = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt to generate variations.');
            return;
        }
        setIsGeneratingVariations(true);
        setError(null);
        setVariationImages([]);
        try {
            const results = await generateImageFromPrompt(prompt, aspectRatio, 4);
            setVariationImages(results.map(r => `data:image/jpeg;base64,${r}`));
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate variations. ${errorMessage}`);
        } finally {
            setIsGeneratingVariations(false);
        }
    };

    const handleClear = () => {
        setPrompt('');
        setGeneratedImage(null);
        setVariationImages([]);
        setError(null);
        setIsLoading(false);
        setAspectRatio('1:1');
    };

    const canSubmit = !isLoading && !!prompt.trim() && !isCorrectingText;
    const canClear = !!prompt.trim() || !!generatedImage;

    return (
        <React.Fragment>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:items-start">
                    <div className="bg-dark-primary p-4 rounded-2xl shadow-lg flex flex-col space-y-4">
                        <h2 className="text-xl font-bold text-center text-dark-text">برمت إلى صورة</h2>
                        
                        <div>
                            <label htmlFor="p2i-prompt" className="block text-sm font-medium text-dark-text-secondary mb-1">
                                وصف الصورة
                            </label>
                            <div className="bg-dark-secondary border-2 border-dark-border rounded-lg focus-within:ring-2 focus-within:ring-accent focus-within:border-accent flex flex-col transition-all duration-200">
                                <div className="p-2.5 pb-0 flex-grow">
                                    <textarea
                                        id="p2i-prompt"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        rows={5}
                                        className="w-full h-full bg-transparent text-dark-text focus:outline-none resize-none"
                                        placeholder="مثال: صورة واقعية لقطة ترتدي خوذة فضاء..."
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
                            <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                                نسبة العرض إلى الارتفاع
                            </label>
                            <div className="flex justify-center gap-2">
                                {ASPECT_RATIO_OPTIONS.map(({ value, label, icon: Icon }) => (
                                    <button
                                        key={value}
                                        onClick={() => setAspectRatio(value)}
                                        disabled={isLoading}
                                        className={`p-2 rounded-lg border-2 transition-colors disabled:opacity-50 ${
                                            aspectRatio === value
                                                ? 'bg-accent/20 border-accent text-accent'
                                                : 'bg-dark-secondary border-dark-border hover:border-accent'
                                        }`}
                                        title={label}
                                    >
                                        <Icon className="w-6 h-6" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-grow"></div>

                        <div className="flex items-center gap-2 pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                className="flex-grow bg-accent hover:bg-accent-hover disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : (
                                    <WandSparklesIcon className="w-5 h-5 mr-2" />
                                )}
                                <span>توليد الصورة</span>
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
                                        : 'bg-dark-secondary text-gray-600 cursor-not-allowed'
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
                            onImageClick={() => generatedImage && setViewingImage(generatedImage)}
                        />
                        {(isGeneratingVariations || variationImages.length > 0) && (
                            <VariationsDisplay
                                images={variationImages}
                                onSelectVariation={setGeneratedImage}
                                isLoading={isGeneratingVariations}
                            />
                        )}
                    </div>
                </div>
            </div>
            <ImageZoomModal 
                imageUrl={viewingImage}
                onClose={() => setViewingImage(null)}
            />
        </React.Fragment>
    );
};
export default PromptToImageView;
