import { useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Headphones, Play } from 'lucide-react-native';
import { colors as c } from '@bastiat/design-tokens';
import { durationLabel } from '@bastiat/contracts';
import { getHome, cacheContent } from '../../src/services/api';
import { useLibrary } from '../../src/services/library';
import {
  Artwork,
  ContentCard,
  Eyebrow,
  Header,
  Title,
  Txt,
  SectionHeading,
  Loading,
  ErrorView,
  openContent,
  type,
} from '../../src/components/ui';

export default function HomeScreen() {
  const { data, error, isRefetching, refetch } = useQuery({ queryKey: ['home'], queryFn: getHome });
  const lib = useLibrary();
  useEffect(() => {
    if (data?.featuredCourse) cacheContent(data.featuredCourse);
    data?.sections.forEach((section) => section.items.forEach(cacheContent));
  }, [data]);
  const progress = lib
    .entries()
    .filter((item) => !item.value.completed && item.value.positionSeconds > 0)
    .sort((a, b) => b.value.updatedAt.localeCompare(a.value.updatedAt))[0]?.value;
  const resume = data?.featuredCourse?.lessons.find(
    (lesson) => lesson.slug === progress?.lessonSlug,
  );
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <Header />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={c.copper}
          />
        }
      >
        {error ? (
          <ErrorView
            message={error.message}
            retry={() => {
              void refetch();
            }}
          />
        ) : !data ? (
          <Loading />
        ) : (
          <>
            <View style={styles.intro}>
              <Eyebrow>THE FRÉDÉRIC BASTIAT COLLECTION</Eyebrow>
              <Title>A little curiosity.{`\n`}A wider world.</Title>
            </View>
            {resume && progress && (
              <Pressable
                style={styles.continue}
                onPress={() => openContent(resume)}
                accessibilityRole="button"
                accessibilityLabel={`Continue ${resume.title}`}
              >
                <Play color={c.copper} size={22} />
                <View style={{ flex: 1 }}>
                  <Eyebrow>CONTINUE LEARNING</Eyebrow>
                  <Txt style={{ fontFamily: type.medium, fontSize: 15 }}>{resume.title}</Txt>
                  <Txt style={{ color: c.muted, fontSize: 11 }}>
                    {durationLabel(Math.max(0, resume.durationSeconds - progress.positionSeconds))}{' '}
                    remaining
                  </Txt>
                </View>
                <ArrowRight color={c.copper} size={19} />
              </Pressable>
            )}
            {data.featuredCourse && (
              <Pressable
                style={styles.hero}
                accessibilityRole="button"
                accessibilityLabel="Explore The Seen and the Unseen"
                onPress={() => openContent(data.featuredCourse!)}
              >
                <Artwork
                  uri={data.featuredCourse.coverUrl}
                  style={{ aspectRatio: undefined, height: 320 }}
                />
                <LinearGradient
                  colors={['transparent', '#0C1A21EE']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.heroCopy}>
                  <View style={styles.badge}>
                    <Txt style={styles.badgeText}>THE ESSENTIALS · COURSE 01</Txt>
                  </View>
                  <Txt style={styles.heroTitle}>The Seen{`\n`}and the Unseen</Txt>
                  <View style={styles.heroBottom}>
                    <View style={{ gap: 4 }}>
                      <Txt style={{ color: '#D2D6CE', fontSize: 12 }}>
                        {data.featuredCourse.lessonCount} lessons ·{' '}
                        {durationLabel(data.featuredCourse.durationSeconds)}
                      </Txt>
                      <Txt style={{ color: '#B2BFB9', fontSize: 11 }}>Look beyond the obvious.</Txt>
                    </View>
                    <View style={styles.heroArrow}>
                      <ArrowRight size={24} color={c.text} />
                    </View>
                  </View>
                </View>
              </Pressable>
            )}
            <View style={styles.note}>
              <Headphones size={16} color={c.copper} />
              <Txt style={styles.noteText}>A fresh perspective. One lesson at a time.</Txt>
            </View>
            {data.sections.map((section, index) => (
              <View style={styles.section} key={section.title}>
                <SectionHeading
                  title={section.title}
                  subtitle={section.description}
                  action={() => router.navigate('/(tabs)/explore')}
                />
                {index === 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 20 }}
                  >
                    {section.items.map((item) => (
                      <ContentCard key={item.slug} item={item} horizontal />
                    ))}
                  </ScrollView>
                ) : (
                  section.items.map((item) => <ContentCard key={item.slug} item={item} />)
                )}
              </View>
            ))}
            <View style={styles.quote}>
              <Txt style={styles.quoteText}>What does the first{`\n`}glance leave out?</Txt>
              <Eyebrow>AN INVITATION TO THINK FURTHER</Eyebrow>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  intro: { paddingHorizontal: 24, paddingTop: 26, paddingBottom: 23, gap: 10 },
  hero: {
    marginHorizontal: 22,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: c.border,
  },
  heroCopy: { position: 'absolute', left: 24, right: 24, bottom: 22 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#16282BCC',
    borderRadius: 3,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeText: { fontSize: 9, letterSpacing: 1.1, color: '#F0D5B5', lineHeight: 16 },
  heroTitle: { fontFamily: type.display, fontSize: 34, lineHeight: 42, letterSpacing: -0.8 },
  heroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  heroArrow: {
    width: 44,
    height: 44,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#BCBCAA90',
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    marginHorizontal: 24,
    paddingVertical: 19,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  noteText: { fontSize: 12, color: c.muted },
  section: { paddingHorizontal: 24, marginTop: 28 },
  continue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 8,
    padding: 17,
    marginHorizontal: 22,
    marginBottom: 24,
  },
  quote: {
    marginHorizontal: 24,
    marginTop: 14,
    padding: 25,
    gap: 15,
    backgroundColor: c.surface,
    borderLeftWidth: 2,
    borderLeftColor: c.copper,
  },
  quoteText: { fontFamily: type.display, fontSize: 27, lineHeight: 37 },
});
