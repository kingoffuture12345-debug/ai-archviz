const express = require('express');
const { GoogleGenerativeAI } = require('@google/genai');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'https://ai-archviz.vercel.app',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.post('/generate-image', async (req, res) => {
  try {
    const { prompt, mainImageData, referenceImageData, modelId } = req.body;

    const model = genAI.getGenerativeModel({ model: modelId });

    const parts = [
      { text: prompt },
    ];

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

    res.json({
      base64Image: result.candidates[0].content.parts[0].inlineData.data,
    });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/enhance-prompt', async (req, res) => {
  try {
    const { userPrompt, mode, context, image } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const parts = [
      { text: "Enhance the following prompt for an AI image generator:" },
      { text: `User Prompt: ${userPrompt}` },
    ];

    if (mode) {
      parts.push({ text: `Style: ${mode}` });
    }
    if (context) {
      parts.push({ text: `Context: ${context}` });
    }
    if (image) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: image.split(',')[1],
        },
      });
    }

    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    const enhancedText = result.candidates[0].content.parts[0].text;

    res.json({ enhancedText });
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
