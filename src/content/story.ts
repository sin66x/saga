import type { LoadedPackage } from '@/features/import/validate';
import type { AssetSource, FlatPage, Story, StoryManifest, StorySource } from './types';

/** Flattens chapters into a single page list with global indexes and page numbers. */
export function flattenPages(manifest: StoryManifest): FlatPage[] {
  const pages: FlatPage[] = [];
  manifest.chapters.forEach((chapter, chapterIndex) => {
    for (const page of chapter.pages) {
      pages.push({ ...page, index: pages.length, number: pages.length + 1, chapterId: chapter.id, chapterIndex });
    }
  });
  return pages;
}

export function makeStory(pkg: Omit<LoadedPackage, 'assets'>, source: StorySource, resolveAsset: (path: string) => AssetSource): Story {
  return {
    manifest: pkg.manifest,
    source,
    pages: flattenPages(pkg.manifest),
    vocabulary: pkg.vocabulary,
    quiz: pkg.quiz,
    exerciseSets: pkg.exerciseSets,
    resolveAsset,
  };
}

/** Index of the first page of each chapter. */
export function chapterStarts(story: Story): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of story.pages) if (out[p.chapterId] === undefined) out[p.chapterId] = p.index;
  return out;
}

export function storyWordCount(story: Story): number {
  return story.pages.reduce((n, p) => n + p.paragraphs.join(' ').split(/\s+/).filter(Boolean).length, 0);
}
