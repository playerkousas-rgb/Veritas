import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, YearInReview } from '../lib/types';
import { generateYearInReview } from '../lib/dailyJournal';
import NeumorphicCard from '../components/NeumorphicCard';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type YearInReviewScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

interface YearInReviewScreenProps {
  navigation: YearInReviewScreenNavigationProp;
}

const COLORS = {
  background: '#F5F5F5',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  paper: '#FAFAFA',
  gold: '#FFD700',
};

export const YearInReviewScreen: React.FC<YearInReviewScreenProps> = ({ navigation }) => {
  const [report, setReport] = useState<YearInReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    const year = new Date().getFullYear();
    const data = await generateYearInReview(year);
    setReport(data);
    setLoading(false);
  };

  if (loading || !report) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Generating your authentic journey...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{report.year} Wrapped</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color={COLORS.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#2F2F2F', '#1a1a1a']}
          style={styles.heroCard}
        >
          <Text style={styles.heroTitle}>Your Year in Truth</Text>
          <Text style={styles.heroSubtitle}>
            {report.totalAuthenticHours} hours of authentic living
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{report.daysWithPhotos}</Text>
              <Text style={styles.statLabel}>Days Captured</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{report.daysWithJournals}</Text>
              <Text style={styles.statLabel}>Days Reflected</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{report.pureRawCount}</Text>
              <Text style={styles.statLabel}>Pure Raw</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Streak Card */}
        <NeumorphicCard style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Ionicons name="flame" size={32} color="#FF6B6B" />
            <View style={styles.streakText}>
              <Text style={styles.streakNumber}>{report.longestStreak}</Text>
              <Text style={styles.streakLabel}>Longest Streak</Text>
            </View>
          </View>
          <Text style={styles.streakDescription}>
            Your longest consecutive run of authentic days. 
            Currently on a {report.currentStreak} day streak!
          </Text>
        </NeumorphicCard>

        {/* Monthly Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Journey</Text>
          <View style={styles.monthGrid}>
            {report.monthlyBreakdown.map((month) => (
              <View key={month.month} style={styles.monthItem}>
                <Text style={styles.monthName}>
                  {new Date(2024, month.month - 1).toLocaleString('default', { month: 'short' })}
                </Text>
                <View style={styles.monthBars}>
                  <View style={[styles.monthBar, { height: Math.min(month.photos * 3, 40) }]} />
                  <View style={[styles.monthBarAlt, { height: Math.min(month.journals * 3, 40) }]} />
                </View>
                <Text style={styles.monthCount}>{month.photos}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Favorite Locations */}
        {report.favoriteLocations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Authentic Places</Text>
            {report.favoriteLocations.map((loc, index) => (
              <NeumorphicCard key={loc.location} style={styles.locationCard} intensity="light">
                <View style={styles.locationRank}>
                  <Text style={styles.locationRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{loc.location}</Text>
                  <Text style={styles.locationCount}>{loc.count} authentic moments</Text>
                </View>
              </NeumorphicCard>
            ))}
          </View>
        )}

        {/* Quote Card */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            "In a world of filters and AI, you chose to see and share reality."
          </Text>
          <Text style={styles.quoteAuthor}>— Veritas</Text>
        </View>

        {/* Download Button */}
        <TouchableOpacity style={styles.downloadButton}>
          <Ionicons name="download-outline" size={20} color={COLORS.paper} />
          <Text style={styles.downloadText}>Export My Year</Text>
        </TouchableOpacity>

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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
  },
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.gold,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  streakCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    marginLeft: 16,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.ink,
  },
  streakLabel: {
    fontSize: 14,
    color: COLORS.pencil,
  },
  streakDescription: {
    fontSize: 14,
    color: COLORS.pencil,
    marginTop: 12,
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 16,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthItem: {
    width: (width - 56) / 4,
    alignItems: 'center',
    marginBottom: 16,
  },
  monthName: {
    fontSize: 12,
    color: COLORS.pencil,
    marginBottom: 8,
  },
  monthBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    gap: 2,
  },
  monthBar: {
    width: 8,
    backgroundColor: COLORS.ink,
    borderRadius: 4,
  },
  monthBarAlt: {
    width: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  monthCount: {
    fontSize: 11,
    color: COLORS.ink,
    marginTop: 4,
    fontWeight: '600',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  locationRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
  },
  locationInfo: {
    marginLeft: 16,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
  },
  locationCount: {
    fontSize: 13,
    color: COLORS.pencil,
    marginTop: 2,
  },
  quoteCard: {
    marginHorizontal: 20,
    marginTop: 32,
    padding: 24,
    backgroundColor: COLORS.ink,
    borderRadius: 20,
  },
  quoteText: {
    fontSize: 18,
    color: '#FFF',
    fontStyle: 'italic',
    lineHeight: 28,
    textAlign: 'center',
  },
  quoteAuthor: {
    fontSize: 14,
    color: COLORS.accent,
    textAlign: 'center',
    marginTop: 16,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ink,
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  downloadText: {
    color: COLORS.paper,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 100,
  },
});

export default YearInReviewScreen;
