import { GoogleGenAI, Modality } from "@google/genai";
import type { NextApiRequest, NextApiResponse } from 'next';

const aiClient = new GoogleGenAI({
  apiKey: process.env.API_KEY!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, mainImageData, referenceImageData, modelId } = req.body;

    if (!prompt || !modelId) {
      return res.status(400).json({ error: "prompt and modelId are required" });
    }

    const referenceParts = referenceImageData
      ? referenceImageData.map((img: string) => ({
          inlineData: {
            data: img.includes(',') ? img.split(',')[1] : img,
            mimeType: 'image/jpeg',
          },
        }))
      : [];

    const parts = [
      mainImageData
        ? {
            inlineData: {
              data: mainImageData.includes(',') ? mainImageData.split(',')[1] : mainImageData,
              mimeType: 'image/jpeg',
            },
          }
        : null,
      ...referenceParts,
      { text: prompt },
    ].filter(Boolean);

    const response = await aiClient.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error("No content returned from AI model");
    }

    const imagePart = candidate.content.parts.find((p: any) => p.inlineData?.data);
    if (!imagePart) {
      throw new Error("AI model did not return an image");
    }

    return res.status(200).json({ base64Image: imagePart.inlineData.data });
  } catch (error: any) {
    console.error("Error generating image:", error);
    return res.status(500).json({ error: error.message });
  }
}
