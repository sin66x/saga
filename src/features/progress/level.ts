/**
 * A simple, transparent estimate of the learner's current level (SFI-style progression),
 * based on the hardest story finished and how many grammar topics have been practised well.
 */
export interface LevelInfo {
  cefr: 'A1' | 'A1-A2' | 'A2' | 'B1';
  label: string;
  next?: string;
}

export function estimateLevel(input: { hardestCompletedDifficulty: number; goodGrammarTopics: number; wordsMastered: number }): LevelInfo {
  const { hardestCompletedDifficulty: d, goodGrammarTopics: g, wordsMastered: w } = input;
  if (d >= 3 && g >= 18) return { cefr: 'B1', label: 'Intermediate' };
  if (d >= 2 || g >= 12 || w >= 150) return { cefr: 'A2', label: 'Elementary', next: 'Finish “Ett år i Sverige” and practise 18 grammar topics to reach B1.' };
  if (d >= 1 || g >= 5 || w >= 40) return { cefr: 'A1-A2', label: 'Beginner', next: 'Finish an A2 story or practise 12 grammar topics to reach A2.' };
  return { cefr: 'A1', label: 'Very beginner', next: 'Finish your first story or practise 5 grammar topics to move up.' };
}
