# 🕌 نظام المكالمات والدردشة المتكامل - أكاديمية المحرون

## 📋 نظرة عامة

تم بناء نظام مكالمات ودردشة متكامل بالكامل من الصفر باستخدام:
- **WebRTC** للمكالمات المرئية والصوتية
- **Socket.io** لخادم الإشارات
- **Firebase** لتخزين الرسائل والبيانات
- **React/Next.js** للواجهة الأمامية

## 🏗️ البنية المعمارية

### المكونات الأساسية:

1. **خادم الإشارات (Signaling Server)**
   - `server/signaling-server.js`
   - يدير اتصالات WebRTC
   - يتعامل مع الغرف والمشاركين

2. **مدير WebRTC (WebRTC Manager)**
   - `src/lib/webrtc-manager.ts`
   - يدير اتصالات الند للند
   - يتعامل مع الوسائط والبيانات

3. **نظام الدردشة**
   - `src/components/chat/`
   - دردشة فورية مع Firebase
   - دعم الملفات والإيموجي

4. **واجهات المكالمات المحسنة**
   - `src/components/EnhancedVideoCall.tsx`
   - `src/components/EnhancedCallControls.tsx`
   - `src/components/EnhancedVideoDisplay.tsx`

## 🚀 التشغيل السريع

### 1. تثبيت التبعيات

```bash
# تثبيت تبعيات العميل
npm install

# تثبيت تبعيات الخادم
cd server
npm install
cd ..
```

### 2. إعداد متغيرات البيئة

```bash
# نسخ ملف الإعدادات
cp .env.local.example .env.local

# تحديث القيم في .env.local
NEXT_PUBLIC_SIGNALING_SERVER_URL=http://localhost:3002
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
# ... باقي إعدادات Firebase
```

### 3. تشغيل النظام

```bash
# تشغيل النظام كاملاً (خادم + عميل)
npm run start:system

# أو تشغيل كل جزء منفصل:
# تشغيل خادم الإشارات
npm run start:signaling

# تشغيل العميل
npm run dev
```

## 🔧 الاستخدام

### إنشاء مكالمة جديدة

```tsx
import EnhancedVideoCall from '@/components/EnhancedVideoCall';

function MyComponent() {
  return (
    <EnhancedVideoCall
      targetUserId="user123"
      targetUserName="أحمد محمد"
      targetUserAvatar="/avatar.jpg"
      autoStart={true}
      onStartCall={() => console.log('بدأت المكالمة')}
      onStartVideoCall={() => console.log('مكالمة فيديو')}
    />
  );
}
```

### استخدام نظام الدردشة

```tsx
import ChatManager from '@/components/chat/ChatManager';

function ChatComponent() {
  return (
    <ChatManager
      recipientId="user123"
      recipientName="أحمد محمد"
      recipientAvatar="/avatar.jpg"
      onStartCall={() => console.log('بدء مكالمة صوتية')}
      onStartVideoCall={() => console.log('بدء مكالمة فيديو')}
    />
  );
}
```

### استخدام WebRTC مباشرة

```tsx
import { useWebRTC } from '@/hooks/useWebRTC';

function VideoCallComponent() {
  const {
    isConnected,
    localVideoRef,
    remoteVideoRef,
    registerUser,
    joinRoom,
    toggleVideo,
    toggleAudio,
    endCall
  } = useWebRTC();

  useEffect(() => {
    registerUser('user123', 'أحمد محمد');
  }, []);

  const startCall = async () => {
    await joinRoom('room123', true);
  };

  return (
    <div>
      <video ref={localVideoRef} autoPlay muted />
      <video ref={remoteVideoRef} autoPlay />
      <button onClick={startCall}>بدء المكالمة</button>
      <button onClick={toggleVideo}>تبديل الفيديو</button>
      <button onClick={toggleAudio}>تبديل الصوت</button>
      <button onClick={endCall}>إنهاء المكالمة</button>
    </div>
  );
}
```

## 🎛️ الميزات المتاحة

### مكالمات الفيديو:
- ✅ مكالمات فيديو عالية الجودة
- ✅ تحكم في الكاميرا والميكروفون
- ✅ مشاركة الشاشة
- ✅ مؤشرات جودة الاتصال
- ✅ عداد وقت المكالمة
- ✅ واجهة متجاوبة وجميلة

### نظام الدردشة:
- ✅ رسائل فورية
- ✅ دعم الإيموجي
- ✅ رفع الملفات والصور
- ✅ تسجيل الرسائل الصوتية
- ✅ مؤشرات القراءة والكتابة
- ✅ تخزين دائم في Firebase

### التصميم:
- ✅ تصميم إسلامي أنيق
- ✅ ألوان متناسقة
- ✅ رسوم متحركة سلسة
- ✅ دعم اللغة العربية
- ✅ متجاوب مع جميع الأحجام

## 🔍 مراقبة النظام

### حالة خادم الإشارات:
```
GET http://localhost:3002/status
```

### الغرف النشطة:
```
GET http://localhost:3002/rooms
```

## 🛠️ التطوير والتخصيص

### إضافة ميزات جديدة للمكالمات:

```typescript
// في src/lib/webrtc-manager.ts
export class WebRTCManager {
  // إضافة ميزة جديدة
  async enableFeature() {
    // منطق الميزة الجديدة
  }
}
```

### تخصيص واجهة الدردشة:

```tsx
// في src/components/chat/ChatInterface.tsx
// تخصيص الألوان والأنماط
const customTheme = {
  primaryColor: '#22c55e',
  secondaryColor: '#f59e0b',
  // ...
};
```

### إضافة أنواع رسائل جديدة:

```typescript
// في src/components/chat/ChatMessage.tsx
type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'location';
```

## 🔒 الأمان والخصوصية

- 🔐 تشفير الاتصالات باستخدام WebRTC
- 🛡️ مصادقة المستخدمين عبر Firebase
- 🔒 تخزين آمن للرسائل
- 🚫 عدم تخزين بيانات المكالمات

## 📊 الأداء والتحسين

- ⚡ اتصالات مباشرة (P2P)
- 🚀 تحميل سريع للواجهات
- 💾 تخزين ذكي للرسائل
- 📱 تحسين للأجهزة المحمولة

## 🐛 استكشاف الأخطاء

### مشاكل شائعة:

1. **لا يعمل الفيديو/الصوت:**
   - تأكد من أذونات المتصفح
   - تحقق من إعدادات الكاميرا/الميكروفون

2. **مشاكل الاتصال:**
   - تأكد من تشغيل خادم الإشارات
   - تحقق من إعدادات الشبكة

3. **مشاكل الدردشة:**
   - تأكد من إعدادات Firebase
   - تحقق من الاتصال بالإنترنت

### سجلات التشخيص:

```javascript
// تفعيل السجلات المفصلة
localStorage.setItem('DEBUG_WEBRTC', 'true');
```

## 🤝 المساهمة

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة
3. Commit التغييرات
4. Push للفرع
5. إنشاء Pull Request

## 📞 الدعم

للحصول على المساعدة:
- 📧 البريد الإلكتروني: support@almaheron.com
- 💬 الدردشة المباشرة في التطبيق
- 📱 واتساب: +1234567890

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف LICENSE للتفاصيل.

---

**🕌 بارك الله فيك! نظام المكالمات والدردشة جاهز للاستخدام**

تم بناء هذا النظام بحب وعناية لخدمة أكاديمية المحرون وطلاب القرآن الكريم في جميع أنحاء العالم.
