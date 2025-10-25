# 🚀 Sanity Deals - Android App

تطبيق Android لاستخراج العروض من فيسبوك ورفعها تلقائياً إلى Sanity CMS.

[![Build APK](https://github.com/YOUR_USERNAME/sanity-deals-app/actions/workflows/build-apk.yml/badge.svg)](https://github.com/YOUR_USERNAME/sanity-deals-app/actions)

---

## ✨ المميزات

- ✅ استخراج تلقائي للعروض من منشورات فيسبوك
- ✅ OCR لاستخراج النص من الصور
- ✅ رفع مباشر إلى Sanity Dashboard
- ✅ تخزين الكوكيز محلياً
- ✅ بناء APK تلقائياً عبر GitHub Actions
- ✅ واجهة عربية سهلة الاستخدام

---

## 🏗️ البنية التقنية

### Backend:
- **Node.js + Express**
- **Puppeteer** (Web Scraping)
- **Tesseract.js** (OCR)
- **Sharp** (معالجة الصور)
- **استضافة:** Railway

### Frontend:
- **HTML + JavaScript**
- **Capacitor** (تحويل لـ Android)
- **localStorage** (تخزين الكوكيز)

### CI/CD:
- **GitHub Actions**
- **Gradle** (بناء APK)

---

## 📦 التثبيت

### المتطلبات:
- Node.js 18+
- Java 17 (للبناء المحلي)
- Android SDK (اختياري)

### 1. Clone المشروع:

```bash
git clone https://github.com/YOUR_USERNAME/sanity-deals-app.git
cd sanity-deals-app
```

### 2. إعداد Backend:

```bash
cd backend
npm install
npm start
```

### 3. إعداد Frontend:

```bash
cd ../frontend
npm install
npx cap sync
```

---

## 🚀 الاستخدام

### تشغيل محلي:

```bash
# Backend
cd backend
npm start

# Frontend (في نافذة أخرى)
cd frontend
npx cap run android
```

### بناء APK:

```bash
cd frontend/android
./gradlew assembleDebug
```

الملف: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🤖 GitHub Actions

### بناء تلقائي:

كل `push` على `main` يشغل:
1. ✅ تثبيت Dependencies
2. ✅ بناء Capacitor
3. ✅ بناء APK
4. ✅ رفع كـ Artifact

### تحميل APK:

1. اذهب لـ: **Actions** tab
2. اختر آخر **workflow run**
3. حمّل: **sanity-deals-app** من Artifacts

### إنشاء Release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions سيرفع APK تلقائياً في Releases!

---

## 🔐 Environment Variables

### Backend (Railway):

```env
SANITY_PROJECT_ID=pzyaatrc
SANITY_DATASET=production
SANITY_TOKEN=<your_sanity_token>
PORT=3000
```

### Frontend:

عدّل `API_URL` في `www/index.html`:
```javascript
const API_URL = 'https://your-backend.railway.app';
```

---

## 📱 التثبيت على Android

### من GitHub Releases:

1. اذهب لـ: **Releases**
2. حمّل آخر APK
3. ثبّت على الموبايل

### يدوياً:

```bash
adb install app-debug.apk
```

---

## 🍪 إضافة كوكيز فيسبوك

### للوصول للمنشورات الخاصة:

1. افتح Facebook في Chrome
2. DevTools (F12) → Application → Cookies
3. انسخ: `c_user`, `xs`, `datr`
4. في التطبيق، افتح Console:

```javascript
localStorage.setItem('fb_cookies', JSON.stringify([
  {name: 'c_user', value: 'YOUR_VALUE', domain: '.facebook.com'},
  {name: 'xs', value: 'YOUR_VALUE', domain: '.facebook.com'},
  {name: 'datr', value: 'YOUR_VALUE', domain: '.facebook.com'}
]));
```

---

## 🛠️ التطوير

### هيكل المشروع:

```
sanity-deals-app/
├── backend/
│   ├── server.js          # Express API
│   └── package.json
├── frontend/
│   ├── www/
│   │   └── index.html     # واجهة التطبيق
│   ├── android/           # مشروع Android
│   ├── capacitor.config.json
│   └── package.json
├── .github/
│   └── workflows/
│       └── build-apk.yml  # CI/CD
└── README.md
```

### إضافة ميزة جديدة:

1. عدّل `backend/server.js` أو `frontend/www/index.html`
2. اعمل commit:
   ```bash
   git add .
   git commit -m "Feature: new feature"
   git push origin main
   ```
3. GitHub Actions سيبني APK جديد تلقائياً

---

## 🐛 حل المشاكل

### Backend لا يستجيب:

```bash
# تحقق من الـ Logs
railway logs
```

### APK لا يثبت:

- فعّل: **Settings** → **Install Unknown Apps**

### "Network Error":

- تأكد من `API_URL` صحيح في `index.html`
- تأكد من Backend شغال على Railway

### GitHub Actions فشل:

- راجع Logs في Actions tab
- تأكد من Java 17 في الـ workflow

---

## 📊 الإحصائيات

- **Backend**: Node.js + Express
- **Frontend**: Pure JavaScript (لا يوجد framework ثقيل)
- **حجم APK**: ~5-8 MB
- **زمن البناء**: 5-10 دقائق
- **الدعم**: Android 7.0+

---

## 🤝 المساهمة

المساهمات مرحب بها! 

1. Fork المشروع
2. أنشئ branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. افتح Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License.

---

## 📞 الدعم

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/sanity-deals-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/sanity-deals-app/discussions)

---

## 🙏 شكر خاص

- [Puppeteer](https://pptr.dev/)
- [Tesseract.js](https://tesseract.projectnaptha.com/)
- [Capacitor](https://capacitorjs.com/)
- [Railway](https://railway.app/)

---

## 🎯 الخطط المستقبلية

- [ ] دعم Instagram
- [ ] تحسين OCR للعربية
- [ ] إضافة Dark Mode
- [ ] دعم تعدد اللغات
- [ ] Play Store Release

---

Made with ❤️ by Khaled