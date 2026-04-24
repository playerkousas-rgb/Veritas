import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { audioManager, SOUND_PRESETS } from '../lib/audio';

const { width } = Dimensions.get('window');

interface DarkroomProps {
  visible: boolean;
  imageUri: string;
  metadata: {
    timestamp: number;
    cityName: string;
  };
  onComplete: () => void;
}

const DEVELOP_TIME = 15000; // 15 seconds for full development
const UPDATE_INTERVAL = 100; // Update every 100ms

export const Darkroom: React.FC<DarkroomProps> = ({
  visible,
  imageUri,
  metadata,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'preparing' | 'developing' | 'revealing' | 'complete'>('preparing');
  const [currentSound, setCurrentSound] = useState<string>('');
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      // Reset state
      setProgress(0);
      setPhase('preparing');
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.95);

      // Play darkroom ambience
      audioManager.playDarkroomAmbience();

      // Start animation sequence
      Animated.sequence([
        // Fade in
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        // Slight scale up
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setPhase('developing');
        startDevelopment();
      });
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      audioManager.stopDarkroomAmbience();
    };
  }, [visible]);

  const startDevelopment = () => {
    let elapsed = 0;
    
    timerRef.current = setInterval(() => {
      elapsed += UPDATE_INTERVAL;
      const newProgress = Math.min((elapsed / DEVELOP_TIME) * 100, 100);
      setProgress(newProgress);

      // Phase transitions based on progress
      if (newProgress > 20 && phase === 'developing') {
        // Play paper in chemical sound
        if (newProgress > 30 && newProgress < 35) {
          audioManager.play('darkroom_paper');
          setCurrentSound('paper_swish');
        }
      }
      if (newProgress > 60 && phase !== 'revealing') {
        setPhase('revealing');
      }
      if (newProgress >= 100 && phase !== 'complete') {
        setPhase('complete');
        audioManager.stopDarkroomAmbience();
        
        // Play completion sound
        setTimeout(() => {
          audioManager.play('polaroid_eject');
        }, 200);
        
        setTimeout(() => {
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            onComplete();
          });
        }, 1500);
      }
    }, UPDATE_INTERVAL);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'preparing':
        return 'Preparing chemicals...';
      case 'developing':
        return progress < 30 
          ? 'Developer activating...' 
          : progress < 60 
            ? 'Image forming...' 
            : 'Colors emerging...';
      case 'revealing':
        return 'Almost there...';
      case 'complete':
        return 'Developed!';
      default:
        return '';
    }
  };

  const getImageOpacity = () => {
    // Photo starts invisible and slowly reveals
    if (progress < 20) return 0;
    if (progress > 80) return 1;
    return (progress - 20) / 60;
  };

  const getOverlayOpacity = () => {
    // Brown/sepia overlay that fades away
    if (progress < 20) return 1;
    if (progress > 90) return 0;
    return 1 - ((progress - 20) / 70);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {}}
    >
      <Animated.View 
        style={[
          styles.container,
          { opacity: opacityAnim }
        ]}
      >
        {/* Ambient background */}
        <LinearGradient
          colors={['#1a1a1a', '#0d0d0d']}
          style={styles.background}
        />

        {/* Red safelight effect */}
        <View style={styles.safelight} pointerEvents="none" />

        {/* Sound indicator */}
        {currentSound && (
          <View style={styles.soundIndicator}>
            <Ionicons name="volume-medium" size={16} color="#666" />
            <Text style={styles.soundText}>Darkroom Ambience</Text>
          </View>
        )}

        <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
          {/* Title */}
          <Text style={styles.title}>DARKROOM</Text>
          <Text style={styles.subtitle}>暗室</Text>

          {/* Photo Container */}
          <View style={styles.photoContainer}>
            {/* The developing image */}
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.photo,
                { opacity: getImageOpacity() }
              ]}
              resizeMode="cover"
            />

            {/* Development overlay */}
            <View 
              style={[
                styles.developmentOverlay,
                { opacity: getOverlayOpacity() }
              ]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={['#8B6914', '#5C4A0D', '#3D2F08']}
                style={StyleSheet.absoluteFill}
              />
              
              {/* Chemical texture effect */}
              <View style={styles.chemicalTexture} pointerEvents="none">
                {phase === 'developing' && (
                  <>
                    <View style={[styles.swirl, styles.swirl1]} />
                    <View style={[styles.swirl, styles.swirl2]} />
                    <View style={[styles.swirl, styles.swirl3]} />
                  </>
                )}
              </View>
            </View>

            {/* Polaroid frame overlay */}
            <View style={styles.polaroidFrame} pointerEvents="none">
              <View style={styles.polaroidWhite} />
              <View style={styles.polaroidBottom}>
                <Text style={styles.polaroidDate}>
                  {new Date(metadata.timestamp).toLocaleDateString()}
                </Text>
                <Text style={styles.polaroidLocation}>
                  {metadata.cityName}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { width: `${progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>

          {/* Phase description */}
          <Text style={styles.phaseText}>{getPhaseText()}</Text>

          {/* Completion indicator */}
          {phase === 'complete' && (
            <View style={styles.completeBadge}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
              <Text style={styles.completeText}>Memory Captured</Text>
            </View>
          )}

          {/* Veritas tip */}
          <View style={styles.tipContainer}>
            <Ionicons name="bulb-outline" size={16} color={COLORS.pencil} />
            <Text style={styles.tipText}>
              {progress < 50 
                ? 'Take this moment to breathe and reflect...' 
                : 'Authentic memories take time to develop.'}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const COLORS = {
  background: '#F5F5F5',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  paper: '#FAFAFA',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  safelight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 50, 50, 0.03)',
  },
  soundIndicator: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  soundText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 6,
  },
  content: {
    alignItems: 'center',
    width: width - 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E0E0E0',
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    letterSpacing: 16,
    marginTop: 4,
    marginBottom: 32,
  },
  photoContainer: {
    width: width * 0.75,
    aspectRatio: 0.8, // Polaroid ratio
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    margin: 8,
    marginBottom: 60,
    borderRadius: 2,
  },
  developmentOverlay: {
    ...StyleSheet.absoluteFillObject,
    margin: 8,
    marginBottom: 60,
    borderRadius: 2,
    overflow: 'hidden',
  },
  chemicalTexture: {
    ...StyleSheet.absoluteFillObject,
  },
  swirl: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(139, 105, 20, 0.3)',
  },
  swirl1: {
    top: '20%',
    left: '20%',
  },
  swirl2: {
    top: '50%',
    right: '20%',
  },
  swirl3: {
    bottom: '20%',
    left: '40%',
  },
  polaroidFrame: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  polaroidWhite: {
    ...StyleSheet.absoluteFillObject,
    margin: 4,
    backgroundColor: '#FAFAFA',
    borderRadius: 2,
  },
  polaroidBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  polaroidDate: {
    fontSize: 11,
    color: COLORS.pencil,
    fontFamily: 'monospace',
  },
  polaroidLocation: {
    fontSize: 10,
    color: COLORS.ink,
    marginTop: 2,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    width: '100%',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 12,
    fontFamily: 'monospace',
    width: 40,
  },
  phaseText: {
    fontSize: 14,
    color: '#888',
    marginTop: 16,
    fontStyle: 'italic',
  },
  completeBadge: {
    alignItems: 'center',
    marginTop: 24,
  },
  completeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 8,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontStyle: 'italic',
  },
});

export default Darkroom;
