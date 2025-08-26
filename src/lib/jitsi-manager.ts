'use client';

// مدير Jitsi Meet للمكالمات المجانية
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
    this.displayName = displayName;
  }

  // تحميل Jitsi Meet API
  private async loadJitsiAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      // التحقق من وجود المكتبة
      if (typeof window !== 'undefined' && (window as any).JitsiMeetExternalAPI) {
        resolve();
        return;
      }

      // تحميل المكتبة
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('فشل في تحميل Jitsi Meet API'));
      document.head.appendChild(script);
    });
  }

  // إنشاء مكالمة جديدة
  async createCall(roomName: string, containerElement: HTMLElement): Promise<void> {
    try {
      this.roomName = roomName;
      
      // تحميل API إذا لم يكن محملاً
      await this.loadJitsiAPI();

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

      // إنشاء API instance
      this.api = new (window as any).JitsiMeetExternalAPI(this.domain, options);

      // إعداد معالجات الأحداث
      this.setupEventHandlers();

      console.log('✅ تم إنشاء مكالمة Jitsi بنجاح:', roomName);

    } catch (error) {
      console.error('❌ خطأ في إنشاء المكالمة:', error);
      this.onError?.(error);
      throw error;
    }
  }

  // إعداد معالجات الأحداث
  private setupEventHandlers(): void {
    if (!this.api) return;

    // جاهزية المكالمة
    this.api.addEventListener('videoConferenceJoined', (participant: any) => {
      console.log('🎉 انضممت للمكالمة:', participant);
      this.onVideoConferenceJoined?.(participant);
      this.onReady?.();
    });

    // انضمام مشارك
    this.api.addEventListener('participantJoined', (participant: any) => {
      console.log('👋 انضم مشارك جديد:', participant);
      this.onParticipantJoined?.(participant);
    });

    // مغادرة مشارك
    this.api.addEventListener('participantLeft', (participant: any) => {
      console.log('👋 غادر مشارك:', participant);
      this.onParticipantLeft?.(participant);
    });

    // مغادرة المكالمة
    this.api.addEventListener('videoConferenceLeft', () => {
      console.log('📞 تم إنهاء المكالمة');
      this.onVideoConferenceLeft?.();
    });

    // أخطاء
    this.api.addEventListener('error', (error: any) => {
      console.error('❌ خطأ في Jitsi:', error);
      this.onError?.(error);
    });

    // تغيير حالة الصوت
    this.api.addEventListener('audioMuteStatusChanged', (event: any) => {
      this.isAudioMuted = event.muted;
      console.log('🎤 حالة الصوت:', this.isAudioMuted ? 'مكتوم' : 'مفعل');
    });

    // تغيير حالة الفيديو
    this.api.addEventListener('videoMuteStatusChanged', (event: any) => {
      this.isVideoMuted = event.muted;
      console.log('📹 حالة الفيديو:', this.isVideoMuted ? 'مغلق' : 'مفعل');
    });
  }

  // تبديل حالة الصوت
  toggleAudio(): void {
    if (this.api) {
      this.api.executeCommand('toggleAudio');
    }
  }

  // تبديل حالة الفيديو
  toggleVideo(): void {
    if (this.api) {
      this.api.executeCommand('toggleVideo');
    }
  }

  // إنهاء المكالمة
  endCall(): void {
    if (this.api) {
      this.api.executeCommand('hangup');
      this.api.dispose();
      this.api = null;
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

  // تنظيف الموارد
  dispose(): void {
    if (this.api) {
      this.api.dispose();
      this.api = null;
    }
  }
}
