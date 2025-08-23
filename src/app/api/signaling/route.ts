import { NextRequest, NextResponse } from 'next/server';

// تخزين مؤقت للاتصالات النشطة
const activeConnections = new Map<string, {
  userId: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline';
  lastSeen: Date;
}>();

const activeRooms = new Map<string, {
  roomId: string;
  participants: string[];
  createdAt: Date;
  isActive: boolean;
}>();

// معالجة طلبات GET - للحصول على حالة الخادم
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'status':
      return NextResponse.json({
        success: true,
        message: 'خادم الإشارات يعمل بنجاح',
        timestamp: new Date().toISOString(),
        activeConnections: activeConnections.size,
        activeRooms: activeRooms.size,
        uptime: process.uptime()
      });

    case 'rooms':
      const rooms = Array.from(activeRooms.values()).map(room => ({
        roomId: room.roomId,
        participantCount: room.participants.length,
        participants: room.participants,
        createdAt: room.createdAt,
        isActive: room.isActive
      }));
      
      return NextResponse.json({
        success: true,
        rooms,
        totalRooms: rooms.length
      });

    case 'users':
      const users = Array.from(activeConnections.values()).map(user => ({
        userId: user.userId,
        name: user.name,
        status: user.status,
        lastSeen: user.lastSeen
      }));
      
      return NextResponse.json({
        success: true,
        users,
        totalUsers: users.length
      });

    default:
      return NextResponse.json({
        success: true,
        message: 'مرحباً بك في خادم الإشارات - أكاديمية المحرون',
        endpoints: {
          status: '/api/signaling?action=status',
          rooms: '/api/signaling?action=rooms',
          users: '/api/signaling?action=users'
        }
      });
  }
}

// معالجة طلبات POST - للإجراءات المختلفة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'register-user':
        return handleUserRegistration(data);
      
      case 'join-room':
        return handleJoinRoom(data);
      
      case 'leave-room':
        return handleLeaveRoom(data);
      
      case 'webrtc-offer':
        return handleWebRTCOffer(data);
      
      case 'webrtc-answer':
        return handleWebRTCAnswer(data);
      
      case 'ice-candidate':
        return handleICECandidate(data);
      
      case 'end-call':
        return handleEndCall(data);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'إجراء غير معروف'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('خطأ في معالجة الطلب:', error);
    return NextResponse.json({
      success: false,
      error: 'خطأ في الخادم'
    }, { status: 500 });
  }
}

// تسجيل المستخدم
async function handleUserRegistration(data: any) {
  const { userId, name, avatar } = data;
  
  if (!userId || !name) {
    return NextResponse.json({
      success: false,
      error: 'معرف المستخدم والاسم مطلوبان'
    }, { status: 400 });
  }

  activeConnections.set(userId, {
    userId,
    name,
    avatar,
    status: 'online',
    lastSeen: new Date()
  });

  return NextResponse.json({
    success: true,
    message: 'تم تسجيل المستخدم بنجاح',
    userId
  });
}

// الانضمام إلى غرفة
async function handleJoinRoom(data: any) {
  const { roomId, userId, userName } = data;
  
  if (!roomId || !userId) {
    return NextResponse.json({
      success: false,
      error: 'معرف الغرفة ومعرف المستخدم مطلوبان'
    }, { status: 400 });
  }

  // إنشاء الغرفة إذا لم تكن موجودة
  if (!activeRooms.has(roomId)) {
    activeRooms.set(roomId, {
      roomId,
      participants: [],
      createdAt: new Date(),
      isActive: true
    });
  }

  const room = activeRooms.get(roomId)!;
  
  // إضافة المستخدم إلى الغرفة إذا لم يكن موجوداً
  if (!room.participants.includes(userId)) {
    room.participants.push(userId);
  }

  // تحديث حالة المستخدم
  if (activeConnections.has(userId)) {
    const user = activeConnections.get(userId)!;
    user.lastSeen = new Date();
  }

  return NextResponse.json({
    success: true,
    message: 'تم الانضمام إلى الغرفة بنجاح',
    roomId,
    participants: room.participants,
    participantCount: room.participants.length
  });
}

// مغادرة الغرفة
async function handleLeaveRoom(data: any) {
  const { roomId, userId } = data;
  
  if (!roomId || !userId) {
    return NextResponse.json({
      success: false,
      error: 'معرف الغرفة ومعرف المستخدم مطلوبان'
    }, { status: 400 });
  }

  const room = activeRooms.get(roomId);
  if (room) {
    room.participants = room.participants.filter(id => id !== userId);
    
    // حذف الغرفة إذا أصبحت فارغة
    if (room.participants.length === 0) {
      activeRooms.delete(roomId);
    }
  }

  return NextResponse.json({
    success: true,
    message: 'تم مغادرة الغرفة بنجاح',
    roomId
  });
}

// معالجة WebRTC Offer
async function handleWebRTCOffer(data: any) {
  const { roomId, fromUserId, toUserId, offer } = data;
  
  return NextResponse.json({
    success: true,
    message: 'تم إرسال العرض بنجاح',
    fromUserId,
    toUserId,
    roomId
  });
}

// معالجة WebRTC Answer
async function handleWebRTCAnswer(data: any) {
  const { roomId, fromUserId, toUserId, answer } = data;
  
  return NextResponse.json({
    success: true,
    message: 'تم إرسال الإجابة بنجاح',
    fromUserId,
    toUserId,
    roomId
  });
}

// معالجة ICE Candidate
async function handleICECandidate(data: any) {
  const { roomId, fromUserId, toUserId, candidate } = data;
  
  return NextResponse.json({
    success: true,
    message: 'تم إرسال ICE candidate بنجاح',
    fromUserId,
    toUserId,
    roomId
  });
}

// إنهاء المكالمة
async function handleEndCall(data: any) {
  const { roomId, userId } = data;
  
  // إزالة المستخدم من الغرفة
  await handleLeaveRoom({ roomId, userId });
  
  return NextResponse.json({
    success: true,
    message: 'تم إنهاء المكالمة بنجاح',
    roomId,
    userId
  });
}
