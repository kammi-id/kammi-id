# Cakupan Humas tidak turun ke Struktur bawah

Setiap kewenangan lain menghitung Cakupan secara rekursif — Struktur miliknya
beserta seluruh turunannya. Humas sengaja dikecualikan: Cakupannya berhenti di
Strukturnya sendiri. Alasannya, publikasi adalah milik masing-masing Struktur;
Humas tingkat Wilayah tidak berhak menerbitkan Artikel atau mengubah Pengaturan
Situs atas nama Daerah di bawahnya, sekalipun secara kestrukturan ia berada di
atasnya.

## Consequences

Pengecualian ini hidup sebagai satu `return` lebih awal di tengah query
rekursif penghitung Cakupan, sehingga terbaca seperti kejanggalan yang belum
sempat dirapikan. Bukan — jangan disatukan ke jalur rekursif "biar konsisten".
Konsistensi di situ justru akan diam-diam memberi setiap Humas kendali atas
situs publik seluruh Struktur di bawahnya.
