# Plan - Recolor Website ala Valleycos

## Context
User ingin mengubah warna website proyek agar nuansanya mirip referensi Valleycos: pastel cream/pink, dotted pixel background, border gelap plum/ink, card putih, aksen hot-pink, highlight kuning kecil, dan gaya pixel/neobrutalist yang tetap tegas. Proyek saat ini sudah punya basis neobrutalist/pixel, jadi pendekatan terbaik adalah recolor berbasis token, bukan redesign besar.

## Recommended Approach
Lakukan perubahan dari level design token dulu, lalu rapikan komponen yang masih punya warna hardcoded atau warna lama yang terlalu dominan. Pertahankan struktur React, Tailwind v4, dan flow aplikasi yang sudah ada.

Target palet:

| Role | Target |
|---|---|
| Background | pastel cream sangat muda |
| Secondary background | blush/pale pink |
| Ink/border/text | dark plum hampir hitam |
| Primary accent | hot pink seperti nav aktif/tombol referensi |
| Highlight | kuning kecil untuk underline/label strip |
| Card surface | putih / off-white |
| Error/destructive | tetap merah jelas |
| Success | tetap hijau/soft mint, tapi tidak dominan |

## Critical Files
- `frontend/src/index.css` — sumber utama theme token, background body, utility seperti `premium-band`, `pixel-glass`, shadow/border brutal.
- `frontend/src/App.tsx` — app shell, header/marquee/footer, penggunaan `premium-band`, warna brand/accent.
- `frontend/src/components/PixelDecor.tsx` — SVG pixel decoration masih punya warna hardcoded lama.
- `frontend/src/components/ui/button.tsx` — variant tombol memakai token warna brutal.
- `frontend/src/components/ui/card.tsx` — tone card perlu diarahkan ke card putih/pink/cream yang lebih Valleycos.
- `frontend/src/components/ui/badge.tsx` — badge/status accent.
- `frontend/src/components/ui/input.tsx` dan `frontend/src/components/ui/textarea.tsx` — field putih, border plum, focus hot-pink/yellow.
- `frontend/src/components/BatchSetupStep.tsx` — banyak class warna statis untuk mode/provider.
- `frontend/src/components/LoadingStep.tsx` — loading/terminal/dekorasi dengan warna lama.
- `frontend/src/components/ReviewSubmitStep.tsx` — review form, selected state, success/error.
- `frontend/src/components/BatchResultStep.tsx` — result state, success/error colors.

## Implementation Steps

- [x] **Update global palette tokens**
  - Edit `frontend/src/index.css` `@theme` colors.
  - Map `--color-bg` ke pastel cream, `--color-bg-alt` ke pale pink, `--color-ink` ke dark plum.
  - Map `--color-brutal-pink` ke hot pink, `--color-brutal-yellow` ke highlight yellow.
  - Keep semantic red/success readable for destructive/result states.

- [x] **Rework page background**
  - Update body/root background di `frontend/src/index.css` menjadi cream/pink dotted pattern seperti screenshot.
  - Gunakan radial-gradient dots yang subtle dan tetap performant.
  - Hindari background yang terlalu ramai supaya form tetap terbaca.

- [x] **Recolor app shell and structural bands**
  - Update `premium-band`, header/footer, marquee/strip styling lewat `frontend/src/index.css` dan `frontend/src/App.tsx`.
  - Pakai dark plum untuk strip besar, hot pink untuk aksen aktif, yellow untuk underline/highlight kecil.
  - Pertahankan border tebal dan shadow brutal.

- [x] **Normalize cards and glass surfaces**
  - Update `frontend/src/components/ui/card.tsx` agar default card dominan putih/off-white dengan border dark plum.
  - Revisi `pixel-glass` di `frontend/src/index.css` supaya tidak terasa glassy modern; arahkan ke flat white/pink surface.
  - Tone seperti yellow/pink/violet tetap boleh ada, tapi lebih soft dan tidak terlalu neon.

- [x] **Align interactive primitives**
  - Update `button.tsx`, `badge.tsx`, `input.tsx`, `textarea.tsx`, dan `label.tsx`.
  - Primary action: hot pink dengan border plum.
  - Secondary action: white/off-white dengan border plum.
  - Focus state: hot-pink atau yellow yang jelas.
  - Destructive state: tetap merah kontras seperti modal logout di referensi.

- [x] **Retheme pixel decorations**
  - Update `frontend/src/components/PixelDecor.tsx` hardcoded fills:
    - yellow lama → highlight yellow baru
    - pink lama → hot pink baru
    - blue lama → pastel blue muted atau kurangi dominansinya
    - black lama → dark plum
  - Jika clean, gunakan CSS variable di SVG fill; jika tidak, pakai hex palet baru secara konsisten.

- [x] **Sweep current flow components for old dominant colors**
  - Review `BatchSetupStep.tsx`, `LoadingStep.tsx`, `ReviewSubmitStep.tsx`, `BatchResultStep.tsx`.
  - Ganti warna lama yang mencolok seperti blue/lime/orange/violet neon menjadi hot-pink/yellow/cream/plum, kecuali success/error yang memang semantic.
  - Ikuti pola Tailwind v4 yang sudah ada: jangan membuat class warna dinamis dengan string interpolation.

- [x] **Check responsive and accessibility details**
  - Pastikan teks kecil tetap readable di background cream/pink.
  - Pastikan focus ring terlihat untuk keyboard navigation.
  - Pastikan white card tidak tenggelam di background.
  - Pastikan state success/error tidak hanya mengandalkan warna kalau teks/status sudah tersedia.

## Verification

1. Jalankan frontend:
   - `cd frontend && npm run dev`
2. Buka app di browser dan cek visual utama:
   - background cream/pink dotted muncul
   - header/footer/strip gelap plum
   - card putih dengan border tegas
   - aksen pink dan highlight kuning mirip referensi
3. Walkthrough flow utama:
   - setup/batch form
   - loading state
   - review/submit state
   - result state
4. Cek interaksi:
   - hover/active button
   - input/textarea focus
   - selected state
   - disabled/error/destructive state
5. Cek responsive:
   - desktop
   - narrow/mobile width
6. Jalankan validasi build/lint:
   - `cd frontend && npm run lint`
   - `cd frontend && npm run build`

## Risks and Mitigations

- **Token change memengaruhi banyak komponen sekaligus** — mulai dari token, lalu inspeksi tiap step UI sebelum edit lebih detail.
- **Pastel terlalu low contrast** — gunakan dark plum untuk text/border utama dan cek focus/readability manual.
- **Pink terlalu dominan** — batasi hot pink untuk action, active state, selected state, dan aksen.
- **Yellow terlalu ramai** — gunakan sebagai underline/label strip kecil, bukan surface besar.
- **Warna SVG lama masih nyangkut** — sweep hardcoded hex di `PixelDecor.tsx` dan komponen flow.
- **Tailwind class tidak ter-compile** — pertahankan class statis seperti pola existing lookup table.

## Out of Scope

- Mengubah logic submit/generate/parse.
- Mengubah API/backend.
- Menambah library design system baru.
- Redesign layout besar di luar kebutuhan warna dan sedikit treatment visual.
- Menambah runtime theme switcher.
