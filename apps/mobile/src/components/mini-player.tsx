import { View, Pressable, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pause, Play, X } from 'lucide-react-native';
import { colors as c } from '@bastiat/design-tokens';
import { usePlayer, togglePlayback, stopPlayer } from '../services/player';
import { Artwork, IconButton, ProgressBar, Txt, type } from './ui';

export function MiniPlayer() {
  const player = usePlayer();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  if (!player.lesson || pathname.startsWith('/lesson/')) return null;
  const inTabs = ['/', '/explore', '/library', '/profile'].includes(pathname);
  return (
    <View style={[styles.container, { bottom: insets.bottom + (inTabs ? 65 : 12) }]}>
      <View style={styles.row}>
        <Pressable
          style={styles.content}
          onPress={() =>
            router.push({ pathname: '/lesson/[slug]', params: { slug: player.lesson!.slug } })
          }
          accessibilityRole="button"
          accessibilityLabel={`Open player for ${player.lesson.title}`}
        >
          <Artwork
            uri={player.lesson.coverUrl}
            style={{ width: 45, height: 45, aspectRatio: 1, borderRadius: 4 }}
          />
          <View style={{ flex: 1 }}>
            <Txt style={styles.eyebrow}>{player.playing ? 'NOW PLAYING' : 'PAUSED'}</Txt>
            <Txt numberOfLines={1} style={styles.title}>
              {player.lesson.title}
            </Txt>
          </View>
        </Pressable>
        <IconButton
          label={player.playing ? 'Pause playback' : 'Resume playback'}
          onPress={togglePlayback}
        >
          {player.playing ? (
            <Pause color={c.copper} fill={c.copper} size={22} />
          ) : (
            <Play color={c.copper} fill={c.copper} size={22} />
          )}
        </IconButton>
        <IconButton label="Close player" onPress={stopPlayer}>
          <X size={18} color={c.muted} />
        </IconButton>
      </View>
      <ProgressBar value={player.position / player.duration} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: c.elevated,
    borderWidth: 1,
    borderColor: '#596B71',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 7px 14px rgba(0, 0, 0, 0.3)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 3,
  },
  content: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  eyebrow: { fontSize: 8, lineHeight: 13, letterSpacing: 1, color: c.copper },
  title: { fontSize: 13, lineHeight: 20, fontFamily: type.medium },
});
