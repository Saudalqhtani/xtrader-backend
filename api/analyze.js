const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL_LABELS = {
  scalp: 'سكالب',
  swing: 'سوينج',
};

const PROMPT = `أنت نظام تحليل فني احترافي لسوق التداول يعمل بمنهجية 12 وكيل ذكاء اصطناعي متخصص (اتجاه، هيكل سعري، مناطق عرض وطلب، فجوات سعرية FVG، زخم وحجم، سيولة، أنماط شموع، توافق فريمات، إلخ).

حلّل صور الشارت المرفقة بصريًا فقط (بدون أي بيانات خارجية)، وأصدر توصية تداول احترافية.

أعد ردك بصيغة JSON فقط، بدون أي نص إضافي قبله أو بعده، مطابقًا تمامًا لهذا الهيكل:

{
  "decision": "شراء" أو "بيع",
  "successRate": رقم صحيح بين 60 و95,
  "entry": رقم عشري (سعر الدخول المقترح),
  "stopLoss": رقم عشري,
  "targets": [
    { "label": "الهدف الأول", "value": رقم عشري, "description": "وصف قصير" },
    { "label": "الهدف الثاني", "value": رقم عشري, "description": "وصف قصير" }
  ],
  "recommendationText": "فقرة قصيرة تلخص الصفقة (سطرين)",
  "managementTip": "نصيحة إدارة صفقة قصيرة",
  "entryReason": "فقرة تفصيلية تشرح سبب الدخول بناءً على ما يظهر في الصور",
  "detailedPoints": [
    { "title": "الاتجاه العام", "desc": "..." },
    { "title": "الهيكل السعري", "desc": "..." },
    { "title": "مناطق العرض والطلب", "desc": "..." },
    { "title": "الفجوات السعرية (FVG)", "desc": "..." },
    { "title": "الزخم والحجم", "desc": "..." },
    { "title": "السيولة", "desc": "..." }
  ]
}

كل النصوص باللغة العربية. الأرقام يجب أن تكون أرقامًا فعلية وليست نصوصًا.`;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { images, modelId, symbol } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'لم يتم إرفاق أي صور' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const imageParts = images.map((img) => ({
      inlineData: {
        data: img.base64,
        mimeType: img.mimeType || 'image/jpeg',
      },
    }));

    const result = await model.generateContent([PROMPT, ...imageParts]);
    const rawText = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({ error: 'تعذر تفسير رد النموذج', raw: rawText });
    }

    parsed.modelLabel = MODEL_LABELS[modelId] || modelId;
    parsed.symbol = symbol || 'XAU/USD';

    return res.status(200).json(parsed);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'حدث خطأ في التحليل', details: error.message });
  }
};