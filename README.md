# TracMusic v0.4.0
Sumber musik: **NexaDev API** (`spotifyplay` untuk cari, `spotify` untuk lagu via link, `spotifypl` untuk playlist via link). Lirik: LRCLIB.

1. `npm install`
2. Supabase: buat project, jalankan `supabase/schema.sql` di SQL Editor
3. Auth > URL Configuration: tambah Site URL + Redirect URL (localhost:3000 dan domain Vercel)
4. Salin `.env.example` ke `.env.local`, isi nilainya
5. `npm run dev`
6. Deploy: import ke Vercel, isi env yang sama

Catatan: di Search, tempel tautan `open.spotify.com/track/...` atau `/playlist/...` untuk memuat langsung. Isi baris Home diatur di `SECTIONS` pada `app/page.tsx`.
