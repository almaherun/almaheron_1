'use client';

// نظام تسجيل الأخطاء المفصل
class DetailedLogger {
  private static instance: DetailedLogger;
  private logs: Array<{timestamp: string, level: string, message: string, data?: any}> = [];

  static getInstance(): DetailedLogger {
    if (!DetailedLogger.instance) {
      DetailedLogger.instance = new DetailedLogger();
    }
    return DetailedLogger.instance;
  }

  log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, data };
    this.logs.push(logEntry);

    // طباعة في Console مع ألوان
    const style = {
      INFO: 'color: #2196F3; font-weight: bold',
      WARN: 'color: #FF9800; font-weight: bold',
      ERROR: 'color: #F44336; font-weight: bold',
      DEBUG: 'color: #4CAF50; font-weight: bold'
    };

    console.log(`%c[${level}] ${timestamp} - ${message}`, style[level], data || '');

    // حفظ في localStorage للمراجعة
    try {
      localStorage.setItem('jitsi_debug_logs', JSON.stringify(this.logs.slice(-100))); // آخر 100 سجل
    } catch (e) {
      console.warn('لا يمكن حفظ السجلات في localStorage');
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('jitsi_debug_logs');
  }
}

const logger = DetailedLogger.getInstance();

// مدير Jitsi Meet للمكالمات المجانية مع تسجيل مفصل
export class JitsiManager {
  private api: any = null;
  private domain = 'meet.jit.si';
  private roomName: string = '';
  private displayName: string = '';
  private isVideoMuted = false;
  private isAudioMuted = false;

  // معالجات الأحداث
  public onReady?: () => void;
  public onParticipantJoined?: (participant: any) => void;
  public onParticipantLeft?: (participant: any) => void;
  public onVideoConferenceJoined?: (participant: any) => void;
  public onVideoConferenceLeft?: () => void;
  public onError?: (error: any) => void;

  constructor(displayName: string) {
    logger.log('INFO', 'JitsiManager Constructor', { displayName });
    this.displayName = displayName;

    // فحص البيئة
    this.checkEnvironment();
  }

  // فحص البيئة والمتطلبات
  private checkEnvironment(): void {
    logger.log('DEBUG', 'فحص البيئة والمتطلبات');

    // فحص المتصفح
    if (typeof window === 'undefined') {
      logger.log('ERROR', 'البيئة: window غير متاح (SSR)');
      return;
    }

    // فحص HTTPS
    const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    logger.log(isHTTPS ? 'INFO' : 'WARN', `البروتوكول: ${window.location.protocol}`, { isHTTPS });

    if (!isHTTPS) {
      logger.log('ERROR', 'Jitsi Meet يتطلب HTTPS أو localhost');
    }

    // فحص دعم WebRTC
    const hasWebRTC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    logger.log(hasWebRTC ? 'INFO' : 'ERROR', 'دعم WebRTC', { hasWebRTC });

    // فحص دعم الكاميرا والميكروفون
    if (navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          const audioDevices = devices.filter(d => d.kind === 'audioinput');

          logger.log('INFO', 'الأجهزة المتاحة', {
            video: videoDevices.length,
            audio: audioDevices.length,
            devices: devices.map(d => ({ kind: d.kind, label: d.label }))
          });
        })
        .catch(error => {
          logger.log('ERROR', 'فشل في فحص الأجهزة', error);
        });
    }

    // فحص الشبكة
    if (navigator.onLine !== undefined) {
      logger.log('INFO', 'حالة الشبكة', { online: navigator.onLine });
    }
  }

  // فحص أذونات الكاميرا والميكروفون
  private async checkPermissions(): Promise<void> {
    logger.log('INFO', 'فحص أذونات الوسائط');

    try {
      // طلب الأذونات
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      logger.log('INFO', 'تم الحصول على أذونات الوسائط بنجاح', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      // إيقاف الـ stream بعد التحقق
      stream.getTracks().forEach(track => {
        track.stop();
        logger.log('DEBUG', 'تم إيقاف track', { kind: track.kind, label: track.label });
      });

    } catch (error: any) {
      logger.log('ERROR', 'فشل في الحصول على أذونات الوسائط', {
        name: error.name,
        message: error.message,
        constraint: error.constraint
      });

      // رسائل خطأ مفصلة حسب نوع الخطأ
      if (error.name === 'NotAllowedError') {
        throw new Error('تم رفض الوصول للكاميرا والميكروفون. يرجى السماح بالوصول من إعدادات المتصفح.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('لم يتم العثور على كاميرا أو ميكروفون. تأكد من توصيل الأجهزة.');
      } else if (error.name === 'NotReadableError') {
        throw new Error('الكاميرا أو الميكروفون مستخدم من تطبيق آخر.');
      } else if (error.name === 'OverconstrainedError') {
        throw new Error('إعدادات الكاميرا أو الميكروفون غير مدعومة.');
      } else {
        throw new Error(`خطأ في الوصول للوسائط: ${error.message}`);
      }
    }
  }

  // تحميل Jitsi Meet API مع تسجيل مفصل
  private async loadJitsiAPI(): Promise<void> {
    logger.log('INFO', 'بدء تحميل Jitsi Meet API');

    return new Promise((resolve, reject) => {
      // التحقق من وجود المكتبة
      if (typeof window !== 'undefined' && (window as any).JitsiMeetExternalAPI) {
        logger.log('INFO', 'Jitsi API موجود مسبقاً');
        resolve();
        return;
      }

      logger.log('INFO', 'تحميل Jitsi API من الخادم');

      // تحميل المكتبة
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;

      script.onload = () => {
        logger.log('INFO', 'تم تحميل Jitsi API بنجاح');

        // التحقق من وجود الكلاس
        if ((window as any).JitsiMeetExternalAPI) {
          logger.log('INFO', 'JitsiMeetExternalAPI متاح');
          resolve();
        } else {
          logger.log('ERROR', 'JitsiMeetExternalAPI غير متاح بعد التحميل');
          reject(new Error('JitsiMeetExternalAPI غير متاح بعد التحميل'));
        }
      };

      script.onerror = (error) => {
        logger.log('ERROR', 'فشل في تحميل Jitsi Meet API', error);
        reject(new Error('فشل في تحميل Jitsi Meet API'));
      };

      // فحص إذا كان الـ script موجود مسبقاً
      const existingScript = document.querySelector('script[src="https://meet.jit.si/external_api.js"]');
      if (existingScript) {
        logger.log('WARN', 'Jitsi script موجود مسبقاً، إزالة النسخة القديمة');
        existingScript.remove();
      }

      document.head.appendChild(script);
      logger.log('DEBUG', 'تم إضافة Jitsi script إلى DOM');
    });
  }

  // إنشاء مكالمة جديدة مع تسجيل مفصل
  async createCall(roomName: string, containerElement: HTMLElement): Promise<void> {
    logger.log('INFO', 'بدء إنشاء مكالمة جديدة', { roomName, hasContainer: !!containerElement });

    try {
      // التحقق من المعاملات
      if (!roomName || !roomName.trim()) {
        throw new Error('اسم الغرفة مطلوب');
      }

      if (!containerElement) {
        throw new Error('عنصر الحاوي مطلوب');
      }

      this.roomName = roomName.trim();
      logger.log('DEBUG', 'تم تعيين اسم الغرفة', { roomName: this.roomName });

      // فحص الأذونات قبل البدء
      await this.checkPermissions();

      // تحميل API إذا لم يكن محملاً
      logger.log('INFO', 'تحميل Jitsi API');
      await this.loadJitsiAPI();

      // التحقق من توفر JitsiMeetExternalAPI
      if (!(window as any).JitsiMeetExternalAPI) {
        throw new Error('JitsiMeetExternalAPI غير متاح بعد التحميل');
      }

      logger.log('INFO', 'إعداد خيارات المكالمة');
      const options = {
        roomName: this.roomName,
        width: '100%',
        height: '100%',
        parentNode: containerElement,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          enableClosePage: false,
          prejoinPageEnabled: false,
          disableInviteFunctions: true,
          disableAddingBackgroundImages: true,
          enableEmailInStats: false,
          enableDisplayNameInStats: false,
          enablePhoneNumberInStats: false,
          // إعدادات عربية
          defaultLanguage: 'ar',
          // إعدادات الأمان
          enableLobbyChat: false,
          enableInsecureRoomNameWarning: false,
        },
        interfaceConfigOverwrite: {
          // إخفاء عناصر غير مرغوب فيها
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
            'security'
          ],
          SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          DISPLAY_WELCOME_PAGE_CONTENT: false,
          DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
          APP_NAME: 'أكاديمية المحرون للقرآن',
          NATIVE_APP_NAME: 'أكاديمية المحرون للقرآن',
          DEFAULT_BACKGROUND: '#1a365d',
          DISABLE_VIDEO_BACKGROUND: false,
          INITIAL_TOOLBAR_TIMEOUT: 20000,
          TOOLBAR_TIMEOUT: 4000,
          TOOLBAR_ALWAYS_VISIBLE: false,
          DEFAULT_REMOTE_DISPLAY_NAME: 'مشارك',
          DEFAULT_LOCAL_DISPLAY_NAME: 'أنت',
          SHOW_CHROME_EXTENSION_BANNER: false,
        },
        userInfo: {
          displayName: this.displayName,
        }
      };

      logger.log('DEBUG', 'خيارات Jitsi المكونة', options);

      // تنظيف الحاوي
      logger.log('DEBUG', 'تنظيف الحاوي');
      containerElement.innerHTML = '';

      // إنشاء API instance
      logger.log('INFO', 'إنشاء مثيل JitsiMeetExternalAPI');
      try {
        this.api = new (window as any).JitsiMeetExternalAPI(this.domain, options);
        logger.log('INFO', 'تم إنشاء مثيل JitsiMeetExternalAPI بنجاح');
      } catch (apiError: any) {
        logger.log('ERROR', 'فشل في إنشاء مثيل JitsiMeetExternalAPI', apiError);
        throw new Error(`فشل في إنشاء مثيل Jitsi: ${apiError.message}`);
      }

      // إعداد معالجات الأحداث
      logger.log('INFO', 'إعداد معالجات الأحداث');
      this.setupEventHandlers();

      logger.log('INFO', '✅ تم إنشاء مكالمة Jitsi بنجاح', { roomName, domain: this.domain });

    } catch (error: any) {
      logger.log('ERROR', '❌ خطأ في إنشاء المكالمة', {
        message: error.message,
        stack: error.stack,
        roomName,
        displayName: this.displayName
      });

      this.onError?.(error);
      throw error;
    }
  }

  // إعداد معالجات الأحداث مع تسجيل مفصل
  private setupEventHandlers(): void {
    if (!this.api) {
      logger.log('ERROR', 'لا يمكن إعداد معالجات الأحداث - API غير متاح');
      return;
    }

    logger.log('INFO', 'إعداد معالجات أحداث Jitsi');

    // جاهزية المكالمة
    this.api.addEventListener('videoConferenceJoined', (participant: any) => {
      logger.log('INFO', '🎉 انضممت للمكالمة بنجاح', participant);
      this.onVideoConferenceJoined?.(participant);
      this.onReady?.();
    });

    // انضمام مشارك
    this.api.addEventListener('participantJoined', (participant: any) => {
      logger.log('INFO', '👋 انضم مشارك جديد', participant);
      this.onParticipantJoined?.(participant);
    });

    // مغادرة مشارك
    this.api.addEventListener('participantLeft', (participant: any) => {
      logger.log('INFO', '👋 غادر مشارك', participant);
      this.onParticipantLeft?.(participant);
    });

    // مغادرة المكالمة
    this.api.addEventListener('videoConferenceLeft', () => {
      logger.log('INFO', '📞 تم إنهاء المكالمة');
      this.onVideoConferenceLeft?.();
    });

    // أخطاء Jitsi
    this.api.addEventListener('error', (error: any) => {
      logger.log('ERROR', '❌ خطأ في Jitsi', error);
      this.onError?.(error);
    });

    // تغيير حالة الصوت
    this.api.addEventListener('audioMuteStatusChanged', (event: any) => {
      this.isAudioMuted = event.muted;
      logger.log('DEBUG', '🎤 تغيير حالة الصوت', { muted: this.isAudioMuted });
    });

    // تغيير حالة الفيديو
    this.api.addEventListener('videoMuteStatusChanged', (event: any) => {
      this.isVideoMuted = event.muted;
      logger.log('DEBUG', '📹 تغيير حالة الفيديو', { muted: this.isVideoMuted });
    });
  }

  // تبديل حالة الصوت مع تسجيل
  toggleAudio(): void {
    logger.log('INFO', 'تبديل حالة الصوت');
    if (this.api) {
      try {
        this.api.executeCommand('toggleAudio');
        logger.log('DEBUG', 'تم تنفيذ أمر تبديل الصوت');
      } catch (error) {
        logger.log('ERROR', 'فشل في تبديل الصوت', error);
      }
    } else {
      logger.log('WARN', 'لا يمكن تبديل الصوت - API غير متاح');
    }
  }

  // تبديل حالة الفيديو مع تسجيل
  toggleVideo(): void {
    logger.log('INFO', 'تبديل حالة الفيديو');
    if (this.api) {
      try {
        this.api.executeCommand('toggleVideo');
        logger.log('DEBUG', 'تم تنفيذ أمر تبديل الفيديو');
      } catch (error) {
        logger.log('ERROR', 'فشل في تبديل الفيديو', error);
      }
    } else {
      logger.log('WARN', 'لا يمكن تبديل الفيديو - API غير متاح');
    }
  }

  // إنهاء المكالمة مع تسجيل
  endCall(): void {
    logger.log('INFO', 'إنهاء المكالمة');
    if (this.api) {
      try {
        this.api.executeCommand('hangup');
        this.api.dispose();
        this.api = null;
        logger.log('INFO', 'تم إنهاء المكالمة وتنظيف الموارد');
      } catch (error) {
        logger.log('ERROR', 'خطأ أثناء إنهاء المكالمة', error);
      }
    } else {
      logger.log('WARN', 'لا توجد مكالمة نشطة لإنهائها');
    }
  }

  // الحصول على حالة الصوت
  getAudioMuted(): boolean {
    return this.isAudioMuted;
  }

  // الحصول على حالة الفيديو
  getVideoMuted(): boolean {
    return this.isVideoMuted;
  }

  // الحصول على اسم الغرفة
  getRoomName(): string {
    return this.roomName;
  }

  // التحقق من حالة المكالمة
  isCallActive(): boolean {
    return this.api !== null;
  }

  // تنظيف الموارد مع تسجيل
  dispose(): void {
    logger.log('INFO', 'تنظيف موارد JitsiManager');
    if (this.api) {
      try {
        this.api.dispose();
        this.api = null;
        logger.log('INFO', 'تم تنظيف موارد Jitsi بنجاح');
      } catch (error) {
        logger.log('ERROR', 'خطأ أثناء تنظيف موارد Jitsi', error);
      }
    }
  }

  // الحصول على السجلات للتشخيص
  static getDebugLogs() {
    return logger.getLogs();
  }

  // مسح السجلات
  static clearDebugLogs() {
    logger.clearLogs();
  }
}

// دوال مساعدة للتشخيص
export const JitsiDebugUtils = {
  // عرض السجلات في Console
  showLogs: () => {
    const logs = logger.getLogs();
    console.group('🔍 سجلات تشخيص Jitsi');
    logs.forEach(log => {
      const style = {
        INFO: 'color: #2196F3',
        WARN: 'color: #FF9800',
        ERROR: 'color: #F44336',
        DEBUG: 'color: #4CAF50'
      }[log.level] || 'color: #000';

      console.log(`%c[${log.level}] ${log.timestamp} - ${log.message}`, style, log.data || '');
    });
    console.groupEnd();
  },

  // تصدير السجلات كـ JSON
  exportLogs: () => {
    const logs = logger.getLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jitsi-debug-logs-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  // فحص حالة النظام
  checkSystemStatus: async () => {
    logger.log('INFO', 'فحص حالة النظام');

    const status = {
      browser: navigator.userAgent,
      online: navigator.onLine,
      https: window.location.protocol === 'https:',
      webrtc: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      jitsiAPI: !!(window as any).JitsiMeetExternalAPI,
      timestamp: new Date().toISOString()
    };

    // فحص الأجهزة
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      status.devices = {
        video: devices.filter(d => d.kind === 'videoinput').length,
        audio: devices.filter(d => d.kind === 'audioinput').length
      };
    } catch (error) {
      status.devices = { error: error.message };
    }

    logger.log('INFO', 'حالة النظام', status);
    return status;
  },

  // مسح السجلات
  clearLogs: () => {
    logger.clearLogs();
    console.log('🧹 تم مسح سجلات التشخيص');
  }
};
