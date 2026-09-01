import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/* =========================================================
   LOCALIZED ARTICLE CONTENT

   Finnish and English are two language versions of the same
   article, not independent editorial content. Any substantive
   edit to title, intro, perspective, source wording or alt text
   must be reflected in both fi and en in the same change.

   Translation can be natural rather than word for word, but
   facts, examples, emphasis, argument and conclusion must stay
   aligned. See AGENTS.md for the repository-wide rule.
   ========================================================= */

const languagePost = z.object({
  title:
    z.string(),

  tags:
    z.array(
      z.string()
    ).min(1),

  intro:
    z.string(),

  metaDescription:
    z.string()
      .min(1)
      .max(180)
      .optional(),

  graphicAlt:
    z.string()
      .min(1)
      .optional(),

  perspective:
    z.array(
      z.string()
    ).min(1),
});

/* =========================================================
   LEGACY SINGLE SOURCE FORMAT
   ========================================================= */

const legacyLanguagePost =
  languagePost.extend({
    sourceName:
      z.string(),

    sourceLinkText:
      z.string(),

    sourceTitle:
      z.string(),
  });

const legacySourceFields = {
  sourceUrl:
    z.string().url(),

  fi:
    legacyLanguagePost,

  en:
    legacyLanguagePost,
};

/* =========================================================
   NEW MULTIPLE SOURCES FORMAT
   ========================================================= */

const localizedSource =
  z.object({
    name:
      z.string(),

    linkText:
      z.string(),

    title:
      z.string(),
  });

const source =
  z.object({
    url:
      z.string().url(),

    fi:
      localizedSource,

    en:
      localizedSource,
  });

const multipleSourceFields = {
  sources:
    z.array(
      source
    ).min(1),

  fi:
    languagePost,

  en:
    languagePost,
};

/* =========================================================
   COMMON FIELDS
   ========================================================= */

const commonFields = {
  graphic:
    z.string()
      .min(1)
      .optional(),

  interactiveGraphic:
    z.enum([
      'butterfly',
      'stormwater',
      'tree',
    ]).optional(),

  metaImage:
    z.string()
      .min(1)
      .optional(),
};

/* =========================================================
   POST SCHEMA

   During migration both source formats are accepted:
   - old sourceUrl + localized source fields
   - new sources array
   ========================================================= */

const postSchema =
  z.union([
    z.object({
      status:
        z.literal(
          'published'
        ),

      publishedAt:
        z.string()
          .datetime({
            offset: true,
          }),

      ...commonFields,
      ...legacySourceFields,
    }),

    z.object({
      status:
        z.literal(
          'draft'
        ),

      publishedAt:
        z.null(),

      ...commonFields,
      ...legacySourceFields,
    }),

    z.object({
      status:
        z.literal(
          'published'
        ),

      publishedAt:
        z.string()
          .datetime({
            offset: true,
          }),

      ...commonFields,
      ...multipleSourceFields,
    }),

    z.object({
      status:
        z.literal(
          'draft'
        ),

      publishedAt:
        z.null(),

      ...commonFields,
      ...multipleSourceFields,
    }),
  ])
    .superRefine(
      (
        post,
        context
      ) => {
        if (
          !post.graphic &&
          !post.interactiveGraphic
        ) {
          return;
        }

        if (
          !post.fi.graphicAlt
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              'fi',
              'graphicAlt',
            ],

            message:
              'graphicAlt is required when a graphic is set',
          });
        }

        if (
          !post.en.graphicAlt
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              'en',
              'graphicAlt',
            ],

            message:
              'graphicAlt is required when a graphic is set',
          });
        }
      }
    );

/* =========================================================
   COLLECTION
   ========================================================= */

const posts =
  defineCollection({
    loader:
      glob({
        pattern:
          '*.md',

        base:
          './src/content/posts',
      }),

    schema:
      postSchema,
  });

export const collections = {
  posts,
};
