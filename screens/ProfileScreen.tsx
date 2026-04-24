import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, User, VeritasPhoto, JournalEntry } from '../lib/types';
import { AuthAPI, UserAPI } from '../lib/api';
import NeumorphicCard from '../components/NeumorphicCard';
import { formatNumber } from '../lib/utils';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

const COLORS = {
  background: '#F5F5F5',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  paper: '#FAFAFA',
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'photos' | 'journals'>('photos');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = AuthAPI.getCurrentUser();
    if (currentUser) {
      const freshUser = await UserAPI.getUserById(currentUser.id);
      if (freshUser) {
        setUser(freshUser);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await AuthAPI.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          },
        },
      ]
    );
  };

  const formatJoinDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>個人</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={COLORS.ink} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color={COLORS.ink} />
            </TouchableOpacity>
          </View>
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

          <Text style={styles.username}>{user.username}</Text>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

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
            onPress={() => navigation.navigate('Followers', { userId: user.id, type: 'followers' })}
          >
            <Text style={styles.statNumber}>{formatNumber(user.followers.length)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('Followers', { userId: user.id, type: 'following' })}
          >
            <Text style={styles.statNumber}>{formatNumber(user.following.length)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.yearReviewButton}
            onPress={() => navigation.navigate('YearInReview')}
          >
            <Ionicons name="calendar-outline" size={18} color={COLORS.ink} />
            <Text style={styles.yearReviewText}>Year in Review</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
            onPress={() => setActiveTab('photos')}
          >
            <Ionicons 
              name="grid" 
              size={20} 
              color={activeTab === 'photos' ? COLORS.ink : COLORS.pencil} 
            />
            <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>
              Photos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'journals' && styles.tabActive]}
            onPress={() => setActiveTab('journals')}
          >
            <Ionicons 
              name="journal" 
              size={20} 
              color={activeTab === 'journals' ? COLORS.ink : COLORS.pencil} 
            />
            <Text style={[styles.tabText, activeTab === 'journals' && styles.tabTextActive]}>
              Journal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'photos' ? (
          user.photos.length > 0 ? (
            <View style={styles.photosGrid}>
              {user.photos.map((photo, index) => (
                <TouchableOpacity key={photo.id} style={styles.photoItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <NeumorphicCard style={styles.emptyCard} intensity="light">
                <Ionicons name="images-outline" size={48} color={COLORS.pencil} />
                <Text style={styles.emptyTitle}>No Photos Yet</Text>
                <Text style={styles.emptyText}>
                  Your captured authentic moments will appear here.
                </Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('Camera')}
                >
                  <Text style={styles.emptyButtonText}>Take First Photo</Text>
                </TouchableOpacity>
              </NeumorphicCard>
            </View>
          )
        ) : (
          user.journals.length > 0 ? (
            <View style={styles.journalsList}>
              {user.journals.map((journal) => {
                const date = new Date(journal.timestamp);
                return (
                  <NeumorphicCard key={journal.id} style={styles.journalCard} intensity="light">
                    <View style={styles.journalHeader}>
                      <Text style={styles.journalDate}>
                        {date.toLocaleDateString()}
                      </Text>
                      <Text style={styles.journalWeather}>
                        {journal.weather === 'sunny' && '☀️'}
                        {journal.weather === 'cloudy' && '☁️'}
                        {journal.weather === 'rainy' && '🌧️'}
                        {journal.weather === 'snowy' && '❄️'}
                        {journal.weather === 'windy' && '💨'}
                      </Text>
                    </View>
                    <Text style={styles.journalContent} numberOfLines={3}>
                      {journal.content}
                    </Text>
                    {journal.location && (
                      <View style={styles.journalLocation}>
                        <Ionicons name="location-outline" size={12} color={COLORS.pencil} />
                        <Text style={styles.journalLocationText}>{journal.location}</Text>
                      </View>
                    )}
                  </NeumorphicCard>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <NeumorphicCard style={styles.emptyCard} intensity="light">
                <Ionicons name="journal-outline" size={48} color={COLORS.pencil} />
                <Text style={styles.emptyTitle}>No Journal Entries</Text>
                <Text style={styles.emptyText}>
                  Your written reflections will appear here.
                </Text>
              </NeumorphicCard>
            </View>
          )
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Veritas Badge */}
      <View style={styles.badgeContainer}>
        <View style={styles.veritasBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
          <Text style={styles.veritasText}>Veritas Authentic</Text>
        </View>
      </View>
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
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.ink,
  },
  bio: {
    fontSize: 15,
    color: COLORS.pencil,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  joinDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
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
    marginTop: 20,
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.paper,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  yearReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ink,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  yearReviewText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.paper,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginRight: 12,
    backgroundColor: COLORS.paper,
    borderRadius: 12,
    opacity: 0.7,
  },
  tabActive: {
    opacity: 1,
    backgroundColor: COLORS.paper,
    shadowColor: '#D1D1D1',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.pencil,
  },
  tabTextActive: {
    color: COLORS.ink,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
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
  emptyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
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
  },
  emptyButton: {
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
  },
  journalsList: {
    paddingHorizontal: 20,
  },
  journalCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  journalDate: {
    fontSize: 12,
    color: COLORS.pencil,
  },
  journalWeather: {
    fontSize: 16,
  },
  journalContent: {
    fontSize: 14,
    color: COLORS.ink,
    lineHeight: 20,
  },
  journalLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  journalLocationText: {
    fontSize: 11,
    color: COLORS.pencil,
    marginLeft: 4,
  },
  bottomPadding: {
    height: 100,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  veritasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#D1D1D1',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  veritasText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 6,
  },
});

export default ProfileScreen;
