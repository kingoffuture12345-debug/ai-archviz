// services/geminiService.ts
export const generateDesign = async (
  prompt: string,
  mainImageData?: string,
  referenceImageData?: string[],
  modelId: string = "gemini-2.5-flash-image-preview"
): Promise<string> => {
  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        mainImageData,
        referenceImageData,
        modelId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Unknown error");
    }

    const data = await response.json();
    return data.base64Image;
  } catch (error: any) {
    console.error("Error calling generate-image API:", error);
    throw new Error(`Failed to generate design. ${error.message}`);
  }
};

export const enhancePrompt = async (
  userPrompt: string,
  mode?: string,
  context?: any,
  image?: string
): Promise<string> => {
  try {
    const response = await fetch("/api/enhance-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userPrompt, mode, context, image }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Unknown error");
    }

    const data = await response.json();
    return data.enhancedText;
  } catch (error: any) {
    console.error("Error calling enhance-prompt API:", error);
    throw new Error(`Failed to enhance prompt. ${error.message}`);
  }
};
