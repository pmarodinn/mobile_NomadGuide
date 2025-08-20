import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';

export default function App() {
  const [screen, setScreen] = useState('welcome');

  const handleNavigate = (target) => setScreen(target);
  const handleAuthSuccess = () => {
    setScreen('dashboard');
  };
  const handleBack = () => setScreen('welcome');

  let Current = null;
  if (screen === 'welcome') Current = <WelcomeScreen onNavigate={handleNavigate} />;
  if (screen === 'login') Current = <LoginScreen onBack={handleBack} onSuccess={handleAuthSuccess} onNavigate={handleNavigate} />;
  if (screen === 'register') Current = <RegisterScreen onBack={handleBack} onNavigate={handleNavigate} />;
  if (screen === 'dashboard') Current = <DashboardScreen />;
  if (screen === 'forgot') Current = <ForgotPasswordScreen onBack={handleBack} onNavigate={handleNavigate} />;

  return (
    <View style={{ flex: 1 }}>
      {Current}
      <StatusBar style="dark" />
    </View>
  );
}
