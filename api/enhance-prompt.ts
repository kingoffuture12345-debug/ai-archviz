// api/enhance-prompt.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { enhancePrompt } from '../services/geminiService'; // تأكد من المسار الصحيح

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        const { userPrompt, mode, context, image } = req.body;
        
        // هنا يتم استدعاء الدالة التي أرسلتها
        const enhancedText = await enhancePrompt(userPrompt, mode, context, image);

        res.status(200).json({ success: true, enhancedText });

    } catch (error) {
        console.error('Error enhancing prompt:', error);
        res.status(500).json({ success: false, error: error.message || 'Unknown error' });
    }
}
