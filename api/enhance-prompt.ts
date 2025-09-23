export const enhancePrompt = async (userPrompt, mode, context, image) => {
    return withApiLock(async () => {
        try {
            const response = await fetch('/api/enhance-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userPrompt, mode, context, image }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                if (errorData.error?.status === "RESOURCE_EXHAUSTED") {
                    throw new Error("تم استنفاد حصة API الخاصة بك. حاول لاحقاً أو تحقق من خطة الاشتراك المدفوعة.");
                }

                throw new Error(`Server returned an error: ${errorData.error?.message || "Unknown error"}`);
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
