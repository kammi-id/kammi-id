# Keadaan Kader saling meniadakan

Aktif, Sanksi, Non-Aktif, dan Alumni disimpan sebagai tiga boolean yang secara
teknis bisa menyala bersamaan, sehingga skema seolah menawarkan model
multi-sumbu — seorang Alumni yang sekaligus Non-Aktif, misalnya. Kami memutuskan
sebaliknya: seorang Kader berada pada **tepat satu** Keadaan, mengikuti model
yang sudah dijalankan UI profil dan sudah tercermin pada data production.

## Considered Options

Model multi-sumbu sempat dipilih lebih dulu, dengan alasan Non-Aktif menyangkut
keterlibatan sedangkan Alumni menyangkut tuntasnya kekaderan — dua hal yang
memang berbeda. Opsi itu dibatalkan setelah ketahuan bahwa aplikasi sudah
berjalan di production dengan model saling-meniadakan: form profil mengikat
ketiganya ke satu pilihan, sehingga data yang terkumpul selama ini tidak pernah
merekam kombinasi. Menerima model yang lebih longgar berarti menganggap sah
kombinasi yang datanya tidak pernah ada, tanpa cara memulihkan mana yang
seharusnya menyala.

## Consequences

Skema tidak menegakkan aturan ini — tiga boolean terpisah tetap mengizinkan
kombinasi apa pun, dan aturannya hanya hidup di UI. Siapa pun yang menambah
jalur tulis baru ke Keadaan Kader (impor massal, aksi lain, skrip perbaikan
data) wajib menegakkannya sendiri. Jangan "membetulkan" UI profil agar
ketiganya bisa dinyalakan bersamaan — itu keputusan yang dibuat sadar di sini,
bukan keterbatasan yang belum sempat diperbaiki.
