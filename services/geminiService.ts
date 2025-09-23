// GeminiService.ts
let isApiBusy = false;

async function withApiLock(apiCall) {
    if (isApiBusy) {
        throw new Error("The AI is currently busy. Please wait.");
    }
    isApiBusy = true;
    try {
        const result = await apiCall();
        return result;
    } finally {
        setTimeout(() => { isApiBusy = false; }, 300);
    }
}

export const generateDesign = async (prompt, mainImageData, referenceImageData, modelId) => {
    return withApiLock(async () => {
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, mainImageData, referenceImageData, modelId })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Server returned an unknown error.");
        }

        return data.base64Image;
    });
};

export const enhancePrompt = async (userPrompt, mode, context, image) => {
    return withApiLock(async () => {
        const response = await fetch('/api/enhance-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userPrompt, mode, context, image })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Server returned an unknown error.");
        }

        return data.enhancedText;
    });
};
