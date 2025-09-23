// api/generate.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, mainImageData, referenceImageData, modelId } = req.body;

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'Missing GOOGLE_API_KEY in environment' });
    }

    // استدعاء Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                ...(mainImageData
                  ? [{ inline_data: { data: mainImageData.data, mime_type: mainImageData.mimeType } }]
                  : []),
                ...(referenceImageData
                  ? referenceImageData.map((img) => ({
                      inline_data: { data: img.data, mime_type: img.mimeType },
                    }))
                  : []),
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // تحقق من الرد
    if (!data || data.error) {
      return res.status(500).json({ error: data.error || 'Unknown error from Gemini API' });
    }

    // Gemini يرجع Base64 غالبًا (نعدل حسب الموديل)
    res.status(200).json({ image: data });
  } catch (error) {
    console.error('Error in /api/generate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
