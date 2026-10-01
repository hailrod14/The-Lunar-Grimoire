# 🌙 The Lunar Grimoire

*A witchy menstrual, medication, and mood tracker, bound as a pixel-art celestial grimoire.*

The Lunar Grimoire turns your cycle into a personal **Lunar Tide**, your moods into the **four elements**, and your medications and supplements into a **Potion & Elixir Cabinet**. Every day gets its own page in a Minecraft-style **Book & Quill** journal. You can revisit any day in the **Grimoire Archive**.

> 🔒 **Your data never leaves your device.** There are no accounts, no servers, and no tracking or analytics. Everything is stored locally in your browser.

**🔮 Live app:** https://hailrod14.github.io/The-Lunar-Grimoire/

> ✨ **Status:** Phase 1 (MVP) is complete.

---

## ✨ Features

### 🌑 The Lunar Dashboard
Your cycle day, shown as a phase of your personal **Lunar Tide**:

| Tide Phase | Cycle Phase | When |
|---|---|---|
| 🌑 **Dark Moon** | Menstrual | From "My tide has begun" until "My tide has ended" |
| 🌒 **Waxing** | Follicular | After bleeding ends, before the Full Moon window |
| 🌕 **Full Moon** | Ovulatory | Estimated ovulation ± 1 day |
| 🌘 **Waning** | Luteal | After the Full Moon window, until your next tide |

- **Tide toggle:** tap *"My tide has begun"* and *"My tide has ended"* to mark your period.
- **Flow logging:** on bleeding days, choose Spotting, Light, Medium, Heavy, or Clots.
- **Sky Moon:** the real moon phase appears in a small silver badge, kept visually separate from your gold personal Tide. When both are in the same phase, you'll see a ✨ *Aligned* flourish.

### 🔥💧🌍💨 Mood Elements
Log how you feel in the **Morning**, **Afternoon**, and **Night**. For each time of day, you can log one or more elements:

| Element | Light Aspect | Shadow Aspect |
|---|---|---|
| 🔥 **Fire** | Passionate | Irritable |
| 💧 **Water** | Intuitive | Emotional |
| 🌍 **Earth** | Grounded | Tired |
| 💨 **Air** | Creative | Anxious |

Each element entry has an **intensity from 1 to 5** and an **aspect** (Light, Shadow, or Mixed). Every element has its own named scale, so you rate things the same way every day:

| # | 🔥 Fire | 💧 Water | 🌍 Earth | 💨 Air | Meaning |
|---|---|---|---|---|---|
| 1 | Ember | Mist | Pebble | Breath | Barely there |
| 2 | Kindling | Stream | Stone | Breeze | Noticeable, but easy to set aside |
| 3 | Flame | River | Boulder | Gust | Clearly present and shaping your choices |
| 4 | Blaze | Tide | Mountain | Gale | Strong and hard to ignore |
| 5 | Wildfire | Tsunami | Bedrock | Tempest | Overwhelming. It's in charge today. |

### 📖 Book & Quill Journal
Each day has its own parchment book for writing about the day.
- Page-flip navigation (`◀ Page 2 of 3 ▶`), inspired by Minecraft's Book & Quill.
- Text flows onto new pages automatically. There's no character limit.
- Your writing autosaves as you type.

### ⚗️ Potion & Elixir Cabinet
A checklist for your daily medications and supplements.
- **Customize each potion** with a name, dose, scheduled time, vessel, and liquid color.
- **Vessels:** Round Flask · Tall Vial · Tincture Dropper · Herb Bundle · Crystal · Tiny Cauldron.
- **Check off** a potion to record the time you took it and trigger a ✨ golden sparkle.
- **Extra doses:** log an as-needed dose of any potion, each with its own time.
- **As-needed-only potions** stay off the daily checklist but are always one tap away.
- **Edit past entries** at any time. Each log keeps the potion's name and dose from that day, so renaming or retiring a potion never rewrites your history.

### 📜 The Grimoire Archive
A pixel-art monthly calendar of your history. Each day tile shows:
- a **tide color band** for the cycle phase,
- a 🩸 **drop** on bleeding days,
- up to four **element pips**,
- a **potion dot** (gold means every potion was taken, dim means some were missed).

Tap any day to open and edit its full entry.

### 🪄 First-Run Ritual
A three-page setup when you first open the app:
1. **Your last tide:** when your last period started, with an option to skip cycle tracking.
2. **Your rhythm:** typical cycle and period length. If you're not sure, the app uses 28 and 5 days.
3. **Stock your cabinet:** add your first potions. You can skip this step.

### 🌕 The Wheel of the Year
The calendar marks the eight sabbats (Samhain, Yule, Imbolc, Ostara, Beltane, Litha, Lughnasadh, Mabon) and every new and full moon, with traditional names like the Harvest and Hunter's Moons and Blue Moons. Moon phases and solstices are computed precisely on your device (Meeus's astronomical algorithms). Choose northern or southern hemisphere in Settings. Each day you can draw a card from the tarot's Major Arcana or cast an Elder Futhark rune; the draw is kept with the day.

### 🐈‍⬛ Familiars
Adopt a small companion: a cat, dog, fox, owl, frog, spider, fish, bat, dragon, griffin, or phoenix, in six or seven colours each, with a name of your choosing. Your familiar follows your tide (or the sky's moon if you don't track a cycle): asleep on a cushion in the Dark Moon, curious as it waxes, glowing and hopping at the Full Moon, and tucked in with a cup of tea as it wanes. Tap to pet them. Dress them up from the wardrobe: hats, crowns, and neckwear, plus seasonal pieces (a pumpkin hat in autumn, a Yule hat in December, a flower crown in spring…) that join the wardrobe when their season arrives and stay once collected.

Your familiar sits on the cover as a die-cut sticker of today's mood, and earns more stickers along the way: one for each sabbat, each new cycle, every 7 days of potions in a row, and each seasonal piece. Each keeps the look your familiar had that day, so the cover becomes a scrapbook of your year. Drag stickers anywhere on the cover; choose which ones show from the sticker album. Your familiar also visits other pages: cheering when you check off a potion, napping in the Book & Quill, peeking over the cabinet shelf, and bringing a hot water bottle the day your tide begins (all of which can be switched off).

### 🌙 Rest, Energy & Prompts
Log last night's sleep (hours and how you slept) and today's energy on the day page; the Scrying Glass shows how they move through your tide, and the doctor-visit summary includes the averages. Each day's journal offers a prompt suited to your phase, the moon, or the sabbat, and new and full moons come with a small ritual.

### 🧪 Apothecary Shelf
Keep count of any potion's supply: each dose you check off comes off the count, the cabinet shows how many days are left, a gentle nudge appears when it's time to refill, and restocking is one tap.

### 🔔 Home-Screen Reminders
With the small reminder service in `/push` (a Cloudflare Worker) deployed, each device can be reminded at dose times even with the Grimoire closed. The service learns only reminder times and opaque ids, never potion names; a dose already checked off on any device doesn't ring.

### 🎂 Holidays & Occasions
Public holidays and well-loved observances for the US, Canada, the UK, or Australia, plus your own birthdays, anniversaries, celebrations, and remembrances (yearly or one-time, with ages counted if you add the year). Each shows as a small mark in the day's right-hand column on the calendar and is named on the day's page.

### ☁️ Sync Across Devices (optional)
Sign in with Google and choose a sync passphrase, and your Grimoire stays the same on your phone and computer. Everything is compressed and encrypted on your device with your passphrase before it's uploaded (AES-256-GCM, PBKDF2-derived key), so the sync server only ever holds data it can't read. Changes sync within moments and whenever the app opens; entries made on two devices at once are merged, not overwritten. With a PIN set, the sync key is sealed under the PIN too.

### 👓 Reading Comfort
Words you read use Atkinson Hyperlegible Next, a typeface designed by the Braille Institute so every letter is distinct, while titles keep their pixel lettering. Per device, choose Storybook (pixel titles), Easy-read everywhere, or All pixel, and Regular, Large, or Larger text.

### 🎨 Themes
Midnight, Parchment (light), Enchanted Forest, and Rose Quartz, or let the Grimoire match your device or follow the seasons. A clasp charm under the ribbons closes the book back onto its cover.

### 📄 Doctor-Visit Summary
A plain, printable report of periods, cycle lengths, symptoms, and medication adherence over 3, 6, or 12 months. Save it as a PDF from the print dialog. Your journal is never included.

### 💾 Export / Import Grimoire
Back up everything to a `.json` file and restore it on any device. Import checks the file and asks before overwriting anything. On a new device, choose **Restore from a backup** on the welcome page to skip setup. Settings shows when you last backed up.

### ⚙️ Settings
- Turn cycle tracking on or off (your tide history is kept either way).
- See whether your rhythm is learned or estimated, and adjust your estimates.
- **Tide history:** edit or delete any logged tide, or add past tides so the Grimoire learns your rhythm sooner.
- Start over by erasing the Grimoire (with a confirmation).

### 📖 A Real Book
The Grimoire opens on a tooled-leather cover showing your current Tide moon. Pages turn with a pixel page-curl and the soft breath of a turning page (the cover settles with a low thump). Optional **cozy forest music** is generated live in your browser: warm pads, a wandering music box, wind in the trees, crickets, a crackling hearth, and the occasional owl. It never repeats, needs no downloads, and pauses when you leave. Toggle it with the ♪ charm under the ribbons, and adjust page sounds and music volume in Settings. On wide screens the book lies open as a two-page spread: the calendar on the left, everything else on the right.

### 📱 Works Everywhere, Even Offline
The Grimoire is a **Progressive Web App (PWA)**:
- **Phone:** install it to your home screen and use it like a native app, with a bottom tab bar.
- **Desktop:** it opens as a two-page, open-book layout.
- **Offline:** it works fully offline after the first visit.

---

## 🌗 How Your Tide Is Calculated

- **Cycle length** is the average of your last 3–6 completed cycles, limited to 21–45 days. Until you've logged enough cycles, it uses your onboarding answer.
- **Period length** is learned the same way.
- **Estimated ovulation** is your predicted next period minus 14 days.
- **Predictions are gentle guesses.** If your tide is late, the app says *"The waning lingers… your tide may be near."* After 10 days of bleeding, it asks whether your tide has ended.
- **Sky Moon** is calculated offline from a known new-moon date and the 29.53-day lunar cycle. It's accurate to within about a day.

> ⚠️ **The Lunar Grimoire is a personal reflection tool, not a medical device.** Cycle predictions are estimates and must **not** be used for contraception or to plan a pregnancy. For health concerns, talk to a qualified healthcare provider.

---

## 🔒 Privacy

- All data is stored in your browser's `localStorage` on your device.
- There are no ads, no analytics, and no tracking. Sync is optional; when it's on, only an encrypted copy (that the server can't read) is stored in Firebase under your Google account.
- This repository is public, but it contains only the app's code, **never your entries**.

**Please keep in mind:**
- Anyone with access to your browser profile can open the app and see your data.
- **Clearing your browser data permanently deletes your Grimoire.** Export a backup regularly.
- Without sync, data stays on one device. Turn on sync in Settings, or use Export and Import to move it.
- If you forget your sync passphrase, the synced copy can't be opened by anyone, including you. Each device keeps its own copy.
- **On iPhone and iPad, the home-screen app keeps its own separate storage from Safari.** Export in Safari, then Import in the installed app.

---

## 🛠️ Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (static export) + React + TypeScript |
| Styling | [Tailwind CSS](https://tailwindcss.com/) with custom pixel-art design tokens |
| Icons | Custom pixel SVG sprites · [Lucide](https://lucide.dev/) for small utility icons |
| Fonts | [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) (headings) · [VT323](https://fonts.google.com/specimen/VT323) (journal) |
| Storage | Browser `localStorage` under one versioned key |
| Offline / Install | Web App Manifest + Service Worker (PWA) |
| Hosting | GitHub Pages via GitHub Actions |

---

## 🚀 Getting Started (Development)

**Requirements:** Node.js 20+ and npm.

```bash
git clone https://github.com/hailrod14/The-Lunar-Grimoire.git
cd The-Lunar-Grimoire
npm install
npm run dev
```

Then open http://localhost:3000.

| Command | What it does |
|---|---|
| `npm run dev` | Starts the local development server |
| `npm run build` | Builds the static site into `out/` |
| `npm test` | Runs the unit tests (cycle and moon math) |
| `npm run lint` | Checks code style |

---

## 🌐 Deployment

Every push to `main` builds and deploys the app to **GitHub Pages** automatically with GitHub Actions.

**One-time setup:**
1. In your repository, go to **Settings → Pages**.
2. Under **Source**, select **GitHub Actions**.
3. Push to `main`. The site will be published at `https://hailrod14.github.io/The-Lunar-Grimoire/`.

**Sync (optional):** create a free Firebase project, enable Google sign-in and Firestore, publish `firestore.rules`, add `<user>.github.io` to Authentication → Authorized domains, and paste the web app's config into `src/lib/firebase-config.ts`. With the config left empty, the app builds without sync.

---

## 🗺️ Roadmap

**Phase 1: MVP** *(complete)*
- [x] Project setup, pixel design system, and deployment
- [x] Clickable layout mockup: calendar home, bookmark ribbons, page turns
- [x] Data storage, cycle math, and moon math, with tests
- [x] First-run ritual and the Calendar home (Your Tide + Sky Moon header)
- [x] The daily page: tide & flow, Mood Elements, potions, and journal
- [x] The Book & Quill and the Potion & Elixir Cabinet
- [x] Settings, tide history editing, Export / Import, PWA install, and offline support
- [x] Polish: curling page-corner turns, page-turn sound (with a mute switch), desktop two-page spread

**Phase 3**
- [x] Several doses a day and weekday schedules for potions
- [x] Tide predictions as a range, sized by how regular your cycles are
- [x] Doctor-visit summary (printable / PDF)
- [x] Journal search and #tags
- [x] Wheel of the Year, named moons, and the daily tarot / rune draw
- [x] Themes, plus closing the book back onto its cover

**Phase 4**
- [x] Readable lettering (Atkinson Hyperlegible Next) with per-device lettering and text size
- [x] Public holidays and personal occasions on the calendar
- [x] Capsule, tablet, and pill bottle vessels
- [x] Optional end-to-end encrypted sync across devices (Firebase)
- [x] Familiars that follow your tide, with a seasonal wardrobe
- [x] Sleep & energy, journal prompts and moon rituals, and the apothecary shelf
- [x] Home-screen reminders that ring while the app is closed
- [x] Cover stickers and familiar visits on other pages

**Phase 2**
- [x] Optional PIN lock, with the Grimoire encrypted on the device (AES-256-GCM, PBKDF2 key) and auto-lock
- [x] Symptom tracking (built-in and your own, mild / moderate / strong)
- [x] The Scrying Glass: elements and symptoms by tide phase, cycle history, potion consistency
- [x] Potion reminders: notifications while open, plus an "Add to my calendar" file for reliable alarms

---

## 📄 License

MIT. See [LICENSE](LICENSE).

---

*Made with moonlight, stardust, and a little bit of code.* 🌙✨
