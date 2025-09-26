import express from 'express';
import { GoogleGenAI } from '@google/genai'; // 💡 تم تعديل الاسم من GoogleGenerativeAI
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 💡 استخدام الاسم الصحيح
const genAI = new GoogleGenAI(process.env.API_KEY); 

const generateImageHandler = async (req, res) => {
  try {
    const { prompt, mainImageData, referenceImageData, modelId } = req.body;

    const model = genAI.getGenerativeModel({ model: modelId });

    const parts = [{ text: prompt }];

    if (mainImageData) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: mainImageData.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }

    if (referenceImageData) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: referenceImageData.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });

    if (!result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
      throw new Error("The AI did not return an image.");
    }

    res.json({
      base64Image: result.candidates[0].content.parts[0].inlineData.data,
    });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message });
  }
};

const enhancePromptHandler = async (req, res) => {
    // يمكنك إعادة إضافة كود enhancePromptHandler هنا إذا كنت تحتاجه
};

app.post('/api/generate-image', generateImageHandler);
// app.post('/api/enhance-prompt', enhancePromptHandler); // أضف هذا السطر إذا أعدت الكود أعلاه

export default app;
