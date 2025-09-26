// api/enhance-prompt.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { enhancePrompt } from '../services/geminiService'; // تأكد من المسار (العودة للخلف ثم مجلد services)

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // التحقق من طريقة الطلب
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        // استخراج البيانات من جسم الطلب
        const { userPrompt, mode, context, image } = req.body;
        
        // استدعاء دالة المنطق الفعلي
        const enhancedText = await enhancePrompt(userPrompt, mode, context, image);

        // إرجاع النتيجة
        res.status(200).json({ success: true, enhancedText });

    } catch (error) {
        console.error('Error enhancing prompt:', error);
        // إرجاع الخطأ إلى الواجهة الأمامية
        res.status(500).json({ success: false, error: error.message || 'Unknown error' });
    }
}
