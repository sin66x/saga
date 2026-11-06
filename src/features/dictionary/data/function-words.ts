// Pronouns, adverbs, prepositions, conjunctions, numerals, interjections and determiners.
// Format: x <pos> <lemma> [forms…] = english [| note]
export default `
# --- pronouns ---
x pron jag = I
x pron mig = me | Object form of "jag". Also pronounced "mej".
x pron du = you (one person)
x pron dig = you (object) | Object form of "du". Ta av dig skorna = take off your shoes.
x pron han = he
x pron honom = him | Object form of "han".
x pron hon = she
x pron henne = her | Object form of "hon".
x pron vi = we
x pron oss = us | Object form of "vi".
x pron ni = you (plural)
x pron er = you (plural object), your
x pron de = they | Pronounced "dom".
x pron dem = them | Object form of "de". Pronounced "dom".
x pron den = it (en-words), the | Also used as the article before adjectives: den gamla skogen.
x pron det = it, that, there | Det finns = there is. Also "the" before adjectives with ett-words.
x pron man = one, you, people | General subject: man tar av sig skorna = you take your shoes off.
x pron sig = himself, herself, itself, themselves | Reflexive: ta av sig, lära sig, röra sig.
x pron min mitt mina = my, mine
x pron din ditt dina = your, yours
x pron hans = his
x pron hennes = her, hers
x pron vår vårt våra = our, ours
x pron deras = their, theirs
x pron sin sitt sina = his/her/its/their own | Reflexive possessive – refers back to the subject.
x pron ingen inget inga = no, nobody, nothing
x pron någon något några = some, any, someone, something | Något gott = something tasty.
x pron någons = someone's
x pron alla = all, everyone
x pron allt = everything, all
x pron vad = what
x pron vem = who
x pron vilken vilket vilka = which, what (a) | Vilken lång resa! = What a long journey!
x pron varje = every, each
x pron flera = several
x pron flesta = most | De flesta = most (people/things).
x pron många = many | Comparative: fler = more.
x pron fler = more (in number) | Fler än = more than.
x pron samma = same
x pron själv själva = (my/your/him)self, oneself | De ville bestämma själva = they wanted to decide for themselves.
x pron annan annat andra = other, another, else
x pron vissa = certain, some
x pron som = who, which, that | Relative pronoun: ett museum som heter … Also: as, like.
x pron detta denna dessa = this, these

# --- articles / determiners ---
x det en = a, an, one | Indefinite article for en-words. Also the number one.
x det ett = a, an, one | Indefinite article for ett-words. Also the number one.

# --- adverbs ---
x adv aldrig = never
x adv alls = at all | Inte alls = not at all. Knappt alls = hardly at all.
x adv alltid = always
x adv annars = otherwise, or else
x adv bara = only, just
x adv bort = away (direction)
x adv bredvid = next to, next door
x adv cirka = about, approximately
x adv där = there, where
x adv därför = therefore, that's why
x adv däremellan = in between
x adv då = then, at that time
x adv dags = time (to do something) | Det är dags för … = it's time for …
x adv drygt = just over, a little more than
x adv efteråt = afterwards
x adv ens = even | Inte ens = not even.
x adv fortfarande = still
x adv fram = forward, out | Ta fram = take out.
x adv förr = before, in the past | Förr i tiden = in the old days.
x adv först = first, at first
x adv förut = before, previously
x adv helst = preferably | Var som helst = anywhere. Vad som helst = anything.
x adv helt = completely, totally
x adv hem = home (direction) | Gå hem = go home.
x adv hemma = at home
x adv här = here
x adv hur = how
x adv ibland = sometimes
x adv idag = today
x adv igen = again
x adv in = in, into (direction)
x adv inne = inside, in
x adv inte = not
x adv ju = you know, of course | Ju mer …, desto … = the more …, the …
x adv desto = the (in comparisons) | Ju mer du läser, desto lättare blir det = the more you read, the easier it gets.
x adv just = just, exactly
x adv kanske = maybe, perhaps
x adv lite = a little, a bit
x adv länge = for a long time
x adv längre = longer, further, any longer | Inte längre = no longer.
x adv mer = more
x adv mest = most, mostly
x adv mycket = very, much, a lot
x adv ner = down (direction)
x adv nere = down (location)
x adv norrut = northwards, further north
x adv nu = now
x adv nästan = almost
x adv också = also, too
x adv ofta = often
x adv precis = exactly, just | Precis lagom = just right.
x adv redan = already
x adv sedan = then, since, ago | För 12 000 år sedan = 12,000 years ago. Also written "sen".
x adv senare = later
x adv snart = soon
x adv särskilt = especially
x adv så = so, like that, then | Om man säger klockan tre, så kommer man klockan tre.
x adv tillbaka = back
x adv tillsammans = together
x adv tyvärr = unfortunately
x adv ungefär = about, approximately
x adv upp = up (direction)
x adv uppe = up (location)
x adv ut = out (direction)
x adv ute = outside, out (location)
x adv utanför = outside
x adv verkligen = really
x adv än = than, still | Än idag = still today. Större än = bigger than.
x adv ända = all the way | Ända till = all the way to.
x adv ändå = still, nevertheless, anyway
x adv äntligen = finally, at last
x adv även = even, also | Även när = even when. Även om = even if.
x adv österut = eastwards, to the east
x adv vare = thanks (to) | Only in "tack vare" = thanks to.
x adv hundratals = hundreds (of)
x adv nära = near, close | För nära = too close.
x adv var = where | Also the past tense of "vara" (was) and "each" in some expressions.
x adv varför = why
x adv när = when | Question word: När kommer du? Also a conjunction.
x adv knappt = barely, hardly
x adv lagom = just right, just enough
x adv allvarligt = seriously
x adv vänligt = kindly, in a friendly way
x adv plötsligt = suddenly
x adv långsamt = slowly
x adv snabbt = quickly
x adv sent = late
x adv tidigt = early
x adv inomhus = indoors
x adv utomhus = outdoors
x adv imorgon = tomorrow
x adv igår = yesterday
x adv alltså = so, therefore, that is
x adv kvar = left, remaining
x adv hit = here (direction)
x adv dit = there (direction)

# --- prepositions ---
x prep av = of, by, from | Hus av trä = houses of wood. Ta av sig = take off.
x prep efter = after
x prep från = from
x prep för = for, too, ago | För mycket = too much. För … sedan = … ago.
x prep före = before | Tränga sig före = jump the queue.
x prep genom = through
x prep hos = at (someone's place), with | Hos Karin = at Karin's.
x prep i = in, at, for | I Sverige, i juni, i fyra dagar.
x prep med = with | Also: along, too (hålla med = agree).
x prep mellan = between
x prep mot = towards, against
x prep om = about, in (time) | En bok om Sverige. Also a conjunction: if.
x prep på = on, at, in | På bordet, på sjukhuset, på vintern.
x prep runt = around | Dygnet runt = around the clock.
x prep till = to, for | Till exempel = for example.
x prep under = under, during
x prep utan = without | Also a conjunction: but (rather).
x prep vid = by, at, next to
x prep över = over, across, above
x prep per = per
x prep enligt = according to
x prep bland = among
x prep sedan = since | Sedan 1960 = since 1960.

# --- conjunctions & particles ---
x conj och = and | Pronounced "å" in everyday speech.
x conj men = but
x conj eller = or
x conj att = that, to | Infinitive marker: att resa = to travel. Also "that": Hon säger att …
x conj om = if, whether
x conj eftersom = because, since
x conj innan = before
x conj trots = despite | Trots att = although, even though.
x conj medan = while
x conj tills = until
x conj fast = although, but
x conj så_att = so that
x conj därför_att = because

# --- numerals ---
x num noll = zero
x num två = two
x num tre = three
x num fyra = four
x num fem = five
x num sex = six
x num sju = seven
x num åtta = eight
x num nio = nine
x num tio = ten
x num elva = eleven
x num tolv = twelve
x num tjugo = twenty
x num tjugoåtta = twenty-eight
x num trettio = thirty
x num nittio = ninety
x num hundra = hundred
x num tusen = thousand
x num första = first
x num andra = second | Also: other (de andra = the others).
x num tredje = third
x num fjärde = fourth

# --- interjections ---
x interj hej = hi, hello
x interj ja = yes
x interj nej = no
x interj tack = thank you, thanks | Tack vare = thanks to.
x interj hejdå = goodbye
x interj förlåt = sorry
x interj ursäkta = excuse me
x interj välkommen = welcome

# --- months & days (written in lower case in Swedish) ---
x noun januari = January
x noun februari = February
x noun mars = March
x noun april = April
x noun maj = May
x noun juni = June
x noun juli = July
x noun augusti = August
x noun september = September
x noun oktober = October
x noun november = November
x noun december = December
x noun måndag = Monday
x noun onsdag = Wednesday
x noun söndag = Sunday

# --- song titles / fixed expressions ---
x noun helan = the first glass (of snaps) | "Helan går" (= down goes the first one) is the most famous Swedish drinking song.
`;
