import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        const { userPrompt, mode, context, image } = req.body;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const parts = [
            { text: "Enhance the following prompt for an AI image generator:" },
            { text: `User Prompt: ${userPrompt}` },
        ];

        if (mode) parts.push({ text: `Style: ${mode}` });
        if (context) parts.push({ text: `Context: ${context}` });
        if (image) parts.push({ inlineData: { mimeType: 'image/jpeg', data: image.split(',')[1] } });

        const result = await model.generateContent({ contents: [{ role: "user", parts }] });

        const enhancedText = result?.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;

        res.status(200).json({ success: true, enhancedText });

    } catch (error) {
        console.error("Error enhancing prompt:", error);
        res.status(500).json({ success: false, error: error.message || 'Unknown error' });
    }
}
