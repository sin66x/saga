# The certificate: how it works and how to fix it

When you install Saga from your laptop, the iPhone has to open the laptop's address over **HTTPS**. iOS only lets a
web app work offline (and only lets its database run) on a *secure* page. A laptop on your Wi-Fi has no certificate
that phones trust, so `npm run cert` creates one:

| File (in `~/.saga-certs/`) | What it is | Share it? |
|---|---|---|
| `rootCA.pem` | The public part of your **own certificate authority** ("Saga local CA"). This is what the phone is asked to trust. | Yes, this is the file the phone downloads. |
| `rootCA-key.pem` | The **secret key** of that authority. | **Never.** With it, someone could impersonate any website on a phone that trusts `rootCA.pem`. Keep it on the laptop only. |
| `server.pem` / `server-key.pem` | The HTTPS certificate for the laptop's address, signed by your authority. Valid 800 days (the longest iOS accepts). | No (the server uses them). |
| `address.txt` | The IP address the certificate was made for. | |

The phone only trusts `rootCA.pem` once. After that, any server certificate signed by it works, until it expires or
the address changes.

---

## Setting up a new phone (the usual case)

The authority already exists on the laptop. **Do not run `npm run cert` again.** Just make the new phone trust it.

**On the laptop**

```bash
npm run web:serve:https      # leave it running
```
Note the address it prints, for example `https://192.168.1.91:8443`.
If a firewall is active: `sudo ufw allow 8090/tcp && sudo ufw allow 8443/tcp`.

**On the new iPhone** (same Wi-Fi as the laptop, use **Safari**)

1. Open `http://192.168.1.91:8090` (the same address, port **8090**, plain `http`).
2. Tap **Download the certificate** and choose **Allow** when iOS asks to download a configuration profile.
3. Open **Settings**. At the top you'll see **Profile Downloaded** (if not: *Settings › General › VPN & Device Management*).
   Tap it › **Install** › enter the passcode › **Install** › **Install** again › **Done**.
4. Open **Settings › General › About › Certificate Trust Settings** (at the very bottom of *About*).
   Under *Enable full trust for root certificates*, switch **on** "Saga local CA (…)" and confirm.
   **Without this step Safari keeps showing a certificate warning.**
5. In Safari open `https://192.168.1.91:8443`. It should open **without any warning**.
6. **Share › Add to Home Screen**, then open Saga from the Home Screen.

Then restore your data if this phone is new: *Saga › Settings › Restore from backup*.

---

## Fixing common problems

### Safari says "This connection is not private" / "Cannot verify server identity"
* The profile isn't trusted yet. Do step 4 above (*Certificate Trust Settings*). Installing the profile alone isn't enough.
* The phone's **date and time** must be correct (turn on *Set Automatically*). A certificate looks "not valid yet" or
  "expired" if the clock is wrong.
* You opened a different address than the one the certificate was made for (for example the laptop's name instead of the
  IP, or an old IP). Use exactly the address the terminal prints.

### The laptop's IP address changed
The certificate and the installed app are tied to the address, so this needs a short routine:

1. **Export a backup** from the installed app (*Settings › Export backup*) if it still opens.
2. On the laptop: `npm run cert` (it reuses your authority and creates a new server certificate for the new address;
   you can also give it explicitly: `npm run cert -- 192.168.1.50`).
3. `npm run web:serve:https`.
4. On the phones: open the **new** address in Safari and **Add to Home Screen** again. (A new address is a new app with
   empty storage.) Then *Restore from backup*. Phones that already trust the authority don't need the profile again.
5. Remove the old Saga icon.

**Tip:** in your router's settings, reserve a fixed ("static DHCP") address for the laptop so this doesn't happen again.

### The certificate expired (after about 2 years)
Run `npm run cert` again. It keeps the authority and creates a fresh server certificate; phones need nothing new.
Restart `npm run web:serve:https`. You can check the dates with:

```bash
openssl x509 -in ~/.saga-certs/server.pem -noout -dates
```

### I lost `~/.saga-certs`, or I'm using a different laptop
Run `npm run cert` on the new laptop: it creates a **new** authority. Every phone then has to install and trust the new
profile (steps above), and because the address is probably different too, reinstall the app and restore a backup.
To avoid this, copy the whole `~/.saga-certs` folder to the new laptop (keep it private, `chmod 700`), then run
`npm run cert` there to get a certificate for its address.

### The profile page never appears / "Cannot connect to server" on `http://…:8090`
* Is `npm run web:serve:https` running? The terminal must show both addresses.
* Same Wi-Fi? Guest or "isolated" Wi-Fi networks block devices from talking to each other.
* Firewall: `sudo ufw status`, then `sudo ufw allow 8090/tcp && sudo ufw allow 8443/tcp`.
* Try the laptop from another device's browser to see if it's the phone or the network.

### I want to check the certificate from the laptop
```bash
# Is the server certificate valid for this address and signed by our authority?
openssl verify -CAfile ~/.saga-certs/rootCA.pem ~/.saga-certs/server.pem
openssl x509 -in ~/.saga-certs/server.pem -noout -subject -dates -ext subjectAltName

# Does the running server present it correctly? (trusting only our authority)
curl --cacert ~/.saga-certs/rootCA.pem -sI https://192.168.1.91:8443/ | head -3
```

### Removing the trust again
On the phone: *Settings › General › VPN & Device Management* › "Saga local CA" › **Remove Profile**.
After this the phone no longer trusts the laptop's certificates. I haven't tested whether an app that is *already
installed* keeps working offline after the profile is removed, so remove it only once you have a backup and don't need
the laptop to update the app. Delete `~/.saga-certs/rootCA-key.pem` too if you will never create certificates again.
