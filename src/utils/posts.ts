import {
  getCollection,
  type CollectionEntry,
} from 'astro:content';

export type PublishedPost =
  CollectionEntry<'posts'> & {
    data: CollectionEntry<'posts'>['data'] & {
      status: 'published';
      publishedAt: string;
    };
  };

export const getPostSlug = (
  id: string
) => {
  return id.replace(
    /^\d{4}-\d{2}-\d{2}-/,
    ''
  );
};

const isPublishedPost = (
  post: CollectionEntry<'posts'>
): post is PublishedPost => {
  return (
    post.data.status === 'published' &&
    typeof post.data.publishedAt === 'string'
  );
};

export const getPublishedPosts =
  async (): Promise<PublishedPost[]> => {
    const posts =
      await getCollection('posts');

    return posts
      .filter(isPublishedPost)
      .sort(
        (a, b) =>
          new Date(
            b.data.publishedAt
          ).getTime() -
          new Date(
            a.data.publishedAt
          ).getTime()
      );
  };
