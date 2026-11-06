# Saga on your iPhone: updating, new phone, troubleshooting

The first install is described step by step in the [README](../README.md#install-it-on-your-iphone). This page
covers what comes after.

Your laptop is the server: `npm run web:serve:https` serves the app over HTTPS on your Wi-Fi, and the iPhone
installs it from there. Once installed, the app runs from the phone by itself, with no laptop and no internet.

---

## Updating the app

Do this after you changed something in the code, or pulled a new version.

1. On the laptop: `npm run web:serve:https` (it rebuilds the app) and leave it running.
2. On the iPhone (same Wi-Fi): open Saga **once**. It downloads the new version in the background.
3. **Close Saga completely** (swipe it away in the app switcher) and open it again. Now it is the new version.

Your words and progress are kept.

## A new phone

1. **Old phone:** *Settings › Export backup* and save the file (iCloud Drive, AirDrop, email).
2. **Laptop:** `npm run web:serve:https`. You do **not** need `npm run cert` again: the certificate authority
   already exists on the laptop.
3. **New phone:** do README steps 2 and 3 (install and trust the certificate, then add to Home Screen).
4. **New phone:** *Settings › Restore from backup* and choose the file.

The detailed certificate steps, with fixes for problems, are in [CERTIFICATE.md](CERTIFICATE.md).

## Backups

Everything you do (saved words, progress, quiz results, settings) is stored in the phone's browser storage for the
Saga app. Use *Settings › Export backup* regularly. The backup is a small `.json` file; *Restore from backup*
replaces the data on the phone with it. Imported stories are not part of the backup: export them from each book page
as a story package (*Export as story package*) and import them again.

## If the laptop's address changes

The installed app belongs to the exact address it was installed from (for example `https://192.168.1.91:8443`). If your
router gives the laptop a new IP address, follow [CERTIFICATE.md](CERTIFICATE.md#the-laptops-ip-address-changed).
Tip: reserve a fixed address for the laptop in your router settings so this never happens.

## Removing the app

Long-press the Saga icon on the Home Screen › **Remove App**. Its stored data goes with it, so export a backup first.

---

## Troubleshooting

| Problem | What to do |
|---|---|
| **No sound** when you tap the play button or a speaker | First check the **silent switch** on the side of the iPhone (orange = silent: flip it) and the volume. Then *Saga › Settings › Voice check* and *Play test tone*. A Swedish voice must be installed: iOS *Settings › Accessibility › Spoken Content › Voices › Swedish*. |
| Safari says the page isn't private / can't be opened | The certificate isn't trusted yet, or the laptop's address changed: [CERTIFICATE.md](CERTIFICATE.md). |
| The page doesn't load at all | Is `npm run web:serve:https` still running in a terminal? Are both devices on the same Wi-Fi? Are the ports 8090 and 8443 allowed by the firewall? Are you using the address the terminal printed? |
| "Add to Home Screen" is missing | Use **Safari**, not Chrome or the browser inside another app. |
| The app shows an old version | Open it, close it completely, open it again (see *Updating the app*). |
| Words or progress disappeared | iOS clears web-app storage when the phone is nearly full, or if the Home Screen icon was recreated from a different address. Restore from your backup. |
| Press and hold doesn't open the dictionary | Hold a word for about half a second without moving the finger. A quick tap does nothing on purpose (so swiping pages never opens it). |
| The first start is slow | The first launch downloads the whole app. Wait for it to finish before going offline. |
