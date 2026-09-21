import { CourseView } from '@/components/views';
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <CourseView slug={(await params).slug} />;
}
