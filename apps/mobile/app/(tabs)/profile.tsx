import { useRef, useState } from 'react';
import {
  ScrollView,
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { UserRound, ArrowUpRight } from 'lucide-react-native';
import { colors as c } from '@bastiat/design-tokens';
import { useSession, signIn, signOut } from '../../src/services/session';
import { useLibrary } from '../../src/services/library';
import { stopPlayer } from '../../src/services/player';
import { Header, Eyebrow, Title, Txt, Button, type } from '../../src/components/ui';

export default function ProfileScreen() {
  const user = useSession();
  const library = useLibrary();
  const signedIn = user && !library.requiresAuthentication;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordInput = useRef<TextInput>(null);
  async function submit() {
    setBusy(true);
    setError(null);
    try {
      stopPlayer();
      await signIn(email, password);
      setPassword('');
    } catch {
      setError('We could not sign you in. Check your details and connection.');
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError(null);
    try {
      stopPlayer();
      await signOut();
    } catch {
      setError('Connect to the internet to securely sign out, then try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <Header />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ padding: 24, paddingBottom: 165 }}
        >
          <Eyebrow>YOUR SPACE</Eyebrow>
          <View style={{ marginTop: 9, marginBottom: 23 }}>
            <Title>{signedIn ? `Hello, ${user.name.split(' ')[0]}.` : 'Stay curious.'}</Title>
          </View>
          <View style={styles.avatar}>
            <UserRound size={34} color={c.copper} strokeWidth={1.25} />
          </View>
          {signedIn ? (
            <>
              <Txt style={{ fontSize: 20, marginTop: 20 }}>{user.name}</Txt>
              <Txt style={styles.description}>{user.email}</Txt>
              <View style={styles.panel}>
                <Title small>One library. Every device.</Title>
                <Txt style={styles.description}>
                  Your saved items and lesson progress sync with the web companion when you are
                  online.
                </Txt>
                <Txt style={styles.description}>
                  Downloads stay on this device. Signing out removes this account’s local progress
                  and saved items. Public downloads remain available.
                </Txt>
              </View>
              <Button
                secondary
                disabled={busy}
                onPress={() => {
                  void logout();
                }}
              >
                {busy ? 'Signing out…' : 'Sign out'}
              </Button>
            </>
          ) : (
            <>
              <Txt style={[styles.description, { marginVertical: 22 }]}>
                {library.requiresAuthentication
                  ? 'Your session expired. Sign in again to sync. Your progress is still saved on this device.'
                  : 'Sign in to save your place across devices. You can explore, listen and download without an account.'}
              </Txt>
              <Txt style={styles.label}>Email</Txt>
              <TextInput
                testID="email"
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordInput.current?.focus()}
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={c.muted}
              />
              <Txt style={styles.label}>Password</Txt>
              <TextInput
                ref={passwordInput}
                testID="password"
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoComplete="current-password"
                secureTextEntry
                returnKeyType="go"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                placeholder="Your password"
                placeholderTextColor={c.muted}
                onSubmitEditing={() => {
                  if (email && password && !busy) void submit();
                }}
              />
              <View style={{ marginTop: 10 }}>
                <Button
                  testID="sign-in"
                  disabled={busy || !email || !password}
                  onPress={() => {
                    void submit();
                  }}
                >
                  {busy ? 'Signing in…' : 'Sign in'}
                </Button>
              </View>
              <Txt style={[styles.description, { fontSize: 12, marginTop: 18 }]}>
                Accounts for this independent demo are provided by its maintainer. Guest progress
                stays separate when you sign in.
              </Txt>
            </>
          )}
          {error && (
            <Txt accessibilityRole="alert" style={{ color: c.danger, marginTop: 16 }}>
              {error}
            </Txt>
          )}
          <View style={{ marginTop: 34 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/about')}
              style={styles.link}
            >
              <Txt style={{ fontSize: 14 }}>About the library & privacy</Txt>
              <ArrowUpRight size={18} color={c.copper} />
            </Pressable>
            <Txt style={[styles.description, { fontSize: 11, marginTop: 20 }]}>
              BASTIAT LIBRARY · VERSION 0.1.0
            </Txt>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: { fontSize: 14, lineHeight: 24, color: c.muted, marginTop: 8 },
  label: { fontSize: 13, marginBottom: 8, marginTop: 14 },
  input: {
    minHeight: 54,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.controlBorder,
    color: c.text,
    fontFamily: type.body,
    fontSize: 15,
  },
  panel: { marginVertical: 28, padding: 21, backgroundColor: c.surface, borderRadius: 7 },
  link: {
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
