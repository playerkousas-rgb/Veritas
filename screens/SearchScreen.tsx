import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, User } from '../lib/types';
import { UserAPI } from '../lib/api';
import NeumorphicCard from '../components/NeumorphicCard';

type SearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

interface SearchScreenProps {
  navigation: SearchScreenNavigationProp;
}

const COLORS = {
  background: '#F5F5F5',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  paper: '#FAFAFA',
};

const TRENDING_SEARCHES = [
  '#NoFilter',
  '#RealMoments',
  '#Tokyo',
  '#MountainLife',
  '#Sunset',
  '#StreetPhotography',
];

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      const users = await UserAPI.searchUsers(searchQuery);
      setResults(users);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.username}>{item.username}</Text>
          {item.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          )}
        </View>
        <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
        <Text style={styles.followers}>{item.followers.length} followers</Text>
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
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>探索</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.pencil} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users, hashtags..."
            placeholderTextColor={COLORS.pencil}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.pencil} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results or Trending */}
      {query.trim() ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            !isSearching && (
              <View style={styles.emptyResults}>
                <Ionicons name="search-outline" size={48} color={COLORS.pencil} />
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            )
          }
        />
      ) : (
        <View style={styles.trendingSection}>
          <Text style={styles.sectionTitle}>Trending</Text>
          <View style={styles.hashtagsContainer}>
            {TRENDING_SEARCHES.map((tag) => (
              <TouchableOpacity 
                key={tag}
                style={styles.hashtagButton}
                onPress={() => setQuery(tag)}
              >
                <Text style={styles.hashtagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Suggested</Text>
          <FlatList
            data={results.length > 0 ? results : []}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={styles.suggestedList}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#D1D1D1',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.ink,
    marginLeft: 12,
  },
  resultsList: {
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
  userAvatar: {
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
    marginBottom: 4,
  },
  followers: {
    fontSize: 12,
    color: COLORS.accent,
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
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.pencil,
    marginTop: 16,
  },
  trendingSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  hashtagButton: {
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  hashtagText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  suggestedList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
});

export default SearchScreen;
