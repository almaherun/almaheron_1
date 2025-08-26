'use client';

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { audioGenerator } from '@/lib/audio-generator';

// أنواع البيانات
export interface CallRequest {
  id?: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  toUserId: string;
  toUserName: string;
  roomName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'ended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  callType: 'video' | 'audio';
  subject?: string; // موضوع المكالمة (مثل: سورة البقرة)
}

export interface CallNotificationCallbacks {
  onIncomingCall?: (callRequest: CallRequest) => void;
  onCallAccepted?: (callRequest: CallRequest) => void;
  onCallRejected?: (callRequest: CallRequest) => void;
  onCallCancelled?: (callRequest: CallRequest) => void;
  onCallEnded?: (callRequest: CallRequest) => void;
  onError?: (error: Error) => void;
}

export class CallNotificationManager {
  private userId: string;
  private userName: string;
  private callbacks: CallNotificationCallbacks = {};
  private unsubscribeIncoming: (() => void) | null = null;
  private unsubscribeOutgoing: (() => void) | null = null;
  private ringtone: HTMLAudioElement | null = null;

  constructor(userId: string, userName: string) {
    this.userId = userId;
    this.userName = userName;
    this.initializeRingtone();
  }

  // تهيئة صوت الرنين
  private initializeRingtone(): void {
    // سيتم استخدام مولد الأصوات بدلاً من ملفات خارجية
    this.ringtone = null;
  }

  // تشغيل صوت الرنين
  private async playRingtone(): Promise<void> {
    try {
      this.ringtone = await audioGenerator.playRingtone();
    } catch (error) {
      console.warn('لا يمكن تشغيل صوت الرنين:', error);
    }
  }

  // إيقاف صوت الرنين
  private stopRingtone(): void {
    if (this.ringtone) {
      this.ringtone.pause();
      this.ringtone.currentTime = 0;
      this.ringtone = null;
    }
  }

  // إعداد معالجات الأحداث
  setCallbacks(callbacks: CallNotificationCallbacks): void {
    this.callbacks = callbacks;
  }

  // بدء الاستماع للمكالمات الواردة
  startListening(): void {
    console.log('🎧 بدء الاستماع للمكالمات الواردة للمستخدم:', this.userId);

    // الاستماع للمكالمات الواردة
    const incomingQuery = query(
      collection(db, 'call_requests'),
      where('toUserId', '==', this.userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    this.unsubscribeIncoming = onSnapshot(incomingQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const callRequest = {
            id: change.doc.id,
            ...change.doc.data()
          } as CallRequest;

          console.log('📞 مكالمة واردة جديدة:', callRequest);
          this.playRingtone();
          this.callbacks.onIncomingCall?.(callRequest);
        }
      });
    }, (error) => {
      console.error('❌ خطأ في الاستماع للمكالمات الواردة:', error);
      this.callbacks.onError?.(error as Error);
    });

    // الاستماع لتحديثات المكالمات الصادرة
    const outgoingQuery = query(
      collection(db, 'call_requests'),
      where('fromUserId', '==', this.userId),
      orderBy('updatedAt', 'desc')
    );

    this.unsubscribeOutgoing = onSnapshot(outgoingQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const callRequest = {
            id: change.doc.id,
            ...change.doc.data()
          } as CallRequest;

          console.log('📱 تحديث مكالمة صادرة:', callRequest);

          switch (callRequest.status) {
            case 'accepted':
              this.callbacks.onCallAccepted?.(callRequest);
              break;
            case 'rejected':
              this.callbacks.onCallRejected?.(callRequest);
              break;
            case 'ended':
              this.callbacks.onCallEnded?.(callRequest);
              break;
          }
        }
      });
    }, (error) => {
      console.error('❌ خطأ في الاستماع للمكالمات الصادرة:', error);
      this.callbacks.onError?.(error as Error);
    });
  }

  // إيقاف الاستماع
  stopListening(): void {
    if (this.unsubscribeIncoming) {
      this.unsubscribeIncoming();
      this.unsubscribeIncoming = null;
    }
    if (this.unsubscribeOutgoing) {
      this.unsubscribeOutgoing();
      this.unsubscribeOutgoing = null;
    }
    this.stopRingtone();
  }

  // إرسال طلب مكالمة
  async sendCallRequest(
    toUserId: string, 
    toUserName: string, 
    callType: 'video' | 'audio' = 'video',
    subject?: string
  ): Promise<string> {
    try {
      const roomName = `call_${this.userId}_${toUserId}_${Date.now()}`;
      
      const callRequest: Omit<CallRequest, 'id'> = {
        fromUserId: this.userId,
        fromUserName: this.userName,
        toUserId,
        toUserName,
        roomName,
        status: 'pending',
        callType,
        subject,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const docRef = await addDoc(collection(db, 'call_requests'), callRequest);
      console.log('📤 تم إرسال طلب المكالمة:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ خطأ في إرسال طلب المكالمة:', error);
      throw error;
    }
  }

  // قبول مكالمة
  async acceptCall(callRequestId: string): Promise<void> {
    try {
      this.stopRingtone();
      
      await updateDoc(doc(db, 'call_requests', callRequestId), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });

      console.log('✅ تم قبول المكالمة:', callRequestId);
    } catch (error) {
      console.error('❌ خطأ في قبول المكالمة:', error);
      throw error;
    }
  }

  // رفض مكالمة
  async rejectCall(callRequestId: string): Promise<void> {
    try {
      this.stopRingtone();
      
      await updateDoc(doc(db, 'call_requests', callRequestId), {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });

      console.log('❌ تم رفض المكالمة:', callRequestId);
    } catch (error) {
      console.error('❌ خطأ في رفض المكالمة:', error);
      throw error;
    }
  }

  // إلغاء مكالمة
  async cancelCall(callRequestId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'call_requests', callRequestId), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });

      console.log('🚫 تم إلغاء المكالمة:', callRequestId);
    } catch (error) {
      console.error('❌ خطأ في إلغاء المكالمة:', error);
      throw error;
    }
  }

  // إنهاء مكالمة
  async endCall(callRequestId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'call_requests', callRequestId), {
        status: 'ended',
        updatedAt: serverTimestamp(),
      });

      console.log('📞 تم إنهاء المكالمة:', callRequestId);
    } catch (error) {
      console.error('❌ خطأ في إنهاء المكالمة:', error);
      throw error;
    }
  }

  // حذف طلب مكالمة
  async deleteCallRequest(callRequestId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'call_requests', callRequestId));
      console.log('🗑️ تم حذف طلب المكالمة:', callRequestId);
    } catch (error) {
      console.error('❌ خطأ في حذف طلب المكالمة:', error);
      throw error;
    }
  }

  // تنظيف الموارد
  dispose(): void {
    this.stopListening();
    if (this.ringtone) {
      this.ringtone.pause();
      this.ringtone = null;
    }
  }
}
