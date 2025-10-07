import { GoogleGenAI, Modality } from "@google/genai";
import { notify } from "../utils/notification";

// FIX: Lazily initialize the GoogleGenAI client to prevent app crashes on load.
// The client will now only be created the first time `generateDesign` is called.
let ai: GoogleGenAI | null = null;
let isApiBusy = false; // Global lock to prevent concurrent API calls.

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        // The API key is retrieved from environment variables at the last possible moment.
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
        setTimeout(() => {
            isApiBusy = false;
        }, 300);
    }
}

type ImageData = { data: string; mimeType: string };

export const identifyObject = async (originalImage: ImageData, maskImage: ImageData): Promise<string> => {
    return withApiLock(async () => {
        try {
            const client = getAiClient();
            const prompt = `Analyze the first image. The second image is a mask where the white areas highlight one or more distinct objects. What are the names of ALL the objects inside the highlighted areas? Provide a short, comma-separated list of the object names (e.g., 'chandelier, coffee table, ottoman'). Answer with only the object names.`;

            const parts: any[] = [
                { inlineData: { data: originalImage.data, mimeType: originalImage.mimeType } },
                { inlineData: { data: maskImage.data, mimeType: maskImage.mimeType } },
                { text: prompt },
            ];

            const response = await client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts },
                config: {
                    // Disable thinking for faster response for this simple task
                    thinkingConfig: { thinkingBudget: 0 },
                }
            });

            const text = response.text;
            if (!text || !text.trim()) {
                throw new Error('The AI model did not return a valid object name.');
            }

            return text.trim();

        } catch (error) {
            console.error("Error calling Gemini API for object identification:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to identify object. ${error.message}`);
            }
            throw new Error('An unknown error occurred while identifying the object.');
        }
    });
};


const _generateDesignInternal = async (prompt: string, mainImageData: ImageData, referenceImageData: ImageData[] | null, modelId: string): Promise<string> => {
     try {
            if (modelId !== 'gemini-2.5-flash-image') {
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
            // FIX: Use the 'response.text' accessor for a more reliable way to get text output.
            const textExplanation = response.text?.trim();

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

export const generateDesign = (prompt: string, mainImageData: ImageData, referenceImageData: ImageData[] | null, modelId: string): Promise<string> => {
    return withApiLock(() => _generateDesignInternal(prompt, mainImageData, referenceImageData, modelId));
};

export const generateDesignVariations = (prompt: string, mainImageData: ImageData, referenceImageData: ImageData[] | null, modelId: string, count: number): Promise<string[]> => {
    return withApiLock(async () => {
        const variations: string[] = [];
        for (let i = 0; i < count; i++) {
            const result = await _generateDesignInternal(prompt, mainImageData, referenceImageData, modelId);
            variations.push(result);
        }
        return variations;
    });
};


export const generateTexture = async (prompt: string, numberOfImages: number = 1): Promise<string[]> => {
    return withApiLock(async () => {
        try {
            const client = getAiClient();
            // Enhance the user prompt with keywords for better texture generation
            const fullPrompt = `photorealistic seamless tileable PBR texture of ${prompt}, 8k, high detail, professional material science photography, realistic lighting`;

            const response = await client.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: fullPrompt,
                config: {
                    numberOfImages: numberOfImages,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            });
            
            if (!response.generatedImages || response.generatedImages.length === 0) {
                throw new Error('The AI model did not generate an image.');
            }
            
            const images = response.generatedImages.map(img => img.image.imageBytes);
            if (images.some(img => !img)) {
                 throw new Error('The AI model returned an empty image.');
            }
            return images;

        } catch (error) {
            console.error("Error calling Imagen API for texture generation:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to generate texture. ${error.message}`);
            }
            throw new Error('An unknown error occurred while communicating with the AI model.');
        }
    });
};

export const generateImageFromPrompt = async (
    prompt: string,
    aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9',
    numberOfImages: number = 1
): Promise<string[]> => {
    return withApiLock(async () => {
        try {
            const client = getAiClient();
            const response = await client.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: numberOfImages,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: aspectRatio,
                },
            });
            
            if (!response.generatedImages || response.generatedImages.length === 0) {
                throw new Error('The AI model did not generate an image.');
            }
            
            const images = response.generatedImages.map(img => img.image.imageBytes);
            if (images.some(img => !img)) {
                 throw new Error('The AI model returned an empty image.');
            }
            return images;

        } catch (error) {
            console.error("Error calling Imagen API for image generation:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to generate image. ${error.message}`);
            }
            throw new Error('An unknown error occurred while communicating with the AI model.');
        }
    });
};

const _generateTextureFromImageInternal = async (
    sourceImageData: ImageData,
    userPrompt: string
): Promise<string> => {
     try {
            const client = getAiClient();

            let systemPrompt = `Analyze the provided source image and transform it into a photorealistic, high-quality, seamless, tileable PBR texture. The texture must maintain the original material's characteristics (like color, pattern, and texture) but be perfectly repeatable for use in 3D rendering and game development.`;
            
            if (userPrompt.trim()) {
                systemPrompt += ` Pay special attention to the user's following guidance: "${userPrompt.trim()}".`;
            }

            systemPrompt += ` The output must ONLY be the final, seamless texture image. Do not add any text or explanation.`;

            const parts: any[] = [
                { inlineData: { data: sourceImageData.data, mimeType: sourceImageData.mimeType } },
                { text: systemPrompt },
            ];

            const response = await client.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });
            
            const candidate = response.candidates?.[0];

            if (!candidate) {
                const blockReason = response.promptFeedback?.blockReason;
                if (blockReason) {
                    throw new Error(`Your request was blocked. Reason: ${blockReason}.`);
                }
                throw new Error('The AI model did not provide a valid response.');
            }

            if (candidate.content?.parts) {
                const imagePart = candidate.content.parts.find(part => part.inlineData?.data);
                if (imagePart?.inlineData) {
                    return imagePart.inlineData.data;
                }
            }
            
            if (candidate.finishReason && candidate.finishReason !== 'STOP') {
                throw new Error(`Image generation failed. Reason: ${candidate.finishReason}.`);
            }
            
            const textExplanation = response.text?.trim();
            if (textExplanation) {
                 console.error("API returned text instead of image:", textExplanation);
                 throw new Error(`The AI returned a text message instead of an image: "${textExplanation}"`);
            }
            
            throw new Error('The AI model did not generate an image. Please try again or adjust your prompt.');

        } catch (error) {
            console.error("Error calling Gemini API for texture from image:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to generate texture from image. ${error.message}`);
            }
            throw new Error('An unknown error occurred while communicating with the AI model.');
        }
};

export const generateTextureFromImage = (
    sourceImageData: ImageData,
    userPrompt: string
): Promise<string> => {
    return withApiLock(() => _generateTextureFromImageInternal(sourceImageData, userPrompt));
};

export const generateTextureFromImageVariations = (
    sourceImageData: ImageData,
    userPrompt: string,
    count: number
): Promise<string[]> => {
    return withApiLock(async () => {
        const variations: string[] = [];
        for (let i = 0; i < count; i++) {
            const result = await _generateTextureFromImageInternal(sourceImageData, userPrompt);
            variations.push(result);
        }
        return variations;
    });
};


export type EnhanceMode = 'architecture-interior' | 'architecture-exterior' | 'image-editing' | 'plan-to-view' | 'style-from-image' | 'image-to-prompt';

export const enhancePrompt = async (
    userPrompt: string, 
    mode: EnhanceMode, 
    context?: Record<string, string>,
    images?: { data: string; mimeType: string }[]
): Promise<string> => {
    return withApiLock(async () => {
        try {
            const client = getAiClient();
            let systemInstruction = '';

            switch (mode) {
                case 'architecture-interior':
                    systemInstruction = `You are an expert AI prompt engineer for architectural visualization. Your task is to rewrite a user's request into a highly detailed and evocative prompt for an AI image editing model. Focus on elaborating the desired style, materials, textures, lighting, color palette, furniture, decor, and overall mood. Do NOT add instructions about preserving the room structure, as that will be handled separately. The goal is to create a rich, artistic description for transforming the scene. The prompt should be photorealistic. Output ONLY the enhanced prompt, without any introductory phrases, commentary, or explanations.`;
                    break;
                case 'architecture-exterior':
                    systemInstruction = `You are an expert AI prompt engineer for architectural visualization. Your task is to rewrite a user's request into a highly detailed and evocative prompt for an AI image editing model. Focus on elaborating the desired style, materials, textures, lighting, color palette, landscaping, and architectural details. Do NOT add instructions about preserving the building structure, as that will be handled separately. The goal is to create a rich, artistic description for transforming the scene. The prompt should be photorealistic. Output ONLY the enhanced prompt, without any introductory phrases, commentary, or explanations.`;
                    break;
                case 'image-editing':
                    systemInstruction = `You are an expert AI prompt engineer for image editing. Rewrite the user's editing request to be clear, direct, and effective for an AI image model. Focus on the action and the subject. Make it sound like a command. For example, "add a hat" instead of "can you add a hat?". Output ONLY the enhanced prompt, without any commentary.`;
                    break;
                case 'plan-to-view':
                    if (!context) {
                        throw new Error("Context is required for plan-to-view prompt enhancement.");
                    }
                    const sourceType = context.planMode === 'SketchTo3D' ? 'sketch' : 'plan';
                    systemInstruction = `You are a world-class AI prompt engineer for architectural visualization. Your task is to analyze the provided 2D ${sourceType} image and the user's prompt, then rewrite the prompt to be more detailed, professional, and highly effective for an AI model that converts 2D plans to 3D views.

**Your process:**
1.  **Analyze the 2D ${sourceType} Image:** Look for key architectural features. Note room counts, layout, unique shapes, number of floors, and the precise locations of windows, doors, and fixtures. Incorporate these specific observations into the enhanced prompt.
2.  **Analyze the User's Prompt:** Identify the core request (e.g., plan type, view, lighting, style).
3.  **Combine & Enhance:** Synthesize your analysis of the image with the user's prompt, expanding on their ideas with richer vocabulary and more specific architectural and artistic details.
    -   **View & Perspective:** Elaborate on the requested view using technical, accuracy-focused language. For a "3D view", describe it as "a 100% structurally accurate 3D render from an eye-level perspective". For a "section", describe it as "a millimeter-precise 3D cross-section view showing the fully furnished interior". Avoid artistic or cinematic terms.
    -   **Lighting:** Enhance lighting descriptions. "Daytime" becomes "bright natural daytime lighting, soft realistic shadows". "Nighttime" becomes "dramatic nighttime illumination, glowing windows, atmospheric streetlights".
    -   **Style & Details:** Intelligently expand upon user-specified styles. If they say "modern", add details like "clean lines, minimalist aesthetic, large glass windows, concrete and wood materials".
    -   **Environment & Realism:** Add relevant environmental details like "landscaped surroundings" for buildings or "bustling streets" for cities.
    -   **Quality Keywords:** Include keywords that push for high quality, such as "hyperrealistic, highly detailed, photorealistic, 8K, Unreal Engine 5 render, professional CGI".
4.  **Preserve Critical Instructions:** The final prompt you generate MUST end with the exact, multi-line "**CRITICAL NON-NEGOTIABLE RULES**" block. Do not alter it in any way.

**CRITICAL NON-NEGOTIABLE RULES:** Your primary task is to create a **100% accurate, millimeter-precise** 3D replica of the 2D ${sourceType}. Deviation is not permitted. You MUST obey these rules:

1.  **ACCURACY IS PARAMOUNT:** Replicate the exact layout, position, thickness, and angle of all walls, doors, doorways, and openings. Do NOT alter the structure. This rule applies to ALL view types, including 3D perspectives, sections, and top-down views. There are no exceptions.
2.  **PRECISE ELEMENT REPLICATION:** The **exact number, size, shape, and location** of all elements shown in the plan—especially windows and doors—must be replicated perfectly. If the plan shows one window, render one window in that exact spot.
3.  **ACCURATE FIXTURE PLACEMENT:** The placement, type, and orientation of all fixtures (toilets, sinks, beds, etc.) must be an **exact match** to their symbols in the plan. Do not move, add, or remove them.
4.  **NO STRUCTURAL INVENTION:** You are **strictly forbidden** from inventing or adding any architectural elements (walls, windows, doors, columns, etc.) that are not explicitly drawn in the 2D plan.
5.  **CONTEXTUAL FURNISHING (SECONDARY TASK):** ONLY AFTER the structure is perfectly replicated, you must furnish the space according to its function, as identified by text labels (e.g., 'غرفة نوم ماستر'). A 'Master Bedroom' must be fully furnished with a bed, nightstands, wardrobe, etc. A 'Bathroom' must contain a toilet and sink. Do not leave labeled rooms empty or partially furnished.
6.  **READ LABELS, IGNORE DIMENSIONS:** You **MUST** read text labels ('Bedroom', 'حمام') for context, but you **MUST IGNORE** all numerical dimensions and construction lines.
7.  **REALISTIC PROPORTIONS:** All objects must have realistic proportions. Avoid strange, distorted, or misplaced items.
8.  **FINAL OUTPUT:** The output must be ONLY the photorealistic image.

**Final Output Format:**
- The entire output must be a single, coherent paragraph ending with the critical instructions block.
- Do not add any other explanations or introductions. Output ONLY the enhanced prompt.`;
                    break;
                case 'style-from-image':
                    systemInstruction = `You are a world-class interior/exterior design expert and an AI prompt engineer. Your task is to analyze the provided reference image(s) and generate a professional, detailed, and accurate prompt that describes the reference style in depth. The prompt should be optimized for an AI image editing model to redesign another space in the same style.

Analyze these aspects carefully and concisely:
- **Design Style:** (e.g., Modern, Classic, Minimal, Industrial, Scandinavian, Bohemian, etc.)
- **Color Palette & Dominant Tones:** (e.g., warm earthy tones, monochromatic grays, vibrant jewel tones)
- **Materials & Textures:** (e.g., natural wood, polished concrete, plush velvet, rough stone, gleaming glass)
- **Furniture Arrangement & Décor Elements:** (e.g., low-profile sofa, ornate chandelier, minimalist wall art, architectural details)
- **Lighting Style:** (e.g., bright natural light from large windows, warm ambient lamps, artificial spotlights)
- **Overall Atmosphere & Mood:** (e.g., cozy and inviting, luxurious and dramatic, calm and serene, professional and sleek)

The final prompt must be a single, cohesive paragraph. Output ONLY the final prompt, without any introductory phrases, commentary, or explanations.`;
                    break;
                case 'image-to-prompt':
                    systemInstruction = `You are a world-class visual analyst and AI prompt engineer. Your task is to analyze the provided image in detail and generate a professional, highly descriptive text prompt that an AI image generation model could use to recreate a similar image.

                    Analyze and describe the following aspects:
                    - **Subject & Composition:** What is the main subject? How is the scene framed? (e.g., close-up, wide shot, rule of thirds).
                    - **Style & Medium:** Is it a photograph, digital painting, watercolor, 3D render? What is the artistic style? (e.g., photorealistic, surreal, anime, art deco).
                    - **Lighting:** Describe the lighting conditions. (e.g., bright studio lighting, dramatic sunset, soft morning light, neon glow).
                    - **Color Palette:** What are the dominant and accent colors? (e.g., warm earthy tones, vibrant neon palette, monochromatic).
                    - **Atmosphere & Mood:** What is the overall feeling? (e.g., serene and peaceful, energetic and chaotic, mysterious and dark).
                    - **Key Details:** Mention any specific, important details, textures, or elements.
                    - **Quality Keywords:** Include terms like "hyperrealistic, 8K, highly detailed, professional photography" where appropriate.

                    The final output must be a single, cohesive paragraph. Output ONLY the final prompt, without any introductory phrases, commentary, or explanations.`;
                    break;
            }

            const parts: any[] = [{ text: userPrompt }];
            if (images && images.length > 0) {
                const imageParts = images.map(img => ({ inlineData: { data: img.data, mimeType: img.mimeType } }));
                parts.unshift(...imageParts);
            }

            const response = await client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts },
                config: {
                    systemInstruction,
                },
            });

            const text = response.text;
            if (!text || !text.trim()) {
                throw new Error('The AI model did not return a valid response for prompt enhancement.');
            }

            return text.trim();

        } catch (error) {
            console.error("Error calling Gemini API for prompt enhancement:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to enhance prompt. ${error.message}`);
            }
            throw new Error('An unknown error occurred while communicating with the AI model.');
        }
    });
};

export const correctText = async (textToCorrect: string): Promise<string> => {
    if (!textToCorrect.trim()) {
        return textToCorrect;
    }

    try {
        const client = getAiClient();
        const systemInstruction = `You are an AI assistant specialized in text correction for an Arabic-speaking user. Your task is to process user-dictated text and fix any mistakes.
- Correct spelling and grammatical errors.
- Ensure proper punctuation. Remove excessive periods or misplaced question marks. Add commas, periods, and question marks where appropriate based on sentence structure and context.
- Do not change the original meaning of the text.
- Respond ONLY with the corrected Arabic text, without any introductory phrases, explanations, or markdown formatting.`;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: textToCorrect,
            config: {
                systemInstruction,
                // Disable thinking for low latency text correction
                thinkingConfig: { thinkingBudget: 0 },
            },
        });

        const text = response.text;
        if (!text || !text.trim()) {
            console.warn('AI text correction failed to return a valid response. Returning original text.');
            return textToCorrect; // Return original on empty response
        }

        return text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for text correction:", error);
        // Re-throw the error so the calling component can handle it and notify the user.
        if (error instanceof Error) {
            throw new Error(`Text correction failed. ${error.message}`);
        }
        throw new Error('An unknown error occurred during text correction.');
    }
};