import { GoogleGenAI, Modality } from "@google/genai";

// FIX: Lazily initialize the GoogleGenAI client to prevent app crashes on load.
// The client will now only be created the first time `generateDesign` is called.
let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        // The API key is retrieved from environment variables at the last possible moment.
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

type ImageData = { data: string; mimeType: string };

export const generateDesign = async (prompt: string, mainImageData: ImageData, referenceImageData: ImageData[] | null, modelId: string): Promise<string> => {
    try {
        if (modelId !== 'gemini-2.5-flash-image-preview') {
            throw new Error(`Model not supported. This application currently only supports the Gemini Nano Banana model.`);
        }
        
        const referenceParts = referenceImageData
            ? referenceImageData.map(img => ({ inlineData: { data: img.data, mimeType: img.mimeType } }))
            : [];

        // FIX: The main image to be edited MUST be the first image part.
        // The reference image should follow, acting as context for the prompt.
        // This resolves the issue where the AI might apply the style of the main image to the reference image.
        const parts: any[] = [
            // The main image to be edited
            { inlineData: { data: mainImageData.data, mimeType: mainImageData.mimeType } },
            // The reference images for style inspiration (if provided)
            ...referenceParts,
            // The text prompt describing the transformation
            { text: prompt },
        ];

        const client = getAiClient(); // Get the initialized client.

        const response = await client.models.generateContent({
            model: modelId,
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const candidate = response.candidates?.[0];

        // First, check for a valid candidate and any immediate blocking issues.
        if (!candidate) {
            const blockReason = response.promptFeedback?.blockReason;
            if (blockReason) {
                throw new Error(`Your request was blocked. Reason: ${blockReason}.`);
            }
            throw new Error('The AI model did not provide a valid response.');
        }

        // Prioritize finding and returning an image from the response parts.
        if (candidate.content?.parts) {
            const imagePart = candidate.content.parts.find(part => part.inlineData?.data);
            if (imagePart?.inlineData) {
                return imagePart.inlineData.data;
            }
        }

        // If no image is found, analyze the reason for the failure.
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            throw new Error(`Image generation failed. Reason: ${candidate.finishReason}.`);
        }
        
        // If there's no image, collect any text parts to provide a more informative error.
        let textExplanation = '';
        if (candidate.content?.parts) {
            textExplanation = candidate.content.parts
                .filter(part => !!part.text)
                .map(part => part.text)
                .join(' ')
                .trim();
        }

        if (textExplanation) {
             console.error("API returned text instead of image:", textExplanation);
             throw new Error(`The AI returned a text message instead of an image: "${textExplanation}"`);
        }
        
        // Fallback error if no image and no text explanation is found.
        throw new Error('The AI model did not generate an image. Please try again or adjust your prompt.');

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            // Re-throw with a user-friendly message, including the specific reason from the inner throws.
            throw new Error(`Failed to generate design. ${error.message}`);
        }
        throw new Error('An unknown error occurred while communicating with the AI model.');
    }
};

export type EnhanceMode = 'architecture-interior' | 'architecture-exterior' | 'image-editing';

export const enhancePrompt = async (userPrompt: string, mode: EnhanceMode): Promise<string> => {
    try {
        const client = getAiClient();
        let systemInstruction = '';

        switch (mode) {
            case 'architecture-interior':
                systemInstruction = `You are an expert AI prompt engineer for architectural visualization. Your task is to rewrite a user's request into a highly detailed prompt for an AI image editing model. The goal is to modify the existing 'before' image, not create a new one. The enhanced prompt must instruct the AI to preserve the original room structure, perspective, and camera angle. The changes should focus on elements within the scene, such as furniture, materials, textures, lighting, color palette, and decorative elements. The prompt should be photorealistic. Output ONLY the enhanced prompt, without any introductory phrases, commentary, or explanations.`;
                break;
            case 'architecture-exterior':
                systemInstruction = `You are an expert AI prompt engineer for architectural visualization. Your task is to rewrite a user's request into a highly detailed prompt for an AI image editing model. The goal is to modify the existing 'before' image, not create a new one. The enhanced prompt must instruct the AI to preserve the original building structure, perspective, and camera angle. The changes should focus on elements within the scene, such as materials, textures, lighting, color palette, landscaping, and architectural details. The prompt should be photorealistic. Output ONLY the enhanced prompt, without any introductory phrases, commentary, or explanations.`;
                break;
            case 'image-editing':
                systemInstruction = `You are an expert AI prompt engineer for image editing. Rewrite the user's editing request to be clear, direct, and effective for an AI image model. Focus on the action and the subject. Make it sound like a command. For example, "add a hat" instead of "can you add a hat?". Output ONLY the enhanced prompt, without any commentary.`;
                break;
        }
        
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction,
                temperature: 0.7,
            },
        });
        
        const enhancedText = response.text;

        if (!enhancedText) {
            throw new Error("The AI model returned an empty response.");
        }
        // Sometimes the model might still add quotes around the prompt. Let's remove them.
        return enhancedText.trim().replace(/^"(.*)"$/, '$1');

    } catch (error) {
        console.error("Error calling Gemini API for prompt enhancement:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to enhance prompt. ${error.message}`);
        }
        throw new Error('An unknown error occurred while enhancing the prompt.');
    }
};