# 01 — Perkuat generator tanpa mengubah kontrak

**What to build:** Ganti sumber acak generator password dengan RNG kriptografis
tanpa mengubah API, format, panjang, charset, fallback, atau perilaku empat flow
production yang sudah menggunakannya.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Pemilihan kata dan setiap karakter acak memakai sumber uniform
  kriptografis, bukan `Math.random`.
- [x] Mode kamus tetap menghasilkan `word-[a-z0-9]{5}` dan mode kamus
  hilang/kosong tetap menghasilkan 12 karakter `[a-z0-9]`.
- [x] API public tetap synchronous dan seluruh caller tidak perlu berubah.
- [x] Regression test membuktikan pembuatan Struktur, pembuatan Member, bulk
  upload, dan reset Akun Kader mempertahankan kontraknya serta menghasilkan
  plaintext yang cocok dengan hash tersimpan.
- [x] Test generator tidak lagi memutasi `dictionary.txt` bersama dengan cara
  yang dapat membuat test paralel saling memengaruhi.
