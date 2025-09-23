import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/genai';

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, mainImageData, referenceImageData, modelId } = req.body;

    const model = genAI.getGenerativeModel({ model: modelId });

    const parts: any[] = [{ text: prompt }];

    if (mainImageData) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: mainImageData.split(',')[1],
        },
      });
    }

    if (referenceImageData) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: referenceImageData.split(',')[1],
        },
      });
    }

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });

    const base64Image = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data)?.inlineData.data;

    if (!base64Image) {
      return res.status(500).json({ error: 'Failed to generate image' });
    }

    res.status(200).json({ base64Image });
  } catch (error: any) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message });
  }
}
