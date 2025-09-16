import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';

// This interface now correctly defines only the properties and methods of a SpeechRecognition INSTANCE.
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    onend: (() => void) | null;
}

// A new interface to define the SpeechRecognition CONSTRUCTOR.
interface SpeechRecognitionConstructor {
    new(): SpeechRecognition;
}

// Check for vendor-prefixed versions of the API, now correctly typed.
const SpeechRecognitionAPI: SpeechRecognitionConstructor | undefined =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface DictationButtonProps {
    onStart: () => void;
    onUpdate: (transcript: string) => void;
    onStop: (transcript: string) => void;
    disabled?: boolean;
}

const DictationButton: React.FC<DictationButtonProps> = ({ onStart, onUpdate, onStop, disabled }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const finalTranscriptRef = useRef<string>('');

    // Check for browser support on mount and clean up on unmount.
    useEffect(() => {
        if (!SpeechRecognitionAPI) {
            console.warn('Speech recognition is not supported in this browser.');
            setIsSupported(false);
        }
        return () => {
            recognitionRef.current?.abort();
        };
    }, []);
    
    const toggleListening = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent form submission if inside a form
        if (disabled || !isSupported) return;

        if (isListening) {
            // Stop listening: provide immediate visual feedback.
            recognitionRef.current?.stop();
            setIsListening(false); 
            // The `onend` handler will perform the final callback and cleanup.
        } else {
            // Start listening
            onStart();
            finalTranscriptRef.current = '';
            
            try {
                const recognition = new SpeechRecognitionAPI!();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = document.documentElement.lang || 'ar-SA';

                // This handler is now more robust. It rebuilds the transcript on each result
                // to correctly handle corrections from the speech recognition service and prevent duplicates.
                recognition.onresult = (event: any) => {
                    let interimTranscript = '';
                    const finalTranscriptParts: string[] = [];
                    
                    for (let i = 0; i < event.results.length; ++i) {
                        const transcriptPart = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscriptParts.push(transcriptPart.trim());
                        } else {
                            interimTranscript = transcriptPart;
                        }
                    }
                    
                    // Re-join all final parts to form the complete sentence.
                    const finalTranscript = finalTranscriptParts.join(' ');
                    finalTranscriptRef.current = finalTranscript;
                    
                    // Combine final and interim for the live update
                    const fullLiveTranscript = [finalTranscript, interimTranscript.trim()].filter(Boolean).join(' ');
                    onUpdate(fullLiveTranscript);
                };

                recognition.onerror = (event: any) => {
                    if (event.error !== 'no-speech' && event.error !== 'aborted') {
                        console.error('Speech recognition error:', event.error, event.message);
                    }
                    // Ensure listening state is false on error for safety.
                    setIsListening(false);
                };
                
                recognition.onend = () => {
                    // This is now primarily for finalization. The UI state may already be updated.
                    setIsListening(false);
                    onStop(finalTranscriptRef.current.trim());
                    recognitionRef.current = null;
                };

                recognition.start();
                setIsListening(true);
                recognitionRef.current = recognition;
            } catch (err) {
                console.error("Error initializing or starting speech recognition:", err);
                setIsSupported(false); // Disable if it fails to start
            }
        }
    };

    if (!isSupported) {
        return null;
    }

    const buttonClasses = `relative flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-primary focus:ring-accent ${
        isListening
            ? 'bg-red-500 text-white shadow-lg'
            : 'bg-light-primary dark:bg-dark-primary text-light-text-secondary dark:text-dark-text-secondary hover:bg-accent hover:text-white'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <button
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            className={buttonClasses}
            aria-label={isListening ? 'إيقاف الإملاء' : 'بدء الإملاء'}
            title={isListening ? 'إيقاف الإملاء' : 'بدء الإملاء'}
        >
            {isListening && <span className="animate-ripple absolute h-full w-full rounded-full bg-red-400 opacity-75"></span>}
            <span className="relative z-10">
                {isListening ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
            </span>
        </button>
    );
};

export default DictationButton;