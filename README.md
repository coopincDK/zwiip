# Zwiip — Photo Cleaner & Sort

> Swipe left to delete, right to keep. Clean up your camera roll in 1 minute.

## 🚀 Quick Start

```bash
npm install
npx expo start
```

Scan QR-kode med Expo Go på telefon.

## 📱 Features

- **Swipe sortering** — venstre/højre/op/ned med konfigurerbare actions
- **Challenge Mode** — 1 minut, sortér så mange som muligt, del score
- **Zwiip Safe** — cooldown timer (0.5–3s) forhindrer fejlsletning
- **15 sprog** — auto-detect telefonens sprog
- **Stats & achievements** — MB frigjort, swipes/min, milestones
- **Undo** — toast + trash-skærm med restore
- **Push notifications** — daglige påmindelser (virker kun i prod build)

## 📁 Projektstruktur

```
app/(tabs)/          ← Screens (index, trash, stats, settings)
src/
  components/        ← SwipeCard, ChallengeMode, Onboarding, etc.
  context/           ← AppContext, SettingsContext
  hooks/             ← usePhotoLibrary, useAlbumManager
  i18n/translations/ ← 15 sprogfiler
  services/          ← notifications, reviewPrompt
  constants/         ← theme, emoji
assets/              ← App icon, overlays, tab icons, screenshots
docs/                ← Pitch, ASO, privacy policy, terms
```

## 🏗️ Build & Deploy

### Forudsætninger
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Apple Developer konto ($99/år)

### 1. Konfigurér EAS

Rediger `eas.json` — udfyld disse felter:
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "DIN_APPLE_ID_EMAIL",
      "ascAppId": "APP_STORE_CONNECT_APP_ID",
      "appleTeamId": "DIT_TEAM_ID"
    }
  }
}
```

### 2. Build til TestFlight

```bash
eas login
eas build --platform ios --profile production
```

### 3. Submit til App Store

```bash
eas submit --platform ios
```

### 4. App Store Connect metadata

| Felt | Værdi |
|------|-------|
| **App Name** | Zwiip - Photo Cleaner & Sort |
| **Subtitle** | Swipe to clean camera roll |
| **Category** | Photography (primær), Utilities (sekundær) |
| **Privacy URL** | https://coopincdk.github.io/zwiip/privacy.html |
| **Support URL** | https://coopincdk.github.io/zwiip/ |
| **Screenshots** | `assets/appstore/` (DA) + `assets/appstore/en/` (EN) |
| **Keywords** | Se `docs/aso-strategy.md` |
| **Beskrivelser** | Se `docs/pitch-appstore.md` (DA + EN) |

## 💰 Pricing Model

| Plan | DKK | USD |
|------|-----|-----|
| Zwiip Intro (månedlig) | 75 kr/md | ~$10 |
| Zwiip Årlig | 75 kr/år | ~$10/år |
| Zwiip Lifetime | 349 kr | ~$49.99 |

**30 dage gratis fuld premium** → derefter paywall.

Gratis efter trial: 50 swipes/dag, kun "Alle" + "Screenshots" kategorier, ingen album-swipe.

## 📚 Dokumentation

- `docs/pitch-investor.md` — Investor pitch
- `docs/pitch-appstore.md` — App Store beskrivelser (DA + EN)
- `docs/aso-strategy.md` — Komplet ASO strategi
- `docs/privacy.html` — Privacy Policy (live på GitHub Pages)
- `docs/terms.html` — Terms of Service

## 🔮 Roadmap (v1.1)

- [ ] Premium gating (50 swipes/dag, kategorier)
- [ ] In-App Purchase (RevenueCat/StoreKit 2)
- [ ] Push notification gating (gratis vs premium)
- [ ] Challenge deeplinks
- [ ] Android build
