const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  // السماح بالطلبات من أي مصدر (Expo Go / التطبيق)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const result = await model.generateContent('قل مرحبا فقط للتأكد أن الاتصال يعمل');
    const text = result.response.text();

    return res.status(200).json({ success: true, message: text });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'حدث خطأ في التحليل', details: error.message });
  }
};