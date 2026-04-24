import { VeritasPhoto, JournalEntry, User } from './types';

export const generateVeritasHash = (timestamp: number, lat: number, lng: number): string => {
  const data = `${timestamp}-${lat}-${lng}-VERITAS`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `VER${Math.abs(hash).toString(16).toUpperCase().slice(0, 8)}`;
};

export const mockPhotos: VeritasPhoto[] = [
  {
    id: '1',
    uri: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600',
    metadata: {
      id: 'meta-1',
      timestamp: Date.now() - 86400000,
      ntpTime: new Date(Date.now() - 86400000).toISOString(),
      latitude: 35.6762,
      longitude: 139.6503,
      altitude: 40,
      gyroscopeX: 0.02,
      gyroscopeY: -0.01,
      gyroscopeZ: 0.15,
      isStationary: false,
      cityName: 'Tokyo',
      veritasHash: generateVeritasHash(Date.now() - 86400000, 35.6762, 139.6503),
    },
    caption: 'Morning coffee in Shibuya, no filter needed',
    userId: 'user1',
    username: 'yuki_truths',
    createdAt: Date.now() - 86400000,
  },
  {
    id: '2',
    uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
    metadata: {
      id: 'meta-2',
      timestamp: Date.now() - 172800000,
      ntpTime: new Date(Date.now() - 172800000).toISOString(),
      latitude: 46.8182,
      longitude: 8.2275,
      altitude: 1500,
      gyroscopeX: 0.05,
      gyroscopeY: 0.03,
      gyroscopeZ: -0.08,
      isStationary: false,
      cityName: 'Swiss Alps',
      veritasHash: generateVeritasHash(Date.now() - 172800000, 46.8182, 8.2275),
    },
    caption: 'The air here is real, no AI could generate this cold',
    userId: 'user2',
    username: 'mountain_seeker',
    createdAt: Date.now() - 172800000,
  },
  {
    id: '3',
    uri: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=600',
    metadata: {
      id: 'meta-3',
      timestamp: Date.now() - 259200000,
      ntpTime: new Date(Date.now() - 259200000).toISOString(),
      latitude: -8.5069,
      longitude: 115.2625,
      altitude: 50,
      gyroscopeX: -0.02,
      gyroscopeY: 0.04,
      gyroscopeZ: 0.11,
      isStationary: false,
      cityName: 'Bali',
      veritasHash: generateVeritasHash(Date.now() - 259200000, -8.5069, 115.2625),
    },
    caption: 'Sunset without filters - just reality',
    userId: 'user3',
    username: 'island_wanderer',
    createdAt: Date.now() - 259200000,
  },
  {
    id: '4',
    uri: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600',
    metadata: {
      id: 'meta-4',
      timestamp: Date.now() - 345600000,
      ntpTime: new Date(Date.now() - 345600000).toISOString(),
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 10,
      gyroscopeX: 0.01,
      gyroscopeY: -0.03,
      gyroscopeZ: 0.22,
      isStationary: false,
      cityName: 'New York',
      veritasHash: generateVeritasHash(Date.now() - 345600000, 40.7128, -74.0060),
    },
    caption: 'City streets, unedited moments',
    userId: 'user4',
    username: 'urban_truth',
    createdAt: Date.now() - 345600000,
  },
];

export const mockJournals: JournalEntry[] = [
  {
    id: '1',
    content: 'Today I realized how much we depend on filters. Walking through the old district, I saw beauty in the cracks, the imperfections. Veritas reminds me that truth doesn\'t need enhancement.',
    timestamp: Date.now() - 86400000,
    weather: 'cloudy',
    location: 'Kyoto, Japan',
  },
  {
    id: '2',
    content: 'Captured my first truly authentic photo today. No editing, no AI, just the moment as it was. The gyroscope detected my steady hands - I was present, truly present.',
    timestamp: Date.now() - 172800000,
    weather: 'sunny',
    location: 'Home',
  },
];

export const mockCurrentUser: User = {
  id: 'currentUser',
  username: 'veritas_seeker',
  bio: 'Seeking truth in a filtered world 📸 Authentic moments only',
  photos: [],
  journals: mockJournals,
  joinedAt: Date.now() - 7776000000,
};
