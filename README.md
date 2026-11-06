# Saga – learn Swedish by reading

Saga is a web app for learning Swedish through illustrated stories that feel like a children's
book. While you read, you press and hold any word to see its translation, base form and grammar,
and save it to **My Words**. It also has spaced-repetition review, SFI-style grammar lessons with
explained exercises, story quizzes, and a Swedish history & culture section.

You install it on your iPhone's Home Screen (a "PWA"). After that it runs **by itself and offline**. Your
laptop is only needed for the first install and for updates. It is free: no server, no accounts, no Apple
Developer account.

* **3 illustrated stories** (A1 → B1), 48 pages and ~2,900 words of original Swedish:
  *Sveriges historia*, *Livet i Sverige*, *Ett år i Sverige*
* **Offline Swedish–English dictionary** (~950 words, ~3,300 forms) with an honest "not found"
* **29 grammar topics** following SFI, ~190 exercises, each with an explanation
* **Spaced repetition** and 6 vocabulary exercise types; **read aloud** with the iPhone's Swedish voice
* **Import new stories** (ZIP/JSON) without changing any code: see [docs/STORY_FORMAT.md](docs/STORY_FORMAT.md)

---

## Install it on your iPhone

**What you need:** a laptop with [Node.js](https://nodejs.org) 20 or newer, an iPhone with Safari, and both on the
**same Wi-Fi**.

**How it works:** the laptop serves Saga over HTTPS for a few minutes. Your iPhone opens it in Safari and adds it
to the Home Screen. HTTPS needs a certificate that the iPhone trusts, so step 2 creates a private one on your laptop
and step 4 teaches your iPhone to trust it (once).

### 1. On the laptop: get the code and start

```bash
npm install
npm run cert                 # once: creates a private certificate for this laptop (stored in ~/.saga-certs)
npm run web:serve:https      # builds the app and serves it. Leave this terminal open!
```

The last command prints two addresses, for example:

```
Saga is served on  https://192.168.1.91:8443
Certificate download: http://192.168.1.91:8090/rootCA.pem
```

*Use the addresses your terminal prints in the steps below.* If your laptop has a firewall (`ufw`), allow the
two ports: `sudo ufw allow 8090/tcp && sudo ufw allow 8443/tcp`.

### 2. On the iPhone: install the certificate (once)

1. Open **Safari** and go to `http://192.168.1.91:8090` (the **http** address, port 8090).
2. Tap **Download the certificate** and choose **Allow**.
3. Open the **Settings** app. At the top tap **Profile Downloaded** › **Install** › enter your passcode ›
   **Install** › **Install** › **Done**.
   (If you don't see it: *Settings › General › VPN & Device Management*.)
4. **Settings › General › About › Certificate Trust Settings** (at the very bottom of *About*) and switch
   **on** "Saga local CA". **Don't skip this step**, or Safari keeps warning you.

### 3. On the iPhone: add Saga to the Home Screen

1. In **Safari** open `https://192.168.1.91:8443` (the **https** address, port 8443). The page opens with no warning.
2. Tap the **Share** button (square with an arrow) › **Add to Home Screen** › **Add**.
3. Open **Saga from the Home Screen** (not from Safari) and wait a few seconds: the first start downloads the
   whole app (about 8 MB).

Done. You can stop the laptop now: Saga works offline from the Home Screen. 🎉

### Using it day to day

* **Read:** swipe or use the arrows. **Press and hold a word** (about half a second, without moving) to see what it
  means; tap **Add to My Words** to save it. The round **play** button reads the page aloud.
* **If there is no sound:** flip the **silent switch** on the side of the iPhone (no orange), check the volume, then
  *Saga › Settings › Voice check*.
* **Back up your data now and then:** *Settings › Export backup*. Your words and progress live in the phone's browser
  storage, and iOS can clear that if the phone is nearly full.

### Updating, a new phone, or something doesn't work

* **Update the app after changing code:** [docs/INSTALL.md](docs/INSTALL.md#updating-the-app)
* **Set up a second or new phone:** [docs/INSTALL.md](docs/INSTALL.md#a-new-phone) and
  [docs/CERTIFICATE.md](docs/CERTIFICATE.md)
* **Safari warns about the certificate, the laptop's address changed, the certificate expired:**
  [docs/CERTIFICATE.md](docs/CERTIFICATE.md)
* **Other problems:** [docs/INSTALL.md](docs/INSTALL.md#troubleshooting)

---

## Development

```bash
npm install
npm run dev                  # development server in the browser: http://localhost:8081
npm run check                # type check + unit tests + story/dictionary check
npx eslint src               # lint
npm run web:build            # production build into dist/ (includes the offline service worker)
npm run web:serve            # serve that build on http://localhost:8090
```

Built with TypeScript, React Native for Web and SQLite (running as WebAssembly in the browser).
Architecture, database schema and design decisions: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### Stories and content

The built-in stories live in `content/stories/<id>/` in the same format as importable packages. After editing
them run:

```bash
npm run content:build        # renders the illustrations, validates the stories, compiles them into the app
npm run content:check        # checks that every word of every story is in the dictionary
```

`content:build` also writes importable example ZIPs to `content/dist/`. To add a story without touching
code, see [docs/STORY_FORMAT.md](docs/STORY_FORMAT.md): it includes a ready-to-use prompt for asking Claude to write one,
and you import the ZIP with **Books › Import** in the app.

### Project structure

```
src/
  app/                 screens (file-based routing): home, books, reader, vocabulary, practice, quiz, grammar, import …
  components/          shared UI (cards, buttons, book cover, illustration, text)
  content/             story types, bundled + imported story loading
  db/                  SQLite migrations, repositories, backup, useDbQuery hook
  features/
    reader/            paginated reader, press-and-hold lookup, dictionary popover
    dictionary/        offline dictionary data, word resolver, English inflection
    vocabulary/        spaced repetition, exercise generator, forms table
    exercises/         exercise renderers, session runner, answer checking
    grammar/           29 SFI topics (lessons + exercises)
    import/            package unpacking, validation, import/export
    quiz/, progress/, settings/
  lib/                 tokenizer, speech, files, small utilities
  theme/               design tokens (colours, typography, spacing)
public/                web app manifest and icons
content/stories/       the built-in story packages (source of truth)
content/dist/          example importable ZIPs (generated)
scripts/               content build, illustration kit, web build (service worker), HTTPS server, certificate
docs/                  install guide, certificate guide, architecture, story format
```
