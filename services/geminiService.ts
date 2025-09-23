import { GoogleGenAI, Modality } from "@google/genai";
import { fetchEventSource } from '@fortaine/fetch-event-source';

// Global lock to prevent concurrent API calls.
let isApiBusy = false;

/**
 * A wrapper function to ensure only one API call is in flight at a time.
 * This prevents hitting rate limits and provides a more user-friendly error.
 */
async function withApiLock<T>(apiCall: () => Promise<T>): Promise<T> {
    if (isApiBusy) {
        throw new Error("The AI is currently busy. Please wait for the current operation to complete before trying again.");
    }
    isApiBusy = true;
    try {
        const result = await apiCall();
        return result;
    } finally {
        // Add a brief cool-down period to respect API rate limits.
        setTimeout(() => {
            isApiBusy = false;
        }, 300);
    }
}

export const generateDesign = async (
    prompt: string,
    mainImageData: string,
    referenceImageData: string[],
    modelId: string
): Promise<string> => {
    return withApiLock(async () => {
        try {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    mainImageData,
                    referenceImageData,
                    modelId
                })
            });

            const raw = await response.text(); // <-- نقرأ الرد كـ نص أول
            try {
                const data = JSON.parse(raw);
                if (!response.ok) {
                    throw new Error(`Server returned an error: ${data.error || raw}`);
                }
                return data.base64Image;
            } catch (parseError) {
                console.error("Response is not valid JSON:", raw);
                throw new Error("Failed to generate design. Server did not return valid JSON.");
            }

        } catch (error) {
            console.error("Error calling proxy server:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to generate design. ${error.message}`);
            }
            throw new Error('An unknown error occurred while communicating with the proxy server.');
        }
    });
};

export const enhancePrompt = async (
    userPrompt: string,
    mode: string,
    context: string,
    image: string
): Promise<string> => {
    return withApiLock(async () => {
        try {
            const response = await fetch('/api/enhance-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userPrompt,
                    mode,
                    context,
                    image
                }),
            });

            const raw = await response.text(); // <-- نقرأ الرد كـ نص أول
            try {
                const data = JSON.parse(raw);
                if (!response.ok) {
                    throw new Error(`Server returned an error: ${data.error || raw}`);
                }
                return data.enhancedText;
            } catch (parseError) {
                console.error("Response is not valid JSON:", raw);
                throw new Error("Failed to enhance prompt. Server did not return valid JSON.");
            }

        } catch (error) {
            console.error("Error calling proxy server for prompt enhancement:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to enhance prompt. ${error.message}`);
            }
            throw new Error('An unknown error occurred while enhancing the prompt.');
        }
    });
};
