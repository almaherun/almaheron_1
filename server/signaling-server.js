const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// إعداد CORS للسماح بالاتصال من العميل
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// تخزين معلومات المستخدمين والغرف
const users = new Map();
const rooms = new Map();

// معلومات الاتصال
const PORT = process.env.SIGNALING_PORT || 3002;

console.log('🚀 خادم الإشارات يبدأ التشغيل...');

// معالجة الاتصالات
io.on('connection', (socket) => {
  console.log(`✅ مستخدم جديد متصل: ${socket.id}`);

  // تسجيل المستخدم
  socket.on('register-user', (userData) => {
    console.log(`📝 تسجيل مستخدم: ${userData.userId} - ${userData.name}`);
    
    users.set(socket.id, {
      userId: userData.userId,
      name: userData.name,
      avatar: userData.avatar,
      socketId: socket.id,
      status: 'online',
      currentRoom: null
    });

    // إرسال تأكيد التسجيل
    socket.emit('user-registered', {
      success: true,
      socketId: socket.id
    });

    // إشعار المستخدمين الآخرين
    socket.broadcast.emit('user-online', {
      userId: userData.userId,
      name: userData.name,
      avatar: userData.avatar
    });
  });

  // إنشاء أو الانضمام لغرفة مكالمة
  socket.on('join-room', (data) => {
    const { roomId, userId, userName, userAvatar } = data;
    console.log(`🏠 ${userName} ينضم للغرفة: ${roomId}`);

    // إنشاء الغرفة إذا لم تكن موجودة
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        participants: new Map(),
        createdAt: new Date(),
        isActive: true
      });
    }

    const room = rooms.get(roomId);
    
    // إضافة المستخدم للغرفة
    room.participants.set(socket.id, {
      userId,
      userName,
      userAvatar,
      socketId: socket.id,
      joinedAt: new Date()
    });

    // تحديث معلومات المستخدم
    if (users.has(socket.id)) {
      const user = users.get(socket.id);
      user.currentRoom = roomId;
      users.set(socket.id, user);
    }

    // الانضمام للغرفة في Socket.io
    socket.join(roomId);

    // إشعار المشاركين الآخرين
    socket.to(roomId).emit('user-joined', {
      userId,
      userName,
      userAvatar,
      socketId: socket.id,
      participantCount: room.participants.size
    });

    // إرسال قائمة المشاركين الحاليين للمستخدم الجديد
    const currentParticipants = Array.from(room.participants.values())
      .filter(p => p.socketId !== socket.id);

    socket.emit('room-joined', {
      roomId,
      participants: currentParticipants,
      participantCount: room.participants.size
    });

    console.log(`👥 الغرفة ${roomId} تحتوي على ${room.participants.size} مشارك`);
  });

  // معالجة عروض WebRTC (Offers)
  socket.on('offer', (data) => {
    const { roomId, targetSocketId, offer, userId } = data;
    console.log(`📤 عرض من ${userId} إلى ${targetSocketId}`);

    // إرسال العرض للمستخدم المستهدف
    socket.to(targetSocketId).emit('offer', {
      offer,
      fromSocketId: socket.id,
      fromUserId: userId,
      roomId
    });
  });

  // معالجة إجابات WebRTC (Answers)
  socket.on('answer', (data) => {
    const { roomId, targetSocketId, answer, userId } = data;
    console.log(`📥 إجابة من ${userId} إلى ${targetSocketId}`);

    // إرسال الإجابة للمستخدم المستهدف
    socket.to(targetSocketId).emit('answer', {
      answer,
      fromSocketId: socket.id,
      fromUserId: userId,
      roomId
    });
  });

  // معالجة ICE Candidates
  socket.on('ice-candidate', (data) => {
    const { roomId, targetSocketId, candidate, userId } = data;
    console.log(`🧊 ICE Candidate من ${userId} إلى ${targetSocketId}`);

    // إرسال ICE Candidate للمستخدم المستهدف
    socket.to(targetSocketId).emit('ice-candidate', {
      candidate,
      fromSocketId: socket.id,
      fromUserId: userId,
      roomId
    });
  });

  // تبديل حالة الكاميرا
  socket.on('toggle-video', (data) => {
    const { roomId, isEnabled, userId } = data;
    console.log(`📹 ${userId} ${isEnabled ? 'فتح' : 'أغلق'} الكاميرا`);

    socket.to(roomId).emit('user-video-toggle', {
      userId,
      socketId: socket.id,
      isVideoEnabled: isEnabled
    });
  });

  // تبديل حالة الميكروفون
  socket.on('toggle-audio', (data) => {
    const { roomId, isEnabled, userId } = data;
    console.log(`🎤 ${userId} ${isEnabled ? 'فتح' : 'أغلق'} الميكروفون`);

    socket.to(roomId).emit('user-audio-toggle', {
      userId,
      socketId: socket.id,
      isAudioEnabled: isEnabled
    });
  });

  // مشاركة الشاشة
  socket.on('screen-share', (data) => {
    const { roomId, isSharing, userId } = data;
    console.log(`🖥️ ${userId} ${isSharing ? 'بدأ' : 'أوقف'} مشاركة الشاشة`);

    socket.to(roomId).emit('user-screen-share', {
      userId,
      socketId: socket.id,
      isScreenSharing: isSharing
    });
  });

  // إنهاء المكالمة
  socket.on('end-call', (data) => {
    const { roomId, userId } = data;
    console.log(`📞 ${userId} أنهى المكالمة في الغرفة ${roomId}`);

    // إشعار المشاركين الآخرين
    socket.to(roomId).emit('call-ended', {
      userId,
      socketId: socket.id,
      endedBy: userId
    });

    // إزالة المستخدم من الغرفة
    handleUserLeaveRoom(socket, roomId);
  });

  // مغادرة الغرفة
  socket.on('leave-room', (data) => {
    const { roomId, userId } = data;
    console.log(`🚪 ${userId} غادر الغرفة ${roomId}`);

    handleUserLeaveRoom(socket, roomId);
  });

  // قطع الاتصال
  socket.on('disconnect', () => {
    console.log(`❌ مستخدم قطع الاتصال: ${socket.id}`);

    const user = users.get(socket.id);
    if (user) {
      // إشعار المستخدمين الآخرين
      socket.broadcast.emit('user-offline', {
        userId: user.userId,
        socketId: socket.id
      });

      // إزالة المستخدم من الغرفة إذا كان في واحدة
      if (user.currentRoom) {
        handleUserLeaveRoom(socket, user.currentRoom);
      }

      // إزالة المستخدم من القائمة
      users.delete(socket.id);
    }
  });

  // معالجة الأخطاء
  socket.on('error', (error) => {
    console.error(`❌ خطأ في Socket ${socket.id}:`, error);
  });
});

// دالة مساعدة لمعالجة مغادرة المستخدم للغرفة
function handleUserLeaveRoom(socket, roomId) {
  if (!rooms.has(roomId)) return;

  const room = rooms.get(roomId);
  const participant = room.participants.get(socket.id);

  if (participant) {
    // إزالة المستخدم من الغرفة
    room.participants.delete(socket.id);

    // إشعار المشاركين الآخرين
    socket.to(roomId).emit('user-left', {
      userId: participant.userId,
      socketId: socket.id,
      participantCount: room.participants.size
    });

    // مغادرة الغرفة في Socket.io
    socket.leave(roomId);

    // حذف الغرفة إذا أصبحت فارغة
    if (room.participants.size === 0) {
      rooms.delete(roomId);
      console.log(`🗑️ تم حذف الغرفة الفارغة: ${roomId}`);
    }

    // تحديث معلومات المستخدم
    if (users.has(socket.id)) {
      const user = users.get(socket.id);
      user.currentRoom = null;
      users.set(socket.id, user);
    }
  }
}

// API endpoints للمراقبة
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    connectedUsers: users.size,
    activeRooms: rooms.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/rooms', (req, res) => {
  const roomsData = Array.from(rooms.entries()).map(([id, room]) => ({
    id,
    participantCount: room.participants.size,
    participants: Array.from(room.participants.values()).map(p => ({
      userId: p.userId,
      userName: p.userName
    })),
    createdAt: room.createdAt,
    isActive: room.isActive
  }));

  res.json(roomsData);
});

// بدء الخادم
server.listen(PORT, () => {
  console.log(`🌟 خادم الإشارات يعمل على المنفذ ${PORT}`);
  console.log(`📊 حالة الخادم: http://localhost:${PORT}/status`);
  console.log(`🏠 الغرف النشطة: http://localhost:${PORT}/rooms`);
});

// معالجة إغلاق الخادم بشكل صحيح
process.on('SIGTERM', () => {
  console.log('🛑 إيقاف خادم الإشارات...');
  server.close(() => {
    console.log('✅ تم إيقاف خادم الإشارات بنجاح');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 إيقاف خادم الإشارات...');
  server.close(() => {
    console.log('✅ تم إيقاف خادم الإشارات بنجاح');
    process.exit(0);
  });
});
