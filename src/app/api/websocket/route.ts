import { NextRequest } from 'next/server';

// تخزين الاتصالات النشطة
const connections = new Map<string, {
  userId: string;
  name: string;
  roomId?: string;
  lastPing: Date;
}>();

// تخزين الرسائل المؤقتة للتبادل
const pendingMessages = new Map<string, Array<{
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  fromUserId: string;
  toUserId?: string;
}>>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const action = searchParams.get('action');

  if (!userId) {
    return new Response('معرف المستخدم مطلوب', { status: 400 });
  }

  // إعداد Server-Sent Events
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // تسجيل الاتصال
      connections.set(userId, {
        userId,
        name: searchParams.get('name') || 'مستخدم',
        roomId: searchParams.get('roomId') || undefined,
        lastPing: new Date()
      });

      console.log(`✅ اتصال جديد: ${userId}`);

      // إرسال رسالة ترحيب
      const welcomeMessage = `data: ${JSON.stringify({
        type: 'connected',
        message: 'تم الاتصال بنجاح',
        userId,
        timestamp: new Date().toISOString()
      })}\n\n`;
      
      controller.enqueue(encoder.encode(welcomeMessage));

      // فحص الرسائل المعلقة
      const userMessages = pendingMessages.get(userId) || [];
      userMessages.forEach(message => {
        const messageData = `data: ${JSON.stringify({
          type: message.type,
          data: message.data,
          fromUserId: message.fromUserId,
          timestamp: message.timestamp.toISOString()
        })}\n\n`;
        
        controller.enqueue(encoder.encode(messageData));
      });

      // مسح الرسائل المعلقة بعد الإرسال
      if (userMessages.length > 0) {
        pendingMessages.delete(userId);
      }

      // إعداد heartbeat للحفاظ على الاتصال
      const heartbeat = setInterval(() => {
        try {
          const pingMessage = `data: ${JSON.stringify({
            type: 'ping',
            timestamp: new Date().toISOString()
          })}\n\n`;
          
          controller.enqueue(encoder.encode(pingMessage));
          
          // تحديث وقت آخر ping
          const connection = connections.get(userId);
          if (connection) {
            connection.lastPing = new Date();
          }
        } catch (error) {
          console.log(`❌ انقطع الاتصال: ${userId}`);
          clearInterval(heartbeat);
          connections.delete(userId);
        }
      }, 30000); // كل 30 ثانية

      // تنظيف عند إغلاق الاتصال
      request.signal.addEventListener('abort', () => {
        console.log(`🔌 إغلاق الاتصال: ${userId}`);
        clearInterval(heartbeat);
        connections.delete(userId);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, fromUserId, toUserId, roomId } = body;

    console.log(`📨 رسالة جديدة: ${type} من ${fromUserId} إلى ${toUserId || 'الجميع'}`);

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      fromUserId,
      toUserId
    };

    if (toUserId) {
      // رسالة لمستخدم محدد
      if (connections.has(toUserId)) {
        // المستخدم متصل - سيتم إرسال الرسالة عبر SSE
        console.log(`✅ المستخدم ${toUserId} متصل`);
      } else {
        // المستخدم غير متصل - حفظ الرسالة
        if (!pendingMessages.has(toUserId)) {
          pendingMessages.set(toUserId, []);
        }
        pendingMessages.get(toUserId)!.push(message);
        console.log(`💾 تم حفظ الرسالة للمستخدم ${toUserId}`);
      }
    } else if (roomId) {
      // رسالة لغرفة
      const roomParticipants = Array.from(connections.values())
        .filter(conn => conn.roomId === roomId)
        .map(conn => conn.userId);
      
      console.log(`📢 إرسال لغرفة ${roomId}: ${roomParticipants.length} مشاركين`);
      
      // حفظ للمشاركين غير المتصلين
      roomParticipants.forEach(participantId => {
        if (!connections.has(participantId)) {
          if (!pendingMessages.has(participantId)) {
            pendingMessages.set(participantId, []);
          }
          pendingMessages.get(participantId)!.push(message);
        }
      });
    }

    return Response.json({
      success: true,
      message: 'تم إرسال الرسالة بنجاح',
      messageId: message.id,
      timestamp: message.timestamp
    });

  } catch (error) {
    console.error('خطأ في معالجة الرسالة:', error);
    return Response.json({
      success: false,
      error: 'خطأ في معالجة الرسالة'
    }, { status: 500 });
  }
}

// معالجة OPTIONS للـ CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
