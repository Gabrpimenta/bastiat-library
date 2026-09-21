import { useEffect, useState } from 'react';
import { View, AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Lora_400Regular, Lora_500Medium } from '@expo-google-fonts/lora';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { restoreSession } from '../src/services/session';
import { restoreDownloads } from '../src/services/downloads';
import { watchPlayerLifecycle } from '../src/services/player';
import { library } from '../src/services/library';
import { MiniPlayer } from '../src/components/mini-player';
import { useReducedMotion } from '../src/services/accessibility';

void SplashScreen.preventAutoHideAsync();
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    const online = !!state.isConnected && state.isInternetReachable !== false;
    setOnline(online);
    if (online) void library.sync();
  }),
);
export default function RootLayout() {
  const reducedMotion = useReducedMotion();
  const [fontsLoaded, fontError] = useFonts({
    Lora_400Regular,
    Lora_500Medium,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });
  const [ready, setReady] = useState(false);
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60000, retry: 1, networkMode: 'always' } },
      }),
  );
  useEffect(() => {
    void restoreSession().finally(() => setReady(true));
    const downloads = restoreDownloads();
    const player = watchPlayerLifecycle();
    const timer = setInterval(() => {
      void library.sync();
    }, 15000);
    const lifecycle = AppState.addEventListener('change', (next) => {
      if (next === 'active') void library.sync();
    });
    return () => {
      downloads.remove();
      player.remove();
      lifecycle.remove();
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if ((fontsLoaded || fontError) && ready) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError, ready]);
  if ((!fontsLoaded && !fontError) || !ready) return null;
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <View style={{ flex: 1, backgroundColor: '#0D171C' }}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0D171C' },
              animation: reducedMotion ? 'none' : 'default',
            }}
          />
          <MiniPlayer />
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
