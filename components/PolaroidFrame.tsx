import React from 'react';
import { View, Image, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VeritasPhoto } from '../lib/types';
import OpticalWatermark from './OpticalWatermark';

const { width } = Dimensions.get('window');

interface PolaroidFrameProps {
  photo: VeritasPhoto;
  size?: 'small' | 'medium' | 'large';
  showHash?: boolean;
  onHashPress?: () => void;
}

const COLORS = {
  paper: '#FAFAFA',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  gold: '#FFD700',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF5252',
};

export const PolaroidFrame: React.FC<PolaroidFrameProps> = ({
  photo,
  size = 'medium',
  showHash = true,
  onHashPress,
}) => {
  const getDimensions = () => {
    switch (size) {
      case 'small':
        return { width: width * 0.4, padding: 8, fontSize: 8 };
      case 'large':
        return { width: width * 0.85, padding: 20, fontSize: 14 };
      default:
        return { width: width * 0.7, padding: 16, fontSize: 12 };
    }
  };

  const dims = getDimensions();
  const imageHeight = dims.width * 1.25; // 4:5 ratio

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatCoords = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
  };

  // Get verity badge info
  const getVerityBadge = () => {
    if (!photo.verityScore) return null;
    
    const { level, score } = photo.verityScore;
    let icon = 'shield';
    let color = COLORS.pencil;
    
    switch (level) {
      case 'PURE_RAW':
        icon = 'star';
        color = COLORS.gold;
        break;
      case 'VERIFIED':
        icon = 'shield-checkmark';
        color = COLORS.success;
        break;
      case 'STUDIO':
        icon = 'aperture';
        color = '#2196F3';
        break;
      case 'QUESTIONABLE':
        icon = 'help-circle';
        color = COLORS.warning;
        break;
      case 'SUSPICIOUS':
        icon = 'warning';
        color = COLORS.error;
        break;
    }
    
    return { icon, color, score };
  };

  const verityBadge = getVerityBadge();

  return (
    <View style={[styles.container, { width: dims.width, padding: dims.padding }]}>
      {/* Verity Badge (if available) */}
      {verityBadge && size !== 'small' && (
        <View style={[styles.verityBadge, { backgroundColor: `${verityBadge.color}15` }]}>
          <Ionicons name={verityBadge.icon as any} size={14} color={verityBadge.color} />
          <Text style={[styles.verityText, { color: verityBadge.color }]}>
            {verityBadge.score}
          </Text>
        </View>
      )}

      {/* Optical Anti-Fraud Watermark */}
      <View style={styles.watermarkContainer}>
        <Image
          source={{ uri: photo.uri }}
          style={[styles.image, { height: imageHeight }]}
          resizeMode="cover"
        />
        <OpticalWatermark photo={photo} size={size} />
      </View>
      
      {/* Humanity check indicator */}
      {photo.humanityCheck && size !== 'small' && (
        <View style={styles.humanityIndicator}>
          <Ionicons name="finger-print" size={12} color={COLORS.accent} />
          <Text style={styles.humanityText}>Humanity ✓</Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.infoRow}>
          <View style={styles.leftSection}>
            <Text style={[styles.timeText, { fontSize: dims.fontSize }]}>
              Time: {formatTime(photo.metadata.timestamp)}
            </Text>
            {photo.metadata.isStationary && (
              <View style={styles.warningBadge}>
                <Text style={styles.warningText}>⚠️ Stationary</Text>
              </View>
            )}
          </View>
          
          <View style={styles.centerSection}>
            <Text style={[styles.locationText, { fontSize: dims.fontSize * 0.9 }]} numberOfLines={1}>
              {photo.metadata.cityName}
            </Text>
            <Text style={[styles.coordsText, { fontSize: dims.fontSize * 0.75 }]}>
              {formatCoords(photo.metadata.latitude, photo.metadata.longitude)}
            </Text>
          </View>

          {showHash && (
            <TouchableOpacity onPress={onHashPress} style={styles.hashSection}>
              <Text style={[styles.hashText, { fontSize: dims.fontSize * 0.8 }]}>
                {photo.metadata.veritasHash}
              </Text>
              <View style={styles.qrPlaceholder}>
                <View style={styles.qrPattern} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.paper,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  watermarkContainer: {
    position: 'relative',
  },
  verityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  verityText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  image: {
    width: '100%',
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
  },
  humanityIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  humanityText: {
    fontSize: 10,
    color: COLORS.accent,
    marginLeft: 4,
    fontWeight: '600',
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flex: 1,
  },
  centerSection: {
    flex: 1.2,
    alignItems: 'center',
  },
  hashSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  timeText: {
    color: COLORS.ink,
    fontFamily: 'monospace',
    letterSpacing: -0.5,
  },
  locationText: {
    color: COLORS.ink,
    fontWeight: '600',
  },
  coordsText: {
    color: COLORS.pencil,
    marginTop: 2,
  },
  hashText: {
    color: COLORS.accent,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  qrPlaceholder: {
    width: 24,
    height: 24,
    marginTop: 4,
    backgroundColor: COLORS.ink,
    borderRadius: 2,
    padding: 2,
  },
  qrPattern: {
    flex: 1,
    backgroundColor: COLORS.paper,
    borderRadius: 1,
  },
  warningBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  warningText: {
    fontSize: 8,
    color: '#E65100',
  },
});

export default PolaroidFrame;
