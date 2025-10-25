const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 🔐 بيانات Sanity - من Environment Variables
const SANITY_CONFIG = {
  projectId: process.env.SANITY_PROJECT_ID || 'pzyaatrc',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN || 'skuWcwaNM6sbTygxTBWKlH8nI62ZO1NUGNzlVvh1lUgchFlrKMJnUTDfLypjkdufyK42zaJlmHFKvzLlFKEMDlfzr9OkPiEubTUfVi6GFNx0kVLWEneIqTQcXkq3g8FKAsPOZimEkgERlHezYri2uweFM8lezcKTK4wT6z730aDKhDkG5fgX'
};

let browserInstance = null;

// دالة للحصول على Browser
async function getBrowser() {
  if (!browserInstance) {
    console.log('🚀 إطلاق Puppeteer...');
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });
  }
  return browserInstance;
}

// ✅ جلب المطاعم
app.get('/api/fetch-stores', async (req, res) => {
  try {
    const query = encodeURIComponent('*[_type == "Restaurants"]{_id, name, name_ar, name_en, title, "displayName": coalesce(name_ar, name_en, name, title)}');
    const url = `https://${SANITY_CONFIG.projectId}.api.sanity.io/v2021-06-07/data/query/${SANITY_CONFIG.dataset}?query=${query}`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${SANITY_CONFIG.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const stores = (response.data.result || []).map(store => {
      const name = store.displayName || store.name_ar || store.name_en || store.name || `Restaurant-${store._id.substring(0, 8)}`;
      return {
        _id: store._id,
        name: name,
        name_ar: store.name_ar || name,
        name_en: store.name_en || name
      };
    }).filter(store => store.name);
    
    res.json({ success: true, stores });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ استخراج بيانات فيسبوك
app.post('/api/extract-fb-data', async (req, res) => {
  const { url, cookies } = req.body;
  
  if (!url) {
    return res.status(400).json({ success: false, error: 'رابط فيسبوك مطلوب' });
  }
  
  let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    
    // إضافة الكوكيز
    if (cookies && Array.isArray(cookies)) {
      await page.setCookie(...cookies);
    }
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    // استخراج البيانات
    const postData = await page.evaluate(() => {
      // النص
      const textSelectors = [
        '[data-ad-preview="message"]',
        'div[dir="auto"]',
        'div[data-testid="post_message"]'
      ];
      let text = '';
      for (const sel of textSelectors) {
        const el = document.querySelector(sel);
        if (el?.innerText) {
          text = el.innerText;
          break;
        }
      }

      // الصورة
      const images = Array.from(document.querySelectorAll('img'))
        .filter(img => img.src?.includes('fbcdn') && img.naturalWidth > 200)
        .sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight));
      
      return { text, imageUrl: images[0]?.src || '' };
    });

    // تحميل الصورة
    let imageBase64 = null;
    if (postData.imageUrl) {
      try {
        const imgResp = await page.goto(postData.imageUrl, { timeout: 30000 });
        const buffer = await imgResp.buffer();
        imageBase64 = buffer.toString('base64');
      } catch (e) {
        console.error('فشل تحميل الصورة:', e.message);
      }
    }

    await page.close();

    // OCR إذا لم يوجد نص
    let finalData;
    if (!postData.text && imageBase64) {
      const ocrText = await performOCR(imageBase64);
      finalData = parseDealText(ocrText);
      finalData.extractedFrom = 'OCR';
    } else {
      finalData = parseDealText(postData.text);
      finalData.extractedFrom = 'Text';
    }
    
    res.json({
      success: true,
      data: {
        ...finalData,
        image_url: postData.imageUrl,
        image_base64: imageBase64
      }
    });

  } catch (error) {
    if (browser) await browser.close();
    res.status(500).json({ success: false, error: error.message });
  }
});

// OCR
async function performOCR(imageBase64) {
  try {
    const buffer = Buffer.from(imageBase64, 'base64');
    const { data: { text } } = await Tesseract.recognize(buffer, 'ara+eng');
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    return '';
  }
}

// تحليل النص
function parseDealText(text) {
  const lines = text.split('\n').filter(l => l.trim());
  
  // استخراج السعر
  const priceMatch = text.match(/(\d+)\s*(?:جنيه|ج)/);
  const price = priceMatch ? parseInt(priceMatch[1]) : 0;
  
  // اسم العرض
  const name_ar = lines[0] || 'عرض خاص';
  const name_en = translateText(name_ar);
  
  // الوصف
  const description_ar = lines.slice(1).join(' ') || 'عرض مميز';
  const description_en = translateText(description_ar);
  
  // Slug
  const slug = name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50) || `deal-${Date.now()}`;
  
  // التواريخ
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return {
    name_ar,
    name_en,
    description_ar,
    description_en,
    price,
    slug,
    validFrom: today.toISOString().split('T')[0],
    validTo: nextWeek.toISOString().split('T')[0]
  };
}

// ترجمة بسيطة
function translateText(arabicText) {
  const dict = {
    'عرض': 'offer', 'خاص': 'special', 'فراخ': 'chicken',
    'ساندويتش': 'sandwich', 'وجبة': 'meal'
  };
  
  let text = arabicText;
  for (const [ar, en] of Object.entries(dict)) {
    text = text.replace(new RegExp(ar, 'gi'), en);
  }
  
  return text.replace(/[\u0600-\u06FF]/g, '').replace(/\s+/g, ' ').trim() || 'special offer';
}

// ✅ رفع الصورة إلى Sanity
app.post('/api/upload-image', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    
    const buffer = Buffer.from(imageBase64, 'base64');
    const processed = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();
    
    const formData = new FormData();
    formData.append('file', processed, { filename: `deal-${Date.now()}.jpg` });
    
    const uploadUrl = `https://${SANITY_CONFIG.projectId}.api.sanity.io/v2021-06-07/assets/images/${SANITY_CONFIG.dataset}`;
    
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${SANITY_CONFIG.token}`
      }
    });
    
    res.json({ success: true, assetId: response.data.document._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ رفع العرض الكامل
app.post('/api/upload-deal', async (req, res) => {
  try {
    const { deal } = req.body;
    
    const doc = {
      _type: 'deals',
      _id: deal.slug,
      name_ar: deal.name_ar,
      name_en: deal.name_en,
      description_ar: deal.description_ar,
      description_en: deal.description_en,
      price: parseFloat(deal.price) || 0,
      validFrom: deal.validFrom,
      validTo: deal.validTo,
      slug: { _type: 'slug', current: deal.slug },
      store: { _ref: deal.store, _type: 'reference' }
    };

    if (deal.imageAssetId) {
      doc.image = {
        _type: 'image',
        asset: { _type: 'reference', _ref: deal.imageAssetId },
        crop: { _type: 'sanity.imageCrop', bottom: 0, left: 0, right: 0, top: 0 },
        hotspot: { _type: 'sanity.imageHotspot', height: 1, width: 1, x: 0.5, y: 0.5 }
      };
    }

    const mutateUrl = `https://${SANITY_CONFIG.projectId}.api.sanity.io/v2021-06-07/data/mutate/${SANITY_CONFIG.dataset}`;
    
    const response = await axios.post(mutateUrl, {
      mutations: [{ createOrReplace: doc }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SANITY_CONFIG.token}`
      }
    });

    res.json({ success: true, dealId: doc._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

// Cleanup
process.on('SIGINT', async () => {
  if (browserInstance) await browserInstance.close();
  process.exit();
});