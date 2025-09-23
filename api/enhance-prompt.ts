import { GoogleGenerativeAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userPrompt, mode, context, image } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const parts = [
      { text: "Enhance the following prompt for an AI image generator:" },
      { text: `User Prompt: ${userPrompt}` },
      ...(mode ? [{ text: `Style: ${mode}` }] : []),
      ...(context ? [{ text: `Context: ${context}` }] : []),
      ...(image ? [{ inlineData: { data: image.split(',')[1], mimeType: 'image/jpeg' } }] : []),
    ];

    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    const enhancedText = result.candidates[0].content.parts[0].text;

    return res.status(200).json({ enhancedText });

  } catch (error) {
    console.error("Error enhancing prompt:", error);
    return res.status(500).json({ error: error.message });
  }
}
