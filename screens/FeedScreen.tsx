import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, VeritasPhoto, User } from '../lib/types';
import { FeedAPI, AuthAPI, StoryAPI, UserAPI } from '../lib/api';
import { getTodayEntry, canAddPhotoToday, getCurrentStreak } from '../lib/dailyJournal';
import PolaroidFrame from '../components/PolaroidFrame';
import NeumorphicCard from '../components/NeumorphicCard';
import { formatDistanceToNow } from '../lib/utils';

const { width } = Dimensions.get('window');

type FeedScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

interface FeedScreenProps {
  navigation: FeedScreenNavigationProp;
}

const COLORS = {
  background: '#F5F5F5',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  paper: '#FAFAFA',
  gold: '#FFD700',
};

export const FeedScreen: React.FC<FeedScreenProps> = ({ navigation }) => {
  const [photos, setPhotos] = useState<VeritasPhoto[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [hasAddedToday, setHasAddedToday] = useState(true);
  const currentUser = AuthAPI.getCurrentUser();

  useEffect(() => {
    loadData();
    checkDailyStatus();
  }, []);

  const loadData = async () => {
    try {
      const [feed, storyList] = await Promise.all([
        FeedAPI.getFeed(),
        StoryAPI.getStories(),
      ]);
      
      // Sort: Pure Raw photos first, then by timestamp
      const sortedFeed = feed.sort((a, b) => {
        const aIsPure = a.verityScore?.level === 'PURE_RAW';
        const bIsPure = b.verityScore?.level === 'PURE_RAW';
        if (aIsPure && !bIsPure) return -1;
        if (!aIsPure && bIsPure) return 1;
        return b.createdAt - a.createdAt;
      });
      
      setPhotos(sortedFeed);
      setStories(storyList);
      
      // Track liked photos
      const liked = new Set<string>();
      feed.forEach(photo => {
        if (photo.likes.includes(currentUser?.id || '')) {
          liked.add(photo.id);
        }
      });
      setLikedPhotos(liked);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDailyStatus = async () => {
    const currentStreak = await getCurrentStreak();
    const canAdd = await canAddPhotoToday();
    setStreak(currentStreak);
    setHasAddedToday(!canAdd);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    await checkDailyStatus();
    setRefreshing(false);
  }, []);

  const handleLike = async (photoId: string) => {
    try {
      if (likedPhotos.has(photoId)) {
        await FeedAPI.unlikePhoto(photoId);
        setLikedPhotos(prev => {
          const next = new Set(prev);
          next.delete(photoId);
          return next;
        });
      } else {
        await FeedAPI.likePhoto(photoId);
        setLikedPhotos(prev => new Set(prev).add(photoId));
      }
    } catch (error) {
      console.error('Error liking photo:', error);
    }
  };

  const handleCameraPress = () => {
    navigation.navigate('Camera');
  };

  const renderStoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.storyItem}>
      <View style={[styles.storyRing, !item.viewed && styles.storyRingUnviewed]}>
        <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {item.username}
      </Text>
    </TouchableOpacity>
  );

  const renderPhoto = ({ item, index }: { item: VeritasPhoto; index: number }) => {
    const isLiked = likedPhotos.has(item.id);
    const isPureRaw = item.verityScore?.level === 'PURE_RAW';
    const isTopThree = index < 3 && isPureRaw;
    
    return (
      <View style={[
        styles.photoContainer,
        isTopThree && styles.pureRawContainer
      ]}>
        {/* Pure Raw Badge for top photos */}
        {isTopThree && (
          <View style={styles.pureRawBanner}>
            <Ionicons name="star" size={16} color={COLORS.gold} />
            <Text style={styles.pureRawBannerText}>Editor's Choice</Text>
          </View>
        )}
        
        {/* User Header */}
        <TouchableOpacity 
          style={styles.userHeader}
          onPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
        >
          <Image source={{ uri: item.userAvatar }} style={styles.userAvatar} />
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.username}>{item.username}</Text>
              {item.verityScore?.level === 'PURE_RAW' && (
                <View style={styles.pureRawBadge}>
                  <Text style={styles.pureRawBadgeText}>★ {item.verityScore.score}</Text>
                </View>
              )}
            </View>
            <Text style={styles.timestamp}>
              {formatDistanceToNow(item.createdAt)} · {item.metadata.cityName}
            </Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.pencil} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Polaroid Photo - Larger for Pure Raw */}
        <View style={[
          styles.polaroidWrapper,
          isTopThree && styles.pureRawPolaroidWrapper
        ]}>
          <View style={isTopThree ? styles.goldBorder : undefined}>
            <PolaroidFrame 
              photo={item} 
              size={isTopThree ? 'large' : 'medium'} 
            />
          </View>
        </View>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <View style={styles.leftActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleLike(item.id)}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={28} 
                color={isLiked ? "#FF6B6B" : COLORS.ink} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={24} color={COLORS.ink} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="send-outline" size={24} color={COLORS.ink} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={24} color={COLORS.ink} />
          </TouchableOpacity>
        </View>

        {/* Likes Count */}
        <Text style={styles.likesCount}>
          {item.likes.length + (isLiked && !item.likes.includes(currentUser?.id || '') ? 1 : 0)} likes
        </Text>

        {/* Caption */}
        {item.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>
              <Text style={styles.captionUsername}>{item.username} </Text>
              {item.caption}
            </Text>
          </View>
        )}

        {/* Verification Badge */}
        <View style={styles.verificationBar}>
          <View style={styles.verificationItem}>
            <Ionicons name="shield-checkmark" size={14} color="#4CAF50" />
            <Text style={styles.verificationText}>Veritas Verified</Text>
          </View>
          {item.metadata.isStationary && (
            <View style={[styles.verificationItem, styles.warningItem]}>
              <Ionicons name="warning" size={14} color="#FF9800" />
              <Text style={[styles.verificationText, styles.warningText]}>Stationary</Text>
            </View>
          )}
          {item.humanityCheck && (
            <View style={styles.verificationItem}>
              <Ionicons name="finger-print" size={14} color={COLORS.accent} />
              <Text style={styles.verificationText}>Human</Text>
            </View>
          )}
        </View>

        {/* Hash */}
        <TouchableOpacity style={styles.hashContainer}>
          <Text style={styles.hashText}>{item.metadata.veritasHash}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <NeumorphicCard style={styles.emptyCard}>
        <Ionicons name="images-outline" size={64} color={COLORS.pencil} />
        <Text style={styles.emptyTitle}>No Authentic Moments Yet</Text>
        <Text style={styles.emptyText}>
          Be the first to capture a real moment. No filters, no AI, just truth.
        </Text>
        <TouchableOpacity style={styles.emptyButton} onPress={handleCameraPress}>
          <Ionicons name="camera" size={20} color={COLORS.paper} />
          <Text style={styles.emptyButtonText}>Capture First Moment</Text>
        </TouchableOpacity>
      </NeumorphicCard>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading authentic moments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Veritas</Text>
          <Text style={styles.headerSubtitle}>真境</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleCameraPress}>
            <Ionicons name="camera" size={24} color={COLORS.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        renderItem={renderPhoto}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ink} />
        }
        ListHeaderComponent={
          <>
            {/* Daily Journal Reminder */}
            {!hasAddedToday && (
              <NeumorphicCard style={styles.dailyReminder} intensity="light">
                <View style={styles.dailyReminderContent}>
                  <Ionicons name="camera-outline" size={24} color={COLORS.accent} />
                  <View style={styles.dailyReminderText}>
                    <Text style={styles.dailyReminderTitle}>Today's Moment</Text>
                    <Text style={styles.dailyReminderDesc}>Capture your one photo for today</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.dailyReminderButton}
                    onPress={handleCameraPress}
                  >
                    <Text style={styles.dailyReminderButtonText}>Capture</Text>
                  </TouchableOpacity>
                </View>
              </NeumorphicCard>
            )}
            
            {/* Streak Counter */}
            {streak > 0 && (
              <View style={styles.streakContainer}>
                <View style={styles.streakBadge}>
                  <Ionicons name="flame" size={16} color="#FF6B6B" />
                  <Text style={styles.streakText}>{streak} day streak</Text>
                </View>
              </View>
            )}

            {/* Stories */}
            <View style={styles.storiesContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesScroll}
              >
                {/* My Story */}
                <TouchableOpacity style={styles.storyItem}>
                  <View style={styles.myStoryRing}>
                    <Image 
                      source={{ uri: currentUser?.avatar }} 
                      style={styles.storyAvatar} 
                    />
                    <View style={styles.addStoryButton}>
                      <Ionicons name="add" size={14} color={COLORS.paper} />
                    </View>
                  </View>
                  <Text style={styles.storyUsername}>Your Story</Text>
                </TouchableOpacity>

                {/* Other Stories */}
                {stories.map((story) => (
                  <View key={story.id}>
                    {renderStoryItem({ item: story })}
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Campaign Banner */}
            <NeumorphicCard style={styles.campaignCard} intensity="light">
              <View style={styles.campaignContent}>
                <Ionicons name="flame" size={24} color="#FF6B6B" />
                <View style={styles.campaignText}>
                  <Text style={styles.campaignTitle}>消失的濾鏡 · The Naturalism Movement</Text>
                  <Text style={styles.campaignDesc}>Share your most unfiltered, authentic moments</Text>
                </View>
              </View>
            </NeumorphicCard>
          </>
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.pencil,
    letterSpacing: 4,
    marginTop: -4,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.paper,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#D1D1D1',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dailyReminder: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
  },
  dailyReminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyReminderText: {
    flex: 1,
    marginLeft: 12,
  },
  dailyReminderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  dailyReminderDesc: {
    fontSize: 12,
    color: COLORS.pencil,
    marginTop: 2,
  },
  dailyReminderButton: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dailyReminderButtonText: {
    color: COLORS.paper,
    fontSize: 13,
    fontWeight: '600',
  },
  streakContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
    marginLeft: 6,
  },
  storiesContainer: {
    marginBottom: 16,
  },
  storiesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 72,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    backgroundColor: '#E0E0E0',
  },
  storyRingUnviewed: {
    backgroundColor: '#8B7355',
  },
  myStoryRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  storyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  addStoryButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.ink,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  storyUsername: {
    fontSize: 11,
    color: COLORS.ink,
    marginTop: 6,
    textAlign: 'center',
  },
  campaignCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  campaignContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  campaignText: {
    marginLeft: 12,
    flex: 1,
  },
  campaignTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  campaignDesc: {
    fontSize: 12,
    color: COLORS.pencil,
    marginTop: 2,
  },
  feedContent: {
    paddingBottom: 100,
  },
  photoContainer: {
    marginBottom: 24,
  },
  pureRawContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    paddingVertical: 16,
    marginHorizontal: 0,
    marginBottom: 24,
  },
  pureRawBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingVertical: 8,
    marginBottom: 12,
  },
  pureRawBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B8860B',
    marginLeft: 6,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ink,
  },
  pureRawBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  pureRawBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B8860B',
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.pencil,
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
  },
  polaroidWrapper: {
    alignItems: 'center',
  },
  pureRawPolaroidWrapper: {
    transform: [{ scale: 1.02 }],
  },
  goldBorder: {
    padding: 3,
    backgroundColor: COLORS.gold,
    borderRadius: 6,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 16,
    padding: 4,
  },
  likesCount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  captionContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  caption: {
    fontSize: 15,
    color: COLORS.ink,
    lineHeight: 22,
  },
  captionUsername: {
    fontWeight: '700',
  },
  verificationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  verificationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
  },
  warningItem: {
    backgroundColor: '#FFF3E0',
  },
  warningText: {
    color: '#FF9800',
  },
  hashContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  hashText: {
    fontSize: 11,
    color: COLORS.accent,
    fontFamily: 'monospace',
  },
  emptyContainer: {
    padding: 20,
    marginTop: 40,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.pencil,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ink,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyButtonText: {
    color: COLORS.paper,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default FeedScreen;
