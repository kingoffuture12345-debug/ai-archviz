import { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { prompt, mainImageData, referenceImageData, modelId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const parts: any[] = [{ text: prompt }];

    if (mainImageData) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: mainImageData.split(",")[1] } });
    }

    if (referenceImageData) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: referenceImageData.split(",")[1] } });
    }

    const response = await client.models.generateContent({
      model: modelId,
      contents: { parts },
      config: { responseModalities: ["IMAGE", "TEXT"] },
    });

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content?.parts) {
      throw new Error("No image generated.");
    }

    const imagePart = candidate.content.parts.find((p: any) => p.inlineData?.data);
    if (!imagePart) throw new Error("No image in response.");

    res.status(200).json({ base64Image: imagePart.inlineData.data });
  } catch (error: any) {
    console.error("Generate Image Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
