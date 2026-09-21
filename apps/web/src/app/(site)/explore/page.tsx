import { ExploreView } from '@/components/views';
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <ExploreView initialQuery={q ?? ''} />;
}
