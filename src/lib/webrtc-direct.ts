// 🚀 نظام WebRTC مباشر بدون سيرفر خارجي
// يستخدم Firebase فقط لتبادل معلومات الاتصال

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  deleteDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface CallOffer {
  id: string;
  studentId: string;
  teacherId: string;
  studentName: string;
  teacherName: string;
  offer: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  status: 'pending' | 'answered' | 'connected' | 'ended';
  createdAt: any;
}

export interface ICECandidate {
  id: string;
  callId: string;
  candidate: RTCIceCandidateInit;
  from: 'student' | 'teacher';
  createdAt: any;
}

export class DirectWebRTCCall {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callId: string;
  private userId: string;
  private userType: 'student' | 'teacher';
  private isInitiator: boolean;
  private config: RTCConfiguration;

  // Callbacks
  public onRemoteStream?: (stream: MediaStream) => void;
  public onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  public onCallEnded?: () => void;

  // STUN servers مجانية
  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.voiparound.com' },
    { urls: 'stun:stun.voipbuster.com' }
  ];

  constructor(
    callId: string,
    userId: string,
    userType: 'student' | 'teacher',
    isInitiator: boolean = false
  ) {
    this.callId = callId;
    this.userId = userId;
    this.userType = userType;
    this.isInitiator = isInitiator;

    // تهيئة إعدادات WebRTC
    this.config = {
      iceServers: this.iceServers
    };

    // إنشاء RTCPeerConnection
    this.peerConnection = new RTCPeerConnection(this.config);

    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    console.log('🔗 Setting up WebRTC peer connection...');

    // الاستماع للـ ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 New ICE candidate:', event.candidate);
        this.sendICECandidate(event.candidate);
      }
    };

    // الاستماع للـ remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('📺 Received remote stream:', event.streams[0]);
      this.remoteStream = event.streams[0];
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };

    // الاستماع لحالة الاتصال
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('🔄 Connection state changed:', state);
      
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state);
      }

      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.cleanup();
        if (this.onCallEnded) {
          this.onCallEnded();
        }
      }
    };

    // الاستماع للـ ICE candidates من Firebase
    this.listenForICECandidates();
  }

  // بدء المكالمة (للطالب)
  async startCall(studentName: string, teacherName: string, teacherId?: string): Promise<void> {
    try {
      console.log('📞 Starting call...');

      // الحصول على الكاميرا والميكروفون
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // إضافة المسارات للـ peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream!);
      });

      // إنشاء offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // حفظ الـ offer في Firebase مع معرف المعلم
      const callOffer: CallOffer = {
        id: this.callId,
        studentId: this.userId,
        teacherId: teacherId || teacherName, // استخدام معرف المعلم أو اسمه
        studentName,
        teacherName,
        offer: offer,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'webrtc_calls', this.callId), callOffer);
      console.log('✅ Call offer sent to Firebase:', {
        callId: this.callId,
        studentId: callOffer.studentId,
        teacherId: callOffer.teacherId,
        studentName: callOffer.studentName,
        teacherName: callOffer.teacherName,
        status: callOffer.status
      });

      // الاستماع للـ answer
      this.listenForAnswer();

    } catch (error) {
      console.error('❌ Error starting call:', error);
      throw error;
    }
  }

  // قبول المكالمة مع الإذن الممنوح مسبقاً (للمعلم)
  async acceptCallWithPermission(teacherId: string): Promise<void> {
    try {
      console.log('✅ Accepting call with pre-granted permission...');

      // طلب الإذن مرة أخرى (لكن يجب أن يكون ممنوح بالفعل)
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        console.log('🎥 Camera and microphone access confirmed');
      } catch (permissionError) {
        console.error('❌ Unexpected permission error:', permissionError);
        throw new Error('خطأ غير متوقع في الوصول للكاميرا');
      }

      await this.processCallAcceptance(teacherId);
    } catch (error) {
      console.error('❌ Accept call with permission failed:', error);
      throw error;
    }
  }

  // قبول المكالمة (للمعلم)
  async acceptCall(teacherId: string): Promise<void> {
    try {
      console.log('✅ Accepting call...');

      // طلب إذن الكاميرا والميكروفون
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        console.log('🎥 Camera and microphone access granted');
      } catch (permissionError) {
        console.error('❌ Camera/microphone permission denied:', permissionError);
        throw new Error('يرجى السماح للكاميرا والميكروفون للمتابعة');
      }

      await this.processCallAcceptance(teacherId);
    } catch (error) {
      console.error('❌ Accept call failed:', error);
      throw error;
    }
  }

  // معالجة قبول المكالمة (مشتركة)
  private async processCallAcceptance(teacherId: string): Promise<void> {
    try {
      // إنشاء peer connection
      this.peerConnection = new RTCPeerConnection(this.config);
      this.setupPeerConnection();

      // إضافة المسارات للـ peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream!);
        });
      }

      // الحصول على الـ offer من Firebase
      const callDoc = await getDoc(doc(db, 'webrtc_calls', this.callId));
      if (!callDoc.exists()) {
        throw new Error('Call not found');
      }

      const callData = callDoc.data() as CallOffer;

      // تحديث معرف المعلم
      await updateDoc(doc(db, 'webrtc_calls', this.callId), {
        teacherId: teacherId,
        status: 'answered'
      });

      // تعيين الـ remote description
      await this.peerConnection.setRemoteDescription(callData.offer);

      // إنشاء answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // حفظ الـ answer في Firebase
      await updateDoc(doc(db, 'webrtc_calls', this.callId), {
        answer: answer,
        status: 'connected'
      });

      console.log('✅ Call answer sent to Firebase');

    } catch (error) {
      console.error('❌ Error accepting call:', error);
      throw error;
    }
  }

  // الاستماع للـ answer (للطالب)
  private listenForAnswer() {
    const unsubscribe = onSnapshot(doc(db, 'webrtc_calls', this.callId), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as CallOffer;
        
        if (data.answer && !this.peerConnection.remoteDescription) {
          console.log('📨 Received answer from teacher');
          this.peerConnection.setRemoteDescription(data.answer);
        }
      }
    });

    // تنظيف المستمع بعد 30 ثانية
    setTimeout(() => {
      unsubscribe();
    }, 30000);
  }

  // إرسال ICE candidate
  private async sendICECandidate(candidate: RTCIceCandidate) {
    try {
      const iceCandidate: ICECandidate = {
        id: `${this.callId}_${Date.now()}_${Math.random()}`,
        callId: this.callId,
        candidate: candidate.toJSON(),
        from: this.userType,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'ice_candidates', iceCandidate.id), iceCandidate);
    } catch (error) {
      console.error('❌ Error sending ICE candidate:', error);
    }
  }

  // الاستماع للـ ICE candidates
  private listenForICECandidates() {
    const candidatesRef = collection(db, 'ice_candidates');
    
    const unsubscribe = onSnapshot(candidatesRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const data = change.doc.data() as ICECandidate;
          
          // تجاهل الـ candidates الخاصة بي
          if (data.callId === this.callId && data.from !== this.userType) {
            console.log('🧊 Received ICE candidate from peer');
            
            try {
              await this.peerConnection.addIceCandidate(data.candidate);
              
              // حذف الـ candidate بعد الاستخدام
              await deleteDoc(doc(db, 'ice_candidates', data.id));
            } catch (error) {
              console.error('❌ Error adding ICE candidate:', error);
            }
          }
        }
      });
    });

    // تنظيف المستمع بعد 60 ثانية
    setTimeout(() => {
      unsubscribe();
    }, 60000);
  }

  // الحصول على الـ local stream
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // الحصول على الـ remote stream
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // تبديل الكاميرا
  async toggleVideo(): Promise<boolean> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  // تبديل الميكروفون
  async toggleAudio(): Promise<boolean> {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  // إنهاء المكالمة
  async endCall(): Promise<void> {
    try {
      console.log('📞 Ending call...');

      // تحديث حالة المكالمة في Firebase
      await updateDoc(doc(db, 'webrtc_calls', this.callId), {
        status: 'ended'
      });

      this.cleanup();

    } catch (error) {
      console.error('❌ Error ending call:', error);
    }
  }

  // تنظيف الموارد
  private cleanup() {
    console.log('🧹 Cleaning up WebRTC resources...');

    // إغلاق الـ local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // إغلاق الـ peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    // حذف بيانات المكالمة من Firebase (اختياري)
    deleteDoc(doc(db, 'webrtc_calls', this.callId)).catch(console.error);
  }
}
