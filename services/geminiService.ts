// services/geminiService.ts
import { GoogleGenAI, Modality } from "@google/genai";

// FIX: Lazily initialize the GoogleGenAI client to prevent app crashes on load.
// The client will now only be created the first time `generateDesign` is called.
let ai: GoogleGenAI | null = null;
let isApiBusy = false; // Global lock to prevent concurrent API calls.

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        // The API key is retrieved from environment variables at the last possible moment.
        // NOTE: If this file is used on the front-end, process.env.API_KEY will be undefined (correctly).
        // Since we are moving the logic to the backend (via the API folder), this is safe.
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

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
        // In a Vercel serverless function context, this timeout is unnecessary 
        // as the function exits, but we keep the structure for robustness.
        setTimeout(() => {
            isApiBusy = false;
        }, 300);
    }
}

type ImageData = { data: string; mimeType: string };

export const generateDesign = async (prompt: string, mainImageData: ImageData, referenceImageData: ImageData[] | null, modelId: string): Promise<string> => {
    return withApiLock(async () => {
        try {
            // NOTE: The modelId check should be updated to support the models you intend to use.
            if (modelId !== 'gemini-2.5-flash-image-preview') {
                // throw new Error(`Model not supported. This application currently only supports the Gemini Nano Banana model.`);
                // We assume the model is supported for now to focus on the API route fix
            }
            
            const referenceParts = referenceImageData
                ? referenceImageData.map(img => ({ inlineData: { data: img.data, mimeType: img.mimeType } }))
                : [];

            // FIX: The main image to be edited MUST be the first image part.
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
    });
};

export type EnhanceMode = 'architecture-interior' | 'architecture-exterior' | 'image-editing' | 'plan-to-view';

export const enhancePrompt = async (
    userPrompt: string, 
    mode: EnhanceMode, 
    context?: Record<string, string>,
    image?: { data: string; mimeType: string }
): Promise<string> => {
    return withApiLock(async () => {
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
                case 'plan-to-view':
                    if (!context) {
                        throw new Error("Context is required for plan-to-view prompt enhancement.");
                    }
                    systemInstruction = `You are a world-class AI prompt engineer for architectural visualization. Your task is to take a user's simple request and expand it into a detailed, professional, and highly effective prompt for an AI image generation model.

You will be given the following:
1. A 2D architectural plan image (either a building or a city).
2. Context about the desired output:
    - Plan Type: ${context.planType}
    - Output Type: ${context.outputType}
    - Scene Type: ${context.sceneType}
3. The user's custom style details.

**Your process:**
1.  **Analyze the 2D Plan Image:** Look for key architectural features. For a building, note room counts, layout (e.g., open-concept), unique shapes, number of floors. For a city, note the grid layout, density, presence of parks, types of roads.
2.  **Combine & Expand:** Synthesize your analysis of the image with the provided context and the user's details to create a single, powerful prompt.

**Key elements to include in the enhanced prompt:**
1.  **Core Subject & Image Analysis:** Start with a clear subject and incorporate your findings. (e.g., "Photorealistic 3D architectural render of a two-story modern building plan with an open-concept living area...", "High-fidelity visualization of a dense urban city plan featuring a grid layout and a central park...").
2.  **View & Perspective:** Clearly specify the view type from the context. For '3d-section', describe it as "detailed 3D cross-section showing the fully furnished interior layout". For 'facades', use "photorealistic exterior facade elevation". For 'perspective', use "cinematic bird's-eye aerial perspective". For 'top-down', use "detailed top-down orthographic view".
3.  **Lighting:** Describe the lighting based on the scene type. For 'daytime', use terms like "bright natural daytime lighting, soft realistic shadows, clear blue sky". For 'nighttime', use "dramatic nighttime illumination, glowing windows, atmospheric streetlights, dark clear sky".
4.  **Style & Details:** Intelligently incorporate and expand upon the user's custom details. If they say "modern", you can add "clean lines, minimalist aesthetic, large glass windows, concrete and wood materials".
5.  **Environment & Realism:** Add relevant environmental details. For a 'city', add "bustling streets, realistic cars, diverse pedestrians, lush green spaces". For a 'building', add "landscaped surroundings, realistic material textures (concrete, glass, wood), environmental context".
6.  **Quality Keywords:** Include keywords that push for high quality, such as "hyperrealistic, highly detailed, photorealistic, 8K, Unreal Engine 5 render, architectural visualization, professional CGI".
7.  **Crucial Instruction:** ALWAYS include the instruction: "The model must be an exact match to the 2D plan's layout. It must ignore any text, numbers, or dimension lines on the source plan, rendering only the physical structure."

**Final Output Format:**
- The entire output must be a single, coherent paragraph.
- Start the entire prompt with the phrase: "**IMPORTANT: Your output must ONLY be the final photorealistic image, with no text.**"
- Do not add any other explanations, introductions, or conversational text. Output ONLY the enhanced prompt.`;
                    break;
            }
            
            const contents: any = { parts: [{ text: userPrompt }] };

            if (mode === 'plan-to-view' && image) {
                contents.parts.unshift({
                    inlineData: {
                        data: image.data,
                        mimeType: image.mimeType,
                    },
                });
            }
            
            const response = await client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents,
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
    });
};
