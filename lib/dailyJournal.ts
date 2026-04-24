// Daily Journal System - One Photo Per Day
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VeritasPhoto, JournalEntry } from './types';
import { AuthAPI } from './api';

const STORAGE_KEY = '@veritas_daily_journal';

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  photo?: VeritasPhoto;
  journal?: JournalEntry;
  timestamp: number;
  streakCount: number;
  isComplete: boolean;
}

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

// Get today's date string
const getTodayString = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Check if user can add photo today
export const canAddPhotoToday = async (): Promise<boolean> => {
  const today = getTodayString();
  const entries = await getAllDailyEntries();
  const todayEntry = entries.find(e => e.date === today);
  return !todayEntry?.photo;
};

// Add photo to today's entry
export const addPhotoToDaily = async (photo: VeritasPhoto): Promise<DailyEntry> => {
  const today = getTodayString();
  const entries = await getAllDailyEntries();
  
  const existingIndex = entries.findIndex(e => e.date === today);
  const yesterday = getYesterdayString();
  const yesterdayEntry = entries.find(e => e.date === yesterday);
  
  const streakCount = yesterdayEntry ? yesterdayEntry.streakCount + 1 : 1;
  
  const entry: DailyEntry = {
    date: today,
    photo,
    journal: existingIndex >= 0 ? entries[existingIndex].journal : undefined,
    timestamp: Date.now(),
    streakCount,
    isComplete: existingIndex >= 0 && entries[existingIndex].journal ? true : false,
  };
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return entry;
};

// Add journal to today's entry
export const addJournalToDaily = async (journal: JournalEntry): Promise<DailyEntry> => {
  const today = getTodayString();
  const entries = await getAllDailyEntries();
  
  const existingIndex = entries.findIndex(e => e.date === today);
  
  const entry: DailyEntry = {
    date: today,
    photo: existingIndex >= 0 ? entries[existingIndex].photo : undefined,
    journal,
    timestamp: existingIndex >= 0 ? entries[existingIndex].timestamp : Date.now(),
    streakCount: existingIndex >= 0 ? entries[existingIndex].streakCount : 0,
    isComplete: existingIndex >= 0 && entries[existingIndex].photo ? true : false,
  };
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return entry;
};

// Get all daily entries
export const getAllDailyEntries = async (): Promise<DailyEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Get today's entry
export const getTodayEntry = async (): Promise<DailyEntry | null> => {
  const today = getTodayString();
  const entries = await getAllDailyEntries();
  return entries.find(e => e.date === today) || null;
};

// Get yesterday's date string
const getYesterdayString = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Get current streak
export const getCurrentStreak = async (): Promise<number> => {
  const entries = await getAllDailyEntries();
  if (entries.length === 0) return 0;
  
  // Sort by date descending
  const sorted = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Check if most recent is today or yesterday
  const today = getTodayString();
  const yesterday = getYesterdayString();
  const mostRecent = sorted[0];
  
  if (mostRecent.date !== today && mostRecent.date !== yesterday) {
    return 0; // Streak broken
  }
  
  return mostRecent.streakCount;
};

// Generate Year in Review
export const generateYearInReview = async (year: number): Promise<YearInReview> => {
  const entries = await getAllDailyEntries();
  const yearEntries = entries.filter(e => e.date.startsWith(String(year)));
  
  const daysWithPhotos = yearEntries.filter(e => e.photo).length;
  const daysWithJournals = yearEntries.filter(e => e.journal).length;
  
  // Calculate longest streak
  let longestStreak = 0;
  let currentStreak = 0;
  const sorted = yearEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || isConsecutiveDay(sorted[i - 1].date, sorted[i].date)) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  // Count Pure Raw photos
  const pureRawCount = yearEntries.filter(
    e => e.photo?.verityScore?.level === 'PURE_RAW'
  ).length;
  
  // Calculate authentic hours (estimate: each photo = ~1 hour of authentic presence)
  const totalAuthenticHours = daysWithPhotos * 1 + daysWithJournals * 0.5;
  
  // Favorite locations
  const locationCounts: Record<string, number> = {};
  yearEntries.forEach(e => {
    if (e.photo?.metadata.cityName) {
      locationCounts[e.photo.metadata.cityName] = (locationCounts[e.photo.metadata.cityName] || 0) + 1;
    }
  });
  
  const favoriteLocations = Object.entries(locationCounts)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Monthly breakdown
  const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    photos: yearEntries.filter(e => {
      const month = parseInt(e.date.split('-')[1]);
      return month === i + 1 && e.photo;
    }).length,
    journals: yearEntries.filter(e => {
      const month = parseInt(e.date.split('-')[1]);
      return month === i + 1 && e.journal;
    }).length,
  }));
  
  // Special memories (Pure Raw + Journal combo)
  const memories = yearEntries
    .filter(e => e.photo?.verityScore?.level === 'PURE_RAW' && e.journal)
    .map(e => ({
      date: e.date,
      photo: e.photo,
      journal: e.journal,
    }))
    .slice(0, 10);
  
  return {
    year,
    totalDays: yearEntries.length,
    daysWithPhotos,
    daysWithJournals,
    longestStreak,
    currentStreak: await getCurrentStreak(),
    pureRawCount,
    totalAuthenticHours: Math.round(totalAuthenticHours),
    favoriteLocations,
    monthlyBreakdown,
    memories,
  };
};

// Check if two dates are consecutive
const isConsecutiveDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = diffTime / (1000 * 3600 * 24);
  return diffDays === 1;
};

// Get streak milestone message
export const getStreakMilestone = (streak: number): string | null => {
  const milestones: Record<number, string> = {
    7: '🔥 One week of authenticity!',
    30: '🌟 One month of real moments!',
    100: '🏆 100 days of truth!',
    365: '🎊 One year of unfiltered life!',
  };
  
  return milestones[streak] || null;
};
