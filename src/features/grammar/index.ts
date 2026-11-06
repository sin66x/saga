import { adjectiveTopics } from './content/adjectives';
import { nounTopics } from './content/nouns';
import { otherTopics } from './content/other';
import { prepositionTopics } from './content/prepositions';
import { pronounTopics } from './content/pronouns';
import { sentenceTopics } from './content/sentence';
import { verbTopics } from './content/verbs';
import { CATEGORIES, type GrammarCategory, type GrammarTopic } from './types';

/** All built-in grammar topics, in teaching order (easy → harder within each area). */
export const GRAMMAR_TOPICS: GrammarTopic[] = [
  ...nounTopics,
  ...verbTopics,
  ...adjectiveTopics,
  ...pronounTopics,
  ...sentenceTopics,
  ...prepositionTopics,
  ...otherTopics,
];

const byId = new Map(GRAMMAR_TOPICS.map((t) => [t.id, t]));

export function getTopic(id: string): GrammarTopic | undefined {
  return byId.get(id);
}

export function topicsByCategory(): { category: (typeof CATEGORIES)[number]; topics: GrammarTopic[] }[] {
  return CATEGORIES.map((category) => ({ category, topics: GRAMMAR_TOPICS.filter((t) => t.category === category.id) }));
}

export type { GrammarCategory, GrammarTopic };
export { CATEGORIES };
