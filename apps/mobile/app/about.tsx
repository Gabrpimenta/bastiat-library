import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors as c } from '@bastiat/design-tokens';
import { BackBar, Title, Txt, Eyebrow } from '../src/components/ui';

export default function AboutScreen() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <BackBar label="Profile" />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 160 }}>
        <Eyebrow>ABOUT & PRIVACY</Eyebrow>
        <View style={{ marginTop: 12, marginBottom: 25 }}>
          <Title>Ideas, with context.</Title>
        </View>
        {[
          [
            'An independent library',
            'A portfolio project by Gabriel Pimenta exploring the arguments of Frédéric Bastiat. This app is not affiliated with the Ayn Rand Institute or any publisher.',
          ],
          [
            'Original content',
            'Readings, lesson scripts and illustrations were created for this project and are released under CC BY 4.0. The lessons use synthetic narration. Source links point to further reading; the narration is not a historical recording.',
          ],
          [
            'Your data',
            'Guest progress and saved items stay on this device. Signed-in accounts store a name, email, password hash, sessions, lesson progress and saved items on the server. Session credentials are stored in the system’s secure storage. Downloads contain public media and remain after sign-out.',
          ],
          [
            'Offline use',
            'Downloaded lessons and cached text work without a connection. Progress waits on this device until you reconnect. If two sessions change the same lesson, you choose where to continue. Downloads run while the app is open and verify the file before it becomes available.',
          ],
          [
            'Privacy and controls',
            'There are no advertising or analytics SDKs. Operational logs support debugging without recording passwords or playback transcripts. Remove downloads in My library. Signing out revokes your server session and clears the account’s local study data; an internet connection is required. Ask the demo maintainer to delete the server account and its study records.',
          ],
          [
            'App permissions',
            'Audio can continue in the background. Video pauses when the app leaves the foreground. This app does not request microphone, camera or photo-library access.',
          ],
        ].map(([title, body]) => (
          <View key={title} style={{ marginBottom: 29 }}>
            <Title small>{title}</Title>
            <Txt style={{ color: c.muted, fontSize: 15, lineHeight: 26, marginTop: 12 }}>
              {body}
            </Txt>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
