# Saga — Architecture

Saga is a personal web app for learning Swedish by reading illustrated stories. It is installed on the
iPhone Home Screen as a **PWA** (progressive web app) and then runs offline by itself. This document covers the
architecture, the technology choices, the database schema, how word lookup works, the main technical risks and the
roadmap. The story package format has its own document: [`STORY_FORMAT.md`](./STORY_FORMAT.md).

---

## 1. Product architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ Routes (src/app) — screens only, thin                              │
│  (tabs): Home · Books · Vocabulary · Practice · Progress           │
│  stack:  story/[id] · read/[id] · quiz/[id] · knowledge · review   │
│          vocab-practice · grammar/[topic] · word/[id] · import     │
│          settings                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Feature modules (src/features) — UI components + hooks per domain  │
│  reader · vocabulary · exercises · grammar · quiz · progress ·     │
│  import · content · dictionary                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Domain logic (pure TypeScript, unit tested, no React)              │
│  tokenizer · dictionary resolver · lemmatizer · SRS scheduler ·    │
│  answer checking · exercise generation · package validator · stats │
├─────────────────────────────────────────────────────────────────────┤
│ Data                                                               │
│  Content store: bundled stories (JS modules) + imported stories    │
│                 (Documents/stories/<id>/…)                         │
│  SQLite (WebAssembly): progress, vocabulary, SRS, results, settings│
└─────────────────────────────────────────────────────────────────────┘
```

**Content vs. user data.** Stories, dictionary and grammar lessons are
*content*. They are read-only and can be replaced. Progress, saved words and
results are *user data* and live only in SQLite. User data refers to content by
stable string IDs (`storyId`, `pageId`, `topicId`, `questionId`). This means a
story can be re-imported or updated without losing progress.

**Bundled and imported stories share one format.** The three built-in stories
are written in `content/stories/<id>/` in the same package layout an imported
ZIP uses. `npm run content:build` validates them with the app's own validator,
compiles them into `src/content/bundled/generated/*.ts`, and writes example ZIP
packages to `content/dist/`. The import code is therefore tested on real
content all the time.

**Reactivity.** Repositories are plain async functions `(db, …) => …`. Screens
read data with `useDbQuery(loader, tags)`. It loads on mount and on screen
focus, and again whenever a write calls `invalidate(tag)`. There is no global
state library: SQLite holds the state.

---

## 2. Technology stack

| Concern | Choice | Why |
|---|---|---|
| App | **TypeScript** (strict), React Native for Web, **Expo Router** | One typed code base; file-based routing; the build tooling produces a static web app. Works on Linux with no extra tools. |
| Distribution | A static build in `dist/` (`npm run web:build`) + a generated **service worker** (`scripts/build-pwa.ts`) | The laptop serves it over HTTPS once (`npm run web:serve:https`); the phone installs it to the Home Screen and then needs nothing else, even offline. |
| Persistence | **SQLite as WebAssembly** (`expo-sqlite`), stored in the browser | Relational data (vocabulary + reviews + results), transactions, migrations with `PRAGMA user_version`. Needs cross-origin-isolation headers (see risks). |
| Imported stories | Rows in the `story_files` table (base64 text) | A browser has no file system; imports are small. |
| ZIP | **fflate** (pure JS) | Synchronous unzip is fast for packages of a few MB. |
| Import / export | The browser's file picker and downloads | Story packages and backups are plain files. |
| Illustrations | **react-native-svg** (`SvgXml`) + expo-image | The built-in art is original vector "watercolour" SVG, sharp on every screen, small, and works offline. Imported stories can use PNG, JPG, WebP or SVG. |
| Typography | Fraunces (display), Literata (reading), Nunito Sans (UI) via `@expo-google-fonts` | Literata was designed for long-form reading on screens. Fraunces gives the soft, storybook feel for titles. |
| Speech | The Web Speech API (`src/lib/speechWeb.ts`) | Reads pages and words aloud with the phone's Swedish voice, offline. |
| Icons | `expo-symbols` (rendered as Material Symbols on the web) | One icon set. |
| Tests | Jest | Unit tests for all domain logic. |
| Scripts | tsx | Runs the TypeScript content build, validation and the local HTTPS server on Node. |

---

## 3. Database schema (SQLite, `saga.db`)

Migrations run in `src/db/migrations.ts`. They are versioned with
`PRAGMA user_version`, and each one is a transaction. Timestamps are ISO-8601
UTC strings.

```sql
-- key/value preferences (reader font size, current story, …)
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

-- one row per story the user has opened
CREATE TABLE reading_progress (
  story_id         TEXT PRIMARY KEY,
  current_page     INTEGER NOT NULL DEFAULT 0,   -- 0-based index in flattened page list
  furthest_page    INTEGER NOT NULL DEFAULT 0,
  total_pages      INTEGER NOT NULL DEFAULT 0,   -- cached for list screens
  started_at       TEXT NOT NULL,
  last_opened_at   TEXT NOT NULL,
  completed_at     TEXT
);

-- distinct pages seen ("pages read" statistic)
CREATE TABLE page_reads (
  story_id TEXT NOT NULL, page_id TEXT NOT NULL, first_read_at TEXT NOT NULL,
  PRIMARY KEY (story_id, page_id)
);

CREATE TABLE bookmarks (
  story_id TEXT NOT NULL, page_id TEXT NOT NULL, page_index INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (story_id, page_id)
);

-- active reading time (idle time is not counted)
CREATE TABLE reading_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id TEXT NOT NULL, started_at TEXT NOT NULL, seconds INTEGER NOT NULL
);

-- My Vocabulary + spaced-repetition state, one row per lemma+part of speech
CREATE TABLE vocabulary (
  id             TEXT PRIMARY KEY,
  word           TEXT NOT NULL,          -- form as met in the text ("skogen")
  lemma          TEXT NOT NULL,          -- dictionary form ("skog")
  pos            TEXT NOT NULL,          -- noun | verb | adjective | …
  translation    TEXT NOT NULL,
  gender         TEXT,                   -- en | ett (nouns)
  forms_json     TEXT,                   -- {"indefSg":"en skog", "defSg":"skogen", …}
  sentence       TEXT,                   -- original sentence from the story
  story_id       TEXT, page_id TEXT,
  notes          TEXT,
  status         TEXT NOT NULL DEFAULT 'new',  -- new | learning | reviewing | mastered
  ease           REAL NOT NULL DEFAULT 2.5,
  interval_days  REAL NOT NULL DEFAULT 0,
  repetitions    INTEGER NOT NULL DEFAULT 0,
  lapses         INTEGER NOT NULL DEFAULT 0,
  due_at         TEXT NOT NULL,
  last_reviewed_at TEXT,
  created_at     TEXT NOT NULL, updated_at TEXT NOT NULL,
  UNIQUE (lemma, pos)
);
CREATE INDEX idx_vocab_due ON vocabulary (due_at);

CREATE TABLE review_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vocab_id TEXT NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  reviewed_at TEXT NOT NULL,
  grade TEXT NOT NULL,                  -- again | hard | good | easy
  mode TEXT NOT NULL                    -- flashcard | choice | typing | cloze | match | identify
);

-- every answered grammar / vocabulary exercise
CREATE TABLE exercise_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,                   -- grammar | vocab | story-grammar
  topic_id TEXT NOT NULL, exercise_id TEXT NOT NULL,
  correct INTEGER NOT NULL, answered_at TEXT NOT NULL
);
CREATE INDEX idx_ex_topic ON exercise_results (kind, topic_id);

CREATE TABLE quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id TEXT NOT NULL,               -- or 'knowledge' for the mixed section
  score INTEGER NOT NULL, total INTEGER NOT NULL,
  started_at TEXT NOT NULL, finished_at TEXT NOT NULL
);
CREATE TABLE quiz_answers (
  attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL, question_id TEXT NOT NULL,
  correct INTEGER NOT NULL, answered_at TEXT NOT NULL
);

-- registry of imported packages (files live in Documents/stories/<id>/)
CREATE TABLE imported_stories (
  story_id TEXT PRIMARY KEY, version TEXT NOT NULL, format_version INTEGER NOT NULL,
  title_sv TEXT NOT NULL, imported_at TEXT NOT NULL, source_name TEXT
);
```

Every table uses stable text IDs, and nothing depends on autoincrement IDs
across tables. A later sync feature could add `updated_at` and
`deleted_at` columns and push and pull rows without remodelling.

---

## 4. UI screen structure

```
Tabs
├─ Home         Continue reading (hero) · My Books shelf · Vocabulary summary ·
│               Practice + Swedish Knowledge entry cards · Learning progress strip
├─ Books        Book covers grid (level, time, chapters, progress) · Import
├─ Vocabulary   Search · filters (story / type / status) · word cards → word detail
├─ Practice     Daily review · vocabulary exercises · grammar topics by area ·
│               Swedish Knowledge (history & culture)
└─ Progress     Reading time, stories, pages, words, mastery, quiz scores, grammar
Stack (pushed over the tabs)
├─ story/[id]          Book details: cover, description, chapters, key words, quiz
├─ read/[id]           The reader (full-screen, paginated)
├─ quiz/[id]           Story quiz with explanations
├─ knowledge           Mixed questions from completed stories
├─ review              Daily spaced-repetition flashcards
├─ vocab-practice      Exercise session (6 exercise types)
├─ grammar/[topic]     Explanation → examples → practice → summary
├─ word/[id]           Vocabulary card detail (sheet)
├─ import              Import a story package (modal)
└─ settings            Reading preferences, backup/restore, export (modal)
```

### Reader layouts

Each page sets a `layout`, and the reader picks a composition for it:

| layout | Composition |
|---|---|
| `hero` | Large illustration (~50 % height) with text below. The default. |
| `full` | Full-bleed illustration with a short text panel over a paper fade. For short, atmospheric pages. |
| `inset` | Smaller framed illustration with longer text. |
| `portrait` | Round character/object vignette with text. |
| `timeline` | Native timeline (year → label) with short text. |
| `map` | Wide map image with caption, legend and text. |
| `text` | Text only, with a decorative initial. For quiet passages. |

Pages can also carry a `factBox`: a "Historical fact" box or a "Story" (fiction)
box. This keeps facts and fiction clearly apart.

---

## 5. Word-level long-press: implementation

**Requirements:** reliable lookup of a single word, correct handling of å, ä and
ö, natural line wrapping and justification, no clash with scrolling or page
swiping, and the same behaviour on every screen size.

**Options considered**

1. *Browser text selection*: opens the iOS selection/copy menu. You can't
   add a lookup action to it from JS, it selects ranges instead of words, and it
   gets in the way of swiping. Rejected.
2. *One `<View>` per word in a `flexWrap` row*: easy to measure, but it loses
   real text layout. Kerning, hyphenation, justification and line breaking
   around punctuation all suffer, and long pages get heavy. Rejected.
3. *Nested `<Text>` spans* in one paragraph `<Text>`: **chosen.** iOS lays the
   paragraph out as one block of text, so typography stays natural. Each word
   span gets its own pointer handlers.

**How it works**

1. `tokenize(paragraph)` (pure, unit-tested) splits text into `word`,
   `number`, `space` and `punct` tokens. It uses an explicit Unicode letter
   class (`A–Z a–z À–ÿ`, which covers å ä ö é ü) instead of `\p{L}` so it doesn't
   depend on the engine. Inner hyphens and apostrophes stay inside a word
   (`1500-talet`, `Sankta-Lucia`). Each word keeps its character offset and the
   sentence it belongs to.
2. `InteractiveText` renders `<Text>` with one nested `<Text>` per word token,
   each with pointer handlers (press and hold on touch, click with a mouse).
   Spaces and punctuation are plain strings, so they can't be pressed.
3. On a hold: the word gets a soft highlight, and the press position places a
   popover (`popoverLayout.ts`) on the roomier side of the word, so the finger
   never covers the card. It always fits inside the safe area; tall content
   scrolls inside the card.
4. `resolveWord(surface, context)` looks up the word in this order:
   1. the story's own `vocabulary.json` (contextual meanings),
   2. the bundled Swedish–English dictionary form index (every inflected form
      → lemma + form label),
   3. rule-based Swedish lemmatisation (suffix stripping: `-arna`, `-orna`,
      `-erna`, `-en`, `-et`, `-ar`, `-ade`, `-at`, `-t`, …), checked against
      the dictionary (marked "probable"),
   4. compound splitting (`midsommar|stång`, with linking `-s-`), shown as
      "Compound (automatic analysis)",
   5. otherwise "Not in the dictionary". The app never makes up a
      translation. You can still save the word with your own note.
5. "Add to My Words" saves the word together with its sentence, story and page.
   Words are de-duplicated on `(lemma, pos)`.

**The gesture:** react-native-web's `<Text>` has no long-press, so `InteractiveText` builds it from pointer
events: touch = press and hold for about half a second (any movement cancels it, so swiping pages never opens it),
mouse = click.

**The installable app:** `npm run web:build` exports the app as static files plus a generated service worker
(`scripts/build-pwa.ts`) that caches everything, so it works offline once installed. SQLite runs as
WebAssembly in the browser, which needs cross-origin-isolation headers (see the risks table). Imported story files
are stored in the `story_files` table (base64), backups download as files, and confirmations use the browser's own
dialogs (`src/lib/dialog.ts`).

**Completion:** a story counts as finished when the last page is reached *and*
at least 80 % of its pages have been read. Jumping to the end from the contents
doesn't count.

**Why reading stays comfortable:** short taps do nothing, so there's no
accidental popover while turning pages. A long-press is cancelled as soon as
the finger moves (scroll or swipe). Line layout doesn't depend on the touch
logic.

**Accessibility:** for VoiceOver, each paragraph is exposed as one readable
element rather than many single-word elements. The reader's "Words on this page"
sheet lists every word on the page with its translation, so lookup also works
without a long-press.

---

## 6. Technical risks and mitigations

| Risk | Mitigation |
|---|---|
| Press-and-hold on nested text spans breaking in a future react-native-web release | All of it is isolated in `InteractiveText`. The tokenizer and resolver are independent, so a fallback (word `View`s) could be swapped in without touching other code. |
| Dictionary coverage | `npm run content:check` reports every story word the resolver cannot find. The built-in stories reach 100 % coverage. Imported stories bring their own `vocabulary.json`. |
| Wrong translations or history | Built-in content was written and reviewed for accuracy. Facts and fiction are labelled. The resolver shows "not found" rather than guessing. |
| Large imported images | Packages are validated (25 MB ZIP limit). Images are shown with expo-image, which caches and downsamples them. |
| No Mac, no Apple Developer account, no hosting | The app is a PWA served once from the laptop over HTTPS (free), then it runs from the phone. |
| iOS Safari quirks in the web app | Speech must start synchronously inside a tap (`speechWeb.ts`); the silent switch can mute it (Voice check in Settings); web storage can be evicted when the phone is nearly full (backup/restore in Settings). |
| The in-browser database needs HTTPS and isolation headers | `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` are sent by the dev server and the local HTTPS server (`scripts/lib/webHeaders.js`). The laptop serves HTTPS with its own certificate authority (`docs/CERTIFICATE.md`). |
| The installed app is tied to its address | Reserve a fixed address for the laptop in the router; backup/restore moves the data when it changes (`docs/INSTALL.md`). |
| Data loss | Every write is committed to SQLite right away. Backup (download) and restore (file picker) of a JSON file. |

---

## 7. Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 Foundation | TypeScript + file-based routing, design tokens, fonts, SQLite + migrations, Home, Library | ✅ |
| 2 Reading | Paginated reader, layouts, illustrations, progress, bookmarks, chapters, long-press dictionary + popover | ✅ |
| 3 Vocabulary | Save words, vocabulary list, filters, word detail, SRS, daily review, 6 exercise types | ✅ |
| 4 Grammar | 29 SFI topics with explanations, examples, varied exercises, feedback, progress | ✅ |
| 5 Stories | Three illustrated stories, vocabulary, quizzes, knowledge section | ✅ |
| 6 Import | ZIP / JSON import, validation, illustrations, export, backup/restore | ✅ |
| 7 Polish | Animations, accessibility labels, Dynamic Type limits, testing on devices | ongoing |
| 8 Web app | Installable PWA: offline service worker, hold-to-lookup, web storage for imports, read-aloud, private HTTPS certificate from the laptop | ✅ |

Future ideas (not built, to keep the app focused): iCloud sync, an optional AI
translation provider behind the `TranslationProvider` interface, and generated
illustrations for imported stories.
