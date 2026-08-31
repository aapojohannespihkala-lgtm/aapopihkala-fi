import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const languagePost = z.object({
  title: z.string(),
  tags: z.array(z.string()).min(1),
  intro: z.string(),
  sourceName: z.string(),
  sourceLinkText: z.string(),
  sourceTitle: z.string(),
  graphicAlt: z.string().optional(),
  perspective: z.array(z.string()).min(1)
});

const commonFields = {
  sourceUrl: z.string().url(),
  graphic: z.string().optional(),
  fi: languagePost,
  en: languagePost
};

const posts = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: './src/content/posts'
  }),

  schema: z.discriminatedUnion('status', [
    z.object({
      status: z.literal('published'),
      publishedAt: z.string().datetime({ offset: true }),
      ...commonFields
    }),

    z.object({
      status: z.literal('draft'),
      publishedAt: z.null(),
      ...commonFields
    })
  ])
});

export const collections = {
  posts
};
