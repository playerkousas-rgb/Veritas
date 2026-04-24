// Veritas Backend API Service
import { User, VeritasPhoto, JournalEntry, Message, Conversation, Notification } from './types';

const API_BASE_URL = 'https://api.veritas.app/v1';

// Mock Backend Data
let MOCK_USERS: User[] = [
  {
    id: 'user1',
    username: 'yuki_truths',
    email: 'yuki@veritas.app',
    bio: 'Capturing authentic moments in Tokyo 📸',
    avatar: 'https://i.pravatar.cc/150?u=yuki',
    photos: [],
    journals: [],
    followers: ['user2', 'user3', 'currentUser'],
    following: ['user2', 'currentUser'],
    joinedAt: Date.now() - 86400000 * 365,
    isVerified: true,
  },
  {
    id: 'user2',
    username: 'mountain_seeker',
    email: 'mountain@veritas.app',
    bio: 'Real adventures, no filters needed',
    avatar: 'https://i.pravatar.cc/150?u=mountain',
    photos: [],
    journals: [],
    followers: ['user1', 'currentUser'],
    following: ['user1', 'user3', 'currentUser'],
    joinedAt: Date.now() - 86400000 * 200,
    isVerified: true,
  },
  {
    id: 'user3',
    username: 'island_wanderer',
    email: 'island@veritas.app',
    bio: 'Island life, authentic vibes 🏝️',
    avatar: 'https://i.pravatar.cc/150?u=island',
    photos: [],
    journals: [],
    followers: ['user2'],
    following: ['user1', 'user2'],
    joinedAt: Date.now() - 86400000 * 100,
    isVerified: false,
  },
  {
    id: 'user4',
    username: 'urban_truth',
    email: 'urban@veritas.app',
    bio: 'Street photography, real moments',
    avatar: 'https://i.pravatar.cc/150?u=urban',
    photos: [],
    journals: [],
    followers: [],
    following: ['currentUser'],
    joinedAt: Date.now() - 86400000 * 50,
    isVerified: false,
  },
];

let CURRENT_USER: User | null = null;

let MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv1',
    participants: ['currentUser', 'user1'],
    messages: [
      {
        id: 'msg1',
        senderId: 'user1',
        text: 'Hey! Love your latest polaroid 📸',
        timestamp: Date.now() - 3600000,
        read: true,
      },
      {
        id: 'msg2',
        senderId: 'currentUser',
        text: 'Thanks! Your Tokyo shots are amazing too',
        timestamp: Date.now() - 3500000,
        read: true,
      },
    ],
    lastMessage: {
      id: 'msg2',
      senderId: 'currentUser',
      text: 'Thanks! Your Tokyo shots are amazing too',
      timestamp: Date.now() - 3500000,
      read: true,
    },
    unreadCount: 0,
  },
  {
    id: 'conv2',
    participants: ['currentUser', 'user2'],
    messages: [
      {
        id: 'msg3',
        senderId: 'user2',
        text: 'Did you see that sunset yesterday?',
        timestamp: Date.now() - 7200000,
        read: false,
      },
    ],
    lastMessage: {
      id: 'msg3',
      senderId: 'user2',
      text: 'Did you see that sunset yesterday?',
      timestamp: Date.now() - 7200000,
      read: false,
    },
    unreadCount: 1,
  },
];

let MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif1',
    type: 'follow',
    actorId: 'user1',
    targetId: 'currentUser',
    text: 'yuki_truths started following you',
    timestamp: Date.now() - 3600000,
    read: false,
  },
  {
    id: 'notif2',
    type: 'like',
    actorId: 'user2',
    targetId: 'currentUser',
    photoId: 'photo1',
    text: 'mountain_seeker liked your photo',
    timestamp: Date.now() - 7200000,
    read: true,
  },
  {
    id: 'notif3',
    type: 'message',
    actorId: 'user2',
    targetId: 'currentUser',
    text: 'mountain_seeker sent you a message',
    timestamp: Date.now() - 7200000,
    read: false,
  },
];

// Auth API
export const AuthAPI = {
  register: async (username: string, email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if username exists
    if (MOCK_USERS.find(u => u.username === username)) {
      throw new Error('Username already taken');
    }
    if (MOCK_USERS.find(u => u.email === email)) {
      throw new Error('Email already registered');
    }
    
    const newUser: User = {
      id: `user${Date.now()}`,
      username,
      email,
      bio: '',
      avatar: `https://i.pravatar.cc/150?u=${username}`,
      photos: [],
      journals: [],
      followers: [],
      following: [],
      joinedAt: Date.now(),
      isVerified: false,
    };
    
    MOCK_USERS.push(newUser);
    CURRENT_USER = newUser;
    return newUser;
  },
  
  login: async (emailOrUsername: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user = MOCK_USERS.find(
      u => u.email === emailOrUsername || u.username === emailOrUsername
    );
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // In real app, verify password hash
    CURRENT_USER = user;
    return user;
  },
  
  logout: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    CURRENT_USER = null;
  },
  
  getCurrentUser: (): User | null => CURRENT_USER,
  
  updateProfile: async (updates: Partial<User>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!CURRENT_USER) {
      throw new Error('Not authenticated');
    }
    
    const userIndex = MOCK_USERS.findIndex(u => u.id === CURRENT_USER!.id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...updates };
    CURRENT_USER = MOCK_USERS[userIndex];
    return CURRENT_USER;
  },
};

// User API
export const UserAPI = {
  getUserById: async (userId: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_USERS.find(u => u.id === userId) || null;
  },
  
  getUserByUsername: async (username: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_USERS.find(u => u.username === username) || null;
  },
  
  searchUsers: async (query: string): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    if (!query.trim()) return [];
    
    return MOCK_USERS.filter(
      u => 
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        u.bio.toLowerCase().includes(query.toLowerCase())
    );
  },
  
  followUser: async (userId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (!CURRENT_USER) throw new Error('Not authenticated');
    
    const targetUser = MOCK_USERS.find(u => u.id === userId);
    if (!targetUser) throw new Error('User not found');
    
    if (!CURRENT_USER.following.includes(userId)) {
      CURRENT_USER.following.push(userId);
      targetUser.followers.push(CURRENT_USER.id);
    }
  },
  
  unfollowUser: async (userId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (!CURRENT_USER) throw new Error('Not authenticated');
    
    const targetUser = MOCK_USERS.find(u => u.id === userId);
    if (!targetUser) throw new Error('User not found');
    
    CURRENT_USER.following = CURRENT_USER.following.filter(id => id !== userId);
    targetUser.followers = targetUser.followers.filter(id => id !== CURRENT_USER!.id);
  },
  
  getFollowers: async (userId: string): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) return [];
    return MOCK_USERS.filter(u => user.followers.includes(u.id));
  },
  
  getFollowing: async (userId: string): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) return [];
    return MOCK_USERS.filter(u => user.following.includes(u.id));
  },
};

// Feed API
export const FeedAPI = {
  getFeed: async (): Promise<VeritasPhoto[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    if (!CURRENT_USER) throw new Error('Not authenticated');
    
    // Return photos from followed users + own photos
    const relevantUsers = [...CURRENT_USER.following, CURRENT_USER.id];
    
    // Generate mock feed photos
    const mockPhotos: VeritasPhoto[] = [
      {
        id: 'feed1',
        uri: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600',
        metadata: {
          id: 'meta-feed1',
          timestamp: Date.now() - 3600000,
          ntpTime: new Date(Date.now() - 3600000).toISOString(),
          latitude: 35.6762,
          longitude: 139.6503,
          altitude: 40,
          gyroscopeX: 0.02,
          gyroscopeY: -0.01,
          gyroscopeZ: 0.15,
          isStationary: false,
          cityName: 'Tokyo',
          veritasHash: 'VERA7B3C9D2',
        },
        caption: 'Morning commute, unfiltered reality',
        userId: 'user1',
        username: 'yuki_truths',
        userAvatar: 'https://i.pravatar.cc/150?u=yuki',
        likes: ['currentUser', 'user2'],
        comments: [],
        createdAt: Date.now() - 3600000,
      },
      {
        id: 'feed2',
        uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
        metadata: {
          id: 'meta-feed2',
          timestamp: Date.now() - 7200000,
          ntpTime: new Date(Date.now() - 7200000).toISOString(),
          latitude: 46.8182,
          longitude: 8.2275,
          altitude: 1500,
          gyroscopeX: 0.05,
          gyroscopeY: 0.03,
          gyroscopeZ: -0.08,
          isStationary: false,
          cityName: 'Swiss Alps',
          veritasHash: 'VERF8E2A1B5',
        },
        caption: 'No AI can capture this cold air 🏔️',
        userId: 'user2',
        username: 'mountain_seeker',
        userAvatar: 'https://i.pravatar.cc/150?u=mountain',
        likes: ['user1', 'user3', 'currentUser'],
        comments: [],
        createdAt: Date.now() - 7200000,
      },
    ];
    
    return mockPhotos;
  },
  
  likePhoto: async (photoId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log('Liked photo:', photoId);
  },
  
  unlikePhoto: async (photoId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log('Unliked photo:', photoId);
  },
};

// Messaging API
export const MessageAPI = {
  getConversations: async (): Promise<Conversation[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return MOCK_CONVERSATIONS.map(conv => ({
      ...conv,
      participants: conv.participants.filter(p => p !== CURRENT_USER?.id),
    }));
  },
  
  getMessages: async (conversationId: string): Promise<Message[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const conv = MOCK_CONVERSATIONS.find(c => c.id === conversationId);
    return conv?.messages || [];
  },
  
  sendMessage: async (conversationId: string, text: string): Promise<Message> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!CURRENT_USER) throw new Error('Not authenticated');
    
    const newMessage: Message = {
      id: `msg${Date.now()}`,
      senderId: CURRENT_USER.id,
      text,
      timestamp: Date.now(),
      read: false,
    };
    
    const conv = MOCK_CONVERSATIONS.find(c => c.id === conversationId);
    if (conv) {
      conv.messages.push(newMessage);
      conv.lastMessage = newMessage;
    }
    
    return newMessage;
  },
  
  createConversation: async (userId: string): Promise<Conversation> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (!CURRENT_USER) throw new Error('Not authenticated');
    
    // Check if conversation already exists
    const existing = MOCK_CONVERSATIONS.find(
      c => c.participants.includes(userId) && c.participants.includes(CURRENT_USER!.id)
    );
    
    if (existing) {
      return existing;
    }
    
    const newConv: Conversation = {
      id: `conv${Date.now()}`,
      participants: [CURRENT_USER.id, userId],
      messages: [],
      lastMessage: undefined,
      unreadCount: 0,
    };
    
    MOCK_CONVERSATIONS.push(newConv);
    return newConv;
  },
  
  markAsRead: async (conversationId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const conv = MOCK_CONVERSATIONS.find(c => c.id === conversationId);
    if (conv) {
      conv.unreadCount = 0;
      conv.messages.forEach(m => {
        if (m.senderId !== CURRENT_USER?.id) {
          m.read = true;
        }
      });
    }
  },
};

// Notifications API
export const NotificationAPI = {
  getNotifications: async (): Promise<Notification[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_NOTIFICATIONS.sort((a, b) => b.timestamp - a.timestamp);
  },
  
  markAsRead: async (notificationId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const notif = MOCK_NOTIFICATIONS.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
    }
  },
  
  markAllAsRead: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    MOCK_NOTIFICATIONS.forEach(n => n.read = true);
  },
  
  getUnreadCount: async (): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return MOCK_NOTIFICATIONS.filter(n => !n.read).length;
  },
};

// Stories API
export const StoryAPI = {
  getStories: async (): Promise<any[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (!CURRENT_USER) return [];
    
    return [
      {
        id: 'story1',
        userId: 'user1',
        username: 'yuki_truths',
        avatar: 'https://i.pravatar.cc/150?u=yuki',
        uri: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400',
        timestamp: Date.now() - 1800000,
        viewed: false,
      },
      {
        id: 'story2',
        userId: 'user2',
        username: 'mountain_seeker',
        avatar: 'https://i.pravatar.cc/150?u=mountain',
        uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400',
        timestamp: Date.now() - 3600000,
        viewed: true,
      },
    ];
  },
};
