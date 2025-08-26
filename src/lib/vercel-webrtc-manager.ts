// ملف محذوف - سيتم استبداله بنظام Jitsi Meet الجديد

  // معالجات الأحداث
  public onLocalStream?: (stream: MediaStream) => void;
  public onRemoteStream?: (stream: MediaStream) => void;
  public onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  public onError?: (error: Error) => void;
  public onMessage?: (message: any) => void;

  constructor(userId: string, userName: string) {
    console.log('🏗️ VercelWebRTCManager constructor called:', { userId, userName });
    this.userId = userId;
    this.userName = userName;
  }

  // بدء الاتصال بخادم الإشارات
  async connectToSignalingServer(): Promise<boolean> {
    console.log('🔌 VercelWebRTCManager.connectToSignalingServer called');
    try {
      // تسجيل المستخدم
      const registerResponse = await fetch('/api/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-user',
          data: {
            userId: this.userId,
            name: this.userName
          }
        })
      });

      const registerResult = await registerResponse.json();
      if (!registerResult.success) {
        throw new Error(registerResult.error);
      }

      // إعداد Server-Sent Events للاستقبال
      this.eventSource = new EventSource(
        `/api/websocket?userId=${this.userId}&name=${encodeURIComponent(this.userName)}`
      );

      this.eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleSignalingMessage(message);
        } catch (error) {
          console.error('خطأ في معالجة الرسالة:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('خطأ في الاتصال:', error);
        this.onError?.(new Error('انقطع الاتصال مع الخادم'));
      };

      console.log('✅ تم الاتصال بخادم الإشارات');
      return true;

    } catch (error) {
      console.error('خطأ في الاتصال بخادم الإشارات:', error);
      this.onError?.(error as Error);
      return false;
    }
  }

  // إنشاء اتصال WebRTC
  private createPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });

    // معالجة ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.targetUserId) {
        this.sendSignalingMessage('ice-candidate', {
          candidate: event.candidate,
          toUserId: this.targetUserId,
          roomId: this.roomId
        });
      }
    };

    // معالجة الـ remote stream
    pc.ontrack = (event) => {
      console.log('📺 تم استقبال remote stream');
      this.remoteStream = event.streams[0];
      this.onRemoteStream?.(this.remoteStream);
    };

    // معالجة تغيير حالة الاتصال
    pc.onconnectionstatechange = () => {
      console.log('🔄 حالة الاتصال:', pc.connectionState);
      this.onConnectionStateChange?.(pc.connectionState);
    };

    return pc;
  }

  // الحصول على الوسائط المحلية
  async getLocalMedia(video = true, audio = true): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 1280, height: 720 } : false,
        audio: audio
      });

      this.localStream = stream;
      this.onLocalStream?.(stream);
      
      console.log('🎥 تم الحصول على الوسائط المحلية');
      return stream;

    } catch (error) {
      console.error('خطأ في الحصول على الوسائط:', error);
      throw new Error('لا يمكن الوصول للكاميرا أو الميكروفون');
    }
  }

  // بدء مكالمة جديدة
  async startCall(targetUserId: string): Promise<void> {
    try {
      this.targetUserId = targetUserId;
      this.roomId = `call_${this.userId}_${targetUserId}_${Date.now()}`;
      this.isInitiator = true;

      // الانضمام إلى الغرفة
      await this.joinRoom(this.roomId);

      // إنشاء peer connection
      this.peerConnection = this.createPeerConnection();

      // الحصول على الوسائط المحلية
      const stream = await this.getLocalMedia();
      
      // إضافة tracks للـ peer connection
      stream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, stream);
      });

      // إنشاء offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // إرسال offer
      await this.sendSignalingMessage('webrtc-offer', {
        offer: offer,
        toUserId: targetUserId,
        roomId: this.roomId
      });

      console.log('📞 تم بدء المكالمة');

    } catch (error) {
      console.error('خطأ في بدء المكالمة:', error);
      this.onError?.(error as Error);
    }
  }

  // قبول مكالمة واردة
  async acceptCall(fromUserId: string, roomId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      this.targetUserId = fromUserId;
      this.roomId = roomId;
      this.isInitiator = false;

      // الانضمام إلى الغرفة
      await this.joinRoom(roomId);

      // إنشاء peer connection
      this.peerConnection = this.createPeerConnection();

      // الحصول على الوسائط المحلية
      const stream = await this.getLocalMedia();
      
      // إضافة tracks للـ peer connection
      stream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, stream);
      });

      // تعيين remote description
      await this.peerConnection.setRemoteDescription(offer);

      // إنشاء answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // إرسال answer
      await this.sendSignalingMessage('webrtc-answer', {
        answer: answer,
        toUserId: fromUserId,
        roomId: roomId
      });

      console.log('✅ تم قبول المكالمة');

    } catch (error) {
      console.error('خطأ في قبول المكالمة:', error);
      this.onError?.(error as Error);
    }
  }

  // الانضمام إلى غرفة
  private async joinRoom(roomId: string): Promise<void> {
    const response = await fetch('/api/signaling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'join-room',
        data: {
          roomId,
          userId: this.userId,
          userName: this.userName
        }
      })
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error);
    }
  }

  // إرسال رسالة إشارة
  private async sendSignalingMessage(type: string, data: any): Promise<void> {
    try {
      const response = await fetch('/api/websocket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data,
          fromUserId: this.userId,
          toUserId: data.toUserId,
          roomId: data.roomId
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error('خطأ في إرسال الرسالة:', result.error);
      }
    } catch (error) {
      console.error('خطأ في إرسال رسالة الإشارة:', error);
    }
  }

  // معالجة رسائل الإشارة الواردة
  private async handleSignalingMessage(message: any): Promise<void> {
    try {
      switch (message.type) {
        case 'webrtc-offer':
          if (message.data.toUserId === this.userId) {
            // استقبال offer - يمكن قبول المكالمة
            this.onMessage?.({
              type: 'incoming-call',
              fromUserId: message.fromUserId,
              roomId: message.data.roomId,
              offer: message.data.offer
            });
          }
          break;

        case 'webrtc-answer':
          if (message.data.toUserId === this.userId && this.peerConnection) {
            await this.peerConnection.setRemoteDescription(message.data.answer);
            console.log('✅ تم استقبال answer');
          }
          break;

        case 'ice-candidate':
          if (message.data.toUserId === this.userId && this.peerConnection) {
            await this.peerConnection.addIceCandidate(message.data.candidate);
            console.log('🧊 تم إضافة ICE candidate');
          }
          break;

        case 'ping':
          // heartbeat - لا حاجة لفعل شيء
          break;

        default:
          console.log('رسالة غير معروفة:', message.type);
      }
    } catch (error) {
      console.error('خطأ في معالجة رسالة الإشارة:', error);
    }
  }

  // إنهاء المكالمة
  async endCall(): Promise<void> {
    try {
      if (this.roomId) {
        await fetch('/api/signaling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'end-call',
            data: {
              roomId: this.roomId,
              userId: this.userId
            }
          })
        });
      }

      // إغلاق peer connection
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      // إيقاف الوسائط المحلية
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      // إغلاق EventSource
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      this.remoteStream = null;
      this.roomId = null;
      this.targetUserId = null;

      console.log('📴 تم إنهاء المكالمة');

    } catch (error) {
      console.error('خطأ في إنهاء المكالمة:', error);
    }
  }

  // تبديل الفيديو
  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  // تبديل الصوت
  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  // الحصول على الحالات
  get connectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null;
  }

  get isConnected(): boolean {
    return this.peerConnection?.connectionState === 'connected';
  }
}
