# 📸 Zwiip — Photo Cleaner & Sort

> **Tinder for dit kamerarulle.** Swipe venstre = slet, højre = gem. Ryd op på 1 minut.

---

## ⚡ Kom i gang

```bash
git clone https://github.com/coopincDK/zwiip.git
cd zwiip
npm install
npx expo start
```

Scan QR-kode med **Expo Go** på telefon.

---

## 🎯 Hvad er Zwiip?

Zwiip gør oprydning i billeder sjovt og hurtigt:

| Gesture | Handling |
|---------|----------|
| **Swipe ←** | Slet |
| **Swipe →** | Behold |
| **Swipe ↑↓** | Flyt til album (premium) |
| **Tap** | Fullscreen zoom |

---

## 📱 Features

| Feature | Status |
|---------|--------|
| Swipe sortering (4 retninger) | ✅ |
| Challenge Mode (1 min, del score) | ✅ |
| Zwiip Safe cooldown timer (0.5–3s) | ✅ |
| 15 sprog (auto-detect) | ✅ |
| Stats & achievements | ✅ |
| Onboarding tutorial | ✅ |
| Undo toast + trash restore | ✅ |
| Haptic feedback | ✅ |
| Push notifications (prod only) | ✅ |
| In-app review prompt | ✅ |
| App Store screenshots (DA + EN) | ✅ |
| Privacy Policy + Terms (GitHub Pages) | ✅ |

---

## 📁 Projektstruktur

```
app/(tabs)/              ← 4 screens: Sort, Trash, Stats, Settings
src/
  ├─ components/          ← SwipeCard, ChallengeMode, Onboarding...
  ├─ context/             ← AppContext (state), SettingsContext
  ├─ hooks/               ← usePhotoLibrary, useAlbumManager
  ├─ i18n/translations/   ← 15 sprogfiler (en, da, de, es, fr...)
  ├─ services/            ← notifications, reviewPrompt
  └─ constants/           ← theme, emoji
assets/
  ├─ overlays/            ← Swipe keep/delete overlays
  ├─ appstore/            ← Screenshots DK
  └─ appstore/en/         ← Screenshots EN
docs/
  ├─ pitch-investor.md    ← Investor pitch
  ├─ pitch-appstore.md    ← App Store beskrivelser (DA + EN)
  ├─ aso-strategy.md      ← SEO/ASO strategi + keywords
  ├─ privacy.html         ← Privacy Policy (live)
  └─ terms.html           ← Terms of Service (live)
```

---

## 🏗️ Build & Deploy til App Store

### Forudsætninger

- Node.js 18+
- `npm install -g eas-cli`
- Apple Developer konto ($99/år)

### Trin 1: Konfigurér EAS

Rediger `eas.json` — udfyld med jeres Apple Developer info:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "jeres@email.com",
      "ascAppId": "FRA_APP_STORE_CONNECT",
      "appleTeamId": "FRA_DEVELOPER_PORTAL"
    }
  }
}
```

### Trin 2: Build

```bash
eas login
eas build --platform ios --profile production
```

### Trin 3: Submit

```bash
eas submit --platform ios
```

### Trin 4: App Store Connect

| Felt | Værdi |
|------|-------|
| App Name | `Zwiip - Photo Cleaner & Sort` |
| Subtitle | `Swipe to clean camera roll` |
| Category | Photography + Utilities |
| Privacy URL | `https://coopincdk.github.io/zwiip/privacy.html` |
| Support URL | `https://coopincdk.github.io/zwiip/` |
| Screenshots | `assets/appstore/` (DA) + `assets/appstore/en/` (EN) |
| Keywords | Se `docs/aso-strategy.md` |
| Beskrivelser | Se `docs/pitch-appstore.md` |

---

## 💰 Pricing Model

| Plan | DKK | USD |
|------|-----|-----|
| **Zwiip Intro** (månedlig) | 75 kr | ~$10 |
| **Zwiip Årlig** | 75 kr/år | ~$10/år |
| **Zwiip Lifetime** | 349 kr | ~$49.99 |

🎁 **30 dage gratis fuld premium** efter download.

Efter trial: 50 swipes/dag, kun "Alle" + "Screenshots", ingen album-swipe.

---

## 🔮 Roadmap (v1.1)

- [ ] Premium gating (50 swipes/dag, kategorier)
- [ ] In-App Purchase (RevenueCat / StoreKit 2)
- [ ] Paywall screen med 3 planer
- [ ] Push notification gating (gratis vs premium)
- [ ] Challenge deeplinks
- [ ] Android build

---

## 📡 Links

| | URL |
|---|---|
| 🔒 Privacy Policy | https://coopincdk.github.io/zwiip/privacy.html |
| 📄 Terms of Service | https://coopincdk.github.io/zwiip/terms.html |
| 🌐 Landing Page | https://coopincdk.github.io/zwiip/ |
| 📦 Repository | https://github.com/coopincDK/zwiip |

---

*Built with React Native (Expo) • 15 languages • Zero servers • 100% on-device privacy*
