/**
 * Validates the bundled story packages and reports dictionary coverage:
 * every word in every story must resolve to a dictionary entry.
 *
 *   npm run content:check
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createResolver } from '../src/features/dictionary/resolver';
import { loadStoryPackage, formatIssues } from '../src/features/import/validate';
import { tokenize } from '../src/lib/tokenizer';
import { folderReader } from './lib/fs-reader';

const root = join(__dirname, '..', 'content', 'stories');
let failed = false;
for (const id of readdirSync(root)) {
  const { pkg, issues } = loadStoryPackage(folderReader(join(root, id)));
  console.log(`\n■ ${id}`);
  if (issues.length) console.log(formatIssues(issues));
  if (!pkg) { failed = true; continue; }
  const resolver = createResolver(pkg.vocabulary);
  const missing = new Map<string, string[]>();
  const fuzzy = new Map<string, string>();
  let words = 0;
  for (const ch of pkg.manifest.chapters) for (const p of ch.pages) {
    const texts = [...p.paragraphs, p.heading ?? '', ...(p.timeline ?? []).map((t) => t.label), p.factBox?.text.sv ?? ''];
    for (const t of texts) {
      const tokens = tokenize(t);
      tokens.forEach((tok, i) => {
        if (tok.kind !== 'word' && !(tok.kind === 'number' && tok.text.includes('-'))) return;
        words++;
        const r = resolver.resolve(tok.text, {});
        if (r.status === 'not-found') missing.set(tok.text.toLowerCase(), [...(missing.get(tok.text.toLowerCase()) ?? []), p.id]);
        else if (r.status !== 'found') fuzzy.set(tok.text.toLowerCase(), `${r.status}: ${r.translation ?? ''}`);
      });
    }
  }
  const pages = pkg.manifest.chapters.reduce((n, c) => n + c.pages.length, 0);
  console.log(`  ${pages} pages · ${words} words · ${pkg.quiz.length} quiz questions · ${pkg.vocabulary.length} key words`);
  if (fuzzy.size) console.log(`  ~ ${fuzzy.size} probable/compound:\n    ` + [...fuzzy].map(([w, s]) => `${w} (${s})`).join('\n    '));
  if (missing.size) { failed = true; console.log(`  ✗ ${missing.size} not found: ` + [...missing.keys()].join(' ')); }
  else console.log('  ✓ every word resolves');
}
process.exit(failed ? 1 : 0);
