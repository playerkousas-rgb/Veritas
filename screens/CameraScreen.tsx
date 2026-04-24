import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { Gyroscope, LightSensor } from 'expo-sensors';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, VeritasPhoto, PhotoMetadata } from '../lib/types';
import { generateVeritasHash } from '../lib/mockData';
import { AuthAPI } from '../lib/api';
import { performHapticChallenge, getPatternName, HapticPattern } from '../lib/hapticSignature';
import { calculateVerityScore, VerityScore, VerityLevel } from '../lib/verityScore';
import { audioManager } from '../lib/audio';
import { HumanityCheck, HumanityCheckResult } from '../components/HumanityCheck';
import { Darkroom } from '../components/Darkroom';

const { width, height } = Dimensions.get('window');

type CameraScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Camera'>;

interface CameraScreenProps {
  navigation: CameraScreenNavigationProp;
}

const COLORS = {
  background: '#F5F5F5',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  paper: '#FAFAFA',
};

const VERITY_BADGES: Record<VerityLevel, { icon: string; color: string }> = {
  PURE_RAW: { icon: '★', color: '#FFD700' },
  VERIFIED: { icon: '✓', color: '#4CAF50' },
  STUDIO: { icon: '◎', color: '#2196F3' },
  QUESTIONABLE: { icon: '?', color: '#FF9800' },
  SUSPICIOUS: { icon: '⚠', color: '#FF5252' },
};

export const CameraScreen: React.FC<CameraScreenProps> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [cityName, setCityName] = useState('Unknown');
  const [brightnessReadings, setBrightnessReadings] = useState<number[]>([]);
  
  // Haptic challenge state
  const [hapticChallenge, setHapticChallenge] = useState<{
    pattern: HapticPattern;
    verification: { success: boolean; confidence: number; details: string };
  } | null>(null);
  const [showHapticIndicator, setShowHapticIndicator] = useState(false);
  
  // Humanity check state
  const [capturedPhoto, setCapturedPhoto] = useState<CameraCapturedPicture | null>(null);
  const [photoMetadata, setPhotoMetadata] = useState<PhotoMetadata | null>(null);
  const [showHumanityCheck, setShowHumanityCheck] = useState(false);
  const [humanityResult, setHumanityResult] = useState<HumanityCheckResult | null>(null);
  
  // Darkroom state
  const [showDarkroom, setShowDarkroom] = useState(false);
  
  // Verity score
  const [verityScore, setVerityScore] = useState<VerityScore | null>(null);
  
  // Animated values
  const flashAnim = useRef(new Animated.Value(0)).current;
  const polaroidY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    // Subscribe to gyroscope
    let gyroSubscription: any;
    Gyroscope.isAvailableAsync().then((available) => {
      if (available) {
        Gyroscope.setUpdateInterval(100);
        gyroSubscription = Gyroscope.addListener((data) => {
          setGyroData(data);
        });
      }
    });

    // Get location
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        
        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (reverseGeocode[0]) {
            const city = reverseGeocode[0].city || reverseGeocode[0].region || 'Unknown';
            setCityName(city);
          }
        } catch {
          setCityName('Unknown');
        }
      }
    })();

    // Start light sensor monitoring for light analysis (Analog Print detection)
    let lightSubscription: any;
    LightSensor.isAvailableAsync().then((available) => {
      if (available) {
        LightSensor.setUpdateInterval(100);
        lightSubscription = LightSensor.addListener((data) => {
          setBrightnessReadings(prev => [...prev.slice(-50), data.illuminance]);
        });
      }
    });

    return () => {
      if (gyroSubscription) gyroSubscription.remove();
      if (lightSubscription) lightSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const triggerFlash = () => {
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const detectStationary = (): boolean => {
    const threshold = 0.05;
    return (
      Math.abs(gyroData.x) < threshold && 
      Math.abs(gyroData.y) < threshold && 
      Math.abs(gyroData.z) < threshold
    );
  };

  const takePicture = useCallback(async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      
      // Step 0: Play mechanical shutter wind-up sound
      await audioManager.play('film_wind');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Step 1: Haptic Challenge (Anti-spoofing)
      setShowHapticIndicator(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const hapticResult = await performHapticChallenge();
      setHapticChallenge(hapticResult);
      setShowHapticIndicator(false);
      
      if (!hapticResult.verification.success) {
        Alert.alert(
          'Haptic Verification Warning',
          'Could not verify physical touch signature. Please hold the device naturally when capturing.',
          [{ text: 'Continue Anyway', onPress: () => proceedWithCapture(hapticResult) }]
        );
      } else {
        proceedWithCapture(hapticResult);
      }
    }
  }, [isCapturing, gyroData, location, cityName, brightnessReadings]);

  const proceedWithCapture = async (hapticResult: { pattern: HapticPattern; verification: { success: boolean; confidence: number; details: string } }) => {
    try {
      // Step 2: Play mechanical shutter sound + flash
      await audioManager.playShutter();
      triggerFlash();
      
      const photo: CameraCapturedPicture = await cameraRef.current!.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (!photo) {
        throw new Error('Failed to capture photo');
      }

      setCapturedPhoto(photo);

      // Step 3: Generate metadata
      const timestamp = Date.now();
      const lat = location?.coords.latitude || 0;
      const lng = location?.coords.longitude || 0;
      const altitude = location?.coords.altitude || 0;
      const isStationary = detectStationary();

      const metadata: PhotoMetadata = {
        id: `meta-${timestamp}`,
        timestamp,
        ntpTime: new Date(timestamp).toISOString(),
        latitude: lat,
        longitude: lng,
        altitude,
        gyroscopeX: gyroData.x,
        gyroscopeY: gyroData.y,
        gyroscopeZ: gyroData.z,
        isStationary,
        cityName,
        veritasHash: generateVeritasHash(timestamp, lat, lng),
      };

      setPhotoMetadata(metadata);

      // Step 4: Calculate Verity Score
      const score = calculateVerityScore(metadata, hapticResult.verification, brightnessReadings);
      setVerityScore(score);

      // Step 5: Show Humanity Check
      setShowHumanityCheck(true);

    } catch (error) {
      console.error('Error taking picture:', error);
      setIsCapturing(false);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleHumanityComplete = (result: HumanityCheckResult) => {
    setHumanityResult(result);
    setShowHumanityCheck(false);
    
    // Step 6: Show Darkroom (delayed development)
    setShowDarkroom(true);
  };

  const handleHumanitySkip = () => {
    setShowHumanityCheck(false);
    setShowDarkroom(true);
  };

  const handleDarkroomComplete = () => {
    setShowDarkroom(false);
    setIsCapturing(false);
    
    // Play Pure Raw achievement sound if applicable
    if (verityScore?.level === 'PURE_RAW') {
      audioManager.playPureRawAchievement();
    }
    
    // Navigate to preview with all data
    if (capturedPhoto && photoMetadata && verityScore) {
      const currentUser = AuthAPI.getCurrentUser();
      
      const veritasPhoto: VeritasPhoto = {
        id: `photo-${photoMetadata.timestamp}`,
        uri: capturedPhoto.uri,
        metadata: photoMetadata,
        userId: currentUser?.id || 'unknown',
        username: currentUser?.username || 'unknown',
        userAvatar: currentUser?.avatar,
        likes: [],
        comments: [],
        createdAt: photoMetadata.timestamp,
        // Extended metadata
        verityScore: verityScore,
        humanityCheck: humanityResult || undefined,
        hapticSignature: hapticChallenge?.pattern,
      };

      navigation.navigate('Preview', { 
        photo: veritasPhoto,
      });
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <NeumorphicCard size="medium" intensity="medium" style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={64} color={COLORS.ink} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Veritas needs camera access to capture authentic moments. Gallery access is intentionally disabled.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Access</Text>
          </TouchableOpacity>
        </NeumorphicCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef} 
        style={styles.camera}
        mode="picture"
        facing="back"
      >
        {/* Overlay UI */}
        <View style={styles.overlay}>
          {/* Top Info Bar */}
          <View style={styles.topBar}>
            <View style={styles.gyroIndicator}>
              <Ionicons 
                name="phone-portrait-outline" 
                size={16} 
                color={detectStationary() ? '#FF6B6B' : '#4CAF50'} 
              />
              <Text style={styles.gyroText}>
                {detectStationary() ? 'STATIONARY' : 'ACTIVE'}
              </Text>
            </View>
            <View style={styles.locationIndicator}>
              <Ionicons name="location" size={16} color={COLORS.ink} />
              <Text style={styles.locationText} numberOfLines={1}>
                {cityName}
              </Text>
            </View>
          </View>

          {/* Haptic Challenge Indicator */}
          {showHapticIndicator && (
            <View style={styles.hapticChallengeOverlay}>
              <ActivityIndicator color={COLORS.accent} size="large" />
              <Text style={styles.hapticChallengeText}>Verifying physical presence...</Text>
              <Text style={styles.hapticChallengeSubtext}>Hold device naturally</Text>
            </View>
          )}

          {/* Viewfinder Frame */}
          <View style={styles.viewfinderContainer}>
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.viewfinderText}>4:5 Polaroid Frame</Text>
          </View>

          {/* Verity Score Preview (if calculated) */}
          {verityScore && (
            <View style={styles.verityPreview}>
              <Text style={[styles.verityBadge, { color: verityScore.badgeColor }]}>
                {verityScore.badge}
              </Text>
              <Text style={styles.verityScore}>{verityScore.score}/100</Text>
            </View>
          )}

          {/* Bottom Controls */}
          <View style={styles.bottomBar}>
            <View style={styles.infoPill}>
              <Text style={styles.infoText}>
                {hapticChallenge ? getPatternName(hapticChallenge.pattern) : 'Ready'}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.shutterButton, isCapturing && styles.shutterButtonDisabled]}
              onPress={takePicture}
              disabled={isCapturing}
            >
              <View style={styles.shutterInner} />
            </TouchableOpacity>

            <View style={styles.infoPill}>
              <Text style={styles.infoText}>
                GPS: {location?.coords.latitude.toFixed(2) || '--'}, {location?.coords.longitude.toFixed(2) || '--'}
              </Text>
            </View>
          </View>
        </View>
      </CameraView>

      {/* Flash Overlay */}
      <Animated.View 
        style={[styles.flashOverlay, { opacity: flashAnim }]} 
        pointerEvents="none"
      />

      {/* Modals */}
      <HumanityCheck
        visible={showHumanityCheck}
        onComplete={handleHumanityComplete}
        onSkip={handleHumanitySkip}
      />

      {capturedPhoto && photoMetadata && (
        <Darkroom
          visible={showDarkroom}
          imageUri={capturedPhoto.uri}
          metadata={{
            timestamp: photoMetadata.timestamp,
            cityName: photoMetadata.cityName,
          }}
          onComplete={handleDarkroomComplete}
        />
      )}
    </View>
  );
};

// Neumorphic Card Component
const NeumorphicCard: React.FC<any> = ({ children, style }) => (
  <View style={[styles.neuCard, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  neuCard: {
    backgroundColor: COLORS.background,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#D1D1D1',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 320,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: COLORS.pencil,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: COLORS.paper,
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
  },
  gyroIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gyroText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: 150,
  },
  locationText: {
    color: '#FFF',
    fontSize: 12,
    marginLeft: 6,
  },
  hapticChallengeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hapticChallengeText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  hapticChallengeSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  viewfinderContainer: {
    alignItems: 'center',
  },
  viewfinder: {
    width: width * 0.8,
    height: width * 0.8 * 1.25,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FFF',
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  viewfinderText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 12,
    letterSpacing: 2,
  },
  verityPreview: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    alignSelf: 'center',
  },
  verityBadge: {
    fontSize: 16,
    fontWeight: '700',
  },
  verityScore: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  bottomBar: {
    alignItems: 'center',
    marginBottom: 30,
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
    marginVertical: 20,
  },
  shutterButtonDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
  infoPill: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  infoText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF',
  },
});

export default CameraScreen;
