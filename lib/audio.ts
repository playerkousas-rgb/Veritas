// Veritas Sonic Identity - Audio System
// Note: In production, these would be actual .mp3/.wav files
// For this demo, we simulate the audio system structure

export type SoundType = 
  | 'shutter_mechanical'    // Leica M-style mechanical shutter
  | 'shutter_soft'          // Softer alternative
  | 'darkroom_water'        // Water dripping/flowing
  | 'darkroom_paper'        // Photo paper in chemicals
  | 'darkroom_fan'          // Ventilation fan
  | 'polaroid_eject'        // Polaroid eject mechanism
  | 'film_wind'             // Film advance lever
  | 'achievement_unlock'    // Success sound
  | 'verity_pure_raw';      // Pure Raw badge sound

// Audio configuration with descriptions for actual assets
export const AUDIO_ASSETS: Record<SoundType, {
  description: string;
  duration: number;
  volume: number;
  haptic: boolean;
}> = {
  shutter_mechanical: {
    description: 'Leica M6 mechanical shutter - crisp metallic click with gear winding aftermath',
    duration: 0.8,
    volume: 0.9,
    haptic: true,
  },
  shutter_soft: {
    description: 'Soft leaf shutter - gentle whisper',
    duration: 0.3,
    volume: 0.6,
    haptic: true,
  },
  darkroom_water: {
    description: 'Water trickling in darkroom sink - continuous ambient',
    duration: 15.0,
    volume: 0.2,
    haptic: false,
  },
  darkroom_paper: {
    description: 'Photo paper being agitated in developer tray - sloshing sound',
    duration: 3.0,
    volume: 0.3,
    haptic: false,
  },
  darkroom_fan: {
    description: 'Safelight ventilation - low frequency hum',
    duration: 10.0,
    volume: 0.15,
    haptic: false,
  },
  polaroid_eject: {
    description: 'Polaroid SX-70 eject mechanism - motor whir and pop',
    duration: 1.2,
    volume: 0.7,
    haptic: true,
  },
  film_wind: {
    description: 'Film advance lever - satisfying ratchet click',
    duration: 0.4,
    volume: 0.5,
    haptic: true,
  },
  achievement_unlock: {
    description: 'Glass chime with analog synth undertone',
    duration: 2.0,
    volume: 0.8,
    haptic: true,
  },
  verity_pure_raw: {
    description: 'Golden shimmer with camera shutter harmony',
    duration: 1.5,
    volume: 0.85,
    haptic: true,
  },
};

// Mock audio player (in production, use expo-av)
class AudioManager {
  private enabled: boolean = true;
  private volume: number = 1.0;

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  async play(sound: SoundType): Promise<void> {
    if (!this.enabled) return;
    
    const config = AUDIO_ASSETS[sound];
    console.log(`[Audio] Playing: ${config.description} (${config.duration}s)`);
    
    // In production:
    // const { sound: audio } = await Audio.Sound.createAsync(
    //   require(`../assets/audio/${sound}.mp3`),
    //   { volume: config.volume * this.volume }
    // );
    // await audio.playAsync();
  }

  async playShutter(): Promise<void> {
    await this.play('shutter_mechanical');
  }

  async playDarkroomAmbience(): Promise<void> {
    // Loop water + paper sounds
    await this.play('darkroom_water');
    setTimeout(() => this.play('darkroom_paper'), 2000);
  }

  async stopDarkroomAmbience(): Promise<void> {
    // Stop all darkroom sounds
    console.log('[Audio] Stopping darkroom ambience');
  }

  async playPolaroidEject(): Promise<void> {
    await this.play('polaroid_eject');
  }

  async playPureRawAchievement(): Promise<void> {
    await this.play('verity_pure_raw');
    setTimeout(() => this.play('achievement_unlock'), 500);
  }
}

export const audioManager = new AudioManager();

// Sound presets for different scenarios
export const SOUND_PRESETS = {
  CAPTURE_SEQUENCE: [
    'film_wind',
    'shutter_mechanical',
  ] as SoundType[],
  
  DARKROOM_SEQUENCE: [
    'darkroom_fan',
    'darkroom_water',
    'darkroom_paper',
  ] as SoundType[],
  
  PURE_RAW_REWARD: [
    'verity_pure_raw',
    'achievement_unlock',
  ] as SoundType[],
};
