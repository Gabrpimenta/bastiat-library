import { getPayload } from 'payload';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './payload.config';
import type { Article, Course, Lesson } from './payload-types';

if (process.env.ALLOW_SEED !== 'true' || process.env.NODE_ENV === 'production')
  throw new Error('Seeding is allowed only in an explicitly enabled development database.');
const password = process.env.SEED_PASSWORD;
if (!password || password.length < 16)
  throw new Error('Set a local seed password of at least 16 characters.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
type Editorial = {
  course: {
    slug: string;
    title: string;
    description: string;
    introduction: string;
    topic: string;
    cover: Course['cover'];
  };
  lessons: {
    slug: string;
    title: string;
    description: string;
    format: Lesson['format'];
    cover: Lesson['cover'];
    paragraphs: string[];
  }[];
  articles: {
    slug: string;
    title: string;
    description: string;
    cover: Article['cover'];
    topic: string;
    readingMinutes: number;
    body: string;
  }[];
  sources: { title: string; url: string }[];
};
const editorial: Editorial = JSON.parse(
  await readFile(path.join(root, 'content/editorial.json'), 'utf8'),
);
const manifest: {
  slug: string;
  filename: string;
  sha256: string;
  durationSeconds: number;
  version: string;
}[] = JSON.parse(await readFile(path.join(root, 'content/media/manifest.json'), 'utf8'));
const payload = await getPayload({ config });

for (const account of [
  {
    email: process.env.SEED_ADMIN_EMAIL ?? 'editor@bastiat.local',
    name: 'Library editor',
    role: 'editor' as const,
  },
  {
    email: process.env.SEED_STUDENT_EMAIL ?? 'reader@bastiat.local',
    name: 'Alex Morgan',
    role: 'student' as const,
  },
  { email: 'second@bastiat.local', name: 'Sam Taylor', role: 'student' as const },
]) {
  if (
    !(
      await payload.find({
        collection: 'users',
        where: { email: { equals: account.email } },
        limit: 1,
      })
    ).totalDocs
  )
    await payload.create({
      collection: 'users',
      data: { ...account, password },
      overrideAccess: true,
    });
}
let author = (
  await payload.find({ collection: 'authors', where: { slug: { equals: 'library-editors' } } })
).docs[0];
author ??= await payload.create({
  collection: 'authors',
  data: {
    name: 'Bastiat Library',
    slug: 'library-editors',
    bio: 'Original editorial introductions to the ideas of Frédéric Bastiat. Synthetic narration is labeled in each lesson.',
  },
});
const topicIds = new Map<string, number>();
for (const [slug, name] of [
  ['economics', 'Economics of everyday life'],
  ['liberty', 'Liberty & responsibility'],
  ['exchange', 'Exchange & cooperation'],
]) {
  let topic = (await payload.find({ collection: 'topics', where: { slug: { equals: slug! } } }))
    .docs[0];
  topic ??= await payload.create({ collection: 'topics', data: { slug: slug!, name: name! } });
  topicIds.set(name!, topic.id);
}
const economics = topicIds.get(editorial.course.topic)!;
let course = (
  await payload.find({ collection: 'courses', where: { slug: { equals: editorial.course.slug } } })
).docs[0];
const courseData = {
  ...editorial.course,
  topic: economics,
  author: author.id,
  level: 'Beginner' as const,
  _status: 'published' as const,
};
course = course
  ? await payload.update({ collection: 'courses', id: course.id, data: courseData })
  : await payload.create({ collection: 'courses', data: courseData });
const lessonIds: number[] = [];
for (const [index, lesson] of editorial.lessons.entries()) {
  const asset = manifest.find((item) => item.slug === lesson.slug)!;
  let media = (
    await payload.find({ collection: 'media', where: { filename: { equals: asset.filename } } })
  ).docs[0];
  if (!media)
    media = await payload.create({
      collection: 'media',
      filePath: path.join(root, 'content/media', asset.filename),
      data: {
        alt: lesson.title,
        sha256: asset.sha256,
        assetVersion: asset.version,
        durationSeconds: asset.durationSeconds,
        license: 'CC BY 4.0 — original script, synthetic Kokoro narration, original artwork',
      },
    });
  const old = (
    await payload.find({ collection: 'lessons', where: { slug: { equals: lesson.slug } } })
  ).docs[0];
  const data = {
    title: lesson.title,
    slug: lesson.slug,
    description: lesson.description,
    cover: lesson.cover,
    format: lesson.format,
    topic: economics,
    author: author.id,
    course: course.id,
    order: index + 1,
    asset: media.id,
    transcript: lesson.paragraphs.join('\n\n'),
    sources: editorial.sources,
    _status: 'published' as const,
  };
  const result = old
    ? await payload.update({ collection: 'lessons', id: old.id, data })
    : await payload.create({ collection: 'lessons', data });
  lessonIds.push(result.id);
}
const articleIds: number[] = [];
for (const article of editorial.articles) {
  const old = (
    await payload.find({ collection: 'articles', where: { slug: { equals: article.slug } } })
  ).docs[0];
  const data = {
    ...article,
    author: author.id,
    topic: topicIds.get(article.topic)!,
    sources: editorial.sources,
    _status: 'published' as const,
  };
  const result = old
    ? await payload.update({ collection: 'articles', id: old.id, data })
    : await payload.create({ collection: 'articles', data });
  articleIds.push(result.id);
}
await payload.updateGlobal({
  slug: 'home',
  data: {
    featuredCourse: course.id,
    sections: [
      {
        title: 'A little perspective goes a long way',
        description: 'Short readings. Lasting questions.',
        items: articleIds.map((value) => ({ relationTo: 'articles' as const, value })),
      },
      {
        title: 'Make time for an idea',
        description: 'One lesson is all it takes to begin.',
        items: lessonIds.map((value) => ({ relationTo: 'lessons' as const, value })),
      },
    ],
  },
});
console.log(
  'Seed complete: one course, three media lessons, two readings, and three local accounts.',
);
await payload.destroy();
process.exit(0);
