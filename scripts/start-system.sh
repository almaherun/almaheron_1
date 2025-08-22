#!/bin/bash

# 🚀 سكريبت تشغيل نظام المكالمات المتكامل - أكاديمية المحرون

echo "🕌 بدء تشغيل نظام المكالمات المتكامل - أكاديمية المحرون"
echo "=================================================="

# التحقق من وجود Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. يرجى تثبيت Node.js أولاً"
    exit 1
fi

# التحقق من وجود npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm غير مثبت. يرجى تثبيت npm أولاً"
    exit 1
fi

echo "✅ Node.js و npm متوفران"

# إنشاء ملف .env.local إذا لم يكن موجوداً
if [ ! -f .env.local ]; then
    echo "📝 إنشاء ملف .env.local من المثال..."
    cp .env.local.example .env.local
    echo "⚠️  يرجى تحديث ملف .env.local بالقيم الصحيحة"
fi

# تثبيت تبعيات العميل
echo "📦 تثبيت تبعيات العميل..."
npm install

# تثبيت تبعيات الخادم
echo "📦 تثبيت تبعيات خادم الإشارات..."
cd server
npm install
cd ..

# إنشاء مجلدات مطلوبة
echo "📁 إنشاء المجلدات المطلوبة..."
mkdir -p public/styles
mkdir -p logs

# نسخ ملفات CSS
echo "🎨 نسخ ملفات التصميم..."
if [ -f src/styles/islamic-theme.css ]; then
    cp src/styles/islamic-theme.css public/styles/
    echo "✅ تم نسخ ملف التصميم الإسلامي"
fi

# إنشاء ملف تشغيل متوازي
cat > start-parallel.js << 'EOF'
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 بدء تشغيل النظام المتكامل...\n');

// تشغيل خادم الإشارات
console.log('🌐 تشغيل خادم الإشارات...');
const signalingServer = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'server'),
    stdio: 'pipe'
});

signalingServer.stdout.on('data', (data) => {
    console.log(`[خادم الإشارات] ${data.toString().trim()}`);
});

signalingServer.stderr.on('data', (data) => {
    console.error(`[خادم الإشارات - خطأ] ${data.toString().trim()}`);
});

// انتظار ثانيتين ثم تشغيل العميل
setTimeout(() => {
    console.log('🖥️  تشغيل العميل...');
    const client = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe'
    });

    client.stdout.on('data', (data) => {
        console.log(`[العميل] ${data.toString().trim()}`);
    });

    client.stderr.on('data', (data) => {
        console.error(`[العميل - خطأ] ${data.toString().trim()}`);
    });

    client.on('close', (code) => {
        console.log(`[العميل] انتهى بالكود ${code}`);
        signalingServer.kill();
        process.exit(code);
    });
}, 2000);

signalingServer.on('close', (code) => {
    console.log(`[خادم الإشارات] انتهى بالكود ${code}`);
    process.exit(code);
});

// معالجة إيقاف النظام
process.on('SIGINT', () => {
    console.log('\n🛑 إيقاف النظام...');
    signalingServer.kill();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 إيقاف النظام...');
    signalingServer.kill();
    process.exit(0);
});
EOF

echo "✅ تم إنشاء ملف التشغيل المتوازي"

# إضافة سكريبت للـ package.json
echo "📝 تحديث سكريبتات package.json..."

# إنشاء نسخة احتياطية من package.json
cp package.json package.json.backup

# إضافة السكريبت الجديد
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['start:system'] = 'node start-parallel.js';
pkg.scripts['start:signaling'] = 'cd server && npm start';
pkg.scripts['dev:signaling'] = 'cd server && npm run dev';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ تم تحديث package.json');
"

echo ""
echo "🎉 تم إعداد النظام بنجاح!"
echo ""
echo "📋 الخطوات التالية:"
echo "1. تحديث ملف .env.local بالقيم الصحيحة"
echo "2. تشغيل النظام باستخدام: npm run start:system"
echo ""
echo "🔧 أوامر مفيدة:"
echo "- تشغيل النظام كاملاً: npm run start:system"
echo "- تشغيل العميل فقط: npm run dev"
echo "- تشغيل خادم الإشارات فقط: npm run start:signaling"
echo "- تطوير خادم الإشارات: npm run dev:signaling"
echo ""
echo "🌐 الروابط:"
echo "- العميل: http://localhost:3000"
echo "- خادم الإشارات: http://localhost:3002"
echo "- حالة الخادم: http://localhost:3002/status"
echo "- الغرف النشطة: http://localhost:3002/rooms"
echo ""
echo "🕌 بارك الله فيك! نظام المكالمات جاهز للاستخدام"
