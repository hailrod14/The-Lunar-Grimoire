# 🌙 The Lunar Grimoire

*A witchy menstrual, medication, and mood tracker, bound as a pixel-art celestial grimoire.*

The Lunar Grimoire turns your cycle into a personal **Lunar Tide**, your moods into the **four elements**, and your medications and supplements into a **Potion & Elixir Cabinet**. Every day gets its own page in a Minecraft-style **Book & Quill** journal. You can revisit any day in the **Grimoire Archive**.

> 🔒 **Your data never leaves your device.** There are no accounts, no servers, and no tracking or analytics. Everything is stored locally in your browser.

**🔮 Live app:** https://hailrod14.github.io/The-Lunar-Grimoire/

> 🚧 **Status:** Phase 1 (MVP) is in active development.

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

### 💾 Export / Import Grimoire
Back up everything to a `.json` file and restore it on any device. Import checks the file and asks before overwriting anything.

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
- There is no backend, no accounts, no cookies, no analytics, and no third-party tracking.
- This repository is public, but it contains only the app's code, **never your entries**.

**Please keep in mind:**
- Anyone with access to your browser profile can open the app and see your data.
- **Clearing your browser data permanently deletes your Grimoire.** Export a backup regularly.
- Data does not sync between devices automatically. Use Export and Import to move it.

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

---

## 🗺️ Roadmap

**Phase 1: MVP** *(in progress)*
- [x] Project setup, pixel design system, and deployment
- [x] Clickable layout mockup: calendar home, bookmark ribbons, page turns
- [x] Data storage, cycle math, and moon math, with tests
- [ ] First-run ritual and the Calendar home (Your Tide + Sky Moon header)
- [ ] The daily page: tide & flow, Mood Elements, potions, and journal
- [ ] The Book & Quill and the Potion & Elixir Cabinet
- [ ] Tide history editing, Export / Import, PWA install, and offline support
- [ ] Polish: curling page-corner turns, page-turn sound (with a mute switch), desktop two-page spread

**Phase 2: Ideas**
- [ ] Optional PIN lock screen
- [ ] Symptom tracking (cramps, headaches, cravings, and more)
- [ ] Element and cycle pattern insights
- [ ] Optional potion reminders

---

## 📄 License

MIT. See [LICENSE](LICENSE).

---

*Made with moonlight, stardust, and a little bit of code.* 🌙✨
