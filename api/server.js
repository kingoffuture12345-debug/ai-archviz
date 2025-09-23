const express = require('express');
const { GoogleGenerativeAI } = require('@google/genai');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Helper function to safely extract base64 image
function safeGetImage(result) {
    return result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data)?.inlineData?.data || null;
}

// Helper function to safely extract text
function safeGetText(result) {
    return result?.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || "";
}

const generateImageHandler = async (req, res) => {
    try {
        const { prompt, mainImageData, referenceImageData, modelId } = req.body;

        const model = genAI.getGenerativeModel({ model: modelId });

        const parts = [{ text: prompt }];

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
            success: true,
            base64Image: safeGetImage(result)
        });
    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Unknown server error'
        });
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
                    data: image.split(',')[1],
                },
            });
        }

        const result = await model.generateContent({ contents: [{ role: "user", parts }] });

        res.json({
            success: true,
            enhancedText: safeGetText(result)
        });
    } catch (error) {
        console.error("Error enhancing prompt:", error);
        res.status(500).json({
            success: false,
            error: error.message || 'Unknown server error'
        });
    }
};

app.post('/api/generate-image', generateImageHandler);
app.post('/api/enhance-prompt', enhancePromptHandler);

module.exports = app;
