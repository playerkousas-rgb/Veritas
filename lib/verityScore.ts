// Verity Score System - Authenticity Grading
import { PhotoMetadata } from './types';

export type VerityLevel = 
  | 'PURE_RAW'      // 100% - Perfect authenticity
  | 'VERIFIED'      // 80-99% - High authenticity with minor caveats
  | 'STUDIO'        // 60-79% - Stationary/professional setup
  | 'QUESTIONABLE'  // 40-59% - Some concerns
  | 'SUSPICIOUS';   // 0-39% - Likely fake/screen capture

export interface VerityScore {
  level: VerityLevel;
  score: number; // 0-100
  factors: VerityFactor[];
  badge: string;
  badgeColor: string;
  description: string;
}

export interface VerityFactor {
  name: string;
  score: number; // Contribution to total (0-25)
  status: 'pass' | 'warning' | 'fail';
  details: string;
}

// Detect artificial light flicker (50/60Hz)
export const detectLightFlicker = (brightnessReadings: number[]): boolean => {
  if (brightnessReadings.length < 20) return false;
  
  // Look for periodic variations that match AC frequency
  // Natural light has smooth variations, artificial light flickers at line frequency
  const variations: number[] = [];
  
  for (let i = 1; i < brightnessReadings.length; i++) {
    variations.push(Math.abs(brightnessReadings[i] - brightnessReadings[i - 1]));
  }
  
  // Calculate variance
  const mean = variations.reduce((a, b) => a + b, 0) / variations.length;
  const variance = variations.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / variations.length;
  
  // High variance indicates flickering
  return variance > 0.5;
};

// Calculate verity score
export const calculateVerityScore = (
  metadata: PhotoMetadata,
  hapticResult: { success: boolean; confidence: number },
  lightReadings?: number[]
): VerityScore => {
  const factors: VerityFactor[] = [];
  
  // Factor 1: Haptic Signature (25 points)
  const hapticFactor: VerityFactor = {
    name: 'Haptic Verification',
    score: hapticResult.success ? 25 : hapticResult.confidence * 0.25,
    status: hapticResult.success ? 'pass' : hapticResult.confidence > 50 ? 'warning' : 'fail',
    details: hapticResult.success 
      ? 'Physical touch verified' 
      : `Partial verification: ${hapticResult.details}`,
  };
  factors.push(hapticFactor);
  
  // Factor 2: Motion/Gyroscope (25 points)
  const motionMagnitude = Math.sqrt(
    metadata.gyroscopeX ** 2 + 
    metadata.gyroscopeY ** 2 + 
    metadata.gyroscopeZ ** 2
  );
  
  const motionFactor: VerityFactor = {
    name: 'Motion Detection',
    score: metadata.isStationary ? 10 : Math.min(25, motionMagnitude * 100 + 15),
    status: metadata.isStationary ? 'warning' : 'pass',
    details: metadata.isStationary 
      ? 'Device was stationary (possible tripod/stand)' 
      : `Natural hand movement detected: ${motionMagnitude.toFixed(3)}`,
  };
  factors.push(motionFactor);
  
  // Factor 3: GPS/Location (25 points)
  const hasValidGPS = metadata.latitude !== 0 && metadata.longitude !== 0;
  const hasAltitude = metadata.altitude !== 0;
  
  const gpsFactor: VerityFactor = {
    name: 'Location Verification',
    score: hasValidGPS ? (hasAltitude ? 25 : 20) : 0,
    status: hasValidGPS ? 'pass' : 'fail',
    details: hasValidGPS 
      ? `GPS: ${metadata.cityName}${hasAltitude ? `, Alt: ${metadata.altitude.toFixed(1)}m` : ''}` 
      : 'No GPS data available',
  };
  factors.push(gpsFactor);
  
  // Factor 4: Light Analysis (25 points)
  let lightScore = 15; // Default for natural/unknown light
  let lightStatus: 'pass' | 'warning' | 'fail' = 'pass';
  let lightDetails = 'Natural lighting assumed';
  
  if (lightReadings && lightReadings.length > 0) {
    const hasFlicker = detectLightFlicker(lightReadings);
    if (hasFlicker) {
      lightScore = 25;
      lightStatus = 'pass';
      lightDetails = 'Mains frequency flicker detected (natural indoor lighting)';
    } else {
      const avgLight = lightReadings.reduce((a, b) => a + b, 0) / lightReadings.length;
      if (avgLight > 0.8) {
        lightScore = 20;
        lightDetails = 'Bright natural light detected';
      }
    }
  }
  
  const lightFactor: VerityFactor = {
    name: 'Light Analysis',
    score: lightScore,
    status: lightStatus,
    details: lightDetails,
  };
  factors.push(lightFactor);
  
  // Calculate total score
  const totalScore = Math.round(factors.reduce((acc, f) => acc + f.score, 0));
  
  // Determine level
  let level: VerityLevel;
  let badge: string;
  let badgeColor: string;
  let description: string;
  
  if (totalScore >= 95 && !metadata.isStationary && hapticResult.success) {
    level = 'PURE_RAW';
    badge = '★ Pure Raw';
    badgeColor = '#FFD700'; // Gold
    description = 'Perfect authenticity. Handheld, natural conditions.';
  } else if (totalScore >= 80) {
    level = 'VERIFIED';
    badge = '✓ Verified Authentic';
    badgeColor = '#4CAF50'; // Green
    description = 'High confidence in authenticity.';
  } else if (totalScore >= 60) {
    level = 'STUDIO';
    badge = '◎ Studio';
    badgeColor = '#2196F3'; // Blue
    description = 'Professional/stationary setup detected.';
  } else if (totalScore >= 40) {
    level = 'QUESTIONABLE';
    badge = '? Review';
    badgeColor = '#FF9800'; // Orange
    description = 'Some authenticity concerns.';
  } else {
    level = 'SUSPICIOUS';
    badge = '⚠ Suspicious';
    badgeColor = '#FF5252'; // Red
    description = 'Likely screen capture or manipulation.';
  }
  
  return {
    level,
    score: totalScore,
    factors,
    badge,
    badgeColor,
    description,
  };
};

// Get achievement for verity score
export const getVerityAchievement = (score: VerityScore): { title: string; icon: string } | null => {
  if (score.level === 'PURE_RAW') {
    return { title: 'Purist', icon: '🌟' };
  }
  if (score.factors.find(f => f.name === 'Light Analysis')?.score === 25) {
    return { title: 'Analog Eye', icon: '📻' };
  }
  if (score.score >= 90) {
    return { title: 'Truth Keeper', icon: '💎' };
  }
  return null;
};
