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
import { RootStackParamList, Conversation, User } from '../lib/types';
import { MessageAPI, UserAPI } from '../lib/api';
import { AuthAPI } from '../lib/api';
import { formatDistanceToNow } from '../lib/utils';

const COLORS = {
  background: '#F5F5F5',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  paper: '#FAFAFA',
};

type MessagesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

interface MessagesScreenProps {
  navigation: MessagesScreenNavigationProp;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ navigation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const convs = await MessageAPI.getConversations();
      setConversations(convs);
      
      // Load user data for participants
      const users = new Map<string, User>();
      for (const conv of convs) {
        for (const userId of conv.participants) {
          if (!users.has(userId)) {
            const user = await UserAPI.getUserById(userId);
            if (user) {
              users.set(userId, user);
            }
          }
        }
      }
      setUserMap(users);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, []);

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUserId = item.participants.find(id => id !== AuthAPI.getCurrentUser()?.id);
    const otherUser = otherUserId ? userMap.get(otherUserId) : null;
    
    if (!otherUser) return null;

    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => navigation.navigate('Chat', { 
          conversationId: item.id,
          user: otherUser
        })}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.conversationInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>{otherUser.username}</Text>
            {otherUser.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            )}
          </View>
          <Text 
            style={[
              styles.lastMessage,
              item.unreadCount > 0 && styles.unreadMessage
            ]} 
            numberOfLines={1}
          >
            {item.lastMessage?.text || 'No messages yet'}
          </Text>
        </View>
        
        <View style={styles.rightSection}>
          {item.lastMessage && (
            <Text style={styles.timestamp}>
              {formatDistanceToNow(item.lastMessage.timestamp)}
            </Text>
          )}
          <Ionicons name="chevron-forward" size={20} color={COLORS.pencil} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>訊息</Text>
        </View>
        <TouchableOpacity 
          style={styles.newMessageButton}
          onPress={() => navigation.navigate('NewMessage')}
        >
          <Ionicons name="create-outline" size={24} color={COLORS.ink} />
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ink} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={COLORS.pencil} />
            <Text style={styles.emptyTitle}>No Messages Yet</Text>
            <Text style={styles.emptyText}>
              Start a conversation with someone in the community
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('NewMessage')}
            >
              <Text style={styles.emptyButtonText}>Start Chat</Text>
            </TouchableOpacity>
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
  newMessageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.paper,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D1D1D1',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#D1D1D1',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  conversationInfo: {
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
  lastMessage: {
    fontSize: 14,
    color: COLORS.pencil,
  },
  unreadMessage: {
    color: COLORS.ink,
    fontWeight: '600',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.pencil,
    marginBottom: 4,
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
  emptyButton: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  emptyButtonText: {
    color: COLORS.paper,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MessagesScreen;
