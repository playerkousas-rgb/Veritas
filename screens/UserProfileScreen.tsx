import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, User } from '../lib/types';
import { UserAPI, MessageAPI, AuthAPI } from '../lib/api';
import NeumorphicCard from '../components/NeumorphicCard';
import { formatNumber } from '../lib/utils';

type UserProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;
type UserProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

interface UserProfileScreenProps {
  navigation: UserProfileScreenNavigationProp;
  route: UserProfileScreenRouteProp;
}

const COLORS = {
  background: '#F5F5F5',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  paper: '#FAFAFA',
};

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { userId } = route.params;
  const [user, setUser] = useState<User | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = AuthAPI.getCurrentUser();

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      const userData = await UserAPI.getUserById(userId);
      if (userData) {
        setUser(userData);
        // Check if current user is following this user
        if (currentUser) {
          setIsFollowing(currentUser.following.includes(userId));
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await UserAPI.unfollowUser(userId);
        setIsFollowing(false);
      } else {
        await UserAPI.followUser(userId);
        setIsFollowing(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not update follow status');
    }
  };

  const handleMessage = async () => {
    if (!user) return;
    try {
      const conversation = await MessageAPI.createConversation(userId);
      navigation.navigate('Chat', { conversationId: conversation.id, user });
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const formatJoinDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading || !user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const isCurrentUser = currentUser?.id === userId;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={COLORS.ink} />
          </TouchableOpacity>
          <Text style={styles.headerUsername}>{user.username}</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color={COLORS.ink} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <NeumorphicCard style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            {user.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
            )}
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.username}>{user.username}</Text>
          </View>

          {user.bio ? (
            <Text style={styles.bio}>{user.bio}</Text>
          ) : null}

          <View style={styles.joinDate}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.pencil} />
            <Text style={styles.joinDateText}>
              Joined {formatJoinDate(user.joinedAt)}
            </Text>
          </View>
        </NeumorphicCard>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{formatNumber(user.photos.length)}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('Followers', { userId, type: 'followers' })}
          >
            <Text style={styles.statNumber}>{formatNumber(user.followers.length)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('Followers', { userId, type: 'following' })}
          >
            <Text style={styles.statNumber}>{formatNumber(user.following.length)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        {!isCurrentUser && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[
                styles.actionButton,
                isFollowing ? styles.followingButton : styles.followButton
              ]}
              onPress={handleFollow}
            >
              <Text style={[
                styles.actionButtonText,
                isFollowing ? styles.followingButtonText : styles.followButtonText
              ]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.messageButton]}
              onPress={handleMessage}
            >
              <Ionicons name="mail-outline" size={18} color={COLORS.ink} />
              <Text style={[styles.actionButtonText, { marginLeft: 6 }]}>Message</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Photo Grid */}
        <View style={styles.photosSection}>
          <Text style={styles.sectionTitle}>
            {isCurrentUser ? 'My Photos' : `${user.username}'s Photos`}
          </Text>

          {user.photos.length > 0 ? (
            <View style={styles.photosGrid}>
              {user.photos.map((photo) => (
                <TouchableOpacity key={photo.id} style={styles.photoItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPhotos}>
              <Ionicons name="images-outline" size={48} color={COLORS.pencil} />
              <Text style={styles.emptyText}>No photos yet</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    paddingBottom: 16,
  },
  headerUsername: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
  },
  profileCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.paper,
    borderRadius: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.ink,
  },
  bio: {
    fontSize: 15,
    color: COLORS.pencil,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  joinDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  joinDateText: {
    fontSize: 13,
    color: COLORS.pencil,
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.ink,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.pencil,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  followButton: {
    backgroundColor: COLORS.ink,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.pencil,
  },
  messageButton: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  followButtonText: {
    color: COLORS.paper,
  },
  followingButtonText: {
    color: COLORS.pencil,
  },
  photosSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 16,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  emptyPhotos: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.pencil,
    marginTop: 12,
  },
  bottomPadding: {
    height: 100,
  },
});

export default UserProfileScreen;
