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
                
                // معالجة خاصة عند نفاد الحصة
                if (errorData.error?.status === "RESOURCE_EXHAUSTED") {
                    throw new Error("تم استنفاد حصة API الخاصة بك. حاول لاحقاً أو تحقق من خطة الاشتراك المدفوعة.");
                }

                throw new Error(`Server returned an error: ${errorData.error?.message || "Unknown error"}`);
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
