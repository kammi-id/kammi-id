# 03 — Tampilkan kredensial setelah menambah Struktur

**What to build:** Setelah pembuatan Struktur berhasil, tampilkan seluruh
kredensial awal Akun Kepengurusan sekali saja dengan copy per akun, Salin Semua,
dan download CSV yang aman.

**Blocked by:** 01 — Perkuat generator tanpa mengubah kontrak.

**Status:** done

- [x] Server Action meneruskan seluruh kredensial hanya setelah transaksi
  pembuatan sukses dan tidak mengubah jumlah, role, username, atau hash akun.
- [x] Dialog sukses tidak menutup otomatis, menyamarkan password secara asali,
  dan memperingatkan bahwa plaintext tidak dapat dibaca kembali.
- [x] Copy per field, Salin Semua, serta CSV memuat setiap akun aktual yang baru
  dibuat dengan label kewenangan kontekstual.
- [x] CSV mengikuti escaping RFC 4180, menetralkan formula injection,
  menyanitasi filename, dan mencabut Blob URL setelah digunakan.
- [x] Plaintext tidak masuk log, cache, database, atau Credential Panel.
- [x] Kegagalan pembuatan tidak membuka dialog dan tidak mengembalikan kredensial
  parsial; kehilangan respons dipulihkan melalui flow reset, bukan pembacaan ulang.
