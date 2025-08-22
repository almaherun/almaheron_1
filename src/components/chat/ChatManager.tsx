'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from './ChatInterface';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  where,
  getDocs
} from 'firebase/firestore';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'system';
  timestamp: Date;
  isRead: boolean;
  replyTo?: string;
}

interface Chat {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  participantAvatars: { [key: string]: string };
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: { [key: string]: number };
  isActive: boolean;
}

interface ChatManagerProps {
  recipientId?: string;
  recipientName?: string;
  recipientAvatar?: string;
  onStartCall?: () => void;
  onStartVideoCall?: () => void;
}

export default function ChatManager({
  recipientId,
  recipientName,
  recipientAvatar,
  onStartCall,
  onStartVideoCall
}: ChatManagerProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const messagesUnsubscribe = useRef<(() => void) | null>(null);
  const chatsUnsubscribe = useRef<(() => void) | null>(null);

  // تحميل قائمة الدردشات
  useEffect(() => {
    if (!user?.uid) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    chatsUnsubscribe.current = onSnapshot(chatsQuery, (snapshot) => {
      const chatsData: Chat[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        chatsData.push({
          id: doc.id,
          participants: data.participants,
          participantNames: data.participantNames || {},
          participantAvatars: data.participantAvatars || {},
          lastMessage: data.lastMessage,
          lastMessageTime: data.lastMessageTime?.toDate(),
          unreadCount: data.unreadCount || {},
          isActive: data.isActive || false
        });
      });
      
      // ترتيب الدردشات حسب آخر رسالة
      chatsData.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
      });
      
      setChats(chatsData);
    });

    return () => {
      if (chatsUnsubscribe.current) {
        chatsUnsubscribe.current();
      }
    };
  }, [user?.uid]);

  // إنشاء أو العثور على دردشة مع مستخدم معين
  const findOrCreateChat = async (otherUserId: string, otherUserName: string, otherUserAvatar?: string) => {
    if (!user?.uid) return null;

    // البحث عن دردشة موجودة
    const existingChat = chats.find(chat => 
      chat.participants.includes(otherUserId) && chat.participants.includes(user.uid)
    );

    if (existingChat) {
      return existingChat;
    }

    // إنشاء دردشة جديدة
    try {
      const chatData = {
        participants: [user.uid, otherUserId],
        participantNames: {
          [user.uid]: user.displayName || 'أنت',
          [otherUserId]: otherUserName
        },
        participantAvatars: {
          [user.uid]: user.photoURL || '',
          [otherUserId]: otherUserAvatar || ''
        },
        unreadCount: {
          [user.uid]: 0,
          [otherUserId]: 0
        },
        isActive: true,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'chats'), chatData);
      
      const newChat: Chat = {
        id: docRef.id,
        ...chatData,
        unreadCount: chatData.unreadCount
      };

      return newChat;
    } catch (error) {
      console.error('خطأ في إنشاء الدردشة:', error);
      return null;
    }
  };

  // تحميل رسائل الدردشة النشطة
  useEffect(() => {
    if (!activeChat?.id) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    messagesUnsubscribe.current = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messagesData.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar,
          content: data.content,
          type: data.type,
          timestamp: data.timestamp?.toDate() || new Date(),
          isRead: data.isRead || false,
          replyTo: data.replyTo
        });
      });
      setMessages(messagesData);

      // تحديث حالة القراءة للرسائل الجديدة
      markMessagesAsRead(messagesData);
    });

    return () => {
      if (messagesUnsubscribe.current) {
        messagesUnsubscribe.current();
      }
    };
  }, [activeChat?.id]);

  // تحديد الرسائل كمقروءة
  const markMessagesAsRead = async (messages: Message[]) => {
    if (!user?.uid || !activeChat?.id) return;

    const unreadMessages = messages.filter(
      msg => msg.senderId !== user.uid && !msg.isRead
    );

    for (const message of unreadMessages) {
      try {
        await updateDoc(
          doc(db, 'chats', activeChat.id, 'messages', message.id),
          { isRead: true }
        );
      } catch (error) {
        console.error('خطأ في تحديث حالة القراءة:', error);
      }
    }
  };

  // إرسال رسالة
  const sendMessage = async (content: string, type: 'text' | 'image' | 'file' | 'audio') => {
    if (!user?.uid || !activeChat?.id || !content.trim()) return;

    try {
      const messageData = {
        senderId: user.uid,
        senderName: user.displayName || 'مستخدم',
        senderAvatar: user.photoURL || '',
        content: content.trim(),
        type,
        timestamp: serverTimestamp(),
        isRead: false
      };

      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), messageData);

      // تحديث آخر رسالة في الدردشة
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: type === 'text' ? content.trim() : `تم إرسال ${type}`,
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${activeChat.participants.find(p => p !== user.uid)}`]: 
          (activeChat.unreadCount[activeChat.participants.find(p => p !== user.uid) || ''] || 0) + 1
      });

    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
    }
  };

  // معالجة الكتابة
  const handleTyping = (isTyping: boolean) => {
    setIsTyping(isTyping);
    // يمكن إضافة منطق إرسال حالة الكتابة للمستخدم الآخر هنا
  };

  // فتح دردشة مع مستخدم معين
  const openChatWith = async (userId: string, userName: string, userAvatar?: string) => {
    const chat = await findOrCreateChat(userId, userName, userAvatar);
    if (chat) {
      setActiveChat(chat);
      setIsMinimized(false);
      setShowChatList(false);
    }
  };

  // فتح دردشة مع المستلم المحدد
  useEffect(() => {
    if (recipientId && recipientName && user?.uid) {
      openChatWith(recipientId, recipientName, recipientAvatar);
    }
  }, [recipientId, recipientName, recipientAvatar, user?.uid]);

  if (!user?.uid) {
    return null;
  }

  // عرض قائمة الدردشات
  if (showChatList) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
      >
        <div className="bg-green-500 text-white p-4 flex items-center justify-between">
          <h3 className="font-semibold">الدردشات</h3>
          <button
            onClick={() => setShowChatList(false)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>لا توجد دردشات</p>
            </div>
          ) : (
            chats.map((chat) => {
              const otherParticipant = chat.participants.find(p => p !== user.uid);
              const otherName = otherParticipant ? chat.participantNames[otherParticipant] : 'مستخدم';
              const otherAvatar = otherParticipant ? chat.participantAvatars[otherParticipant] : '';
              const unreadCount = chat.unreadCount[user.uid] || 0;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChat(chat);
                    setShowChatList(false);
                  }}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {otherAvatar ? (
                      <img src={otherAvatar} alt={otherName} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                        {otherName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{otherName}</h4>
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                        {unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    );
  }

  // عرض واجهة الدردشة النشطة
  if (activeChat) {
    const otherParticipant = activeChat.participants.find(p => p !== user.uid);
    const otherName = otherParticipant ? activeChat.participantNames[otherParticipant] : 'مستخدم';
    const otherAvatar = otherParticipant ? activeChat.participantAvatars[otherParticipant] : '';

    return (
      <ChatInterface
        chatId={activeChat.id}
        currentUserId={user.uid}
        currentUserName={user.displayName || 'أنت'}
        currentUserAvatar={user.photoURL || ''}
        recipientName={otherName}
        recipientAvatar={otherAvatar}
        recipientStatus="online"
        messages={messages}
        isMinimized={isMinimized}
        onSendMessage={sendMessage}
        onStartCall={onStartCall}
        onStartVideoCall={onStartVideoCall}
        onToggleMinimize={() => setIsMinimized(!isMinimized)}
        onClose={() => setActiveChat(null)}
        onTyping={handleTyping}
      />
    );
  }

  // زر فتح الدردشات
  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onClick={() => setShowChatList(true)}
      className="fixed bottom-4 right-4 w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors flex items-center justify-center"
    >
      <MessageCircle className="w-6 h-6" />
      {chats.reduce((total, chat) => total + (chat.unreadCount[user?.uid || ''] || 0), 0) > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
          {chats.reduce((total, chat) => total + (chat.unreadCount[user?.uid || ''] || 0), 0)}
        </div>
      )}
    </motion.button>
  );
}
