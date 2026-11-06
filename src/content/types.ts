/**
 * Story content format — version 1.
 *
 * These types describe the JSON files inside a story package (see docs/STORY_FORMAT.md).
 * They are the single source of truth for bundled and imported stories alike.
 *
 * Extensibility rules:
 *  - New optional fields may be added at any time without bumping `formatVersion`.
 *  - Unknown fields are ignored by the app (forward compatible).
 *  - A breaking change bumps `formatVersion`; the importer keeps reading older versions.
 */

export const CURRENT_FORMAT_VERSION = 1;
export const SUPPORTED_FORMAT_VERSIONS = [1] as const;

/** Text in Swedish with an English rendering. */
export interface Bilingual {
  sv: string;
  en: string;
}

export type Cefr = 'A1' | 'A1-A2' | 'A2' | 'A2-B1' | 'B1' | 'B1-B2' | 'B2';

/** 1 = very beginner … 4 = intermediate. Drives sorting and the "current level" statistic. */
export type Difficulty = 1 | 2 | 3 | 4;

export type PageLayout = 'hero' | 'full' | 'inset' | 'portrait' | 'timeline' | 'map' | 'text';

/** Relative path inside the package (e.g. "images/page-01.svg") or a data: URI (JSON packages). */
export type AssetPath = string;

export interface StoryImage {
  src: AssetPath;
  /** Accessibility description (English). */
  alt: string;
  /** Optional caption shown under maps/diagrams. */
  caption?: Bilingual;
  /** width / height. Defaults to 4/3. */
  aspect?: number;
}

export interface TimelineEntry {
  /** Display label for the time, e.g. "793", "1500-talet", "idag". */
  when: string;
  /** Short Swedish label. */
  label: string;
}

/** Whether a page presents historical fact, cultural information or fiction. */
export type ContentKind = 'history' | 'culture' | 'fiction';

export interface FactBox {
  kind: 'fact' | 'fiction' | 'tip';
  text: Bilingual;
}

export interface StoryPage {
  /** Stable ID, unique within the story (progress and bookmarks refer to it). */
  id: string;
  layout?: PageLayout;
  image?: StoryImage;
  /** Swedish paragraphs. Keep pages short: ~40–100 words. */
  paragraphs: string[];
  /** Optional heading shown above the text. */
  heading?: string;
  timeline?: TimelineEntry[];
  factBox?: FactBox;
  kind?: ContentKind;
  /** Optional English summary for the "help" toggle. */
  summaryEn?: string;
}

export interface StoryChapter {
  id: string;
  title: Bilingual;
  pages: StoryPage[];
}

export interface StoryTheme {
  /** Accent colour (hex) used for progress bars and chapter marks. */
  accent?: string;
  /** Background tint of the book cover card. */
  coverTint?: string;
}

export interface StoryManifest {
  formatVersion: number;
  id: string;
  /** Content version of this story (semver-ish), used when re-importing. */
  version: string;
  language: 'sv';
  title: Bilingual;
  description: Bilingual;
  level: {
    cefr: Cefr;
    difficulty: Difficulty;
  };
  estimatedReadingMinutes: number;
  author: string;
  cover: StoryImage;
  theme?: StoryTheme;
  tags?: string[];
  /** Note about historical accuracy vs fiction, shown on the book page. */
  accuracyNote?: Bilingual;
  chapters: StoryChapter[];
  /** Relative file paths (zip) — or inline content (single-JSON packages). */
  vocabulary?: string | VocabularyFile;
  quiz?: string | QuizFile;
  exercises?: (string | ExerciseSetFile)[];
  createdAt?: string;
}

/* ------------------------------------------------------------------ */
/* Vocabulary                                                          */
/* ------------------------------------------------------------------ */

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'numeral'
  | 'interjection'
  | 'determiner'
  | 'proper-noun'
  | 'particle'
  | 'phrase';

export interface NounForms {
  indefSg?: string;
  defSg?: string;
  indefPl?: string;
  defPl?: string;
}
export interface VerbForms {
  infinitive?: string;
  present?: string;
  past?: string;
  supine?: string;
  imperative?: string;
}
export interface AdjectiveForms {
  common?: string;
  neuter?: string;
  plural?: string;
  comparative?: string;
  superlative?: string;
}
export type WordForms = NounForms & VerbForms & AdjectiveForms & { other?: string[] };

export interface DictionaryEntry {
  lemma: string;
  pos: PartOfSpeech;
  /** English translation of the lemma, e.g. "forest" or "to go". */
  en: string;
  /** Optional English plural (nouns) when not regular (child → children). */
  enPlural?: string;
  /** Optional English past / past participle (verbs). */
  enPast?: string;
  enParticiple?: string;
  gender?: 'en' | 'ett';
  forms?: WordForms;
  example?: Bilingual;
  note?: string;
  /** Marks words the story wants to highlight as key vocabulary. */
  key?: boolean;
}

export interface VocabularyFile {
  formatVersion: number;
  entries: DictionaryEntry[];
}

/* ------------------------------------------------------------------ */
/* Exercises (shared by grammar topics, story exercises and quizzes)   */
/* ------------------------------------------------------------------ */

interface ExerciseBase {
  id: string;
  /** Instruction in English, e.g. "Choose the correct form". */
  prompt: string;
  /** Why the correct answer is correct (simple English). */
  explanation: string;
  hint?: string;
  /** 1 (easy) … 3 (harder). */
  difficulty?: 1 | 2 | 3;
}

export interface ChoiceExercise extends ExerciseBase {
  type: 'choice';
  /** Optional Swedish sentence or question shown prominently. Use ___ for a gap. */
  sentence?: string;
  options: string[];
  /** Index into options. */
  answer: number;
  /** Optional per-option explanation for wrong choices (key = option index). */
  wrong?: Record<string, string>;
}

export interface FillExercise extends ExerciseBase {
  type: 'fill';
  /** Sentence with exactly one ___ gap. */
  sentence: string;
  /** Accepted answers (first one is canonical). */
  answers: string[];
  /** Optional English translation of the full sentence. */
  translation?: string;
}

export interface OrderExercise extends ExerciseBase {
  type: 'order';
  /** Words in the correct order. Punctuation is added automatically if `end` is set. */
  words: string[];
  /** Alternative correct orders. */
  alternatives?: string[][];
  end?: '.' | '?' | '!';
  translation?: string;
}

export interface MatchExercise extends ExerciseBase {
  type: 'match';
  pairs: [string, string][];
}

export interface CorrectExercise extends ExerciseBase {
  type: 'correct';
  /** The incorrect sentence. */
  incorrect: string;
  /** Choices: corrected versions (one right). */
  options: string[];
  answer: number;
  wrong?: Record<string, string>;
}

export interface TrueFalseExercise extends ExerciseBase {
  type: 'truefalse';
  statement: string;
  answer: boolean;
}

/** Tap the word in a sentence that matches the prompt (e.g. "Tap the word meaning 'forest'"). */
export interface IdentifyExercise extends ExerciseBase {
  type: 'identify';
  sentence: string;
  /** The exact word (as written in the sentence) that must be tapped. */
  target: string;
  translation?: string;
}

export type Exercise =
  | ChoiceExercise
  | IdentifyExercise
  | FillExercise
  | OrderExercise
  | MatchExercise
  | CorrectExercise
  | TrueFalseExercise;

export type ExerciseType = Exercise['type'];

export interface ExerciseSetFile {
  formatVersion: number;
  id: string;
  title: Bilingual;
  /** Optional link to a built-in grammar topic (e.g. "nouns-plural"). */
  grammarTopic?: string;
  explanation?: string;
  exercises: Exercise[];
}

/* ------------------------------------------------------------------ */
/* Quiz                                                                */
/* ------------------------------------------------------------------ */

export type QuizCategory = 'comprehension' | 'history' | 'culture' | 'vocabulary';

export type QuizQuestion = (ChoiceExercise | TrueFalseExercise) & {
  category: QuizCategory;
  /** The relevant Swedish information (usually a sentence from the story). */
  swedish?: string;
  /** Story page where the answer is introduced. */
  pageId?: string;
};

export interface QuizFile {
  formatVersion: number;
  questions: QuizQuestion[];
}

/* ------------------------------------------------------------------ */
/* Runtime (resolved) story                                            */
/* ------------------------------------------------------------------ */

export type StorySource = 'bundled' | 'imported';

/** A resolved asset the UI can render. */
export type AssetSource =
  | { kind: 'svg-xml'; xml: string }
  | { kind: 'bitmap'; uri: string }
  | { kind: 'missing'; path: string };

export interface FlatPage extends StoryPage {
  index: number;
  chapterId: string;
  chapterIndex: number;
  /** 1-based page number within the whole story. */
  number: number;
}

export interface Story {
  manifest: StoryManifest;
  source: StorySource;
  pages: FlatPage[];
  vocabulary: DictionaryEntry[];
  quiz: QuizQuestion[];
  exerciseSets: ExerciseSetFile[];
  resolveAsset: (path: AssetPath) => AssetSource;
}
