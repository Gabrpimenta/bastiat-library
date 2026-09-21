import { LessonView } from '@/components/views';
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <LessonView slug={(await params).slug} />;
}
