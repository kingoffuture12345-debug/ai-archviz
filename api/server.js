import express from 'express';
import { GoogleGenerativeAI } from '@google/genai';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

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
  try {
    const { userPrompt, mode, context, image } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const parts = [
      { text: "Enhance the following prompt for an AI image generator:" },
      { text: `User Prompt: ${userPrompt}` },
    ];

    if (mode) parts.push({ text: `Style: ${mode}` });
    if (context) parts.push({ text: `Context: ${context}` });
    if (image) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: image.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }

    const result = await model.generateContent({ contents: [{ role: "user", parts }] });

    const enhancedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!enhancedText) {
      throw new Error("The AI did not return enhanced text.");
    }

    res.json({ enhancedText });
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    res.status(500).json({ error: error.message });
  }
};

app.post('/api/generate-image', generateImageHandler);
app.post('/api/enhance-prompt', enhancePromptHandler);

export default app;
