import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Notification, User } from '../lib/types';
import { NotificationAPI, UserAPI } from '../lib/api';
import { formatDistanceToNow } from '../lib/utils';

const COLORS = {
  background: '#F5F5F5',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  paper: '#FAFAFA',
};

type NotificationsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Notifications'>;

interface NotificationsScreenProps {
  navigation: NotificationsScreenNavigationProp;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const notifs = await NotificationAPI.getNotifications();
      setNotifications(notifs);
      
      // Load actor user data
      const users = new Map<string, User>();
      for (const notif of notifs) {
        if (!users.has(notif.actorId)) {
          const user = await UserAPI.getUserById(notif.actorId);
          if (user) {
            users.set(notif.actorId, user);
          }
        }
      }
      setUserMap(users);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, []);

  const markAllAsRead = async () => {
    await NotificationAPI.markAllAsRead();
    await loadNotifications();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return { name: 'heart', color: '#FF6B6B' };
      case 'follow':
        return { name: 'person-add', color: '#4CAF50' };
      case 'comment':
        return { name: 'chatbubble', color: COLORS.accent };
      case 'message':
        return { name: 'mail', color: '#2196F3' };
      case 'mention':
        return { name: 'at', color: '#9C27B0' };
      default:
        return { name: 'notifications', color: COLORS.pencil };
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const actor = userMap.get(item.actorId);
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.read && styles.unreadNotification]}
        onPress={async () => {
          await NotificationAPI.markAsRead(item.id);
          if (item.type === 'follow') {
            navigation.navigate('UserProfile', { userId: item.actorId });
          } else if (item.type === 'message') {
            if (actor) {
              // Find or create conversation
              navigation.navigate('Chat', { conversationId: 'conv2', user: actor });
            }
          }
        }}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name as any} size={20} color={icon.color} />
        </View>

        <View style={styles.content}>
          <View style={styles.avatarRow}>
            {actor && (
              <Image source={{ uri: actor.avatar }} style={styles.avatar} />
            )}
            <Text style={styles.notificationText}>
              <Text style={styles.actorName}>{actor?.username || 'Someone'} </Text>
              {item.text.replace(actor?.username || '', '')}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {formatDistanceToNow(item.timestamp)}
          </Text>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>通知</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{notifications.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{unreadCount}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ink} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={COLORS.pencil} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              When someone likes, comments, or follows you, you'll see it here
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
  markAllText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statItem: {
    marginRight: 24,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.ink,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.pencil,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  unreadNotification: {
    backgroundColor: '#F0F7FF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  notificationText: {
    fontSize: 14,
    color: COLORS.ink,
    lineHeight: 20,
    flex: 1,
  },
  actorName: {
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.pencil,
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.pencil,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});

export default NotificationsScreen;
