/**
 * App Navigator - Main navigation setup
 * Handles navigation between all screens in the app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { 
  LandingScreen, 
  LoginScreen, 
  RegisterScreen, 
  TutorialScreen, 
  PathSelectionScreen,
  ParticipantHomeScreen,
  SurveyScreen,
  SurveyCompletedScreen,
  ResearcherDashboardScreen,
  CreateSurveyScreen,
  SurveyPreviewScreen,
} from '../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false, // We'll handle our own headers
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen 
          name="Landing" 
          component={LandingScreen}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
        />
        <Stack.Screen 
          name="Tutorial" 
          component={TutorialScreen}
        />
        <Stack.Screen 
          name="PathSelection" 
          component={PathSelectionScreen}
        />
        {/* Participant Flow Screens */}
        <Stack.Screen 
          name="ParticipantHome" 
          component={ParticipantHomeScreen}
        />
        <Stack.Screen 
          name="Survey" 
          component={SurveyScreen}
        />
        <Stack.Screen 
          name="SurveyCompleted" 
          component={SurveyCompletedScreen}
        />
        {/* Researcher Flow Screens */}
        <Stack.Screen 
          name="ResearcherDashboard" 
          component={ResearcherDashboardScreen}
        />
        <Stack.Screen 
          name="CreateSurvey" 
          component={CreateSurveyScreen}
        />
        <Stack.Screen 
          name="SurveyPreview" 
          component={SurveyPreviewScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

