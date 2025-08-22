import { io, Socket } from 'socket.io-client';

// إعدادات WebRTC
const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // يمكن إضافة TURN servers هنا للشبكات المحدودة
  ],
  iceCandidatePoolSize: 10,
};

// أنواع الأحداث
export interface WebRTCEvents {
  'connection-state-change': (state: RTCPeerConnectionState) => void;
  'remote-stream': (stream: MediaStream) => void;
  'local-stream': (stream: MediaStream) => void;
  'user-joined': (user: any) => void;
  'user-left': (user: any) => void;
  'call-ended': (data: any) => void;
  'error': (error: Error) => void;
  'ice-connection-state': (state: RTCIceConnectionState) => void;
  'data-channel-message': (message: any) => void;
}

export class WebRTCManager {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private eventListeners: Map<keyof WebRTCEvents, Function[]> = new Map();
  
  // معلومات المستخدم والغرفة
  private userId: string = '';
  private userName: string = '';
  private userAvatar: string = '';
  private roomId: string = '';
  private isInitiator: boolean = false;
  
  // حالة الوسائط
  private isVideoEnabled: boolean = true;
  private isAudioEnabled: boolean = true;
  private isScreenSharing: boolean = false;

  constructor(signalingServerUrl: string = 'http://localhost:3002') {
    this.initializeSocket(signalingServerUrl);
  }

  // تهيئة Socket.io
  private initializeSocket(url: string) {
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('✅ متصل بخادم الإشارات');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ انقطع الاتصال مع خادم الإشارات');
      this.emit('error', new Error('انقطع الاتصال مع خادم الإشارات'));
    });

    // معالجة أحداث WebRTC
    this.setupSignalingHandlers();
  }

  // إعداد معالجات الإشارات
  private setupSignalingHandlers() {
    if (!this.socket) return;

    // تسجيل المستخدم
    this.socket.on('user-registered', (data) => {
      console.log('✅ تم تسجيل المستخدم:', data);
    });

    // انضمام مستخدم جديد
    this.socket.on('user-joined', async (data) => {
      console.log('👤 مستخدم جديد انضم:', data);
      this.emit('user-joined', data);
      
      // إذا كنا المبادر، نرسل عرض
      if (this.isInitiator) {
        await this.createOffer(data.socketId);
      }
    });

    // مغادرة مستخدم
    this.socket.on('user-left', (data) => {
      console.log('👋 مستخدم غادر:', data);
      this.emit('user-left', data);
    });

    // استقبال عرض
    this.socket.on('offer', async (data) => {
      console.log('📤 استقبال عرض من:', data.fromUserId);
      await this.handleOffer(data);
    });

    // استقبال إجابة
    this.socket.on('answer', async (data) => {
      console.log('📥 استقبال إجابة من:', data.fromUserId);
      await this.handleAnswer(data);
    });

    // استقبال ICE Candidate
    this.socket.on('ice-candidate', async (data) => {
      console.log('🧊 استقبال ICE Candidate من:', data.fromUserId);
      await this.handleIceCandidate(data);
    });

    // تحديث حالة الفيديو
    this.socket.on('user-video-toggle', (data) => {
      console.log('📹 تحديث حالة الفيديو:', data);
      // يمكن إضافة منطق إضافي هنا
    });

    // تحديث حالة الصوت
    this.socket.on('user-audio-toggle', (data) => {
      console.log('🎤 تحديث حالة الصوت:', data);
      // يمكن إضافة منطق إضافي هنا
    });

    // انتهاء المكالمة
    this.socket.on('call-ended', (data) => {
      console.log('📞 انتهت المكالمة:', data);
      this.emit('call-ended', data);
      this.cleanup();
    });
  }

  // تسجيل المستخدم
  async registerUser(userId: string, userName: string, userAvatar: string = '') {
    this.userId = userId;
    this.userName = userName;
    this.userAvatar = userAvatar;

    if (this.socket) {
      this.socket.emit('register-user', {
        userId,
        name: userName,
        avatar: userAvatar
      });
    }
  }

  // الانضمام لغرفة
  async joinRoom(roomId: string, isInitiator: boolean = false) {
    this.roomId = roomId;
    this.isInitiator = isInitiator;

    if (this.socket) {
      this.socket.emit('join-room', {
        roomId,
        userId: this.userId,
        userName: this.userName,
        userAvatar: this.userAvatar
      });
    }

    // إعداد WebRTC
    await this.initializePeerConnection();
    await this.getUserMedia();
  }

  // تهيئة اتصال WebRTC
  private async initializePeerConnection() {
    this.peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);

    // معالجة ICE Candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', {
          roomId: this.roomId,
          targetSocketId: null, // سيتم تحديده حسب السياق
          candidate: event.candidate,
          userId: this.userId
        });
      }
    };

    // معالجة التدفق البعيد
    this.peerConnection.ontrack = (event) => {
      console.log('📺 استقبال تدفق بعيد');
      this.remoteStream = event.streams[0];
      this.emit('remote-stream', this.remoteStream);
    };

    // معالجة تغيير حالة الاتصال
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('🔗 حالة الاتصال:', state);
      if (state) {
        this.emit('connection-state-change', state);
      }
    };

    // معالجة تغيير حالة ICE
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log('🧊 حالة ICE:', state);
      if (state) {
        this.emit('ice-connection-state', state);
      }
    };

    // إنشاء قناة البيانات للدردشة
    this.dataChannel = this.peerConnection.createDataChannel('chat', {
      ordered: true
    });

    this.dataChannel.onopen = () => {
      console.log('💬 قناة البيانات مفتوحة');
    };

    this.dataChannel.onmessage = (event) => {
      console.log('💬 رسالة من قناة البيانات:', event.data);
      this.emit('data-channel-message', JSON.parse(event.data));
    };

    // معالجة قناة البيانات الواردة
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (event) => {
        console.log('💬 رسالة من قناة البيانات الواردة:', event.data);
        this.emit('data-channel-message', JSON.parse(event.data));
      };
    };
  }

  // الحصول على وسائط المستخدم
  private async getUserMedia(video: boolean = true, audio: boolean = true) {
    try {
      const constraints: MediaStreamConstraints = {
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.emit('local-stream', this.localStream);

      // إضافة التدفق لـ PeerConnection
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      console.log('📹 تم الحصول على وسائط المستخدم');
    } catch (error) {
      console.error('❌ خطأ في الحصول على الوسائط:', error);
      this.emit('error', error as Error);
    }
  }

  // إنشاء عرض
  private async createOffer(targetSocketId: string) {
    if (!this.peerConnection) return;

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await this.peerConnection.setLocalDescription(offer);

      if (this.socket) {
        this.socket.emit('offer', {
          roomId: this.roomId,
          targetSocketId,
          offer,
          userId: this.userId
        });
      }

      console.log('📤 تم إرسال العرض');
    } catch (error) {
      console.error('❌ خطأ في إنشاء العرض:', error);
      this.emit('error', error as Error);
    }
  }

  // معالجة العرض
  private async handleOffer(data: any) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(data.offer);

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      if (this.socket) {
        this.socket.emit('answer', {
          roomId: this.roomId,
          targetSocketId: data.fromSocketId,
          answer,
          userId: this.userId
        });
      }

      console.log('📥 تم إرسال الإجابة');
    } catch (error) {
      console.error('❌ خطأ في معالجة العرض:', error);
      this.emit('error', error as Error);
    }
  }

  // معالجة الإجابة
  private async handleAnswer(data: any) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(data.answer);
      console.log('✅ تم تعيين الإجابة البعيدة');
    } catch (error) {
      console.error('❌ خطأ في معالجة الإجابة:', error);
      this.emit('error', error as Error);
    }
  }

  // معالجة ICE Candidate
  private async handleIceCandidate(data: any) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(data.candidate);
      console.log('✅ تم إضافة ICE Candidate');
    } catch (error) {
      console.error('❌ خطأ في إضافة ICE Candidate:', error);
      this.emit('error', error as Error);
    }
  }

  // تبديل الفيديو
  async toggleVideo() {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isVideoEnabled = videoTrack.enabled;

      if (this.socket) {
        this.socket.emit('toggle-video', {
          roomId: this.roomId,
          isEnabled: this.isVideoEnabled,
          userId: this.userId
        });
      }

      console.log(`📹 الفيديو ${this.isVideoEnabled ? 'مفعل' : 'معطل'}`);
      return this.isVideoEnabled;
    }
    return false;
  }

  // تبديل الصوت
  async toggleAudio() {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isAudioEnabled = audioTrack.enabled;

      if (this.socket) {
        this.socket.emit('toggle-audio', {
          roomId: this.roomId,
          isEnabled: this.isAudioEnabled,
          userId: this.userId
        });
      }

      console.log(`🎤 الصوت ${this.isAudioEnabled ? 'مفعل' : 'معطل'}`);
      return this.isAudioEnabled;
    }
    return false;
  }

  // مشاركة الشاشة
  async toggleScreenShare() {
    try {
      if (!this.isScreenSharing) {
        // بدء مشاركة الشاشة
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        // استبدال تدفق الفيديو
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = this.peerConnection?.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }

        this.isScreenSharing = true;

        // معالجة انتهاء مشاركة الشاشة
        videoTrack.onended = () => {
          this.stopScreenShare();
        };

      } else {
        // إيقاف مشاركة الشاشة
        await this.stopScreenShare();
      }

      if (this.socket) {
        this.socket.emit('screen-share', {
          roomId: this.roomId,
          isSharing: this.isScreenSharing,
          userId: this.userId
        });
      }

      console.log(`🖥️ مشاركة الشاشة ${this.isScreenSharing ? 'مفعلة' : 'معطلة'}`);
      return this.isScreenSharing;

    } catch (error) {
      console.error('❌ خطأ في مشاركة الشاشة:', error);
      this.emit('error', error as Error);
      return false;
    }
  }

  // إيقاف مشاركة الشاشة
  private async stopScreenShare() {
    if (!this.localStream) return;

    // العودة للكاميرا العادية
    const videoTrack = this.localStream.getVideoTracks()[0];
    const sender = this.peerConnection?.getSenders().find(s => 
      s.track && s.track.kind === 'video'
    );

    if (sender && videoTrack) {
      await sender.replaceTrack(videoTrack);
    }

    this.isScreenSharing = false;
  }

  // إرسال رسالة عبر قناة البيانات
  sendDataChannelMessage(message: any) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // إنهاء المكالمة
  async endCall() {
    if (this.socket) {
      this.socket.emit('end-call', {
        roomId: this.roomId,
        userId: this.userId
      });
    }

    this.cleanup();
  }

  // تنظيف الموارد
  private cleanup() {
    // إيقاف التدفقات
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    // إغلاق اتصال WebRTC
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // إغلاق قناة البيانات
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    console.log('🧹 تم تنظيف الموارد');
  }

  // إضافة مستمع للأحداث
  on<K extends keyof WebRTCEvents>(event: K, listener: WebRTCEvents[K]) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  // إزالة مستمع الأحداث
  off<K extends keyof WebRTCEvents>(event: K, listener: WebRTCEvents[K]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // إطلاق حدث
  private emit<K extends keyof WebRTCEvents>(event: K, ...args: Parameters<WebRTCEvents[K]>) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as any)(...args);
        } catch (error) {
          console.error(`خطأ في معالج الحدث ${event}:`, error);
        }
      });
    }
  }

  // الحصول على حالة الاتصال
  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null;
  }

  // الحصول على معلومات الإحصائيات
  async getStats(): Promise<RTCStatsReport | null> {
    if (this.peerConnection) {
      return await this.peerConnection.getStats();
    }
    return null;
  }

  // تدمير المدير
  destroy() {
    this.cleanup();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.eventListeners.clear();
    console.log('💥 تم تدمير WebRTC Manager');
  }

  // الحصول على معلومات الحالة
  getStatus() {
    return {
      isConnected: this.socket?.connected || false,
      connectionState: this.getConnectionState(),
      hasLocalStream: !!this.localStream,
      hasRemoteStream: !!this.remoteStream,
      isVideoEnabled: this.isVideoEnabled,
      isAudioEnabled: this.isAudioEnabled,
      isScreenSharing: this.isScreenSharing,
      roomId: this.roomId,
      userId: this.userId
    };
  }
}
