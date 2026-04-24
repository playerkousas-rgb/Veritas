import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, JournalEntry } from '../lib/types';
import { AuthAPI } from '../lib/api';
import PaperTexture from '../components/PaperTexture';
import NeumorphicCard from '../components/NeumorphicCard';

type JournalScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

interface JournalScreenProps {
  navigation: JournalScreenNavigationProp;
}

const COLORS = {
  background: '#F5F5F5',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  paper: '#F8F6F1',
  line: '#E8E4DC',
};

const WEATHER_LABELS: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
  windy: '💨',
};

export const JournalScreen: React.FC<JournalScreenProps> = () => {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [content, setContent] = useState('');
  const [weather, setWeather] = useState<JournalEntry['weather']>('sunny');
  const [location, setLocation] = useState('');

  useEffect(() => {
    loadJournals();
  }, []);

  const loadJournals = () => {
    const user = AuthAPI.getCurrentUser();
    if (user) {
      setJournals(user.journals || []);
    }
  };

  const openNewEntry = () => {
    setEditingEntry(null);
    setContent('');
    setWeather('sunny');
    setLocation('');
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setContent(entry.content);
    setWeather(entry.weather);
    setLocation(entry.location || '');
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const saveEntry = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something in your journal.');
      return;
    }

    const user = AuthAPI.getCurrentUser();
    if (!user) {
      Alert.alert('Error', 'Please log in');
      return;
    }

    if (editingEntry) {
      // Update existing entry
      const updated = user.journals.map(j => 
        j.id === editingEntry.id 
          ? { ...j, content: content.trim(), weather, location: location.trim() || undefined }
          : j
      );
      user.journals = updated;
    } else {
      // Create new entry
      const newEntry: JournalEntry = {
        id: `journal-${Date.now()}`,
        content: content.trim(),
        timestamp: Date.now(),
        weather,
        location: location.trim() || undefined,
      };
      user.journals.unshift(newEntry);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
    loadJournals();
  };

  const handleDelete = (entry: JournalEntry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const user = AuthAPI.getCurrentUser();
            if (user) {
              user.journals = user.journals.filter(j => j.id !== entry.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              loadJournals();
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const renderJournalCard = ({ item }: { item: JournalEntry }) => {
    const dateInfo = formatDate(item.timestamp);

    return (
      <NeumorphicCard style={styles.journalCard}>
        <View style={styles.cardHeader}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>{dateInfo.date}</Text>
            <Text style={styles.weekdayText}>{dateInfo.weekday}</Text>
          </View>
          <View style={styles.weatherBadge}>
            <Text style={styles.weatherEmoji}>{WEATHER_LABELS[item.weather]}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.journalContent}>{item.content}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            {item.location && (
              <View style={styles.locationTag}>
                <Ionicons name="location-outline" size={14} color={COLORS.pencil} />
                <Text style={styles.locationText}>{item.location}</Text>
              </View>
            )}
            <Text style={styles.timeText}>{dateInfo.time}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => openEditEntry(item)}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.pencil} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>
      </NeumorphicCard>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <NeumorphicCard style={styles.emptyCard}>
        <Ionicons name="journal-outline" size={64} color={COLORS.pencil} />
        <Text style={styles.emptyTitle}>Your Journal Awaits</Text>
        <Text style={styles.emptyText}>
          Record your authentic thoughts, unfiltered and true. Each entry is a time capsule of reality.
        </Text>
        <TouchableOpacity style={styles.emptyButton} onPress={openNewEntry}>
          <Ionicons name="add" size={20} color={COLORS.paper} />
          <Text style={styles.emptyButtonText}>Write First Entry</Text>
        </TouchableOpacity>
      </NeumorphicCard>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Journal</Text>
          <Text style={styles.headerSubtitle}>日記</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openNewEntry}>
          <Ionicons name="add" size={28} color={COLORS.paper} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <NeumorphicCard style={styles.statCard} intensity="light">
          <Text style={styles.statNumber}>{journals.length}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </NeumorphicCard>
        <NeumorphicCard style={styles.statCard} intensity="light">
          <Text style={styles.statNumber}>
            {journals.reduce((acc, j) => acc + j.content.length, 0)}
          </Text>
          <Text style={styles.statLabel}>Characters</Text>
        </NeumorphicCard>
      </View>

      {/* Journal List */}
      <FlatList
        data={journals}
        keyExtractor={(item) => item.id}
        renderItem={renderJournalCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Editor Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color={COLORS.ink} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingEntry ? 'Edit Entry' : 'New Entry'}
            </Text>
            <TouchableOpacity onPress={saveEntry}>
              <Ionicons name="checkmark" size={28} color={COLORS.accent} />
            </TouchableOpacity>
          </View>

          <PaperTexture style={styles.paperContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Weather Selector */}
              <View style={styles.weatherSelector}>
                <Text style={styles.selectorLabel}>Weather</Text>
                <View style={styles.weatherOptions}>
                  {(Object.keys(WEATHER_LABELS) as JournalEntry['weather'][]).map((w) => (
                    <TouchableOpacity
                      key={w}
                      style={[
                        styles.weatherOption,
                        weather === w && styles.weatherOptionActive,
                      ]}
                      onPress={() => setWeather(w)}
                    >
                      <Text style={styles.weatherOptionEmoji}>{WEATHER_LABELS[w]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Location Input */}
              <View style={styles.locationInput}>
                <Ionicons name="location-outline" size={20} color={COLORS.pencil} />
                <TextInput
                  style={styles.locationTextInput}
                  placeholder="Location (optional)"
                  placeholderTextColor={COLORS.pencil}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              {/* Content Input */}
              <TextInput
                style={styles.contentInput}
                placeholder="Write your authentic thoughts here..."
                placeholderTextColor={COLORS.pencil}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                autoFocus
              />
            </ScrollView>
          </PaperTexture>
        </View>
      </Modal>
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    marginRight: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.ink,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.pencil,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  journalCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dateBadge: {},
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  weekdayText: {
    fontSize: 12,
    color: COLORS.pencil,
    marginTop: 2,
  },
  weatherBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherEmoji: {
    fontSize: 18,
  },
  contentContainer: {
    marginBottom: 16,
  },
  journalContent: {
    fontSize: 16,
    color: COLORS.ink,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  footerLeft: {
    flex: 1,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.pencil,
    marginLeft: 4,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.pencil,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
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
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
  },
  paperContainer: {
    flex: 1,
  },
  weatherSelector: {
    paddingTop: 20,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.pencil,
    marginBottom: 12,
  },
  weatherOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  weatherOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weatherOptionActive: {
    borderColor: COLORS.accent,
  },
  weatherOptionEmoji: {
    fontSize: 20,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  locationTextInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.ink,
    marginLeft: 8,
    paddingVertical: 8,
  },
  contentInput: {
    flex: 1,
    fontSize: 18,
    color: COLORS.ink,
    lineHeight: 28,
    minHeight: 400,
  },
});

export default JournalScreen;
