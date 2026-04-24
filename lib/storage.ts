import AsyncStorage from '@react-native-async-storage/async-storage';
import { VeritasPhoto, JournalEntry, User } from './types';
import { mockCurrentUser, mockPhotos } from './mockData';

const STORAGE_KEYS = {
  USER: '@veritas_user',
  PHOTOS: '@veritas_photos',
  JOURNALS: '@veritas_journals',
  FEED: '@veritas_feed',
};

// Initialize with mock data
export const initializeStorage = async (): Promise<void> => {
  try {
    const existingUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (!existingUser) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockCurrentUser));
    }
    
    const existingFeed = await AsyncStorage.getItem(STORAGE_KEYS.FEED);
    if (!existingFeed) {
      await AsyncStorage.setItem(STORAGE_KEYS.FEED, JSON.stringify(mockPhotos));
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

export const getUser = async (): Promise<User> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (data) {
      return JSON.parse(data);
    }
    return mockCurrentUser;
  } catch {
    return mockCurrentUser;
  }
};

export const updateUser = async (user: User): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getFeed = async (): Promise<VeritasPhoto[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FEED);
    if (data) {
      return JSON.parse(data);
    }
    return mockPhotos;
  } catch {
    return mockPhotos;
  }
};

export const addPhotoToFeed = async (photo: VeritasPhoto): Promise<void> => {
  const feed = await getFeed();
  feed.unshift(photo);
  await AsyncStorage.setItem(STORAGE_KEYS.FEED, JSON.stringify(feed));
  
  // Also add to user's photos
  const user = await getUser();
  user.photos.unshift(photo);
  await updateUser(user);
};

export const getJournals = async (): Promise<JournalEntry[]> => {
  try {
    const user = await getUser();
    return user.journals || [];
  } catch {
    return [];
  }
};

export const addJournal = async (entry: JournalEntry): Promise<void> => {
  const user = await getUser();
  user.journals.unshift(entry);
  await updateUser(user);
};

export const updateJournal = async (entry: JournalEntry): Promise<void> => {
  const user = await getUser();
  const index = user.journals.findIndex(j => j.id === entry.id);
  if (index !== -1) {
    user.journals[index] = entry;
    await updateUser(user);
  }
};

export const deleteJournal = async (id: string): Promise<void> => {
  const user = await getUser();
  user.journals = user.journals.filter(j => j.id !== id);
  await updateUser(user);
};
