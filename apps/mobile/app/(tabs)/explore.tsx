import { useEffect, useState } from 'react';
import { View, TextInput, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react-native';
import { colors as c } from '@bastiat/design-tokens';
import { getCatalog } from '../../src/services/api';
import {
  Header,
  Title,
  Txt,
  Eyebrow,
  Chips,
  Chip,
  ContentCard,
  Loading,
  ErrorView,
  Empty,
  type,
} from '../../src/components/ui';

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [kind, setKind] = useState('all');
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(timeout);
  }, [query]);
  const result = useInfiniteQuery({
    queryKey: ['catalog', debounced, kind],
    queryFn: ({ pageParam }) => getCatalog(debounced, kind, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <Header />
      <FlatList
        data={result.data?.pages.flatMap((page) => page.items) ?? []}
        keyExtractor={(item) => `${item.kind}:${item.slug}`}
        renderItem={({ item }) => <ContentCard item={item} />}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 110 }}
        onEndReached={() => {
          if (result.hasNextPage && !result.isFetchingNextPage) void result.fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        refreshing={result.isRefetching}
        onRefresh={() => {
          void result.refetch();
        }}
        ListHeaderComponent={
          <>
            <View style={styles.intro}>
              <Eyebrow>THE COLLECTION</Eyebrow>
              <Title>Follow a question.</Title>
              <Txt style={styles.description}>Good ideas begin with curiosity.</Txt>
            </View>
            <View style={styles.search}>
              <Search size={20} color={c.muted} />
              <TextInput
                accessibilityLabel="Search the library"
                placeholder="Search ideas, lessons, readings…"
                placeholderTextColor={c.muted}
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
            </View>
            <View style={{ marginVertical: 14 }}>
              <Chips>
                {[
                  ['all', 'All content'],
                  ['course', 'Courses'],
                  ['audio', 'Audio'],
                  ['video', 'Video'],
                  ['article', 'Readings'],
                ].map(([value, label]) => (
                  <Chip
                    key={value}
                    label={label!}
                    selected={kind === value}
                    onPress={() => setKind(value!)}
                  />
                ))}
              </Chips>
            </View>
          </>
        }
        ListEmptyComponent={
          result.error ? (
            <ErrorView
              message={result.error.message}
              retry={() => {
                void result.refetch();
              }}
            />
          ) : result.isPending ? (
            <Loading />
          ) : (
            <Empty
              title="A different question?"
              description="Try another word or a different format to find something new."
            />
          )
        }
        ListFooterComponent={result.isFetchingNextPage ? <Loading /> : null}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  intro: { paddingTop: 29, paddingBottom: 27, gap: 11 },
  description: { color: c.muted, fontSize: 14 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: c.text,
    fontFamily: type.body,
    fontSize: 14,
    minHeight: 53,
  },
});
