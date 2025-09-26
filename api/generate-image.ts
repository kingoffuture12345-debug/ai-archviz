// api/generate-image.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { generateDesign } from '../services/geminiService'; // تأكد من المسار (العودة للخلف ثم مجلد services)

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // التحقق من طريقة الطلب
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        // استخراج البيانات من جسم الطلب
        const { prompt, mainImageData, referenceImageData, modelId } = req.body;
        
        // استدعاء دالة المنطق الفعلي
        const base64Image = await generateDesign(prompt, mainImageData, referenceImageData, modelId);

        // إرجاع النتيجة
        res.status(200).json({ success: true, base64Image });

    } catch (error) {
        console.error('Error generating image:', error);
        // إرجاع الخطأ إلى الواجهة الأمامية (مهم لحل مشكلة 'Failed to generate design')
        res.status(500).json({ success: false, error: error.message || 'Unknown error' });
    }
}
