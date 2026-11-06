import type { DictionaryEntry, ExerciseSetFile, QuizQuestion, StoryManifest } from '../types';

/** A story compiled into the app bundle by scripts/build-content.ts. */
export interface BundledStory {
  manifest: StoryManifest;
  vocabulary: DictionaryEntry[];
  quiz: QuizQuestion[];
  exerciseSets: ExerciseSetFile[];
  /** Package path → inline SVG markup. */
  assets: Record<string, string>;
}
