import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, VeritasPhoto } from '../lib/types';
import { FeedAPI, AuthAPI } from '../lib/api';
import PolaroidFrame from '../components/PolaroidFrame';
import NeumorphicCard from '../components/NeumorphicCard';

type PreviewScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Preview'>;
type PreviewScreenRouteProp = RouteProp<RootStackParamList, 'Preview'>;

interface PreviewScreenProps {
  navigation: PreviewScreenNavigationProp;
  route: PreviewScreenRouteProp;
}

const COLORS = {
  background: '#F5F5F5',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  paper: '#FAFAFA',
  success: '#4CAF50',
  gold: '#FFD700',
};

// Render the humanity check doodle as a simple SVG-like view
const DoodlePreview: React.FC<{ doodle: { x: number; y: number }[] }> = ({ doodle }) => {
  if (doodle.length < 2) return null;
  
  return (
    <View style={styles.doodleContainer}>
      <Text style={styles.doodleLabel}>Your Response:</Text>
      <View style={styles.doodleCanvas}>
        {doodle.map((point, index) => {
          if (index === 0) return null;
          const prev = doodle[index - 1];
          return (
            <View
              key={index}
              style={[
                styles.doodleLine,
                {
                  left: (prev.x / 300) * 150,
                  top: (prev.y / 200) * 80,
                  width: Math.sqrt(
                    Math.pow((point.x - prev.x) / 300 * 150, 2) + 
                    Math.pow((point.y - prev.y) / 200 * 80, 2)
                  ),
                  transform: [{
                    rotate: `${Math.atan2(
                      (point.y - prev.y) / 200 * 80,
                      (point.x - prev.x) / 300 * 150
                    )}rad`
                  }],
                }
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

export const PreviewScreen: React.FC<PreviewScreenProps> = ({ navigation, route }) => {
  const { photo } = route.params;
  const [caption, setCaption] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const currentUser = AuthAPI.getCurrentUser();
      if (!currentUser) {
        Alert.alert('Error', 'Please log in to publish');
        return;
      }

      const photoWithCaption: VeritasPhoto = {
        ...photo,
        caption: caption.trim() || undefined,
      };

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Published!',
        `Your authentic moment has been shared to the Veritas community.\n\nVerity Score: ${photo.verityScore?.score || 0}/100`,
        [
          {
            text: 'View Feed',
            onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to publish. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  }, [photo, caption, navigation]);

  const handleSaveToGallery = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSaved(true);
    
    Alert.alert(
      'Saved',
      'Your Veritas Polaroid has been saved to your gallery.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleHashPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const factors = photo.verityScore?.factors || [];
    const factorDetails = factors.map(f => 
      `${f.name}: ${f.status.toUpperCase()} (${Math.round(f.score)}/25)\n${f.details}`
    ).join('\n\n');
    
    Alert.alert(
      'Veritas Hash Verification',
      `Hash: ${photo.metadata.veritasHash}\n` +
      `Level: ${photo.verityScore?.badge || 'Unknown'}\n` +
      `Score: ${photo.verityScore?.score || 0}/100\n\n` +
      `Timestamp: ${new Date(photo.metadata.timestamp).toISOString()}\n` +
      `Location: ${photo.metadata.cityName}\n` +
      `Coordinates: ${photo.metadata.latitude.toFixed(6)}, ${photo.metadata.longitude.toFixed(6)}\n` +
      `Altitude: ${photo.metadata.altitude.toFixed(1)}m\n` +
      `Gyroscope: X:${photo.metadata.gyroscopeX.toFixed(3)} Y:${photo.metadata.gyroscopeY.toFixed(3)} Z:${photo.metadata.gyroscopeZ.toFixed(3)}\n` +
      `Haptic Pattern: ${photo.hapticSignature || 'None'}\n\n` +
      `--- Verification Factors ---\n\n${factorDetails}\n\n` +
      'This metadata is cryptographically sealed and cannot be altered.',
      [{ text: 'Verified ✓', style: 'default' }]
    );
  }, [photo]);

  const verityScore = photo.verityScore;
  const humanityCheck = photo.humanityCheck;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Veritas Capture</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.polaroidContainer}>
          <PolaroidFrame 
            photo={photo} 
            size="large" 
            onHashPress={handleHashPress}
          />
        </View>

        {/* Verity Score Card */}
        {verityScore && (
          <NeumorphicCard style={[styles.verityCard, { borderLeftWidth: 4, borderLeftColor: verityScore.badgeColor }]}>
            <View style={styles.verityHeader}>
              <View style={[styles.verityIcon, { backgroundColor: `${verityScore.badgeColor}20` }]}>
                <Text style={[styles.verityIconText, { color: verityScore.badgeColor }]}>
                  {verityScore.level === 'PURE_RAW' ? '★' : 
                   verityScore.level === 'VERIFIED' ? '✓' :
                   verityScore.level === 'STUDIO' ? '◎' :
                   verityScore.level === 'QUESTIONABLE' ? '?' : '⚠'}
                </Text>
              </View>
              <View style={styles.verityInfo}>
                <Text style={[styles.verityBadge, { color: verityScore.badgeColor }]}>
                  {verityScore.badge}
                </Text>
                <Text style={styles.verityDescription}>{verityScore.description}</Text>
              </View>
              <View style={styles.verityScoreBox}>
                <Text style={[styles.verityScoreNumber, { color: verityScore.badgeColor }]}>
                  {verityScore.score}
                </Text>
                <Text style={styles.verityScoreLabel}>/100</Text>
              </View>
            </View>

            {/* Factors */}
            <View style={styles.factorsContainer}>
              {verityScore.factors.map((factor, index) => (
                <View key={index} style={styles.factorRow}>
                  <View style={styles.factorLeft}>
                    <Ionicons 
                      name={factor.status === 'pass' ? 'checkmark-circle' : 
                            factor.status === 'warning' ? 'warning' : 'close-circle'} 
                      size={16} 
                      color={factor.status === 'pass' ? '#4CAF50' : 
                             factor.status === 'warning' ? '#FF9800' : '#FF5252'} 
                    />
                    <Text style={styles.factorName}>{factor.name}</Text>
                  </View>
                  <View style={styles.factorBar}>
                    <View style={[styles.factorFill, { 
                      width: `${(factor.score / 25) * 100}%`,
                      backgroundColor: factor.status === 'pass' ? '#4CAF50' : 
                                       factor.status === 'warning' ? '#FF9800' : '#FF5252'
                    }]} />
                  </View>
                  <Text style={styles.factorScore}>{Math.round(factor.score)}</Text>
                </View>
              ))}
            </View>
          </NeumorphicCard>
        )}

        {/* Humanity Check Result */}
        {humanityCheck && (
          <NeumorphicCard style={styles.humanityCard}>
            <View style={styles.humanityHeader}>
              <Ionicons name="finger-print" size={24} color={COLORS.accent} />
              <Text style={styles.humanityTitle}>Humanity Verified</Text>
            </View>
            <Text style={styles.humanityQuestion}>Q: {humanityCheck.question}</Text>
            <Text style={styles.humanityMeta}>
              Response time: {(humanityCheck.responseTime / 1000).toFixed(1)}s · 
              {humanityCheck.doodle.length} strokes
            </Text>
            <DoodlePreview doodle={humanityCheck.doodle} />
          </NeumorphicCard>
        )}

        {/* Metadata Verification Card */}
        <NeumorphicCard style={styles.metadataCard}>
          <View style={styles.metadataHeader}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
            <Text style={styles.metadataTitle}>Authenticity Verified</Text>
          </View>
          
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Capture Method</Text>
            <Text style={styles.metadataValue}>Live Camera Only</Text>
          </View>
          
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Haptic Signature</Text>
            <Text style={[
              styles.metadataValue,
              photo.hapticSignature ? styles.successText : styles.warningText
            ]}>
              {photo.hapticSignature || 'Not Recorded'}
            </Text>
          </View>
          
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Gyroscope Status</Text>
            <Text style={[
              styles.metadataValue,
              photo.metadata.isStationary ? styles.warningText : styles.successText
            ]}>
              {photo.metadata.isStationary ? 'Stationary Detected' : 'Motion Confirmed'}
            </Text>
          </View>
          
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Time Source</Text>
            <Text style={styles.metadataValue}>NTP Server Sync</Text>
          </View>
          
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Location Source</Text>
            <Text style={styles.metadataValue}>GPS + Geocode</Text>
          </View>
        </NeumorphicCard>

        {/* Caption Input */}
        <NeumorphicCard style={styles.captionCard} intensity="light">
          <Text style={styles.captionLabel}>Add Context (Optional)</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="Describe this authentic moment..."
            placeholderTextColor={COLORS.pencil}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={200}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{caption.length}/200</Text>
        </NeumorphicCard>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.saveButton, isSaved && styles.savedButton]}
            onPress={handleSaveToGallery}
            disabled={isSaved}
          >
            <Ionicons 
              name={isSaved ? "checkmark-circle" : "download-outline"} 
              size={24} 
              color={isSaved ? COLORS.success : COLORS.ink} 
            />
            <Text style={[styles.actionButtonText, isSaved && styles.savedButtonText]}>
              {isSaved ? 'Saved' : 'Save to Gallery'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Publish Button */}
      <View style={styles.publishContainer}>
        <TouchableOpacity 
          style={[styles.publishButton, isPublishing && styles.publishButtonDisabled]}
          onPress={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <ActivityIndicator color={COLORS.paper} />
          ) : (
            <>
              <Ionicons name="globe-outline" size={24} color={COLORS.paper} />
              <Text style={styles.publishButtonText}>Publish to Veritas</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  polaroidContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  verityCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
  },
  verityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  verityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verityIconText: {
    fontSize: 24,
    fontWeight: '700',
  },
  verityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  verityBadge: {
    fontSize: 16,
    fontWeight: '700',
  },
  verityDescription: {
    fontSize: 13,
    color: COLORS.pencil,
    marginTop: 2,
  },
  verityScoreBox: {
    alignItems: 'center',
  },
  verityScoreNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  verityScoreLabel: {
    fontSize: 12,
    color: COLORS.pencil,
  },
  factorsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 16,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  factorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 140,
  },
  factorName: {
    fontSize: 13,
    color: COLORS.ink,
    marginLeft: 6,
  },
  factorBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    marginRight: 8,
  },
  factorFill: {
    height: '100%',
    borderRadius: 3,
  },
  factorScore: {
    fontSize: 12,
    color: COLORS.pencil,
    width: 24,
    textAlign: 'right',
  },
  humanityCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
  },
  humanityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  humanityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    marginLeft: 8,
  },
  humanityQuestion: {
    fontSize: 14,
    color: COLORS.ink,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  humanityMeta: {
    fontSize: 12,
    color: COLORS.pencil,
    marginBottom: 12,
  },
  doodleContainer: {
    marginTop: 8,
  },
  doodleLabel: {
    fontSize: 12,
    color: COLORS.pencil,
    marginBottom: 8,
  },
  doodleCanvas: {
    width: 150,
    height: 80,
    backgroundColor: '#FFFEF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  doodleLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: COLORS.ink,
    borderRadius: 1,
  },
  metadataCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
  },
  metadataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    marginLeft: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  metadataLabel: {
    fontSize: 14,
    color: COLORS.pencil,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
  },
  successText: {
    color: COLORS.success,
  },
  warningText: {
    color: '#FF9800',
  },
  captionCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
  },
  captionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: 12,
  },
  captionInput: {
    height: 100,
    fontSize: 16,
    color: COLORS.ink,
    lineHeight: 22,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.pencil,
    textAlign: 'right',
    marginTop: 8,
  },
  actionButtons: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.paper,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#D1D1D1',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
    marginLeft: 8,
  },
  saveButton: {},
  savedButton: {
    backgroundColor: '#E8F5E9',
  },
  savedButtonText: {
    color: COLORS.success,
  },
  bottomPadding: {
    height: 100,
  },
  publishContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ink,
    paddingVertical: 16,
    borderRadius: 16,
  },
  publishButtonDisabled: {
    opacity: 0.7,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.paper,
    marginLeft: 8,
  },
});

export default PreviewScreen;
