import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';

const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { prompt, mainImageData, referenceImageData, modelId } = req.body;

        if (!prompt || !modelId) {
            res.status(400).json({ error: 'Missing required fields: prompt or modelId' });
            return;
        }

        const parts: any[] = [
            { text: prompt }
        ];

        if (mainImageData) {
            parts.unshift({
                inlineData: {
                    data: mainImageData.split(',')[1],
                    mimeType: 'image/jpeg'
                }
            });
        }

        if (referenceImageData) {
            referenceImageData.forEach((img: string) => {
                parts.push({
                    inlineData: {
                        data: img.split(',')[1],
                        mimeType: 'image/jpeg'
                    }
                });
            });
        }

        const response = await client.models.generateContent({
            model: modelId,
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });

        const candidate = response.candidates?.[0];
        if (!candidate || !candidate.content?.parts) {
            throw new Error('No image returned from AI model');
        }

        const imagePart = candidate.content.parts.find((p: any) => p.inlineData?.data);
        if (!imagePart) {
            throw new Error('AI model returned content without image');
        }

        res.status(200).json({ base64Image: imagePart.inlineData.data });
    } catch (error: any) {
        console.error('Error generating image:', error);
        res.status(500).json({ error: error.message || 'Unknown error' });
    }
}
