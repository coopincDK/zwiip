import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AppProvider } from '../src/context/AppContext';
import { SettingsProvider } from '../src/context/SettingsContext';
import { COLORS } from '../src/constants/theme';
import { I18nProvider } from '../src/i18n';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <I18nProvider>
      <SettingsProvider>
        <AppProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.background },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AppProvider>
      </SettingsProvider>
      </I18nProvider>
    </View>
  );
}
