# TracMusic 🎵

Aplikasi streaming musik Android premium dengan katalog musik berlisensi terbuka.

## Status Fitur

| Fitur | Status |
|-------|--------|
| Design system & tema | ✅ Selesai |
| Navigasi tab | ✅ Selesai |
| Layar Home | ✅ Selesai |
| Layar Search | ✅ Selesai |
| Layar Library | ✅ Selesai |
| Layar Settings | ✅ Selesai |
| Now Playing (UI) | ✅ Selesai |
| Mini player | ✅ Selesai |
| Jamendo provider | ✅ Selesai |
| Library store (lokal) | ✅ Selesai |
| Playback store | ✅ Selesai |
| Lokalisasi ID/EN | ✅ Selesai |
| Supabase schema + RLS | ✅ Selesai |
| Audio engine (react-native-track-player) | 🔜 Phase 3 |
| Supabase auth & sync | 🔜 Phase 4 |
| Provider kedua | 🔜 Phase 5 |
| Build APK | 🔜 Phase 6 |

---

## Cara Memulai (dari HP Android)

### 1. Buat akun yang dibutuhkan (semua gratis)

**GitHub** — untuk menyimpan kode
- Buka https://github.com → Sign up

**Expo** — untuk build cloud
- Buka https://expo.dev → Sign up (gratis)

**Jamendo** — untuk musik
- Buka https://devportal.jamendo.com
- Klik "Register" → buat aplikasi baru
- Salin **Client ID** kamu

**Supabase** (opsional untuk Phase 4) — untuk database cloud
- Buka https://supabase.com → New project (gratis)

---

### 2. Buat repositori GitHub

1. Buka https://github.com/new
2. Nama repo: `tracmusic`
3. Pilih Private
4. Klik "Create repository"

---

### 3. Buka GitHub Codespaces (editor di browser)

1. Di halaman repo kamu, klik tombol hijau **"<> Code"**
2. Pilih tab **"Codespaces"**
3. Klik **"Create codespace on main"**
4. Tunggu sekitar 1-2 menit — editor VS Code akan terbuka di browser

---

### 4. Upload file proyek ke Codespace

Di terminal Codespace (bawah layar), jalankan:

```bash
# Clone atau upload semua file TracMusic ke /workspaces/tracmusic
# (jika sudah ada di Codespace, lanjutkan ke langkah berikutnya)
```

---

### 5. Buat file .env

Di Codespace, buat file `.env` di folder utama:

```bash
cat > .env << 'EOF'
EXPO_PUBLIC_JAMENDO_CLIENT_ID=isi_client_id_jamendo_kamu_disini
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=isi_anon_key_supabase_kamu
EOF
```

> ⚠️ **Jangan commit file `.env` ke GitHub!** File `.gitignore` sudah mengecualikannya.

---

### 6. Install dependensi

```bash
npm install
```

---

### 7. Setup database Supabase

1. Buka https://supabase.com → proyek kamu
2. Klik **SQL Editor** di sidebar kiri
3. Salin isi file `supabase/migrations/001_initial.sql`
4. Paste di SQL Editor → klik **Run**

---

### 8. Login ke Expo & EAS

```bash
npx eas-cli login
# Masukkan email & password akun Expo kamu

npx eas-cli build:configure
# Ikuti instruksinya — ini akan mengisi EAS_PROJECT_ID otomatis
```

---

### 9. Build APK (gratis, di cloud Expo)

```bash
# Build APK untuk development/test:
npx eas-cli build --profile preview --platform android
```

Expo akan membangun APK di cloud mereka (~10-20 menit).
Setelah selesai, kamu akan mendapat **link download APK**.

Download dan install APK di HP Android kamu.

> ⚠️ Di HP Android, kamu perlu aktifkan **"Install from unknown sources"** di Settings > Security.

---

### 10. Jalankan di mode development (opsional)

Jika ingin test langsung tanpa build APK:

```bash
npm start
```

Scan QR code dengan aplikasi **Expo Go** di HP kamu (download dari Play Store).

> ⚠️ Beberapa fitur (background audio, lock screen controls) memerlukan development build, bukan Expo Go.

---

## Mendapatkan Jamendo Client ID

1. Buka https://devportal.jamendo.com
2. Klik "Sign up" → buat akun gratis
3. Setelah login, klik "My Apps" → "Create new app"
4. Isi nama app: `TracMusic`
5. Isi URL: `https://github.com/username/tracmusic` (ganti username)
6. Submit → salin **Client ID** yang diberikan

**Catatan tentang Jamendo:**
- API Jamendo gratis untuk penggunaan non-komersial
- Semua musik berlisensi Creative Commons
- Beberapa lagu memerlukan atribusi (nama artis + lisensi)
- Streaming audio MP3 diizinkan secara resmi melalui API mereka

---

## Struktur Proyek

```
src/
  app/
    _layout.tsx          ← Root layout (theme, providers)
    (tabs)/
      _layout.tsx        ← Tab bar dengan mini player
      index.tsx          ← Home screen
      search.tsx         ← Search screen
      library.tsx        ← Library screen
      settings.tsx       ← Settings screen
    player.tsx           ← Full-screen Now Playing
    onboarding.tsx       ← Onboarding flow
  components/ui/
    GlassCard.tsx        ← Glass morphism card
    MiniPlayer.tsx       ← Mini player di atas tab bar
    Skeleton.tsx         ← Loading skeleton
    TrackRow.tsx         ← Track list item
  providers/
    types.ts             ← Provider interface
    registry.ts          ← Provider registry
    jamendo/
      JamendoProvider.ts ← Jamendo API adapter
  services/
    audio/
      playbackStore.ts   ← Zustand playback state
    libraryStore.ts      ← Liked, playlists, recent
  theme/
    tokens.ts            ← Design tokens
    ThemeContext.tsx      ← Light/dark/accent theme
  localization/
    index.ts             ← ID/EN strings
  types/
    music.ts             ← Normalized data models

supabase/
  migrations/
    001_initial.sql      ← Database schema + RLS

assets/
  icons/                 ← App icons (tambahkan sendiri)
```

---

## Catatan Penting

**TracMusic TIDAK:**
- Mengekstrak audio dari YouTube secara ilegal
- Menyimpan audio yang dilindungi hak cipta
- Menggunakan endpoint API tidak resmi
- Menyimpan password Google atau akun lain
- Membuat rekomendasi "palsu" yang berpura-pura personal

**TracMusic YA:**
- Stream musik CC-licensed dari Jamendo secara resmi
- Menampilkan atribusi lisensi sesuai persyaratan CC
- Menyimpan data pengguna lokal dengan AsyncStorage
- Sinkronisasi opsional ke Supabase dengan Row Level Security
- Menghormati preferensi reduce motion

---

## Phase Berikutnya

**Phase 3 — Audio Engine**
- Integrasi `react-native-track-player`
- Background playback
- Lock screen controls
- Notifikasi media Android

**Phase 4 — Supabase Auth**
- Login email
- Sinkronisasi playlist ke cloud
- Sync lintas perangkat

**Phase 5 — Provider Kedua + YouTube Companion**
- Provider musik kedua (sedang diverifikasi)
- Import metadata playlist YouTube Music
- External link handling

**Phase 6 — Build & Release**
- Optimasi performa
- App icon & splash screen
- APK final yang siap dibagikan

---

## Lisensi

Kode TracMusic: MIT License

Musik dari Jamendo: Creative Commons (bervariasi per lagu)
Selalu tampilkan atribusi untuk lagu CC-BY.


---

## Phase 6 — Build & Release

### Checklist sebelum build APK

- [ ] Sudah punya akun Expo di https://expo.dev
- [ ] Jamendo Client ID sudah diisi di `eas.json` (ganti REPLACE_WITH...)
- [ ] (Opsional) Supabase URL dan Anon Key sudah diisi
- [ ] File `icon.png` sudah ada di `assets/icons/`

---

### Cara build APK dari HP Android (step by step)

**1. Buka GitHub Codespace**

Buka repo GitHub TracMusic kamu → klik **Code** → **Codespaces** → **Create codespace**

**2. Upload / sinkronisasi file proyek**

Jika pertama kali: upload zip ini dan extract di Codespace terminal:
```bash
unzip tracmusic-final.zip -d .
cd tracmusic
```

**3. Install dependencies**
```bash
npm install
```

**4. Login ke Expo**
```bash
npx eas-cli login
# Masukkan email & password akun expo.dev kamu
```

**5. Konfigurasi EAS (hanya sekali)**
```bash
npx eas-cli build:configure
# Pilih Android → ini otomatis isi EAS_PROJECT_ID di eas.json
```

**6. Isi credentials di eas.json**

Buka `eas.json`, ganti semua `REPLACE_WITH_YOUR_CLIENT_ID` dll dengan nilai asli:
```json
env: {
  EXPO_PUBLIC_JAMENDO_CLIENT_ID: abc123def456,
  EXPO_PUBLIC_SUPABASE_URL: https://xxx.supabase.co,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: eyJ...
}
```

> ⚠️ **PENTING**: Jangan commit  ke GitHub publik jika sudah berisi credentials.
> Untuk produksi, gunakan EAS Secrets: 

**7. Build APK preview (untuk dibagikan ke teman)**
```bash
npx eas-cli build --profile preview --platform android
```

- Build berjalan di cloud Expo (~10–20 menit)
- Setelah selesai, kamu dapat **link download APK**
- Download APK → kirim ke teman via WhatsApp / Google Drive

**8. Install APK di Android**

Di HP Android yang akan menginstall:
1. Buka **Settings** → **Security** (atau **Privacy**)
2. Aktifkan **Install from unknown sources** untuk browser/Files kamu
3. Download APK → tap → Install

---

### Menggunakan EAS Secrets (lebih aman untuk produksi)

Daripada menyimpan secrets di `eas.json`, gunakan:
```bash
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_JAMENDO_CLIENT_ID --value abc123
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://...
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value eyJ...
```

Lalu hapus bagian `env` dari `eas.json` — EAS akan inject otomatis saat build.

---

### Troubleshooting build umum

| Error | Solusi |
|-------|--------|
|  | Sudah diset ke 24 di app.config.ts |
|  | Jalankan  lagi |
|  | Jalankan  |
|  | Build di cloud EAS — tidak perlu Java lokal |
|  | Cek log di expo.dev/accounts/[user]/builds |
| APK crash saat buka | Audio engine butuh  untuk dev testing |

---

### Perbedaan APK vs Play Store

| | APK (preview) | Play Store (production) |
|-|---------------|------------------------|
| Cara install | Manual / sideload | Langsung dari Play Store |
| Distribusi | WhatsApp, Drive, dll | Publik / kontrol akses |
| Review Google | Tidak perlu | Wajib (1-7 hari) |
| Update | Kirim APK baru | Auto-update via Play |
| Biaya | Gratis | 5 sekali untuk developer account |
| Format | .apk | .aab (EAS submit) |

Untuk share ke teman → gunakan APK preview.
Untuk rilis ke publik → daftar Google Play Console.

---

### Struktur file Phase 6 yang ditambahkan

```
src/
  components/ui/
    AnimatedSplash.tsx    ← Animasi splash screen custom
    SpringButton.tsx      ← Tombol dengan spring animation
    ErrorBoundary.tsx     ← Tangkap crash tanpa layar putih
    EmptyState.tsx        ← Empty state yang konsisten
    OfflineBanner.tsx     ← Banner offline otomatis
  hooks/
    useNetworkStatus.ts   ← Cek koneksi internet
    useReducedMotion.ts   ← Hormat preferensi aksesibilitas

assets/
  icons/
    icon.png              ← App icon 1024x1024 (purple gradient)
    adaptive-icon.png     ← Android adaptive icon
    splash.png            ← Splash screen

babel.config.js           ← Config Babel (reanimated plugin)
metro.config.js           ← Config Metro bundler
```
