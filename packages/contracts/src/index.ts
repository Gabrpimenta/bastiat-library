import { z } from 'zod';

export const apiVersion = 1;
export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const sourceSchema = z.object({ title: z.string(), url: z.url() });
export const assetSchema = z.object({
  url: z.url(),
  mimeType: z.enum(['audio/mpeg', 'video/mp4']),
  bytes: z.number().int().positive(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  version: z.string().min(1),
});
const contentFields = {
  slug: slugSchema,
  title: z.string(),
  description: z.string(),
  coverUrl: z.url(),
  topic: z.string(),
  author: z.string(),
};
export const lessonSchema = z.object({
  ...contentFields,
  kind: z.literal('lesson'),
  courseSlug: slugSchema,
  order: z.number().int().nonnegative(),
  format: z.enum(['audio', 'video']),
  durationSeconds: z.number().positive(),
  transcript: z.string(),
  asset: assetSchema,
  sources: z.array(sourceSchema),
});
export const courseSchema = z.object({
  ...contentFields,
  kind: z.literal('course'),
  level: z.enum(['Beginner', 'Intermediate']),
  durationSeconds: z.number().nonnegative(),
  lessonCount: z.number().int().nonnegative(),
  lessons: z.array(lessonSchema),
  introduction: z.string(),
});
export const articleSchema = z.object({
  ...contentFields,
  kind: z.literal('article'),
  readingMinutes: z.number().int().positive(),
  body: z.string(),
  sources: z.array(sourceSchema),
});
export const contentSchema = z.discriminatedUnion('kind', [
  courseSchema,
  lessonSchema,
  articleSchema,
]);
export const catalogSchema = z.object({
  version: z.literal(1),
  items: z.array(contentSchema),
  page: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  totalItems: z.number().int().nonnegative(),
});
export const homeSchema = z.object({
  version: z.literal(1),
  featuredCourse: courseSchema.nullable(),
  sections: z.array(
    z.object({ title: z.string(), description: z.string(), items: z.array(contentSchema) }),
  ),
});
export const progressSchema = z.object({
  lessonSlug: slugSchema,
  positionSeconds: z.number().finite().nonnegative(),
  completed: z.boolean(),
  assetVersion: z.string().min(1),
  revision: z.number().int().nonnegative(),
  updatedAt: z.iso.datetime(),
});
export const progressMutationSchema = z
  .object({
    operationId: z.uuid(),
    lessonSlug: slugSchema,
    positionSeconds: z
      .number()
      .finite()
      .nonnegative()
      .max(24 * 60 * 60),
    completed: z.boolean(),
    assetVersion: z.string().min(1).max(100),
    baseRevision: z.number().int().nonnegative(),
  })
  .strict();
export const progressResultSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('accepted'), progress: progressSchema }),
  z.object({ status: z.literal('conflict'), progress: progressSchema }),
]);
export const bookmarkSchema = z.object({
  targetSlug: slugSchema,
  targetKind: z.enum(['course', 'lesson', 'article']),
  saved: z.boolean(),
  updatedAt: z.iso.datetime(),
});
export const bookmarkMutationSchema = bookmarkSchema
  .omit({ updatedAt: true })
  .extend({ operationId: z.uuid() })
  .strict();
export const librarySchema = z.object({
  progress: z.array(progressSchema),
  bookmarks: z.array(bookmarkSchema),
});
export const userSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.email(),
  role: z.enum(['student', 'editor']),
});

export type Lesson = z.infer<typeof lessonSchema>;
export type Course = z.infer<typeof courseSchema>;
export type Article = z.infer<typeof articleSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type Home = z.infer<typeof homeSchema>;
export type Progress = z.infer<typeof progressSchema>;
export type ProgressMutation = z.infer<typeof progressMutationSchema>;
export type ProgressResult = z.infer<typeof progressResultSchema>;
export type Bookmark = z.infer<typeof bookmarkSchema>;
export type BookmarkMutation = z.infer<typeof bookmarkMutationSchema>;
export type Library = z.infer<typeof librarySchema>;
export type User = z.infer<typeof userSchema>;

export function durationLabel(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`;
}

export function timeLabel(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export function contentLabel(item: Content): string {
  if (item.kind === 'course')
    return `${item.lessonCount} lessons · ${durationLabel(item.durationSeconds)}`;
  if (item.kind === 'article') return `${item.readingMinutes} min read`;
  return `${item.format === 'audio' ? 'Audio lesson' : 'Video lesson'} · ${durationLabel(item.durationSeconds)}`;
}
