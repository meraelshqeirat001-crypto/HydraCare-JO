# HydraCare-JO — دليل التشغيل والنشر

تطبيق ويب تقدمي (PWA) ثنائي اللغة لمتابعة شرب الماء والتوعية بالوقاية من الجفاف. يتضمن وضعاً محلياً للتجربة، وتكاملاً اختيارياً مع Firebase Authentication وCloud Firestore.

## 1) محتويات الملف
- `index.html` الواجهة الرئيسية.
- `styles.css` التصميم المتجاوب.
- `app.js` وظائف التطبيق وتسجيل الماء وتسجيل الدخول.
- `firebase-config.js` إعدادات مشروع Firebase (يجب تعبئتها).
- `manifest.json` تعريف تثبيت التطبيق.
- `sw.js` التخزين المؤقت والعمل دون اتصال جزئياً.
- `firestore.rules` قواعد حماية بيانات المستخدمين.
- `icons/icon.svg` أيقونة التطبيق.

## 2) إنشاء Firebase وربطه
1. افتح https://console.firebase.google.com وأنشئ مشروعاً باسم `HydraCare-JO`.
2. من Project settings > General > Your apps، أضف تطبيق Web (رمز `</>`).
3. انسخ إعدادات `firebaseConfig` والصق القيم في `firebase-config.js` بدلاً من `YOUR_...`.
4. من Authentication > Sign-in method فعّل Email/Password.
5. من Firestore Database أنشئ قاعدة بيانات (ابدأ بوضع Production).
6. افتح تبويب Rules وانسخ محتوى `firestore.rules` ثم اضغط Publish.
7. أضف نطاق GitHub Pages إلى Authentication > Settings > Authorized domains (مثلاً `username.github.io`).

ملاحظة: إعدادات Firebase Web ليست كلمة مرور، لكن يجب إبقاء قواعد Firestore المنشورة كما هي وعدم فتح قاعدة البيانات للجميع.

## 3) تجربة محلية
لا تفتح `index.html` بالنقر المزدوج؛ وحدات JavaScript وService Worker تحتاج خادماً محلياً.
- ثبّت Visual Studio Code.
- افتح مجلد المشروع.
- ثبّت إضافة Live Server.
- اضغط بزر الفأرة الأيمن على `index.html` ثم Open with Live Server.

أو باستخدام Python من داخل مجلد المشروع:
```bash
python -m http.server 8000
```
ثم افتح `http://localhost:8000`.

## 4) رفع المشروع إلى GitHub
أنشئ مستودعاً جديداً باسم `HydraCare-JO` على https://github.com ثم افتح Terminal داخل مجلد المشروع وشغّل:

```bash
git init
git add .
git commit -m "Initial HydraCare-JO app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/HydraCare-JO.git
git push -u origin main
```
استبدل `YOUR-USERNAME` باسم حساب GitHub الخاص بك.

## 5) نشره عبر GitHub Pages
1. افتح المستودع على GitHub.
2. Settings > Pages.
3. ضمن Build and deployment اختر `Deploy from a branch`.
4. اختر Branch: `main` والمجلد `/ (root)` ثم Save.
5. انتظر اكتمال النشر. سيكون الرابط غالباً:
   `https://YOUR-USERNAME.github.io/HydraCare-JO/`

## 6) أوامر التحديث بعد أي تعديل
```bash
git add .
git commit -m "Update HydraCare-JO"
git push
```
انتظر تحديث GitHub Pages ثم حدّث الصفحة. إذا بقي إصدار قديم، أغلق التطبيق وافتحه مجدداً لمسح أثر التخزين المؤقت.

## 7) التذكيرات — ملاحظة مهمة
زر التذكيرات يطلب إذن الإشعارات ويعمل كتذكير دوري كل ساعة أثناء بقاء التطبيق مفتوحاً/نشطاً. لا يضمن هذا الإصدار إشعارات مجدولة عندما يكون التطبيق مغلقاً. للتذكير الموثوق في الخلفية نحتاج لاحقاً إعداد Firebase Cloud Messaging (FCM) مع مفاتيح Web Push وخدمة خلفية/وظيفة مجدولة. دعم إشعارات الويب يختلف بين المتصفحات وأنظمة iOS وAndroid.

## 8) تنبيه صحي
التطبيق للتثقيف والمتابعة العامة وليس أداة تشخيص أو علاج. لا تفرض هدفاً موحداً للماء على الجميع؛ بعض الحالات الطبية تتطلب تقييد السوائل. ينبغي طلب المساعدة الطبية العاجلة عند ظهور ارتباك أو إغماء أو صعوبة الاستيقاظ أو تدهور شديد.

## 9) معلومات تقنية
- لا توجد مفاتيح Firebase حقيقية ضمن الحزمة؛ أدخل إعدادات مشروعك أنت.
- عند عدم ضبط Firebase يعمل تسجيل الماء محلياً على الجهاز فقط.
- عند تفعيل Firebase، تتم مزامنة الهدف والسجل مع حساب المستخدم.
