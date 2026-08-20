# 02 — Kunci `<uuid>.<ext>`, update tulis-baru, batas 5 MB ditegakkan

**What to build:** Bentuk kunci unggahan baru berubah, `updateFile` berhenti
menimpa, dan batas ukuran yang sudah dijanjikan UI mulai ditegakkan di server.

**Blocked by:** 01

**Status:** ready-for-agent

**Kunci baru `<uuid>.<ext>`.** Sekarang `uploadFile` menyusun
`${randomUUID()}_${file.name}`. `file.name` datang dari pengunggah dan setelah
tiket 01 ia menjadi path filesystem sungguhan. Buang nama aslinya; ambil `ext`
dari daftar putih mime (`image/jpeg`, `image/png`, `image/webp`), tolak sisanya.
Ini lebih kuat daripada sanitizer, karena sanitizer harus benar setiap kali.

44 kunci lama tetap berbentuk `<uuid>_<nama>.jpg` dan **tidak disentuh**. Dua
bentuk kunci hidup berdampingan; keduanya penanda buram, jadi tidak ada yang
perlu membedakannya.

**`updateFile` menulis kunci baru lalu menghapus yang lama.** Menimpa kunci yang
sama berarti `next/image` menyajikan gambar lama selama 24 jam setelah
penggantian — bug yang sudah ada hari ini. `ImageUpload` sudah menyimpan kunci
balikan lewat `onChange`, jadi tidak ada pemanggil yang perlu berubah.

**Batas 5 MB ditegakkan di server action.** `image-upload.tsx` menjanjikan
"Maks. 5MB" tapi tidak ada yang memeriksanya, dan `bodySizeLimit` masih `50mb`.
Rata-rata objek yang ada sekarang 4 MB — janji itu memang tidak pernah
ditegakkan. Pemeriksaan di klien boleh ditambah untuk kenyamanan, tapi yang
mengikat adalah yang di server.

Normalisasi ukuran gambar (resize/encode ulang) **bukan** bagian tiket ini —
lihat tabel penundaan di `spec.md`.
