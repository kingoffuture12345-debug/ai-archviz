import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';

const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { userPrompt, mode, context, image } = req.body;

        if (!userPrompt) {
            res.status(400).json({ error: 'Missing required field: userPrompt' });
            return;
        }

        const parts: any[] = [
            { text: "Enhance the following prompt for an AI image generator:" },
            { text: `User Prompt: ${userPrompt}` },
        ];

        if (mode) {
            parts.push({ text: `Style: ${mode}` });
        }

        if (context) {
            parts.push({ text: `Context: ${JSON.stringify(context)}` });
        }

        if (image) {
            parts.unshift({
                inlineData: {
                    data: image.split(',')[1],
                    mimeType: 'image/jpeg'
                }
            });
        }

        const response = await client.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: { parts },
            config: { responseModalities: [Modality.TEXT] }
        });

        const candidate = response.candidates?.[0];
        if (!candidate || !candidate.content?.parts) {
            throw new Error('No enhanced prompt returned from AI model');
        }

        const textPart = candidate.content.parts.find((p: any) => p.text);
        if (!textPart) {
            throw new Error('AI model returned content without text');
        }

        res.status(200).json({ enhancedText: textPart.text });
    } catch (error: any) {
        console.error('Error enhancing prompt:', error);
        res.status(500).json({ error: error.message || 'Unknown error' });
    }
}
