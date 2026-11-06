/**
 * Story package loading and validation.
 *
 * Used by (1) the in-app importer for ZIP / JSON packages, and (2) the content build
 * script that compiles the bundled stories – so both always agree on the format.
 * Pure TypeScript: no React Native imports.
 */
import {
  type DictionaryEntry,
  type Exercise,
  type ExerciseSetFile,
  type QuizQuestion,
  type StoryManifest,
  SUPPORTED_FORMAT_VERSIONS,
} from '@/content/types';

export interface ValidationIssue {
  level: 'error' | 'warning';
  /** File + JSON path, e.g. "story.json › chapters[0].pages[2].image". */
  where: string;
  message: string;
}

/** Abstract read access to the files of a package (zip entries, a folder, or a single JSON). */
export interface PackageReader {
  has(path: string): boolean;
  text(path: string): string;
  list(): string[];
}

export interface LoadedPackage {
  manifest: StoryManifest;
  vocabulary: DictionaryEntry[];
  quiz: QuizQuestion[];
  exerciseSets: ExerciseSetFile[];
  /** Asset paths referenced by the story (cover + page images). */
  assets: string[];
}

export interface LoadResult {
  pkg?: LoadedPackage;
  issues: ValidationIssue[];
}

export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
const LAYOUTS = ['hero', 'full', 'inset', 'portrait', 'timeline', 'map', 'text'];
const CEFR = ['A1', 'A1-A2', 'A2', 'A2-B1', 'B1', 'B1-B2', 'B2'];
const POS = [
  'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'numeral',
  'interjection', 'determiner', 'proper-noun', 'particle', 'phrase',
];
const QUIZ_CATEGORIES = ['comprehension', 'history', 'culture', 'vocabulary'];
export const STORY_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;
const MAX_WORDS_PER_PAGE = 160;

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Normalises a package path: strips "./" and leading slashes, uses forward slashes. */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.?\/+/, '');
}

export function loadStoryPackage(reader: PackageReader): LoadResult {
  const issues: ValidationIssue[] = [];
  const err = (where: string, message: string) => issues.push({ level: 'error', where, message });
  const warn = (where: string, message: string) => issues.push({ level: 'warning', where, message });

  if (!reader.has('story.json')) {
    err('package', 'story.json is missing. It must be at the root of the package.');
    return { issues };
  }
  const raw = parseJson(reader, 'story.json', err);
  if (!isObj(raw)) return { issues };

  // --- format version -----------------------------------------------------
  const fv = raw.formatVersion;
  if (!isNum(fv)) {
    err('story.json › formatVersion', 'formatVersion is required (use 1).');
    return { issues };
  }
  if (!(SUPPORTED_FORMAT_VERSIONS as readonly number[]).includes(fv)) {
    err('story.json › formatVersion', `Format version ${fv} is not supported by this version of the app (supported: ${SUPPORTED_FORMAT_VERSIONS.join(', ')}).`);
    return { issues };
  }

  // --- metadata -----------------------------------------------------------
  const W = 'story.json';
  if (!isStr(raw.id) || !STORY_ID_PATTERN.test(raw.id))
    err(`${W} › id`, 'id must be lower-case letters, digits and dashes (e.g. "my-story"), 2–64 characters.');
  if (!isStr(raw.version)) warn(`${W} › version`, 'version is missing; "1.0.0" will be assumed.');
  if (raw.language !== undefined && raw.language !== 'sv') err(`${W} › language`, 'Only Swedish ("sv") stories are supported.');
  checkBilingual(raw.title, `${W} › title`, err, true);
  checkBilingual(raw.description, `${W} › description`, err, false);
  if (!isObj(raw.level)) err(`${W} › level`, 'level is required, e.g. { "cefr": "A2", "difficulty": 2 }.');
  else {
    if (!CEFR.includes(String(raw.level.cefr))) err(`${W} › level.cefr`, `cefr must be one of ${CEFR.join(', ')}.`);
    if (![1, 2, 3, 4].includes(Number(raw.level.difficulty))) err(`${W} › level.difficulty`, 'difficulty must be 1, 2, 3 or 4.');
  }
  if (!isNum(raw.estimatedReadingMinutes) || raw.estimatedReadingMinutes <= 0)
    err(`${W} › estimatedReadingMinutes`, 'estimatedReadingMinutes must be a positive number.');
  if (!isStr(raw.author)) warn(`${W} › author`, 'author is missing.');

  const assets: string[] = [];
  const checkImage = (img: unknown, where: string, required: boolean) => {
    if (img === undefined) {
      if (required) err(where, 'An image is required here.');
      return;
    }
    if (!isObj(img) || !isStr(img.src)) {
      err(where, 'An image must be an object with a "src" path.');
      return;
    }
    if (!isStr(img.alt)) warn(where, 'Image has no "alt" text (used by VoiceOver).');
    const src = img.src;
    if (src.startsWith('data:image/')) return;
    if (/^https?:/i.test(src)) {
      err(where, `Remote images are not allowed (the app works offline): ${src}. Put the image inside the package.`);
      return;
    }
    const path = normalizePath(src);
    const ext = path.split('.').pop()?.toLowerCase() ?? '';
    if (!IMAGE_EXTENSIONS.includes(ext)) err(where, `Unsupported image type ".${ext}". Use ${IMAGE_EXTENSIONS.join(', ')}.`);
    else if (!reader.has(path)) err(where, `Image file not found in package: ${path}`);
    else assets.push(path);
    if (img.aspect !== undefined && (!isNum(img.aspect) || img.aspect <= 0)) warn(where, 'aspect must be a positive number (width / height).');
  };
  checkImage(raw.cover, `${W} › cover`, true);

  // --- chapters & pages ---------------------------------------------------
  const pageIds = new Set<string>();
  const chapterIds = new Set<string>();
  if (!Array.isArray(raw.chapters) || raw.chapters.length === 0) {
    err(`${W} › chapters`, 'A story needs at least one chapter with pages.');
  } else {
    raw.chapters.forEach((ch: unknown, ci: number) => {
      const cw = `${W} › chapters[${ci}]`;
      if (!isObj(ch)) return err(cw, 'Chapter must be an object.');
      if (!isStr(ch.id)) err(`${cw}.id`, 'Chapter id is required.');
      else if (chapterIds.has(ch.id)) err(`${cw}.id`, `Duplicate chapter id "${ch.id}".`);
      else chapterIds.add(ch.id);
      checkBilingual(ch.title, `${cw}.title`, err, true);
      if (!Array.isArray(ch.pages) || ch.pages.length === 0) return err(`${cw}.pages`, 'Chapter has no pages.');
      ch.pages.forEach((p: unknown, pi: number) => {
        const pw = `${cw}.pages[${pi}]`;
        if (!isObj(p)) return err(pw, 'Page must be an object.');
        if (!isStr(p.id)) err(`${pw}.id`, 'Page id is required.');
        else if (pageIds.has(p.id)) err(`${pw}.id`, `Duplicate page id "${p.id}". Page ids must be unique within the story.`);
        else pageIds.add(p.id);
        if (p.layout !== undefined && !LAYOUTS.includes(String(p.layout)))
          err(`${pw}.layout`, `Unknown layout "${String(p.layout)}". Use one of ${LAYOUTS.join(', ')}.`);
        if (!Array.isArray(p.paragraphs) || !p.paragraphs.every(isStr)) {
          err(`${pw}.paragraphs`, 'paragraphs must be a list of Swedish text strings.');
        } else {
          if (p.paragraphs.length === 0 && !Array.isArray(p.timeline)) err(`${pw}.paragraphs`, 'Page has no text.');
          const words = (p.paragraphs as string[]).join(' ').split(/\s+/).filter(Boolean).length;
          if (words > MAX_WORDS_PER_PAGE) warn(`${pw}.paragraphs`, `Page is long (${words} words). Consider splitting it – pages read best at 40–100 words.`);
        }
        const needsImage = p.layout !== 'text' && p.layout !== 'timeline';
        checkImage(p.image, `${pw}.image`, false);
        if (needsImage && p.image === undefined && p.layout !== undefined) warn(`${pw}.image`, `Layout "${String(p.layout)}" looks best with an image.`);
        if (p.timeline !== undefined) {
          if (!Array.isArray(p.timeline) || !p.timeline.every((t) => isObj(t) && isStr(t.when) && isStr(t.label)))
            err(`${pw}.timeline`, 'timeline must be a list of { "when": "...", "label": "..." }.');
        }
        if (p.factBox !== undefined) {
          if (!isObj(p.factBox) || !['fact', 'fiction', 'tip'].includes(String(p.factBox.kind)))
            err(`${pw}.factBox`, 'factBox.kind must be "fact", "fiction" or "tip".');
          else checkBilingual(p.factBox.text, `${pw}.factBox.text`, err, true);
        }
      });
    });
  }
  const pageCount = pageIds.size;
  if (pageCount > 0 && pageCount < 3) warn(`${W} › chapters`, `Only ${pageCount} page(s). Stories usually have 10–20 pages.`);

  // --- vocabulary, quiz, exercises -----------------------------------------
  const vocabulary = loadPart(reader, raw.vocabulary, 'vocabulary', err, (data, where) => validateVocabulary(data, where, err, warn));
  const quiz = loadPart(reader, raw.quiz, 'quiz', err, (data, where) => validateQuiz(data, where, pageIds, err, warn));
  const exerciseSets: ExerciseSetFile[] = [];
  if (raw.exercises !== undefined) {
    if (!Array.isArray(raw.exercises)) err(`${W} › exercises`, 'exercises must be a list of file paths or exercise sets.');
    else
      raw.exercises.forEach((ref: unknown) => {
        const set = loadPart(reader, ref, 'exercises', err, (data, where) => validateExerciseSet(data, where, err));
        if (set) exerciseSets.push(set);
      });
  }

  if (issues.some((i) => i.level === 'error')) return { issues };

  const manifest = { ...(raw as unknown as StoryManifest), version: isStr(raw.version) ? raw.version : '1.0.0' };
  return {
    issues,
    pkg: { manifest, vocabulary: vocabulary ?? [], quiz: quiz ?? [], exerciseSets, assets: [...new Set(assets)] },
  };
}

/* ------------------------------------------------------------------ */

function parseJson(reader: PackageReader, path: string, err: (w: string, m: string) => void): unknown {
  try {
    return JSON.parse(reader.text(path));
  } catch (e) {
    err(path, `Not valid JSON: ${(e as Error).message}`);
    return undefined;
  }
}

/** A part can be a relative file path or inline content. */
function loadPart<T>(
  reader: PackageReader,
  ref: unknown,
  label: string,
  err: (w: string, m: string) => void,
  validate: (data: unknown, where: string) => T | undefined,
): T | undefined {
  if (ref === undefined || ref === null) return undefined;
  if (typeof ref === 'string') {
    const path = normalizePath(ref);
    if (!reader.has(path)) {
      err(`story.json › ${label}`, `Referenced file not found: ${path}`);
      return undefined;
    }
    const data = parseJson(reader, path, err);
    return data === undefined ? undefined : validate(data, path);
  }
  return validate(ref, `story.json › ${label} (inline)`);
}

function checkBilingual(v: unknown, where: string, err: (w: string, m: string) => void, requireSv: boolean) {
  if (!isObj(v)) return err(where, 'Must be an object with "sv" and "en" texts.');
  if (requireSv && !isStr(v.sv)) err(`${where}.sv`, 'Swedish text is required.');
  if (!isStr(v.en)) err(`${where}.en`, 'English text is required.');
}

function validateVocabulary(
  data: unknown,
  where: string,
  err: (w: string, m: string) => void,
  warn: (w: string, m: string) => void,
): DictionaryEntry[] | undefined {
  const entries = isObj(data) ? data.entries : data;
  if (!Array.isArray(entries)) {
    err(where, 'Vocabulary must be { "formatVersion": 1, "entries": [...] }.');
    return undefined;
  }
  const ok: DictionaryEntry[] = [];
  entries.forEach((e: unknown, i: number) => {
    const w = `${where} › entries[${i}]`;
    if (!isObj(e) || !isStr(e.lemma) || !isStr(e.en)) return err(w, 'Each entry needs "lemma" and "en".');
    if (!POS.includes(String(e.pos))) return warn(w, `Unknown part of speech "${String(e.pos)}" – entry skipped.`);
    ok.push(e as unknown as DictionaryEntry);
  });
  return ok;
}

function validateQuiz(
  data: unknown,
  where: string,
  pageIds: Set<string>,
  err: (w: string, m: string) => void,
  warn: (w: string, m: string) => void,
): QuizQuestion[] | undefined {
  const questions = isObj(data) ? data.questions : data;
  if (!Array.isArray(questions)) {
    err(where, 'Quiz must be { "formatVersion": 1, "questions": [...] }.');
    return undefined;
  }
  const ids = new Set<string>();
  questions.forEach((q: unknown, i: number) => {
    const w = `${where} › questions[${i}]`;
    if (!isObj(q)) return err(w, 'Question must be an object.');
    if (q.type !== 'choice' && q.type !== 'truefalse') err(`${w}.type`, 'Quiz questions must be "choice" or "truefalse".');
    if (!QUIZ_CATEGORIES.includes(String(q.category))) err(`${w}.category`, `category must be one of ${QUIZ_CATEGORIES.join(', ')}.`);
    if (isStr(q.id)) {
      if (ids.has(q.id)) err(`${w}.id`, `Duplicate question id "${q.id}".`);
      ids.add(q.id);
    }
    if (isStr(q.pageId) && pageIds.size && !pageIds.has(q.pageId)) warn(`${w}.pageId`, `pageId "${q.pageId}" does not match any page.`);
    validateExercise(q, w, err);
  });
  if (questions.length && questions.length < 5) warn(where, 'Quizzes work best with 10–15 questions.');
  return questions as QuizQuestion[];
}

function validateExerciseSet(data: unknown, where: string, err: (w: string, m: string) => void): ExerciseSetFile | undefined {
  if (!isObj(data) || !Array.isArray(data.exercises)) {
    err(where, 'An exercise set must be { "id", "title", "exercises": [...] }.');
    return undefined;
  }
  if (!isStr(data.id)) err(`${where} › id`, 'Exercise set id is required.');
  checkBilingual(data.title, `${where} › title`, err, true);
  const ids = new Set<string>();
  data.exercises.forEach((ex: unknown, i: number) => {
    const w = `${where} › exercises[${i}]`;
    if (isObj(ex) && isStr(ex.id)) {
      if (ids.has(ex.id)) err(`${w}.id`, `Duplicate exercise id "${ex.id}".`);
      ids.add(ex.id);
    }
    validateExercise(ex, w, err);
  });
  return data as unknown as ExerciseSetFile;
}

/** Validates one exercise of any type. Exported for the grammar content tests. */
export function validateExercise(ex: unknown, w: string, err: (w: string, m: string) => void): ex is Exercise {
  if (!isObj(ex)) {
    err(w, 'Exercise must be an object.');
    return false;
  }
  const before = countErrors.n;
  const e = (m: string) => {
    countErrors.n++;
    err(w, m);
  };
  if (!isStr(ex.id)) e('id is required.');
  if (!isStr(ex.prompt)) e('prompt is required.');
  if (!isStr(ex.explanation)) e('explanation is required – always explain the answer.');
  switch (ex.type) {
    case 'choice':
    case 'correct': {
      const opts = ex.options;
      if (!Array.isArray(opts) || opts.length < 2 || !opts.every(isStr)) e('options must be a list of at least two strings.');
      else if (!isNum(ex.answer) || ex.answer < 0 || ex.answer >= opts.length) e(`answer must be an index between 0 and ${opts.length - 1}.`);
      if (ex.type === 'correct' && !isStr(ex.incorrect)) e('incorrect (the sentence with the mistake) is required.');
      break;
    }
    case 'fill':
      if (!isStr(ex.sentence) || !String(ex.sentence).includes('___')) e('sentence must contain a ___ gap.');
      if (!Array.isArray(ex.answers) || !ex.answers.length || !ex.answers.every(isStr)) e('answers must list at least one accepted answer.');
      break;
    case 'order':
      if (!Array.isArray(ex.words) || ex.words.length < 2 || !ex.words.every(isStr)) e('words must list at least two words in the correct order.');
      break;
    case 'match':
      if (!Array.isArray(ex.pairs) || ex.pairs.length < 2 || !ex.pairs.every((p) => Array.isArray(p) && p.length === 2 && isStr(p[0]) && isStr(p[1])))
        e('pairs must be a list of at least two [left, right] pairs.');
      break;
    case 'identify':
      if (!isStr(ex.sentence) || !isStr(ex.target) || !String(ex.sentence).includes(String(ex.target))) e('identify needs a sentence that contains the target word.');
      break;
    case 'truefalse':
      if (!isStr(ex.statement)) e('statement is required.');
      if (typeof ex.answer !== 'boolean') e('answer must be true or false.');
      break;
    default:
      e(`Unknown exercise type "${String(ex.type)}". Use choice, fill, order, match, correct, identify or truefalse.`);
  }
  return countErrors.n === before;
}
const countErrors = { n: 0 };

/** Turns issues into a short, readable report for the import screen. */
export function formatIssues(issues: ValidationIssue[]): string {
  return issues.map((i) => `${i.level === 'error' ? '✗' : '!'} ${i.where}: ${i.message}`).join('\n');
}
