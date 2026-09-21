import { s as layout } from '../../src/components/ui';
import { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { VideoView } from 'expo-video';
import Slider from '@react-native-community/slider';
import { Pause, Play, RotateCcw, RotateCw, Check, ArrowUpRight } from 'lucide-react-native';
import { colors as c } from '@bastiat/design-tokens';
import { timeLabel } from '@bastiat/contracts';
import { getContent } from '../../src/services/api';
import { useLibrary } from '../../src/services/library';
import {
  usePlayer,
  playLesson,
  togglePlayback,
  seek,
  playbackSpeed,
  getVideo,
} from '../../src/services/player';
import {
  Artwork,
  BackBar,
  Eyebrow,
  Title,
  Txt,
  IconButton,
  SaveButton,
  Chips,
  Chip,
  Loading,
  ErrorView,
  Button,
  type,
} from '../../src/components/ui';
import { DownloadButton } from '../../src/components/download-button';
import { MotionPressable } from '../../src/components/motion';

export default function LessonScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const lib = useLibrary();
  const player = usePlayer();
  const [tab, setTab] = useState('transcript');
  const result = useQuery({
    queryKey: ['lesson', slug],
    queryFn: () => getContent('lesson', slug),
  });
  const lesson = result.data?.kind === 'lesson' ? result.data : null;
  const active = player.lesson?.slug === slug;
  const progress = lib.progress(slug);
  const position = active ? player.position : (progress?.value.positionSeconds ?? 0);
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
      <BackBar label="The Seen and the Unseen" />
      <ScrollView
        contentContainerStyle={[layout.page, { paddingHorizontal: 24, paddingBottom: 75 }]}
      >
        {result.error ? (
          <ErrorView
            message={result.error.message}
            retry={() => {
              void result.refetch();
            }}
          />
        ) : !lesson ? (
          <Loading />
        ) : (
          <>
            {active && lesson.format === 'video' && getVideo() ? (
              <VideoView
                player={getVideo()!}
                style={styles.art}
                nativeControls={false}
                contentFit="contain"
              />
            ) : (
              <Artwork uri={lesson.coverUrl} style={styles.art} />
            )}
            <View style={{ marginTop: 24 }}>
              <Eyebrow>
                LESSON {String(lesson.order).padStart(2, '0')} · {lesson.format}
              </Eyebrow>
              <View style={{ marginTop: 11, marginBottom: 12 }}>
                <Title small>{lesson.title}</Title>
              </View>
              <Txt style={styles.description}>{lesson.description}</Txt>
            </View>
            <Slider
              accessibilityLabel="Playback position"
              minimumValue={0}
              maximumValue={lesson.durationSeconds}
              value={position}
              disabled={!active}
              onSlidingComplete={(value) => {
                void seek(value);
              }}
              minimumTrackTintColor={c.copper}
              maximumTrackTintColor={c.border}
              thumbTintColor={c.copper}
              style={{ height: 35, marginTop: 24 }}
            />
            <View style={styles.times}>
              <Txt style={styles.time}>{timeLabel(position)}</Txt>
              <Txt style={styles.time}>{timeLabel(lesson.durationSeconds)}</Txt>
            </View>
            <View style={styles.controls}>
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel="Change playback speed"
                accessibilityState={{ disabled: !active }}
                disabled={!active}
                onPress={() => playbackSpeed(player.speed >= 2 ? 1 : player.speed + 0.25)}
                style={styles.speed}
              >
                <Txt style={{ fontSize: 12 }}>{active ? player.speed : 1}×</Txt>
              </MotionPressable>
              <IconButton
                label="Back 15 seconds"
                disabled={!active}
                onPress={() => {
                  void seek(position - 15);
                }}
              >
                <RotateCcw size={26} color={c.text} />
                <Txt style={styles.skipText}>15</Txt>
              </IconButton>
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel={active && player.playing ? 'Pause lesson' : 'Play lesson'}
                onPress={() =>
                  active && !player.error ? togglePlayback() : void playLesson(lesson)
                }
                style={styles.play}
              >
                {active && player.loading ? (
                  <ActivityIndicator color={c.background} />
                ) : active && player.playing ? (
                  <Pause size={30} color={c.background} fill={c.background} />
                ) : (
                  <Play size={30} color={c.background} fill={c.background} />
                )}
              </MotionPressable>
              <IconButton
                label="Forward 15 seconds"
                disabled={!active}
                onPress={() => {
                  void seek(position + 15);
                }}
              >
                <RotateCw size={26} color={c.text} />
                <Txt style={styles.skipText}>15</Txt>
              </IconButton>
              <SaveButton item={lesson} />
            </View>
            {active && player.error && (
              <Txt
                accessibilityRole="alert"
                style={{ color: c.danger, fontSize: 13, marginBottom: 15 }}
              >
                {player.error}
              </Txt>
            )}
            <View style={styles.narration}>
              <Txt style={{ fontSize: 11, color: c.muted }}>
                Synthetic narration{active && player.offline ? ' · Playing offline' : ''}
              </Txt>
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel={
                  progress?.value.completed ? 'Mark incomplete' : 'Mark lesson complete'
                }
                onPress={() => {
                  lib.saveProgress(lesson, position, !progress?.value.completed);
                  void lib.sync();
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 48 }}
              >
                <Check size={16} color={c.copper} />
                <Txt style={{ fontSize: 11, color: c.copper }}>
                  {progress?.value.completed ? 'Completed' : 'Mark complete'}
                </Txt>
              </MotionPressable>
            </View>
            <DownloadButton lesson={lesson} />
            {progress?.conflict && (
              <View style={styles.conflict}>
                <Title small>Where would you like to continue?</Title>
                <Txt style={styles.description}>
                  This device: {timeLabel(progress.value.positionSeconds)}. Other session:{' '}
                  {timeLabel(progress.conflict.positionSeconds)}.
                </Txt>
                <Button secondary onPress={() => lib.resolveConflict(slug, 'local')}>
                  Use this position
                </Button>
                <Button
                  secondary
                  onPress={() => {
                    const remote = progress.conflict!.positionSeconds;
                    lib.resolveConflict(slug, 'remote');
                    if (active) void seek(remote);
                  }}
                >
                  Use other position
                </Button>
              </View>
            )}
            <View style={{ marginTop: 28, marginBottom: 18 }}>
              <Chips>
                <Chip
                  label="Transcript"
                  selected={tab === 'transcript'}
                  onPress={() => setTab('transcript')}
                />
                <Chip
                  label="Further reading"
                  selected={tab === 'sources'}
                  onPress={() => setTab('sources')}
                />
              </Chips>
            </View>
            {tab === 'transcript' ? (
              lesson.transcript.split('\n\n').map((paragraph, index) => (
                <Txt key={index} selectable style={styles.paragraph}>
                  {paragraph}
                </Txt>
              ))
            ) : (
              <View>
                <Txt style={[styles.description, { marginBottom: 16 }]}>
                  Explore the original arguments and their context.
                </Txt>
                {lesson.sources.map((source) => (
                  <Pressable
                    key={source.url}
                    onPress={() => {
                      void Linking.openURL(source.url);
                    }}
                    style={styles.source}
                    accessibilityRole="link"
                  >
                    <Txt style={{ flex: 1, fontSize: 14, color: c.copper }}>{source.title}</Txt>
                    <ArrowUpRight size={19} color={c.copper} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  art: {
    width: '100%',
    aspectRatio: 1280 / 880,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: c.surface,
  },
  description: { color: c.muted, fontSize: 14, lineHeight: 23 },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontSize: 11, color: c.muted, fontVariant: ['tabular-nums'] },
  controls: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 18,
  },
  speed: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 5,
  },
  play: {
    width: 72,
    height: 72,
    borderRadius: 40,
    backgroundColor: c.copper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { position: 'absolute', fontSize: 9, lineHeight: 11, fontFamily: type.medium },
  narration: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: c.border,
    marginBottom: 15,
  },
  paragraph: { color: '#CBD2D0', fontSize: 16, lineHeight: 29, marginBottom: 22 },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  conflict: {
    borderWidth: 1,
    borderColor: c.copper,
    borderRadius: 8,
    padding: 20,
    gap: 14,
    marginTop: 24,
  },
});
