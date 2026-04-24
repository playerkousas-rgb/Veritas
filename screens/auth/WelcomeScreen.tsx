import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../lib/types';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

const COLORS = {
  background: '#F5F5F5',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  paper: '#FAFAFA',
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={styles.patternDot} />
        ))}
      </View>

      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={styles.logoContainer}>
          <Ionicons name="camera" size={64} color={COLORS.ink} />
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
          </View>
        </View>
        <Text style={styles.title}>Veritas</Text>
        <Text style={styles.subtitle}>真境</Text>
        <Text style={styles.tagline}>Capture Truth. Share Reality.</Text>
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.accent} />
          <Text style={styles.featureText}>Hardware-Locked Authenticity</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="location-outline" size={24} color={COLORS.accent} />
          <Text style={styles.featureText}>GPS Verified Locations</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="people-outline" size={24} color={COLORS.accent} />
          <Text style={styles.featureText}>Real Connections</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.primaryButtonText}>Create Account</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 20,
    opacity: 0.05,
  },
  patternDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.ink,
    margin: 30,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 24,
    color: COLORS.pencil,
    letterSpacing: 16,
    marginTop: -8,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.pencil,
    letterSpacing: 1,
  },
  featuresContainer: {
    marginTop: 40,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.ink,
    marginLeft: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: COLORS.ink,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: COLORS.paper,
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.ink,
  },
  secondaryButtonText: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: COLORS.pencil,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default WelcomeScreen;
