import { getPayload, type Where } from 'payload';
import config from '@payload-config';
import type {
  Article as CMSArticle,
  Course as CMSCourse,
  Lesson as CMSLesson,
  Media,
  Author,
  Topic,
} from '../payload-types';
import {
  articleSchema,
  courseSchema,
  lessonSchema,
  type Article,
  type Course,
  type Lesson,
  type Content,
  type Home,
} from '@bastiat/contracts';

export const cms = () => getPayload({ config });
type Named = Author | Topic | number;
const name = (value: Named) => (typeof value === 'object' ? value.name : '');
const id = (value: { id: number } | number) => (typeof value === 'object' ? value.id : value);
const shared = (doc: CMSArticle | CMSCourse | CMSLesson, origin: string) => ({
  slug: doc.slug,
  title: doc.title,
  description: doc.description,
  author: name(doc.author),
  topic: name(doc.topic),
  coverUrl: `${origin}/artwork/${doc.cover}.webp`,
});

export function lessonDTO(doc: CMSLesson, origin: string): Lesson | null {
  const asset = doc.asset;
  const course = doc.course;
  if (
    typeof asset !== 'object' ||
    typeof course !== 'object' ||
    course._status !== 'published' ||
    !asset.filename ||
    !asset.filesize
  )
    return null;
  const parsed = lessonSchema.safeParse({
    ...shared(doc, origin),
    kind: 'lesson',
    courseSlug: course.slug,
    order: doc.order,
    format: doc.format,
    durationSeconds: asset.durationSeconds,
    transcript: doc.transcript,
    sources: doc.sources ?? [],
    asset: {
      url: `${origin}/api/media/file/${encodeURIComponent(asset.filename)}`,
      mimeType: asset.mimeType,
      bytes: asset.filesize,
      sha256: asset.sha256,
      version: asset.assetVersion,
    },
  });
  return parsed.success ? parsed.data : null;
}

export async function courseDTO(doc: CMSCourse, origin: string): Promise<Course> {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: 'lessons',
    where: { course: { equals: doc.id } },
    sort: 'order',
    limit: 100,
    depth: 2,
    overrideAccess: false,
    user: null,
  });
  const lessons = docs
    .map((lesson) => lessonDTO(lesson, origin))
    .filter((lesson): lesson is Lesson => !!lesson);
  return courseSchema.parse({
    ...shared(doc, origin),
    kind: 'course',
    level: doc.level,
    introduction: doc.introduction,
    lessons,
    lessonCount: lessons.length,
    durationSeconds: lessons.reduce((sum, lesson) => sum + lesson.durationSeconds, 0),
  });
}

export function articleDTO(doc: CMSArticle, origin: string): Article {
  return articleSchema.parse({
    ...shared(doc, origin),
    kind: 'article',
    readingMinutes: doc.readingMinutes,
    body: doc.body,
    sources: doc.sources ?? [],
  });
}

export async function getContent(
  kind: string,
  slug: string,
  origin: string,
): Promise<Content | null> {
  const payload = await cms();
  const options = {
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
    overrideAccess: false as const,
    user: null,
  };
  if (kind === 'course') {
    const doc = (await payload.find({ ...options, collection: 'courses' })).docs[0];
    return doc ? courseDTO(doc, origin) : null;
  }
  if (kind === 'lesson') {
    const doc = (await payload.find({ ...options, collection: 'lessons' })).docs[0];
    return doc ? lessonDTO(doc, origin) : null;
  }
  if (kind === 'article') {
    const doc = (await payload.find({ ...options, collection: 'articles' })).docs[0];
    return doc ? articleDTO(doc, origin) : null;
  }
  return null;
}

export async function getCatalog(origin: string, query = '', kind = 'all', page = 1) {
  const payload = await cms();
  const where: Where = query
    ? {
        or: [
          { title: { contains: query } },
          { description: { contains: query } },
          { 'topic.name': { contains: query } },
        ],
      }
    : {};
  const lessonsWhere: Where = {
    and: [
      where,
      { 'course._status': { equals: 'published' } },
      ...(kind === 'all' ? [] : [{ format: { equals: kind } }]),
    ],
  };
  const groups = [
    { collection: 'courses' as const, enabled: kind === 'all' || kind === 'course', where },
    { collection: 'articles' as const, enabled: kind === 'all' || kind === 'article', where },
    {
      collection: 'lessons' as const,
      enabled: ['all', 'audio', 'video'].includes(kind),
      where: lessonsWhere,
    },
  ].filter((group) => group.enabled);
  const counts = await Promise.all(
    groups.map((group) =>
      payload.count({
        collection: group.collection,
        where: group.where,
        overrideAccess: false,
        user: null,
      }),
    ),
  );
  const pageSize = 12;
  const totalItems = counts.reduce((sum, count) => sum + count.totalDocs, 0);
  let offset = (page - 1) * pageSize;
  const items: Content[] = [];
  // Stable collection groups and slug ordering allow bounded database pagination,
  // including pages that straddle a collection boundary.
  for (const [index, group] of groups.entries()) {
    const count = counts[index]!.totalDocs;
    if (offset >= count) {
      offset -= count;
      continue;
    }
    const wanted = Math.min(pageSize - items.length, count - offset);
    const innerPage = Math.floor(offset / pageSize) + 1;
    const innerOffset = offset % pageSize;
    const options = {
      collection: group.collection,
      where: group.where,
      limit: pageSize,
      sort: 'slug',
      depth: 2,
      overrideAccess: false as const,
      user: null,
    };
    const first = await payload.find({ ...options, page: innerPage });
    const docs = first.docs.slice(innerOffset);
    if (docs.length < wanted)
      docs.push(...(await payload.find({ ...options, page: innerPage + 1 })).docs);
    for (const doc of docs.slice(0, wanted)) {
      const item =
        group.collection === 'courses'
          ? await courseDTO(doc as CMSCourse, origin)
          : group.collection === 'articles'
            ? articleDTO(doc as CMSArticle, origin)
            : lessonDTO(doc as CMSLesson, origin);
      if (item) items.push(item);
    }
    offset = 0;
    if (items.length >= pageSize) break;
  }
  return {
    version: 1 as const,
    items,
    page,
    totalPages: Math.ceil(totalItems / pageSize),
    totalItems,
  };
}

export async function getHome(origin: string): Promise<Home> {
  const payload = await cms();
  const home = await payload.findGlobal({
    slug: 'home',
    depth: 2,
    overrideAccess: false,
    user: null,
  });
  let featuredCourse: Course | null = null;
  if (typeof home.featuredCourse === 'object' && home.featuredCourse?._status === 'published')
    featuredCourse = await courseDTO(home.featuredCourse, origin);
  const sections = await Promise.all(
    (home.sections ?? []).map(async (section) => {
      const items = await Promise.all(
        (section.items ?? []).map(async (entry) => {
          if (typeof entry.value !== 'object' || entry.value._status !== 'published') return null;
          if (entry.relationTo === 'courses') return courseDTO(entry.value as CMSCourse, origin);
          if (entry.relationTo === 'articles') return articleDTO(entry.value as CMSArticle, origin);
          // Reload with the lesson's course and asset populated to the required depth.
          return getContent('lesson', entry.value.slug, origin);
        }),
      );
      return {
        title: section.title,
        description: section.description,
        items: items.filter((item): item is Content => !!item),
      };
    }),
  );
  return { version: 1, featuredCourse, sections };
}

export const relationID = id;
export type MediaDocument = Media;
