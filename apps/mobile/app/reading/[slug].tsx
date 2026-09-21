import { ScrollView, View, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors as c } from '@bastiat/design-tokens';
import { getContent } from '../../src/services/api';
import {
  Artwork,
  BackBar,
  Title,
  Txt,
  Eyebrow,
  SaveButton,
  Loading,
  ErrorView,
  type,
} from '../../src/components/ui';

export default function ReadingScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const result = useQuery({
    queryKey: ['article', slug],
    queryFn: () => getContent('article', slug),
  });
  const article = result.data?.kind === 'article' ? result.data : null;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <BackBar label="Readings" />
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 5, paddingBottom: 160 }}>
        {result.error ? (
          <ErrorView
            message={result.error.message}
            retry={() => {
              void result.refetch();
            }}
          />
        ) : !article ? (
          <Loading />
        ) : (
          <>
            <Artwork uri={article.coverUrl} style={{ borderRadius: 8, marginBottom: 26 }} />
            <Eyebrow>{article.topic} · READING</Eyebrow>
            <View style={{ marginTop: 12 }}>
              <Title>{article.title}</Title>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: c.border,
                marginVertical: 18,
                paddingBottom: 8,
              }}
            >
              <Txt style={{ fontSize: 12, color: c.muted }}>
                {article.author} · {article.readingMinutes} min read
              </Txt>
              <SaveButton item={article} />
            </View>
            <Txt style={{ fontSize: 18, lineHeight: 30, color: c.copper, marginBottom: 24 }}>
              {article.description}
            </Txt>
            {article.body.split('\n\n').map((paragraph, index) => (
              <Txt
                key={index}
                style={{ fontFamily: type.display, fontSize: 17, lineHeight: 30, marginBottom: 22 }}
              >
                {paragraph}
              </Txt>
            ))}
            <View
              style={{ borderTopWidth: 1, borderTopColor: c.border, paddingTop: 25, marginTop: 10 }}
            >
              <Eyebrow>FURTHER READING</Eyebrow>
              {article.sources.map((source) => (
                <Pressable
                  key={source.url}
                  accessibilityRole="link"
                  onPress={() => {
                    void Linking.openURL(source.url);
                  }}
                  style={{ paddingVertical: 15 }}
                >
                  <Txt style={{ fontSize: 14, color: c.copper }}>{source.title} ↗</Txt>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
