import { GoogleGenerativeAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, mainImageData, referenceImageData, modelId } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: modelId });

    const parts = [
      { text: prompt },
      ...(mainImageData ? [{ inlineData: { data: mainImageData.split(',')[1], mimeType: 'image/jpeg' } }] : []),
      ...(referenceImageData ? [{ inlineData: { data: referenceImageData.split(',')[1], mimeType: 'image/jpeg' } }] : []),
    ];

    const result = await model.generateContent({ contents: [{ role: "user", parts }] });

    const base64Image = result.candidates[0].content.parts[0].inlineData.data;
    return res.status(200).json({ base64Image });

  } catch (error) {
    console.error("Error generating image:", error);
    return res.status(500).json({ error: error.message });
  }
}
