import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View, Text, StyleSheet } from 'react-native';

import { AuthAPI } from './lib/api';
import { RootStackParamList, AuthStackParamList, MainTabParamList } from './lib/types';

// Auth Screens
import WelcomeScreen from './screens/auth/WelcomeScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';

// Main Screens
import FeedScreen from './screens/FeedScreen';
import CameraScreen from './screens/CameraScreen';
import SearchScreen from './screens/SearchScreen';
import MessagesScreen from './screens/MessagesScreen';
import ProfileScreen from './screens/ProfileScreen';
import PreviewScreen from './screens/PreviewScreen';
import ChatScreen from './screens/ChatScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import FollowersScreen from './screens/FollowersScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import YearInReviewScreen from './screens/YearInReviewScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

const COLORS = {
  background: '#F5F5F5',
  ink: '#2F2F2F',
  pencil: '#A8A8A8',
  accent: '#8B7355',
  paper: '#FAFAFA',
};

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: COLORS.ink,
        tabBarInactiveTintColor: COLORS.pencil,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-outline';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Camera') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <MainTab.Screen name="Home" component={FeedScreen} />
      <MainTab.Screen name="Search" component={SearchScreen} />
      <MainTab.Screen 
        name="Camera" 
        component={PlaceholderScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Camera');
          },
        })}
      />
      <MainTab.Screen name="Messages" component={MessagesScreen} />
      <MainTab.Screen name="Profile" component={ProfileScreen} />
    </MainTab.Navigator>
  );
}

function PlaceholderScreen() {
  return null;
}

// Root Navigator with Auth State
function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const user = AuthAPI.getCurrentUser();
    setIsAuthenticated(!!user);
  }, []);

  if (isAuthenticated === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Veritas</Text>
        <Text style={styles.loadingSubtext}>真境</Text>
      </View>
    );
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      {!isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <RootStack.Screen name="MainTabs" component={MainTabs} />
          <RootStack.Screen 
            name="Camera" 
            component={CameraScreen}
            options={{ animation: 'slideFromBottom' }}
          />
          <RootStack.Screen 
            name="Preview" 
            component={PreviewScreen}
            options={{ animation: 'slideFromRight' }}
          />
          <RootStack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ animation: 'slideFromRight' }}
          />
          <RootStack.Screen 
            name="UserProfile" 
            component={UserProfileScreen}
            options={{ animation: 'slideFromRight' }}
          />
          <RootStack.Screen 
            name="Followers" 
            component={FollowersScreen}
            options={{ animation: 'slideFromRight' }}
          />
          <RootStack.Screen 
            name="Notifications" 
            component={NotificationsScreen}
            options={{ animation: 'slideFromRight' }}
          />
          <RootStack.Screen 
            name="YearInReview" 
            component={YearInReviewScreen}
            options={{ animation: 'slideFromRight' }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}

export default function App() {
  // Preload icon fonts for web - required for icons to display correctly
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Veritas</Text>
        <Text style={styles.loadingSubtext}>真境</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: 4,
  },
  loadingSubtext: {
    fontSize: 18,
    color: COLORS.pencil,
    letterSpacing: 12,
    marginTop: 8,
  },
});
