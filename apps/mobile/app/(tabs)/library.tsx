import { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQueries } from '@tanstack/react-query';
import { Download, Trash2, RefreshCw } from 'lucide-react-native';
import { colors as c } from '@bastiat/design-tokens';
import { timeLabel } from '@bastiat/contracts';
import { useLibrary } from '../../src/services/library';
import { useSession } from '../../src/services/session';
import { useDownloads, removeDownload, queueDownload } from '../../src/services/downloads';
import { getContent } from '../../src/services/api';
import {
  Header,
  Title,
  Txt,
  Eyebrow,
  Chips,
  Chip,
  Empty,
  Artwork,
  IconButton,
  openContent,
  ContentCard,
  ProgressBar,
} from '../../src/components/ui';

export default function LibraryScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState(params.tab ?? 'progress');
  useEffect(() => {
    if (params.tab) setTab(params.tab);
  }, [params.tab]);
  const library = useLibrary();
  const user = useSession();
  const downloads = useDownloads();
  const targets =
    tab === 'saved'
      ? library.bookmarks().map((entry) => ({ kind: entry.targetKind, slug: entry.targetSlug }))
      : library.entries().map((entry) => ({ kind: 'lesson', slug: entry.value.lessonSlug }));
  const records = useQueries({
    queries: targets.map(({ kind, slug }) => ({
      queryKey: [kind, slug],
      queryFn: () => getContent(kind, slug),
    })),
  });
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 170 }}>
        <Eyebrow>YOUR COLLECTION</Eyebrow>
        <View style={{ marginTop: 9, marginBottom: 10 }}>
          <Title>My library</Title>
        </View>
        <Txt style={styles.muted}>A place for the ideas you want to keep.</Txt>
        <View style={{ marginVertical: 18 }}>
          <Chips>
            <Chip
              label="In progress"
              selected={tab === 'progress'}
              onPress={() => setTab('progress')}
            />
            <Chip label="Saved" selected={tab === 'saved'} onPress={() => setTab('saved')} />
            <Chip
              label="Downloads"
              selected={tab === 'downloads'}
              onPress={() => setTab('downloads')}
            />
          </Chips>
        </View>
        {!user && (
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.notice}>
            <Txt style={{ fontSize: 13, color: c.copper }}>
              Sign in to continue across devices →
            </Txt>
          </Pressable>
        )}
        {user && (
          <View style={styles.sync}>
            <Txt style={styles.muted}>
              {library.syncing
                ? 'Syncing your library…'
                : (library.syncError ?? 'Your progress is saved on this device.')}
            </Txt>
            <IconButton
              label="Sync library"
              onPress={() => {
                void library.sync();
              }}
            >
              <RefreshCw size={18} color={c.copper} />
            </IconButton>
          </View>
        )}
        {tab === 'downloads' ? (
          <>
            {downloads.length === 0 && (
              <Empty
                title="Take an idea with you."
                description="Download a lesson from its player to listen without an internet connection."
              />
            )}
            {downloads.map((item) => (
              <View key={item.lesson.slug} style={styles.download}>
                <Pressable
                  onPress={() => openContent(item.lesson)}
                  style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.lesson.title}`}
                >
                  <Artwork
                    uri={item.lesson.coverUrl}
                    style={{ width: 68, height: 76, aspectRatio: undefined, borderRadius: 5 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontSize: 16 }}>{item.lesson.title}</Txt>
                    <Txt style={styles.muted}>
                      {item.state === 'ready'
                        ? `Available offline · ${(item.received / 1024 / 1024).toFixed(1)} MB`
                        : item.state === 'downloading'
                          ? `Downloading · ${Math.round((item.received / item.lesson.asset.bytes) * 100)}%`
                          : item.state === 'failed'
                            ? item.error
                            : item.state.charAt(0).toUpperCase() + item.state.slice(1)}
                    </Txt>
                  </View>
                </Pressable>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}
                >
                  {['failed', 'cancelled'].includes(item.state) && (
                    <IconButton
                      label={`Retry download ${item.lesson.title}`}
                      onPress={() => queueDownload(item.lesson)}
                    >
                      <Download size={19} color={c.copper} />
                    </IconButton>
                  )}
                  <IconButton
                    label={`Remove download ${item.lesson.title}`}
                    onPress={() =>
                      Alert.alert(
                        'Remove download?',
                        'The lesson will still be available to stream.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => removeDownload(item.lesson.slug),
                          },
                        ],
                      )
                    }
                  >
                    <Trash2 size={18} color={c.muted} />
                  </IconButton>
                </View>
              </View>
            ))}
          </>
        ) : (
          <>
            {targets.length === 0 && (
              <Empty
                title={tab === 'saved' ? 'Keep what moves you.' : 'Your next idea awaits.'}
                description={
                  tab === 'saved'
                    ? 'Tap the bookmark on a course, reading or lesson. Find it here whenever you need it.'
                    : 'Start a lesson and your place will be waiting here.'
                }
              />
            )}
            {records.map((record, index) =>
              record.data ? (
                <View key={`${targets[index]!.kind}:${targets[index]!.slug}`}>
                  <ContentCard item={record.data} />
                  {tab === 'progress' && record.data.kind === 'lesson' && (
                    <View style={{ marginTop: -17, marginBottom: 30 }}>
                      <ProgressBar
                        value={
                          (library.progress(record.data.slug)?.value.positionSeconds ?? 0) /
                          record.data.durationSeconds
                        }
                      />
                      <Txt style={[styles.muted, { marginTop: 8 }]}>
                        {library.progress(record.data.slug)?.value.completed
                          ? 'Completed'
                          : `Resume at ${timeLabel(library.progress(record.data.slug)?.value.positionSeconds ?? 0)}`}
                      </Txt>
                    </View>
                  )}
                </View>
              ) : (
                <Txt key={targets[index]!.slug} style={styles.muted}>
                  {record.isError
                    ? 'This item is not available. Reconnect and try again.'
                    : 'Loading your collection…'}
                </Txt>
              ),
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  muted: { fontSize: 13, lineHeight: 21, color: c.muted },
  notice: { padding: 17, backgroundColor: c.surface, borderRadius: 6, marginBottom: 23 },
  sync: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  download: { borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: 15 },
});
