/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { strToU8, zipSync } from 'fflate';
import { base64ToBytes, bytesToBase64 } from '@/lib/base64';
import { filesFromBytes, memoryReader, PackageError } from '@/features/import/package';
import { loadStoryPackage } from '@/features/import/validate';

const dist = join(__dirname, '..', '..', 'content', 'dist');

const minimal = {
  formatVersion: 1,
  id: 'test-story',
  version: '1.0.0',
  language: 'sv',
  title: { sv: 'Test', en: 'Test' },
  description: { sv: 'En test.', en: 'A test.' },
  level: { cefr: 'A1', difficulty: 1 },
  estimatedReadingMinutes: 5,
  author: 'Test',
  cover: { src: 'cover.png', alt: 'cover' },
  chapters: [{ id: 'c1', title: { sv: 'Ett', en: 'One' }, pages: [{ id: 'p1', paragraphs: ['Hej.'], image: { src: 'images/p1.png', alt: 'x' } }] }],
};

describe('story packages', () => {
  it.each(['sveriges-historia', 'livet-i-sverige', 'ett-ar-i-sverige'])('the bundled example package %s imports cleanly', (id) => {
    const files = filesFromBytes(readFileSync(join(dist, `${id}.zip`)), `${id}.zip`);
    const { pkg, issues } = loadStoryPackage(memoryReader(files));
    expect(issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(pkg?.manifest.id).toBe(id);
    expect(pkg!.quiz.length).toBeGreaterThanOrEqual(10);
    expect(pkg!.manifest.chapters.flatMap((c) => c.pages).length).toBeGreaterThanOrEqual(10);
  });

  it('reports missing images and bad metadata clearly', () => {
    const bad = { ...minimal, id: 'Bad ID', level: { cefr: 'C9', difficulty: 7 } };
    const zip = zipSync({ 'story.json': strToU8(JSON.stringify(bad)) });
    const { pkg, issues } = loadStoryPackage(memoryReader(filesFromBytes(zip, 'x.zip')));
    expect(pkg).toBeUndefined();
    const text = issues.map((i) => `${i.where}: ${i.message}`).join('\n');
    expect(text).toMatch(/id must be lower-case/);
    expect(text).toMatch(/cefr must be one of/);
    expect(text).toMatch(/Image file not found in package: cover.png/);
  });

  it('strips a root folder and accepts the package', () => {
    const zip = zipSync({
      'my-story/story.json': strToU8(JSON.stringify(minimal)),
      'my-story/cover.png': new Uint8Array([1]),
      'my-story/images/p1.png': new Uint8Array([1]),
      '__MACOSX/._story.json': new Uint8Array([0]),
    });
    const { pkg, issues } = loadStoryPackage(memoryReader(filesFromBytes(zip, 'my-story.zip')));
    expect(issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(pkg?.assets).toEqual(['cover.png', 'images/p1.png']);
  });

  it('rejects zip-slip paths', () => {
    const zip = zipSync({ '../evil.json': strToU8('{}') });
    expect(() => filesFromBytes(zip, 'evil.zip')).toThrow(PackageError);
  });

  it('extracts embedded data: images from single-JSON packages', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    const json = { ...minimal, cover: { src: png, alt: 'c' }, chapters: [{ ...minimal.chapters[0], pages: [{ id: 'p1', paragraphs: ['Hej.'] }] }], quiz: { formatVersion: 1, questions: [] } };
    const files = filesFromBytes(strToU8(JSON.stringify(json)), 'story.json');
    const { pkg, issues } = loadStoryPackage(memoryReader(files));
    expect(issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(pkg?.manifest.cover.src).toBe('images/embedded-1.png');
    expect(files.get('images/embedded-1.png')?.[0]).toBe(0x89);
  });

  it('rejects unsupported format versions', () => {
    const files = filesFromBytes(strToU8(JSON.stringify({ ...minimal, formatVersion: 99 })), 'story.json');
    expect(loadStoryPackage(memoryReader(files)).issues[0].message).toMatch(/not supported/);
  });
});

describe('base64', () => {
  it('round-trips arbitrary bytes of every length', () => {
    for (const n of [0, 1, 2, 3, 4, 5, 250, 1001]) {
      const bytes = new Uint8Array(n).map((_, i) => (i * 37 + 11) & 255);
      expect(Array.from(base64ToBytes(bytesToBase64(bytes)))).toEqual(Array.from(bytes));
    }
    expect(bytesToBase64(new Uint8Array([72, 105]))).toBe('SGk=');
  });
});
