import { GoogleGenAI, Modality } from "@google/genai";
import { fetchEventSource } from '@fortaine/fetch-event-source';

// Global lock to prevent concurrent API calls.
let isApiBusy = false; 

/**
 * A wrapper function to ensure only one API call is in flight at a time.
 * This prevents hitting rate limits and provides a more user-friendly error.
 */
async function withApiLock(apiCall) {
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

export const generateDesign = async (prompt, mainImageData, referenceImageData, modelId) => {
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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Server returned an error: ${errorData.error}`);
            }

            const data = await response.json();
            return data.base64Image;

        } catch (error) {
            console.error("Error calling proxy server:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to generate design. ${error.message}`);
            }
            throw new Error('An unknown error occurred while communicating with the proxy server.');
        }
    });
};

export const enhancePrompt = async (userPrompt, mode, context, image) => {
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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Server returned an error: ${errorData.error}`);
            }

            const data = await response.json();
            return data.enhancedText;
        } catch (error) {
            console.error("Error calling proxy server for prompt enhancement:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to enhance prompt. ${error.message}`);
            }
            throw new Error('An unknown error occurred while enhancing the prompt.');
        }
    });
};
