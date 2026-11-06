import { ex, fill, fix, type GrammarTopic, match, mc, table, tip } from '../types';

export const prepositionTopics: GrammarTopic[] = [
  {
    id: 'prep-place',
    category: 'prepositions',
    title: 'Prepositions of place',
    titleSv: 'Var? – i, på, hos, vid, under, över',
    level: 'A1-A2',
    summary: 'i Sverige, på jobbet, hos Karin, vid sjön.',
    lesson: [
      table(['Preposition', 'Use', 'Examples'], [
        ['i', 'inside; countries and cities', 'i rummet, i Sverige, i Umeå'],
        ['på', 'on a surface; many places and institutions; islands', 'på bordet, på jobbet, på sjukhuset, på Gotland'],
        ['hos', 'at someone\'s home or business', 'hos Karin, hos tandläkaren'],
        ['vid', 'by, next to', 'vid sjön, vid bordet'],
        ['under', 'under', 'under sängen'],
        ['över', 'over, above', 'över stan'],
      ]),
      ex(['Jag bor i Göteborg.', 'I live in Gothenburg.'], ['Hon är på bio.', 'She is at the cinema.'], ['Vi äter middag hos min syster.', 'We are having dinner at my sister\'s.']),
      tip('"I" or "på" with places is often idiomatic: i skolan / på universitetet, i affären / på apoteket. Learn them as phrases.'),
    ],
    exercises: [
      mc('e1', 1, 'Choose the preposition.', 'Nadia bor ___ Uppsala.', ['på', 'i', 'hos'], 1, 'Cities and countries take i.'),
      mc('e2', 1, 'Choose the preposition.', 'Kaffet står ___ bordet.', ['på', 'i', 'över'], 0, 'On a surface: på.'),
      mc('e3', 2, 'Choose the preposition.', 'Jag har en tid ___ tandläkaren.', ['på', 'hos', 'vid'], 1, 'At a person\'s place or business: hos.'),
      fill('e4', 2, 'Write the missing preposition.', 'Daniel jobbar ___ ett stort företag.', ['på'], 'Working at a company/workplace: på (på jobbet, på företaget).', 'Daniel works at a big company.'),
      match('e5', 2, 'Match the preposition with a place.', [['på', 'Gotland'], ['i', 'Stockholm'], ['hos', 'doktorn']], 'Islands take på, cities take i, and people (or their workplace) take hos.'),
      fix('e6', 3, 'Vi bodde på Malmö i två år.', ['Vi bodde i Malmö i två år.', 'Vi bodde hos Malmö i två år.', 'Vi bodde vid Malmö i två år.'], 0, 'Cities take i: i Malmö.'),
    ],
  },
  {
    id: 'prep-direction-time',
    category: 'prepositions',
    title: 'Direction, time and more',
    titleSv: 'till, från, med, för, av, om',
    level: 'A2',
    summary: 'åka till, komma från, åka med buss, för ett år sedan.',
    lesson: [
      table(['Preposition', 'Meaning', 'Examples'], [
        ['till', 'to (direction)', 'Jag åker till jobbet.'],
        ['från', 'from', 'Hon kommer från Syrien.'],
        ['med', 'with; by (transport)', 'Jag fikar med Karin. Vi åker med buss.'],
        ['för', 'for; … ago (för … sedan)', 'Tack för maten! för två år sedan'],
        ['av', 'of, by, made of', 'ett hus av trä, en bok av Astrid Lindgren'],
        ['om', 'about; in (future time)', 'en bok om Sverige, om en vecka'],
      ]),
      ex(['Jag flyttade hit för tre år sedan.', 'I moved here three years ago.'], ['Vi ses om en timme.', 'See you in an hour.']),
      tip('Time: "för … sedan" points back (ago), "om …" points forward (in), "i …" gives the duration: "Jag bodde där i fem år."'),
    ],
    exercises: [
      mc('e1', 1, 'Choose the preposition.', 'Daniel kommer ___ Brasilien.', ['till', 'från', 'av'], 1, 'Origin: från.'),
      mc('e2', 1, 'Choose the preposition.', 'Vi åker ___ tåg till Stockholm.', ['med', 'på', 'av'], 0, 'Means of transport: med (med tåg, med buss, med bil).'),
      mc('e3', 2, 'Choose the preposition.', 'Bussen går ___ tio minuter.', ['för', 'om', 'i'], 1, 'Future time from now: om (in ten minutes).'),
      fill('e4', 2, 'Fill in the missing word.', 'Jag kom till Sverige ___ fem år sedan.', ['för'], '"för … sedan" = … ago.', 'I came to Sweden five years ago.'),
      match('e5', 2, 'Match the phrases.', [['ett hus', 'av trä'], ['en film', 'om vikingar'], ['tack', 'för hjälpen'], ['vi åker', 'till stranden']], 'av = made of, om = about, för = for, till = direction.'),
      fix('e6', 3, 'Jag har bott här för två år.', ['Jag har bott här i två år.', 'Jag har bott här om två år.', 'Jag har bott här till två år.'], 0, 'Duration uses i: i två år (for two years). "För två år sedan" would mean "two years ago".'),
    ],
  },
];
