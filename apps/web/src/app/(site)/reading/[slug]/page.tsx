import { ReadingView } from '@/components/views';
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ReadingView slug={(await params).slug} />;
}
