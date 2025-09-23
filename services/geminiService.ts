// geminiService.ts
let isApiBusy = false;

async function withApiLock(apiCall: () => Promise<any>) {
  if (isApiBusy) throw new Error("The AI is currently busy. Please wait.");
  isApiBusy = true;
  try {
    return await apiCall();
  } finally {
    setTimeout(() => { isApiBusy = false; }, 300);
  }
}

export const generateDesign = async (prompt: string, mainImage: string, referenceImage?: string[], modelId = "gemini-2.5-flash-image-preview") => {
  return withApiLock(async () => {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, mainImageData: mainImage, referenceImageData: referenceImage, modelId }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Server returned an error: ${err.error}`);
    }

    const data = await response.json();
    return data.base64Image;
  });
};

export const enhancePrompt = async (userPrompt: string, mode?: string, context?: any, image?: string) => {
  return withApiLock(async () => {
    const response = await fetch("/api/enhance-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userPrompt, mode, context, image }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Server returned an error: ${err.error}`);
    }

    const data = await response.json();
    return data.enhancedText;
  });
};
