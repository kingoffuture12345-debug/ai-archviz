import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/genai';

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userPrompt, mode, context, image } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const parts: any[] = [
      { text: "Enhance the following prompt for an AI image generator:" },
      { text: `User Prompt: ${userPrompt}` },
    ];

    if (mode) parts.push({ text: `Style: ${mode}` });
    if (context) parts.push({ text: `Context: ${context}` });
    if (image) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: image.split(',')[1],
        },
      });
    }

    const result = await model.generateContent({ contents: [{ role: "user", parts }] });

    const enhancedText = result.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;

    if (!enhancedText) {
      return res.status(500).json({ error: 'Failed to enhance prompt' });
    }

    res.status(200).json({ enhancedText });
  } catch (error: any) {
    console.error('Error enhancing prompt:', error);
    res.status(500).json({ error: error.message });
  }
}
