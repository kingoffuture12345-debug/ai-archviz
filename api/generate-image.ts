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
        const { prompt, mainImageData, referenceImageData, modelId } = req.body;

        const model = genAI.getGenerativeModel({ model: modelId });

        const parts = [{ text: prompt }];

        if (mainImageData) {
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: mainImageData.split(',')[1] } });
        }
        if (referenceImageData) {
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: referenceImageData.split(',')[1] } });
        }

        const result = await model.generateContent({ contents: [{ role: 'user', parts }] });

        const image = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data)?.inlineData?.data;

        res.status(200).json({ success: true, base64Image: image });

    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({ success: false, error: error.message || 'Unknown error' });
    }
}
