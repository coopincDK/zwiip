# Zwiip — Monetiseringsplan

## TL;DR

30 dage gratis fuld premium → paywall → 3 planer (måned/år/lifetime).
Gratis efter trial er **begrænset men brugbar**. Challenge er ALTID gratis (viral motor).

---

## 💰 Priser

| Plan | DKK | USD | Periode |
|------|-----|-----|--------|
| **Zwiip Intro** | 75 kr | ~$10 | Månedlig |
| **Zwiip Årlig** | 75 kr | ~$10 | Årlig (best value) |
| **Zwiip Lifetime** | 349 kr | ~$49.99 | Engangskøb |

> **Bemærk:** Årlig koster det samme som 1 måned — det er en bevidst no-brainer.

---

## 📅 Bruger-flow

```
Dag 1: Download Zwiip
        ↓
      30 dage FULD premium gratis
      (alle features, ubegrænset swipes, alle kategorier)
        ↓
Dag 30: Paywall-skærm vises
        "Din gratis periode er udløbet"
        ↓
      Vælg plan    ELLER    Fortsæt gratis (med begrænsninger)
```

---

## ✅ Feature Matrix

| Feature | 30-dage trial | Gratis (efter trial) | Premium |
|---------|:---:|:---:|:---:|
| **Swipe ← →** (slet/gem) | ♾️ Ubegrænset | 50/dag | ♾️ Ubegrænset |
| **Swipe ↑ ↓** (album/mapper) | ✅ | 🔒 Locked | ✅ |
| **Kategori: Alle** | ✅ | ✅ | ✅ |
| **Kategori: Screenshots** | ✅ | ✅ | ✅ |
| **Kategori: Memory Lane** | ✅ | 🔒 Locked | ✅ |
| **Kategori: Album** | ✅ | 🔒 Locked | ✅ |
| **Kategori: Seneste** | ✅ | 🔒 Locked | ✅ |
| **Kategori: Ældste** | ✅ | 🔒 Locked | ✅ |
| **Kategori: Største filer** | ✅ | 🔒 Locked | ✅ |
| **Challenge Mode** | ✅ | ✅ ALTID | ✅ ALTID |
| **Zwiip Safe** | ✅ | ✅ | ✅ |
| **Stats & achievements** | ✅ | ✅ | ✅ |
| **Undo / restore** | ✅ | ✅ | ✅ |
| **Push notifications** | ✅ Alle | ✅ Daglige (engagement) | 🔇 Kun challenge |

---

## 🔔 Push Notifications — Omvendt model

Push er **gratis irritation** — premium betaler for at **slippe**.

| Tidspunkt | Besked | Gratis | Premium |
|-----------|--------|:---:|:---:|
| 10:00 | "Du har 847 usorterede billeder 📸" | ✅ | ❌ |
| 14:00 | "Få 1 min mere og sortér" | ✅ | ❌ |
| 18:00 | "Dine næste 50 billeder er klar" | ✅ | ❌ |
| 20:00 | "Udfordr en ven 🏆" | ✅ | ❌ |
| Når som helst | "[Ven] har udfordret dig!" | ✅ | ✅ |
| Når som helst | "[Ven] slog din score!" | ✅ | ✅ |

> Premium-brugere får fred og ro. Challenge-relaterede push er altid gratis (viral motor).

---

## 🛡️ Konverteringsmotorer

Hvad får gratis brugere til at betale:

### 1. Daglig swipe-grænse (50/dag)
Brugere med 5.000+ billeder rammer grænsen på ~10 minutter.
Popup: "Du har brugt dine 50 swipes i dag — opgrader for ubegrænset"

### 2. Kategori-lock
Bruger ser "Memory Lane" i listen men den er locked med 🔒.
Tap → "Opgrader til Premium for at bruge smarte kategorier"

### 3. Album-swipe lock
Bruger forsøger swipe op/ned → kort animation + "Premium feature".

### 4. Push-træthed
Daglige push-beskeder motiverer: "Slå notifikationer fra med Premium" link i notification.

### 5. Trial-udløb
30 dage med fuld oplevelse → pludselig begrænsninger føles som tab.
Loss aversion er stærkeste motivator.

---

## 🎨 Paywall-skærm (design spec)

```
┌────────────────────────────────┐
│                                │
│    ⚡ Få Zwiip Premium           │
│                                │
│    ✅ Ubegrænset swipes          │
│    ✅ Alle kategorier             │
│    ✅ Sortér i albums             │
│    ✅ Ingen forstyrrende push     │
│                                │
│  ┌──────────────────────────┐  │
│  │  75 kr/md                   │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  75 kr/år  ⭐ BEST VALUE    │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  349 kr  Lifetime           │  │
│  └──────────────────────────┘  │
│                                │
│      Fortsæt gratis             │
│                                │
└────────────────────────────────┘
```

---

## 🛠️ Teknisk implementation (v1.1)

### Trial tracking
```javascript
// Ved første app-start
const installDate = await AsyncStorage.getItem('@zwiip_install_date');
if (!installDate) {
  await AsyncStorage.setItem('@zwiip_install_date', new Date().toISOString());
}

// Check trial status
const daysSinceInstall = (Date.now() - new Date(installDate)) / (1000 * 60 * 60 * 24);
const isTrialActive = daysSinceInstall <= 30;
const isPremium = isTrialActive || hasActiveSubscription;
```

### Feature gating
```javascript
// Swipe limit
if (!isPremium) {
  const todaySwipes = await getTodaySwipeCount();
  if (todaySwipes >= 50) {
    showPaywall('swipe_limit');
    return;
  }
}

// Kategori lock
const FREE_CATEGORIES = ['all', 'screenshots'];
if (!isPremium && !FREE_CATEGORIES.includes(category)) {
  showPaywall('category_lock');
  return;
}

// Album swipe lock
if (!isPremium && (direction === 'up' || direction === 'down')) {
  showPaywall('album_lock');
  return;
}
```

### Betalings-integration
- **RevenueCat** (anbefalet) — håndterer Apple + Google subscriptions
- Alternativ: **StoreKit 2** direkte (kun iOS)
- RevenueCat er gratis under $2.500/md revenue

### Nødvendige pakker
```bash
npm install react-native-purchases  # RevenueCat SDK
```

---

## 📈 Forventede konverteringsrater

| Metrik | Forventet |
|--------|-----------|
| Trial → Betalt | 3–6% |
| Månedlig vs Årlig split | 30/60/10% (md/år/lifetime) |
| ARPU (gratis + premium mix) | ~5 kr/bruger/måned |
| LTV (premium bruger) | ~120 kr |

---

## 📋 Implementation Checklist

- [ ] AsyncStorage: gem install-dato ved første start
- [ ] Trial-status check (30 dage)
- [ ] Paywall-skærm komponent
- [ ] Swipe-tæller (50/dag for gratis)
- [ ] Kategori-lock UI (🔒 ikon + tap-to-upgrade)
- [ ] Album-swipe lock (op/ned blocked)
- [ ] RevenueCat integration
- [ ] 3 subscription products i App Store Connect
- [ ] Push notification gating
- [ ] "Fortsæt gratis" fallback flow
- [ ] Restore purchases knap i Settings
- [ ] Trial-countdown i Settings ("14 dage tilbage")

---

*Denne plan implementeres i v1.1 efter initial App Store launch og bruger-feedback.*
