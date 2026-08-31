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
  graphicAlt: z.string().min(1).optional(),
  perspective: z.array(z.string()).min(1),
});

const commonFields = {
  sourceUrl: z.string().url(),
  graphic: z.string().min(1).optional(),
  fi: languagePost,
  en: languagePost,
};

const postSchema = z
  .discriminatedUnion('status', [
    z.object({
      status: z.literal('published'),
      publishedAt: z
        .string()
        .datetime({
          offset: true,
        }),
      ...commonFields,
    }),

    z.object({
      status: z.literal('draft'),
      publishedAt: z.null(),
      ...commonFields,
    }),
  ])
  .superRefine(
    (post, context) => {
      if (!post.graphic) {
        return;
      }

      if (!post.fi.graphicAlt) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            'fi',
            'graphicAlt',
          ],
          message:
            'graphicAlt is required when graphic is set',
        });
      }

      if (!post.en.graphicAlt) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            'en',
            'graphicAlt',
          ],
          message:
            'graphicAlt is required when graphic is set',
        });
      }
    }
  );

const posts = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: './src/content/posts',
  }),

  schema: postSchema,
});

export const collections = {
  posts,
};
