import { ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Check, Headphones, Play } from 'lucide-react-native';
import { colors as c } from '@bastiat/design-tokens';
import { durationLabel, contentLabel } from '@bastiat/contracts';
import { getContent, cacheContent } from '../../src/services/api';
import { useLibrary } from '../../src/services/library';
import {
  Artwork,
  BackBar,
  Eyebrow,
  Title,
  Txt,
  Button,
  SaveButton,
  SectionHeading,
  ProgressBar,
  Loading,
  ErrorView,
  openContent,
  type,
} from '../../src/components/ui';

export default function CourseScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const lib = useLibrary();
  const result = useQuery({
    queryKey: ['course', slug],
    queryFn: () => getContent('course', slug),
  });
  const course = result.data?.kind === 'course' ? result.data : null;
  useEffect(() => {
    if (course) cacheContent(course);
  }, [course]);
  const completed =
    course?.lessons.filter((lesson) => lib.progress(lesson.slug)?.value.completed).length ?? 0;
  const next =
    course?.lessons.find((lesson) => !lib.progress(lesson.slug)?.value.completed) ??
    course?.lessons[0];
  const hasProgress = course?.lessons.some(
    (lesson) => (lib.progress(lesson.slug)?.value.positionSeconds ?? 0) > 0,
  );
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <BackBar />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 130 }}>
        {result.error ? (
          <ErrorView
            message={result.error.message}
            retry={() => {
              void result.refetch();
            }}
          />
        ) : !course ? (
          <Loading />
        ) : (
          <>
            <Artwork
              uri={course.coverUrl}
              style={{ borderRadius: 9, marginBottom: 26, aspectRatio: 1.45 }}
            />
            <Eyebrow>A GUIDED INTRODUCTION</Eyebrow>
            <View style={{ marginVertical: 13 }}>
              <Title>{course.title}</Title>
            </View>
            <Txt style={styles.description}>{course.description}</Txt>
            <Txt style={styles.meta}>
              {course.lessonCount} lessons · {durationLabel(course.durationSeconds)} ·{' '}
              {course.level}
            </Txt>
            <View
              style={{
                flexDirection: 'row',
                gap: 14,
                alignItems: 'center',
                marginTop: 23,
                marginBottom: 30,
              }}
            >
              <View style={{ flex: 1 }}>
                <Button disabled={!next} onPress={() => next && openContent(next)}>
                  {hasProgress ? 'Continue learning' : 'Start learning'}
                </Button>
              </View>
              <SaveButton item={course} />
            </View>
            <View style={styles.panel}>
              <View style={styles.panelHeading}>
                <Txt style={styles.panelTitle}>Your learning path</Txt>
                <Txt style={{ fontSize: 11, color: c.muted }}>
                  {completed}/{course.lessonCount}
                </Txt>
              </View>
              <ProgressBar value={course.lessonCount ? completed / course.lessonCount : 0} />
              {course.lessons.map((lesson, index) => (
                <Pressable
                  key={lesson.slug}
                  style={styles.lessonRow}
                  onPress={() => openContent(lesson)}
                  accessibilityRole="button"
                  accessibilityLabel={`Lesson ${index + 1}: ${lesson.title}`}
                >
                  <View style={{ width: 22 }}>
                    {lib.progress(lesson.slug)?.value.completed ? (
                      <Check color={c.copper} size={18} />
                    ) : (
                      <Txt style={{ fontSize: 12, color: c.copper }}>
                        {String(index + 1).padStart(2, '0')}
                      </Txt>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt style={{ fontFamily: type.medium, fontSize: 15 }}>{lesson.title}</Txt>
                    <Txt style={{ color: c.muted, fontSize: 11 }}>{contentLabel(lesson)}</Txt>
                  </View>
                  {lesson.format === 'audio' ? (
                    <Headphones size={19} color={c.muted} />
                  ) : (
                    <Play size={19} color={c.muted} />
                  )}
                </Pressable>
              ))}
            </View>
            <View style={{ marginTop: 27 }}>
              <SectionHeading title="A different way of looking" />
              {course.introduction.split('\n\n').map((paragraph) => (
                <Txt key={paragraph} style={[styles.description, { marginBottom: 18 }]}>
                  {paragraph}
                </Txt>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  description: { color: c.muted, fontSize: 15, lineHeight: 26 },
  meta: { color: c.muted, fontSize: 12, marginTop: 18 },
  panel: {
    backgroundColor: c.surface,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
  },
  panelHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 19,
  },
  panelTitle: { fontFamily: type.display, fontSize: 22, lineHeight: 30 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 21,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
});
