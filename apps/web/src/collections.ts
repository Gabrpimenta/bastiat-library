import type { Access, CollectionConfig, Field, GlobalConfig } from 'payload';

export const editor: Access = ({ req }) => req.user?.role === 'editor';
const published: Access = ({ req }) =>
  req.user?.role === 'editor' ? true : { _status: { equals: 'published' } };
const own: Access = ({ req }) => (req.user ? { owner: { equals: req.user.id } } : false);
const contentAccess = { read: published, create: editor, update: editor, delete: editor };
const slug: Field = {
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  validate: (value: unknown) =>
    (typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) ||
    'Use lowercase words separated by hyphens.',
};
const sourceFields: Field = {
  name: 'sources',
  type: 'array',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'url', type: 'text', required: true },
  ],
};
const shared: Field[] = [
  { name: 'title', type: 'text', required: true },
  slug,
  { name: 'description', type: 'textarea', required: true },
  { name: 'author', type: 'relationship', relationTo: 'authors', required: true },
  { name: 'topic', type: 'relationship', relationTo: 'topics', required: true },
  {
    name: 'cover',
    type: 'select',
    required: true,
    defaultValue: 'window',
    options: ['window', 'law', 'trade', 'choice'],
  },
];

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'name' },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
    useSessions: true,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    admin: ({ req }) => req.user?.role === 'editor',
    create: editor,
    read: ({ req }) =>
      req.user?.role === 'editor' ? true : req.user ? { id: { equals: req.user.id } } : false,
    update: ({ req }) =>
      req.user?.role === 'editor' ? true : req.user ? { id: { equals: req.user.id } } : false,
    delete: editor,
  },
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        // Use the same Payload request transaction as the account deletion.
        for (const collection of ['progress', 'bookmarks', 'sync-operations'] as const) {
          await req.payload.delete({
            collection,
            where: { owner: { equals: id } },
            overrideAccess: true,
            req,
          });
        }
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'student',
      options: ['student', 'editor'],
      saveToJWT: true,
      access: {
        create: ({ req }) => req.user?.role === 'editor',
        update: ({ req }) => req.user?.role === 'editor',
      },
    },
  ],
};
export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: { useAsTitle: 'name' },
  access: { read: () => true, create: editor, update: editor, delete: editor },
  fields: [{ name: 'name', type: 'text', required: true }, slug, { name: 'bio', type: 'textarea' }],
};
export const Topics: CollectionConfig = {
  slug: 'topics',
  admin: { useAsTitle: 'name' },
  access: { read: () => true, create: editor, update: editor, delete: editor },
  fields: [{ name: 'name', type: 'text', required: true }, slug],
};
export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',
    mimeTypes: ['audio/mpeg', 'video/mp4', 'image/png', 'image/jpeg', 'image/webp'],
  },
  access: { read: () => true, create: editor, update: editor, delete: editor },
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'sha256', type: 'text', required: true },
    { name: 'assetVersion', type: 'text', required: true, defaultValue: '1' },
    { name: 'durationSeconds', type: 'number', min: 0, required: true },
    { name: 'license', type: 'text', required: true },
  ],
};
export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: { useAsTitle: 'title' },
  versions: { drafts: true },
  access: contentAccess,
  fields: [
    ...shared,
    { name: 'introduction', type: 'textarea', required: true },
    {
      name: 'level',
      type: 'select',
      defaultValue: 'Beginner',
      required: true,
      options: ['Beginner', 'Intermediate'],
    },
  ],
};
export const Lessons: CollectionConfig = {
  slug: 'lessons',
  admin: { useAsTitle: 'title' },
  versions: { drafts: true },
  access: contentAccess,
  fields: [
    ...shared,
    { name: 'course', type: 'relationship', relationTo: 'courses', required: true, index: true },
    { name: 'order', type: 'number', required: true, min: 0 },
    { name: 'format', type: 'select', options: ['audio', 'video'], required: true },
    { name: 'asset', type: 'upload', relationTo: 'media', required: true },
    { name: 'transcript', type: 'textarea', required: true },
    sourceFields,
  ],
};
export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: { useAsTitle: 'title' },
  versions: { drafts: true },
  access: contentAccess,
  fields: [
    ...shared,
    { name: 'body', type: 'textarea', required: true },
    { name: 'readingMinutes', type: 'number', min: 1, required: true },
    sourceFields,
  ],
};
export const Progress: CollectionConfig = {
  slug: 'progress',
  admin: { group: 'Learning records', hidden: true },
  access: { read: own, create: () => false, update: () => false, delete: () => false },
  indexes: [{ fields: ['owner', 'lessonSlug'], unique: true }],
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'lessonSlug', type: 'text', required: true },
    { name: 'positionSeconds', type: 'number', required: true },
    { name: 'completed', type: 'checkbox', required: true, defaultValue: false },
    { name: 'assetVersion', type: 'text', required: true },
    { name: 'revision', type: 'number', required: true, defaultValue: 0 },
  ],
};
export const Bookmarks: CollectionConfig = {
  slug: 'bookmarks',
  admin: { group: 'Learning records', hidden: true },
  access: { read: own, create: () => false, update: () => false, delete: () => false },
  indexes: [{ fields: ['owner', 'targetKind', 'targetSlug'], unique: true }],
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'targetSlug', type: 'text', required: true },
    { name: 'targetKind', type: 'text', required: true },
    { name: 'saved', type: 'checkbox', required: true },
  ],
};
export const SyncOperations: CollectionConfig = {
  slug: 'sync-operations',
  admin: { hidden: true },
  access: { read: () => false, create: () => false, update: () => false, delete: () => false },
  indexes: [{ fields: ['owner', 'operationId'], unique: true }],
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true },
    { name: 'operationId', type: 'text', required: true },
    { name: 'fingerprint', type: 'text', required: true },
    { name: 'result', type: 'json', required: true },
  ],
};
export const Home: GlobalConfig = {
  slug: 'home',
  access: { read: () => true, update: editor },
  fields: [
    { name: 'featuredCourse', type: 'relationship', relationTo: 'courses' },
    {
      name: 'sections',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        {
          name: 'items',
          type: 'relationship',
          relationTo: ['courses', 'lessons', 'articles'],
          hasMany: true,
        },
      ],
    },
  ],
};
