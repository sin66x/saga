# Saga story package format (version 1)

A story is a self-contained **package** that you can add to Saga from the iOS
Files app, without changing or rebuilding the app. The three built-in stories use
exactly this format. Their sources are in `content/stories/`, and ready-made
example ZIPs are in `content/dist/`.

The TypeScript definitions in [`src/content/types.ts`](../src/content/types.ts)
are the source of truth. The validator in
[`src/features/import/validate.ts`](../src/features/import/validate.ts) checks every
rule listed below.

## Package layout

```
my-story.zip
├─ story.json          required – metadata, chapters and pages
├─ cover.png           required – cover image (any name; referenced from story.json)
├─ images/             page illustrations, maps, diagrams
│   ├─ page-01.png
│   └─ …
├─ vocabulary.json     optional – the story's own glossary (key words, contextual meanings)
├─ quiz.json           optional – 10–15 questions recommended
└─ exercises/
    └─ grammar.json    optional – one or more exercise sets
```

* The files may sit inside one root folder in the ZIP (`my-story/story.json`). That
  folder is detected and removed automatically.
* Images can be **PNG, JPG, WebP, GIF or SVG**. Remote URLs are rejected because
  the app works offline.
* Packages can be at most 25 MB.
* **Single-file alternative:** a `.json` file containing `story.json` with
  `vocabulary`, `quiz` and `exercises` written *inline*. Images may be embedded as
  `data:image/png;base64,…` URIs or left out. A page without an image then uses the
  text layout.

## story.json

```jsonc
{
  "formatVersion": 1,                 // required, currently 1
  "id": "en-dag-i-stockholm",         // required, unique: a-z, 0-9 and dashes
  "version": "1.0.0",                 // bump it when you re-import an updated story
  "language": "sv",
  "title":       { "sv": "En dag i Stockholm", "en": "A Day in Stockholm" },
  "description": { "sv": "…", "en": "…" },
  "level": { "cefr": "A2", "difficulty": 2 },   // cefr: A1 | A1-A2 | A2 | A2-B1 | B1 | B1-B2 | B2
                                                 // difficulty: 1 very beginner … 4 intermediate
  "estimatedReadingMinutes": 25,
  "author": "Claude",
  "cover": { "src": "cover.png", "alt": "Description for VoiceOver", "aspect": 0.75 },
  "theme": { "accent": "#3E7A6A", "coverTint": "#E3EEE6" },   // optional
  "accuracyNote": { "sv": "…", "en": "Which parts are fiction, which are fact." },
  "chapters": [
    {
      "id": "ch1",
      "title": { "sv": "Morgon", "en": "Morning" },
      "pages": [
        {
          "id": "p01",                       // unique in the story; progress refers to it
          "layout": "hero",                  // hero | full | inset | portrait | map | timeline | text
          "kind": "fiction",                 // history | culture | fiction (shows a small badge)
          "image": { "src": "images/page-01.png", "alt": "…", "aspect": 1.4,
                     "caption": { "sv": "…", "en": "…" } },      // caption: maps/diagrams
          "heading": "Optional Swedish heading",
          "paragraphs": ["Short Swedish paragraph.", "Another one."],
          "timeline": [{ "when": "1523", "label": "Gustav Vasa blir kung" }],   // timeline layout
          "factBox": { "kind": "fact", "text": { "sv": "…", "en": "…" } },      // fact | fiction | tip
          "summaryEn": "One or two English sentences – shown behind the 'English summary' button."
        }
      ]
    }
  ],
  "vocabulary": "vocabulary.json",
  "quiz": "quiz.json",
  "exercises": ["exercises/grammar.json"]
}
```

### Page layouts

| layout | Use it for |
|---|---|
| `hero` | The default: a large illustration (~45 % of the screen) with text below it. |
| `full` | Atmospheric opening or ending pages. The image runs to the edges and fades into the paper. |
| `inset` | Pages with more text. The image is shown as a small tilted "photo". |
| `portrait` | People and objects, shown in a round vignette. |
| `map` | Maps and diagrams. The image is never cropped, and the caption is shown. |
| `timeline` | A vertical timeline from `timeline` entries. No image is needed. |
| `text` | Text only, with an ornament. |

### Writing guidelines (what makes a good Saga page)

* **40–100 words per page**, and 10–20 pages per story. The validator warns above 160.
* Short sentences. Bring in new words gradually and repeat them a few times.
* Write natural Swedish at a steady level. For A1–A2 that means present tense and
  simple past, and few subordinate clauses. From B1 on, more subordinate clauses,
  the perfect tense and s-passive.
* History must be **accurate**. Fictional characters are fine, but mark those
  pages with `"kind": "fiction"` and explain the split in `accuracyNote`.
* Every page should have an English `summaryEn`.

## vocabulary.json

Words the story wants to explain *in its own way*. They take priority over the
built-in dictionary when the reader long-presses a word, and entries with
`"key": true` are listed on the book page. Include **every word the built-in
dictionary may not know**, such as names, rare words and new compounds. Running
`npm run content:check` on a story folder lists any word that cannot be resolved.

```json
{
  "formatVersion": 1,
  "entries": [
    {
      "lemma": "högtid", "pos": "noun", "gender": "en", "en": "holiday, festive occasion",
      "forms": { "indefSg": "högtid", "defSg": "högtiden", "indefPl": "högtider", "defPl": "högtiderna" },
      "example": { "sv": "Jul är en stor högtid.", "en": "Christmas is a big holiday." },
      "note": "False friend: not 'high tide'!",
      "key": true
    },
    {
      "lemma": "bjuda", "pos": "verb", "en": "to invite, to treat", "enPast": "invited",
      "forms": { "infinitive": "bjuda", "present": "bjuder", "past": "bjöd", "supine": "bjudit" }
    },
    {
      "lemma": "mysig", "pos": "adjective", "en": "cosy",
      "forms": { "common": "mysig", "neuter": "mysigt", "plural": "mysiga", "comparative": "mysigare", "superlative": "mysigast" }
    }
  ]
}
```

`pos` is one of: noun, verb, adjective, adverb, pronoun, preposition, conjunction,
numeral, interjection, determiner, proper-noun, particle, phrase. Extra inflected
forms go in `forms.other` (an array).

## quiz.json

```json
{
  "formatVersion": 1,
  "questions": [
    {
      "id": "q01", "type": "choice", "category": "history", "difficulty": 1,
      "prompt": "Vem var Gustav Vasa?",
      "options": ["…", "…", "…"], "answer": 1,
      "explanation": "Simple English explanation of why this is right.",
      "wrong": { "0": "Optional: why option 0 is wrong." },
      "swedish": "The Swedish sentence from the story that contains the answer.",
      "pageId": "p10"
    },
    {
      "id": "q02", "type": "truefalse", "category": "culture", "difficulty": 1,
      "prompt": "Sant eller falskt?", "statement": "Lucia firas i december.", "answer": true,
      "explanation": "…", "swedish": "…", "pageId": "p05"
    }
  ]
}
```

Categories are `comprehension`, `history`, `culture` and `vocabulary`. History and
culture questions also appear in the **Swedish Knowledge** section once the story
is finished. Difficulty runs from 1 (simple facts) to 3 (a little interpretation),
and questions are asked in that order.

## exercises/grammar.json

```json
{
  "formatVersion": 1,
  "id": "my-story-word-order",
  "title": { "sv": "Ordföljd", "en": "Word order" },
  "grammarTopic": "sentence-v2",
  "explanation": "Short intro shown before the exercises.",
  "exercises": [ … ]
}
```

`grammarTopic` links the set to a built-in lesson. The IDs are listed in
`src/features/grammar/content/*.ts`, for example `nouns-plural`, `verbs-past` and
`sentence-v2`. Every exercise needs `id`, `prompt` and `explanation`, plus the
fields for its type:

| type | fields |
|---|---|
| `choice` | `options`, `answer` (index), optional `sentence` with `___`, optional `wrong` |
| `fill` | `sentence` with exactly one `___`, `answers` (accepted answers), optional `translation` |
| `order` | `words` in the correct order, optional `alternatives`, `end` (`.`, `?` or `!`), `translation` |
| `match` | `pairs`: `[["left","right"], …]` with unique left and right values |
| `correct` | `incorrect` sentence, `options`, `answer` |
| `truefalse` | `statement`, `answer` (true/false) |
| `identify` | `sentence`, `target` (the word to tap) |

## Validation and errors

Before anything is saved, the importer checks:

* that `story.json` exists and is valid JSON, with a supported `formatVersion`;
* the required metadata (`id` format, titles, `level`, reading time);
* that the `id` is unique. A built-in ID is refused. An already-imported ID can be
  replaced with the newer version, and progress is kept;
* every chapter and page (unique IDs, text present, a known layout);
* that every image reference points to a file in the package, of a supported type;
* the quiz and exercise structure (answer indexes in range, explanations present,
  page references).

Errors are shown in the app with the file and JSON path, for example
`story.json › chapters[0].pages[2].image: Image file not found in package: images/p03.png`.

## Generating a new story with Claude

Give Claude this repository (or this file) and ask, for example:

> Write a new Saga story package following docs/STORY_FORMAT.md. Topic: *Astrid
> Lindgren and Swedish children's books*. Level A2, 14 pages in 4 chapters, with a
> fictional frame story and accurate facts. Include vocabulary.json covering every
> word that may not be in the built-in dictionary, a 12-question quiz across all
> four categories, and 6 grammar exercises on adjective agreement. Create the
> folder `content/stories/astrid-lindgren/` with SVG illustrations in the same
> watercolour style (see `scripts/illustrations/`), then run
> `npm run content:check` and zip it.

To use it **without rebuilding the app**, zip the folder, for example
`cd content/stories/astrid-lindgren && zip -r ../../dist/astrid-lindgren.zip .`.
Put the ZIP in iCloud Drive or the iPhone's Files app, then go to Books › Import.
To make it a **built-in** story instead, add its scenes to
`scripts/build-content.ts` and run `npm run content:build`.
