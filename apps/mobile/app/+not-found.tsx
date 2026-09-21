import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title, Txt, Button, s } from '../src/components/ui';
export default function NotFound() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          s.page,
          { flexGrow: 1, padding: 24, paddingBottom: 120, justifyContent: 'center', gap: 24 },
        ]}
      >
        <Title>A page out of place.</Title>
        <Txt>This link does not point to a page in the library.</Txt>
        <Button onPress={() => router.replace('/(tabs)')}>Back to the library</Button>
      </ScrollView>
    </SafeAreaView>
  );
}
