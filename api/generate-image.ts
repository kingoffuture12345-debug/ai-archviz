// api/generate-image.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { generateDesign } from '../services/geminiService'; // تأكد من المسار الصحيح

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        const { prompt, mainImageData, referenceImageData, modelId } = req.body;
        
        // هنا يتم استدعاء الدالة التي أرسلتها
        const base64Image = await generateDesign(prompt, mainImageData, referenceImageData, modelId);

        res.status(200).json({ success: true, base64Image });

    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({ success: false, error: error.message || 'Unknown error' });
    }
}
