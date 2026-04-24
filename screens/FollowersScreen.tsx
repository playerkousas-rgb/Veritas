import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, User } from '../lib/types';
import { UserAPI } from '../lib/api';

type FollowersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Followers'>;
type FollowersScreenRouteProp = RouteProp<RootStackParamList, 'Followers'>;

interface FollowersScreenProps {
  navigation: FollowersScreenNavigationProp;
  route: FollowersScreenRouteProp;
}

const COLORS = {
  background: '#F5F5F5',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  paper: '#FAFAFA',
};

export const FollowersScreen: React.FC<FollowersScreenProps> = ({ navigation, route }) => {
  const { userId, type } = route.params;
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = type === 'followers' 
        ? await UserAPI.getFollowers(userId)
        : await UserAPI.getFollowing(userId);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.username}>{item.username}</Text>
          {item.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          )}
        </View>
        <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
      </View>
      <TouchableOpacity style={styles.followButton}>
        <Text style={styles.followButtonText}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === 'followers' ? 'Followers' : 'Following'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={COLORS.pencil} />
            <Text style={styles.emptyText}>
              {type === 'followers' 
                ? 'No followers yet' 
                : 'Not following anyone yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    marginRight: 6,
  },
  bio: {
    fontSize: 14,
    color: COLORS.pencil,
  },
  followButton: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followButtonText: {
    color: COLORS.paper,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.pencil,
    marginTop: 16,
  },
});

export default FollowersScreen;
