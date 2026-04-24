// Veritas App Types - Full Social Platform

// User & Auth
export interface User {
  id: string;
  username: string;
  email: string;
  bio: string;
  avatar?: string;
  photos: VeritasPhoto[];
  journals: JournalEntry[];
  followers: string[];
  following: string[];
  joinedAt: number;
  isVerified: boolean;
}

// Photo & Metadata
export interface PhotoMetadata {
  id: string;
  timestamp: number;
  ntpTime: string;
  latitude: number;
  longitude: number;
  altitude: number;
  gyroscopeX: number;
  gyroscopeY: number;
  gyroscopeZ: number;
  isStationary: boolean;
  cityName: string;
  veritasHash: string;
}

// Verity Score System
export type VerityLevel = 
  | 'PURE_RAW'      // 100% - Perfect authenticity
  | 'VERIFIED'      // 80-99% - High authenticity with minor caveats
  | 'STUDIO'        // 60-79% - Stationary/professional setup
  | 'QUESTIONABLE'  // 40-59% - Some concerns
  | 'SUSPICIOUS';   // 0-39% - Likely fake/screen capture

export interface VerityFactor {
  name: string;
  score: number;
  status: 'pass' | 'warning' | 'fail';
  details: string;
}

export interface VerityScore {
  level: VerityLevel;
  score: number;
  factors: VerityFactor[];
  badge: string;
  badgeColor: string;
  description: string;
}

// Humanity Check (Anti-bot)
export interface HumanityCheckResult {
  question: string;
  doodle: { x: number; y: number; timestamp: number }[];
  timestamp: number;
  responseTime: number;
}

// Haptic Signature
export type HapticPattern = 'PATTERN_A' | 'PATTERN_B' | 'PATTERN_C' | 'PATTERN_D' | 'PATTERN_E';

export interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  text: string;
  timestamp: number;
}

export interface VeritasPhoto {
  id: string;
  uri: string;
  metadata: PhotoMetadata;
  caption?: string;
  userId: string;
  username: string;
  userAvatar?: string;
  likes: string[];
  comments: Comment[];
  createdAt: number;
  // Extended authenticity features
  verityScore?: VerityScore;
  humanityCheck?: HumanityCheckResult;
  hapticSignature?: HapticPattern;
}

// Journal
export interface JournalEntry {
  id: string;
  content: string;
  timestamp: number;
  weather: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
  location?: string;
}

// Messaging
export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
}

// Notifications
export interface Notification {
  id: string;
  type: 'like' | 'follow' | 'comment' | 'message' | 'mention';
  actorId: string;
  targetId: string;
  photoId?: string;
  text: string;
  timestamp: number;
  read: boolean;
}

// Stories
export interface Story {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  uri: string;
  timestamp: number;
  viewed: boolean;
}

// Year in Review
export interface YearInReview {
  year: number;
  totalDays: number;
  daysWithPhotos: number;
  daysWithJournals: number;
  longestStreak: number;
  currentStreak: number;
  pureRawCount: number;
  totalAuthenticHours: number;
  favoriteLocations: { location: string; count: number }[];
  monthlyBreakdown: { month: number; photos: number; journals: number }[];
  memories: {
    date: string;
    photo?: VeritasPhoto;
    journal?: JournalEntry;
  }[];
}

// Navigation
export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  Camera: undefined;
  Preview: { photo: VeritasPhoto };
  JournalEditor: { entry?: JournalEntry };
  Chat: { conversationId: string; user: User };
  NewMessage: undefined;
  UserProfile: { userId: string };
  Followers: { userId: string; type: 'followers' | 'following' };
  Comments: { photoId: string };
  Notifications: undefined;
  Search: undefined;
  EditProfile: undefined;
  Settings: undefined;
  YearInReview: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Camera: undefined;
  Messages: undefined;
  Profile: undefined;
};
