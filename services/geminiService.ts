// هذه الخدمة ستتعامل مع endpoints الجديدة على Vercel
let isApiBusy = false;

async function withApiLock(apiCall) {
    if (isApiBusy) throw new Error("The AI is currently busy. Please wait.");
    isApiBusy = true;
    try {
        return await apiCall();
    } finally {
        setTimeout(() => { isApiBusy = false; }, 300);
    }
}

export const generateDesign = async (prompt, mainImageData, referenceImageData, modelId) => {
    return withApiLock(async () => {
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, mainImageData, referenceImageData, modelId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Server returned an error: ${errorData.error}`);
        }

        const data = await response.json();
        return data.base64Image;
    });
};

export const enhancePrompt = async (userPrompt, mode, context, image) => {
    return withApiLock(async () => {
        const response = await fetch('/api/enhance-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userPrompt, mode, context, image }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Server returned an error: ${errorData.error}`);
        }

        const data = await response.json();
        return data.enhancedText;
    });
};
