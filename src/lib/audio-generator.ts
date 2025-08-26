'use client';

// مولد الأصوات للرنين والإشعارات
export class AudioGenerator {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // إنشاء نغمة رنين إسلامية هادئة
  createRingtone(): HTMLAudioElement | null {
    if (!this.audioContext) return null;

    try {
      const sampleRate = this.audioContext.sampleRate;
      const duration = 3; // 3 ثوان
      const length = sampleRate * duration;
      
      // إنشاء buffer
      const buffer = this.audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // إنشاء نغمة متناغمة (مقام حجاز)
      for (let i = 0; i < length; i++) {
        const time = i / sampleRate;
        
        // نغمات أساسية
        const freq1 = 440; // لا
        const freq2 = 493.88; // سي
        const freq3 = 523.25; // دو
        
        // موجات صوتية متداخلة
        const wave1 = Math.sin(2 * Math.PI * freq1 * time) * 0.3;
        const wave2 = Math.sin(2 * Math.PI * freq2 * time) * 0.2;
        const wave3 = Math.sin(2 * Math.PI * freq3 * time) * 0.1;
        
        // تأثير التلاشي التدريجي
        const fadeIn = Math.min(time * 4, 1);
        const fadeOut = Math.min((duration - time) * 4, 1);
        const envelope = fadeIn * fadeOut;
        
        data[i] = (wave1 + wave2 + wave3) * envelope * 0.5;
      }
      
      // تحويل إلى WAV
      const wav = this.audioBufferToWav(buffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      // إنشاء عنصر audio
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0.7;
      
      return audio;
    } catch (error) {
      console.error('خطأ في إنشاء نغمة الرنين:', error);
      return null;
    }
  }

  // إنشاء صوت إشعار قصير
  createNotificationSound(): HTMLAudioElement | null {
    if (!this.audioContext) return null;

    try {
      const sampleRate = this.audioContext.sampleRate;
      const duration = 0.5; // نصف ثانية
      const length = sampleRate * duration;
      
      const buffer = this.audioContext.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // نغمة إشعار بسيطة
      for (let i = 0; i < length; i++) {
        const time = i / sampleRate;
        const freq = 800; // تردد عالي للإشعار
        
        const wave = Math.sin(2 * Math.PI * freq * time);
        const envelope = Math.exp(-time * 5); // تلاشي سريع
        
        data[i] = wave * envelope * 0.3;
      }
      
      const wav = this.audioBufferToWav(buffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      audio.volume = 0.5;
      
      return audio;
    } catch (error) {
      console.error('خطأ في إنشاء صوت الإشعار:', error);
      return null;
    }
  }

  // تحويل AudioBuffer إلى WAV
  private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // كتابة نص
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // WAV header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // PCM data
    const data = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return arrayBuffer;
  }

  // تشغيل نغمة رنين
  async playRingtone(): Promise<HTMLAudioElement | null> {
    const ringtone = this.createRingtone();
    if (ringtone) {
      try {
        await ringtone.play();
        return ringtone;
      } catch (error) {
        console.warn('لا يمكن تشغيل نغمة الرنين تلقائياً:', error);
      }
    }
    return null;
  }

  // تشغيل صوت إشعار
  async playNotification(): Promise<void> {
    const notification = this.createNotificationSound();
    if (notification) {
      try {
        await notification.play();
      } catch (error) {
        console.warn('لا يمكن تشغيل صوت الإشعار:', error);
      }
    }
  }

  // إيقاف جميع الأصوات
  stopAll(): void {
    // سيتم إيقاف الأصوات من خلال المراجع المحفوظة
  }
}

// مثيل مشترك
export const audioGenerator = new AudioGenerator();
