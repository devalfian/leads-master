import type { CallbookTemplate } from "./types";

/**
 * Consultative, demo-first outreach callbook. Edit placeholders and verify every factual claim before use.
 */
export const northbayFnbOutdatedWebsiteOutreach: CallbookTemplate = {
  "id": "northbay-fnb-outdated-website-refresh",
  "name": "Northbay F&B — Outdated Website Refresh",
  "description": "Callbook untuk restoran, cafe, warung, bakery, catering, dan bisnis F&B di Northbay yang sudah punya website tetapi tampilannya atau informasinya mungkin perlu penyegaran. Demo refresh khusus sudah dibuat, dengan cabang untuk observasi faktual, menu/CTA, harga, scope, keberatan, follow-up, deal, dan DNC.",
  "targetAudience": "Restoran, cafe, coffee shop, warung, bakery, dessert shop, bar, beach club kecil, catering, dan bisnis F&B di Northbay yang telah memiliki website aktif tetapi tampilannya/informasinya terlihat outdated atau pengalaman mobile/kontak bisa diperjelas.",
  "primaryGoal": "book_meeting",
  "marketCode": "ID",
  "nicheName": "F&B",
  "guidance": "Kasus khusus: bisnis sudah memiliki website yang terlihat outdated dan kamu telah membuat demo konsep refresh khusus. Awali dengan membalas sapaan mereka, lalu tanyakan apakah yang menjawab adalah owner atau apakah bisa berbicara dengan owner/pengelola website dan marketing. Setelah owner tersambung, sebut website yang sudah ada dengan hormat; jangan bilang jelek, rusak, tidak menghasilkan, atau tidak profesional. Sebut maksimal 1–2 observasi yang benar-benar kamu verifikasi di website saat ini, misalnya menu/foto/jam buka sulit ditemukan, layout mobile terasa padat, informasi tampak lama, atau CTA kontak kurang jelas. Ganti placeholder [observasi faktual] sebelum menelepon; jangan mengarang. Jelaskan bahwa demo adalah konsep alternatif, bukan website resmi/live dan bukan klaim bahwa redesign otomatis menaikkan omzet/SEO. Paket Essential Rp1.500.000 dibatasi scope tertulis; fitur online ordering, payment gateway, POS/inventory, table booking real-time, loyalty, multi-location, multi-bahasa, dan integrasi delivery dihitung terpisah. Kisaran Rp2.500.000–Rp3.000.000 hanya disebut sebagai pembanding yang pernah ditemui untuk scope yang sebanding, bukan harga pasar universal. Minta izin sebelum mengirim demo/proposal atau melakukan follow-up. Pada penolakan halus yang bukan larangan kontak, boleh sekali meminta izin mengirim satu WhatsApp singkat agar prospek dapat menyimpan kontak. Jika menolak pesan, tutup tanpa mengirim. Jika meminta jangan dihubungi lagi, tandai DNC dan jangan menawarkan WhatsApp/follow-up. Prinsip keberatan terbaru: validasi dulu, ajukan satu pertanyaan untuk menggali alasan sebenarnya, dengarkan, baru tanggapi secara spesifik dan sepakati langkah berikutnya. Jangan langsung membantah, menjelaskan semua fitur, atau memberi diskon. Setelah demo/harga, beri jeda. Bahasa caller dibuat lebih hangat dengan “aku” dan sapaan sopan; gunakan “Pak/Bu” atau “Kak” sesuai konteks. Izin WhatsApp hanya diminta satu kali pada penolakan halus; jika ditolak, tutup. Permintaan DNC harus langsung dihormati.",
  "startKey": "opening",
  "nodes": [
    {
      "key": "opening",
      "type": "message",
      "title": "Pembukaan — balas sapaan, lalu pastikan owner/decision-maker",
      "script": "Jika pihak bisnis menyapa lebih dulu, balas dengan tenang: “Halo, selamat pagi/siang. Terima kasih ya. Aku [Nama Anda] dari [Brand]. Boleh aku bicara dengan owner [Nama Bisnis], atau orang yang mengurus website sebentar?”\n\nJika mereka membuka dalam bahasa Inggris: “Hi, thanks for answering. My name is [Your Name] from [Brand]. May I speak with the owner of [Business Name], or whoever looks after the website?”",
      "internalNote": "Jangan pitching sebelum terhubung dengan owner/pengambil keputusan. Sapa balik dengan ramah lalu ajukan pertanyaan singkat.",
      "branches": [
        {
          "key": "owner_yes",
          "label": "Mereka pemilik / pengambil keputusan",
          "examples": [
            "Iya, saya owner-nya.",
            "Saya yang urus website.",
            "Saya manager yang mengurus marketing."
          ],
          "target": "owner_intro"
        },
        {
          "key": "transfer",
          "label": "Mereka menawarkan menyambungkan ke owner",
          "examples": [
            "Saya sambungkan dulu.",
            "Tunggu sebentar ya."
          ],
          "target": "transfer_result"
        },
        {
          "key": "not_owner",
          "label": "Yang menjawab staf / admin / resepsionis",
          "examples": [
            "Saya adminnya.",
            "Owner tidak ada.",
            "Website diurus orang lain."
          ],
          "target": "gatekeeper"
        },
        {
          "key": "asks_reason",
          "label": "Mereka bertanya tujuan menelepon",
          "examples": [
            "Ada keperluan apa?",
            "Ini dari mana dan tentang apa?"
          ],
          "target": "gatekeeper_reason"
        },
        {
          "key": "busy",
          "label": "Mereka sedang sibuk",
          "examples": [
            "Lagi melayani pelanggan.",
            "Bisa telepon lagi nanti?"
          ],
          "target": "callback"
        },
        {
          "key": "soft_no",
          "label": "Mereka menolak secara umum",
          "examples": [
            "Belum perlu, terima kasih.",
            "Kami sudah cukup."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Mereka secara eksplisit meminta jangan dihubungi lagi",
          "examples": [
            "Jangan telepon lagi ya.",
            "Hapus nomor kami."
          ],
          "target": "do_not_contact"
        },
        {
          "key": "wrong_number",
          "label": "Nomor atau bisnis salah",
          "examples": [
            "Salah sambung.",
            "Ini bukan nomor bisnis itu."
          ],
          "target": "wrong_contact"
        }
      ]
    },
    {
      "key": "transfer_result",
      "type": "message",
      "title": "Hasil transfer ke owner",
      "script": "“Halo, Pak/Bu. Terima kasih sudah menerima telepon. Aku [Nama Bapak/Ibu]. Aku menghubungi [Nama Bisnis] karena aku sudah menyiapkan demo konsep website khusus untuk bisnis ini. Apakah sekarang waktu yang pas untuk menjelaskan singkat?”",
      "internalNote": "Jika disambungkan, ulangi identitas dan tujuan. Jangan langsung meluncurkan pitch panjang.",
      "branches": [
        {
          "key": "picked_up",
          "label": "Owner tersambung dan bersedia mendengar",
          "examples": [
            "Iya, saya owner. Ada apa?",
            "Oke, silakan."
          ],
          "target": "owner_intro"
        },
        {
          "key": "not_available",
          "label": "Transfer gagal / owner tidak menjawab",
          "examples": [
            "Owner sedang keluar.",
            "Belum bisa dihubungi."
          ],
          "target": "gatekeeper_contact"
        },
        {
          "key": "busy",
          "label": "Owner menjawab tetapi sedang sibuk",
          "examples": [
            "Lagi ada pelanggan.",
            "Saya sedang meeting."
          ],
          "target": "callback"
        },
        {
          "key": "asks_reason",
          "label": "Owner atau staf meminta konteks singkat",
          "examples": [
            "Tentang website apa?"
          ],
          "target": "gatekeeper_reason"
        },
        {
          "key": "dnc",
          "label": "Meminta tidak dihubungi lagi",
          "examples": [
            "Jangan hubungi kami lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "gatekeeper",
      "type": "message",
      "title": "Berbicara dengan admin / staf, bukan owner",
      "script": "“Baik, terima kasih. Aku tidak ingin mengganggu operasional. Aku ingin menunjukkan konsep website yang sudah aku siapkan untuk [Nama Bisnis]. Siapa yang paling tepat untuk aku ajak bicara—owner atau manager?”",
      "internalNote": "Hormati staf dan jangan memaksa mendapat nomor pribadi owner.",
      "branches": [
        {
          "key": "can_transfer",
          "label": "Staf mau menyambungkan",
          "examples": [
            "Saya coba sambungkan.",
            "Tunggu sebentar."
          ],
          "target": "transfer_result"
        },
        {
          "key": "name_time",
          "label": "Memberi nama atau waktu yang tepat",
          "examples": [
            "Coba hubungi Pak Made besok siang.",
            "Owner biasanya ada sore."
          ],
          "target": "gatekeeper_contact"
        },
        {
          "key": "asks_why",
          "label": "Staf meminta alasan telepon",
          "examples": [
            "Boleh tahu tentang apa?"
          ],
          "target": "gatekeeper_reason"
        },
        {
          "key": "send_info",
          "label": "Staf menyarankan kirim informasi dulu",
          "examples": [
            "Kirim saja ke WhatsApp bisnis.",
            "Ada email admin."
          ],
          "target": "send_channel"
        },
        {
          "key": "cannot_share",
          "label": "Tidak bisa memberi kontak / tidak mau menyambungkan",
          "examples": [
            "Kontak owner tidak bisa diberikan.",
            "Kami tidak menyambungkan telepon sales."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "not_interested",
          "label": "Staf menolak tanpa meminta stop contact",
          "examples": [
            "Tidak perlu, terima kasih."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Secara eksplisit meminta tidak dihubungi",
          "examples": [
            "Jangan hubungi nomor ini lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "gatekeeper_reason",
      "type": "message",
      "title": "Menjelaskan tujuan kepada gatekeeper",
      "script": "“Aku web developer. Aku membuat demo konsep website untuk [Nama Bisnis]—misalnya untuk menampilkan menu, foto makanan/minuman, jam buka, lokasi, dan tombol WhatsApp atau reservasi. Aku ingin minta masukan owner apakah konsep ini relevan. Boleh dibantu sambungkan atau beri tahu waktu yang tepat?”",
      "internalNote": "Jelaskan tujuan secara transparan; jangan menyiratkan sudah bekerja sama.",
      "branches": [
        {
          "key": "transfer",
          "label": "Bersedia menyambungkan",
          "examples": [
            "Baik, saya sambungkan."
          ],
          "target": "transfer_result"
        },
        {
          "key": "share_contact",
          "label": "Memberi jalur kontak / waktu",
          "examples": [
            "Coba telepon setelah jam 3.",
            "Email ke alamat bisnis saja."
          ],
          "target": "gatekeeper_contact"
        },
        {
          "key": "send_demo",
          "label": "Meminta demo dikirim",
          "examples": [
            "Kirim link demo dulu."
          ],
          "target": "send_channel"
        },
        {
          "key": "asks_price",
          "label": "Bertanya harga",
          "examples": [
            "Paketnya berapa?"
          ],
          "target": "price"
        },
        {
          "key": "decline",
          "label": "Menolak halus",
          "examples": [
            "Kami tidak tertarik."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Meminta jangan dihubungi lagi",
          "examples": [
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "gatekeeper_contact",
      "type": "message",
      "title": "Konfirmasi jalur terbaik untuk menghubungi owner",
      "script": "“Terima kasih. Kapan biasanya owner punya waktu sebentar? Kalau lebih nyaman, boleh titip nama dan nomor bisnis aku untuk diteruskan, tanpa perlu memberikan nomor pribadi beliau.”",
      "internalNote": "Ambil hanya detail yang mereka bersedia bagikan.",
      "branches": [
        {
          "key": "time_given",
          "label": "Memberikan waktu panggilan",
          "examples": [
            "Besok jam 10 pagi.",
            "Coba hari Kamis setelah makan siang."
          ],
          "target": "callback_scheduled"
        },
        {
          "key": "send_link",
          "label": "Meminta link dikirim",
          "examples": [
            "Kirim WhatsApp saja.",
            "Kirim ke email bisnis."
          ],
          "target": "send_channel"
        },
        {
          "key": "no_contact_info",
          "label": "Tidak memberi waktu/kontak",
          "examples": [
            "Belum bisa membantu."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Meminta tidak dihubungi",
          "examples": [
            "Jangan kontak lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "owner_intro",
      "type": "message",
      "title": "Owner teridentifikasi — izin membahas website lama dan demo refresh",
      "script": "“Makasih ya, Pak/Bu. Aku [Nama Anda] dari [Brand]. Aku sempat lihat website [Nama Bisnis] dan mencatat [observasi faktual yang benar-benar terlihat]. Aku lalu bikin demo konsep penyegaran khusus, terutama untuk bagian [menu/foto/lokasi/jam buka/tombol WhatsApp sesuai demo]. Ini hanya opsi pembanding, bukan berarti website sekarang jelek atau harus diganti. Boleh aku jelaskan sekitar 20 detik?”",
      "internalNote": "Gunakan gaya ramah dan tenang. Identifikasi owner dulu, jelaskan demo tanpa menghakimi, lalu berhenti dan dengarkan. Ganti placeholder sebelum menelepon.",
      "branches": [
        {
          "key": "hear_pitch",
          "label": "Mau mendengar penjelasan",
          "examples": [
            "Silakan.",
            "Oke, lanjut."
          ],
          "target": "outdated_site_observation"
        },
        {
          "key": "show_demo",
          "label": "Langsung ingin melihat demo",
          "examples": [
            "Ada contohnya?",
            "Coba kirim link."
          ],
          "target": "send_channel"
        },
        {
          "key": "price_first",
          "label": "Menanyakan harga dulu",
          "examples": [
            "Berapa biayanya?"
          ],
          "target": "price"
        },
        {
          "key": "existing_site",
          "label": "Sudah punya website",
          "examples": [
            "Kami sudah punya website."
          ],
          "target": "existing_site"
        },
        {
          "key": "busy",
          "label": "Owner sedang sibuk",
          "examples": [
            "Saya sedang urus pelanggan.",
            "Telepon nanti saja."
          ],
          "target": "callback"
        },
        {
          "key": "decision_process",
          "label": "Keputusan dipegang partner / manager",
          "examples": [
            "Saya perlu diskusi dengan partner.",
            "Marketing kami yang memutuskan."
          ],
          "target": "decision_process"
        },
        {
          "key": "soft_no",
          "label": "Tidak tertarik sekarang",
          "examples": [
            "Belum butuh."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Meminta stop contact",
          "examples": [
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        },
        {
          "key": "site_is_fine",
          "label": "Owner mengatakan website yang sekarang sudah cukup",
          "examples": [
            "Website sekarang sudah cukup kok.",
            "Kami puas dengan website yang ada."
          ],
          "target": "website_good_fit"
        },
        {
          "key": "need_think",
          "label": "Prospek ingin pikir-pikir",
          "examples": [
            "Aku perlu pikir-pikir dulu."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "Prospek ingin membandingkan",
          "examples": [
            "Aku mau bandingkan dulu."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "Perlu diskusi dengan partner",
          "examples": [
            "Aku diskusi dengan partner dulu."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "Minta informasi terlebih dahulu",
          "examples": [
            "Kirim informasi dulu aja."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing belum tepat",
          "examples": [
            "Sekarang belum waktunya."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "Hanya lihat-lihat",
          "examples": [
            "Aku cuma lihat-lihat dulu."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "Jeda setelah demo atau harga",
          "examples": [
            "Mereka diam setelah demo atau harga."
          ],
          "target": "objection_silence"
        },
        {
          "key": "price_concern_diagnostic",
          "label": "Price feels too high",
          "examples": [
            "Mahal ya."
          ],
          "target": "objection_expensive"
        }
      ]
    },
    {
      "key": "outdated_site_observation",
      "type": "message",
      "title": "Jelaskan alasan menawarkan refresh — fokus pada contoh yang bisa dilihat",
      "script": "“Aku sempat lihat website yang sekarang. Sebelum aku berasumsi, boleh tahu apakah website itu masih membantu kebutuhan bisnis saat ini, atau ada bagian yang memang ingin dibuat lebih mudah untuk pelanggan?”",
      "internalNote": "Mulai dengan pertanyaan, bukan kritik. Sebut maksimal 1–2 observasi faktual yang sudah diverifikasi jika owner meminta contoh.",
      "branches": [
        {
          "key": "wants_demo",
          "label": "Mau melihat atau menerima demo",
          "examples": [
            "Boleh, kirim link-nya.",
            "Coba tunjukkan."
          ],
          "target": "send_channel"
        },
        {
          "key": "asks_what_outdated",
          "label": "Bertanya bagian mana yang perlu diperbarui",
          "examples": [
            "Bagian mana yang menurut Anda outdated?",
            "Apa yang mau diubah?"
          ],
          "target": "outdated_specifics"
        },
        {
          "key": "site_is_fine",
          "label": "Owner merasa website yang sekarang masih cukup baik",
          "examples": [
            "Menurut saya masih bagus kok.",
            "Website kami masih berfungsi dengan baik."
          ],
          "target": "website_good_fit"
        },
        {
          "key": "already_updating",
          "label": "Sedang memperbarui website",
          "examples": [
            "Kami sedang redesign.",
            "Developer kami sedang mengerjakan update."
          ],
          "target": "refresh_in_progress"
        },
        {
          "key": "asks_price",
          "label": "Menanyakan harga sebelum melihat demo",
          "examples": [
            "Kalau biayanya berapa?",
            "Berapa untuk redesign?"
          ],
          "target": "price"
        },
        {
          "key": "busy",
          "label": "Sedang sibuk",
          "examples": [
            "Saya sedang ada pelanggan.",
            "Telepon lagi nanti."
          ],
          "target": "callback"
        },
        {
          "key": "not_interested",
          "label": "Tidak tertarik",
          "examples": [
            "Tidak perlu, terima kasih.",
            "Kami tidak berminat."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Meminta tidak dihubungi lagi",
          "examples": [
            "Jangan hubungi lagi.",
            "Hapus nomor kami."
          ],
          "target": "do_not_contact"
        },
        {
          "key": "asks_who_made_demo",
          "label": "Owner bertanya siapa yang membuat demo atau apakah ini website resmi",
          "examples": [
            "Ini dibuat siapa?",
            "Ini sudah live?"
          ],
          "target": "demo_privacy"
        },
        {
          "key": "needs_owner_approval",
          "label": "Owner ingin membahas dengan partner atau manager",
          "examples": [
            "Saya diskusi dulu dengan partner."
          ],
          "target": "decision_process"
        },
        {
          "key": "website_update_in_progress",
          "label": "Website sedang dikerjakan ulang oleh tim/developer lain",
          "examples": [
            "Kami sedang redesign.",
            "Developer kami lagi update website."
          ],
          "target": "refresh_in_progress"
        },
        {
          "key": "need_think",
          "label": "Prospek ingin pikir-pikir",
          "examples": [
            "Aku perlu pikir-pikir dulu."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "Prospek ingin membandingkan",
          "examples": [
            "Aku mau bandingkan dulu."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "Perlu diskusi dengan partner",
          "examples": [
            "Aku diskusi dengan partner dulu."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "Minta informasi terlebih dahulu",
          "examples": [
            "Kirim informasi dulu aja."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing belum tepat",
          "examples": [
            "Sekarang belum waktunya."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "Hanya lihat-lihat",
          "examples": [
            "Aku cuma lihat-lihat dulu."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "Jeda setelah demo atau harga",
          "examples": [
            "Mereka diam setelah demo atau harga."
          ],
          "target": "objection_silence"
        }
      ]
    },
    {
      "key": "outdated_specifics",
      "type": "message",
      "title": "Jika owner meminta contoh konkret dari website sekarang",
      "script": "“Yang aku maksud tadi adalah [sebutkan hanya observasi spesifik yang benar-benar kamu periksa]. Bisa jadi hal itu memang bukan prioritas buat bisnis, jadi aku nggak mau berasumsi. Apakah bagian tersebut pernah jadi kendala, atau sebenarnya sudah cukup baik?”",
      "internalNote": "Jangan mengarang masalah performa, SEO, penjualan, keamanan, atau konversi. Jika tidak dianggap masalah oleh owner, terima dan jangan mendebat.",
      "branches": [
        {
          "key": "show_example",
          "label": "Mau melihat contoh perubahan",
          "examples": [
            "Oke, tunjukkan contohnya.",
            "Kirim demonya."
          ],
          "target": "send_channel"
        },
        {
          "key": "asks_price",
          "label": "Minta harga",
          "examples": [
            "Kalau dibuat berapa?"
          ],
          "target": "price"
        },
        {
          "key": "defends_site",
          "label": "Menilai website sekarang sudah cukup",
          "examples": [
            "Kami puas dengan website sekarang."
          ],
          "target": "website_good_fit"
        },
        {
          "key": "asks_proof",
          "label": "Minta bukti dampak atau hasil",
          "examples": [
            "Apa buktinya akan lebih bagus?",
            "Bisa menjamin lebih banyak booking?"
          ],
          "target": "guarantees"
        },
        {
          "key": "soft_no",
          "label": "Tidak ingin melanjutkan",
          "examples": [
            "Kami tidak mau ubah sekarang."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Meminta tidak dihubungi lagi",
          "examples": [
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        },
        {
          "key": "need_think",
          "label": "Prospek ingin pikir-pikir",
          "examples": [
            "Aku perlu pikir-pikir dulu."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "Prospek ingin membandingkan",
          "examples": [
            "Aku mau bandingkan dulu."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "Perlu diskusi dengan partner",
          "examples": [
            "Aku diskusi dengan partner dulu."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "Minta informasi terlebih dahulu",
          "examples": [
            "Kirim informasi dulu aja."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing belum tepat",
          "examples": [
            "Sekarang belum waktunya."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "Hanya lihat-lihat",
          "examples": [
            "Aku cuma lihat-lihat dulu."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "Jeda setelah demo atau harga",
          "examples": [
            "Mereka diam setelah demo atau harga."
          ],
          "target": "objection_silence"
        }
      ]
    },
    {
      "key": "refresh_in_progress",
      "type": "message",
      "title": "Website sedang diperbarui — hormati timeline dan kerja sama yang berjalan",
      "script": "“Oh, baik, terima kasih sudah memberi tahu. Kalau proses pembaruan sudah berjalan, aku tidak ingin mengganggu atau membuat pekerjaan ganda. Demo aku bisa jadi pembanding saja, bukan ajakan mengganti vendor. Apakah Bapak/Ibu ingin melihatnya sebagai referensi, atau lebih baik aku tidak lanjut?”",
      "internalNote": "Jangan mencoba merebut proyek dari developer/agency aktif. Jangan follow-up kecuali diminta atau diizinkan. Jika mereka menyebut jangan dihubungi, langsung DNC.",
      "branches": [
        {
          "key": "wants_reference",
          "label": "Mau melihat demo sebagai pembanding",
          "examples": [
            "Boleh kirim untuk referensi.",
            "Saya mau lihat konsepnya."
          ],
          "target": "send_channel"
        },
        {
          "key": "asks_price",
          "label": "Ingin mengetahui harga jika dikerjakan setelah pembaruan",
          "examples": [
            "Kalau nanti gimana harganya?",
            "Berapa paketnya?"
          ],
          "target": "price"
        },
        {
          "key": "follow_after_launch",
          "label": "Meminta follow-up setelah website baru selesai",
          "examples": [
            "Hubungi lagi bulan depan setelah launch.",
            "Coba kontak lagi setelah proyek selesai."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "currently_busy",
          "label": "Tidak sempat bicara sekarang",
          "examples": [
            "Saya lagi sibuk."
          ],
          "target": "callback"
        },
        {
          "key": "not_needed",
          "label": "Tidak perlu demo atau kontak lanjutan",
          "examples": [
            "Tidak usah, terima kasih."
          ],
          "target": "polite_close"
        },
        {
          "key": "do_not_contact",
          "label": "Meminta tidak dihubungi lagi",
          "examples": [
            "Tolong jangan kontak lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "demo_pitch",
      "type": "message",
      "title": "Pitch utama — demo refresh F&B sudah dibuat khusus",
      "script": "“Aku sudah menyiapkan preview khusus [Nama Bisnis], jadi bukan template kosong. Karena website bisnis sudah ada, ini aku buat sebagai alternatif tampilan/struktur—misalnya menu, foto makanan/minuman, lokasi dan jam operasional, lalu tombol WhatsApp/reservasi yang lebih jelas di mobile. Aku tidak mengklaim ini pasti meningkatkan penjualan; tujuannya agar Bapak/Ibu bisa membandingkan dan memilih. Boleh aku kirim preview-nya atau kita lihat bersama 5 menit?”",
      "internalNote": "Isi [Nama Bisnis], [URL demo], dan contoh yang sungguh ada di demo. Jangan klaim redesign live atau memindahkan domain tanpa persetujuan. Setelah mengajukan pertanyaan terakhir, berhenti bicara dan beri jeda. Jika ada keberatan, gali penyebabnya melalui node objection_* sebelum menjelaskan atau menawarkan diskon.",
      "branches": [
        {
          "key": "walkthrough",
          "label": "Bersedia melihat bersama",
          "examples": [
            "Boleh, tunjukkan.",
            "Ada waktu sebentar."
          ],
          "target": "schedule_review"
        },
        {
          "key": "link_only",
          "label": "Minta link saja",
          "examples": [
            "Kirim dulu, nanti saya lihat."
          ],
          "target": "send_channel"
        },
        {
          "key": "asks_source",
          "label": "Bertanya dari mana demo / apakah live",
          "examples": [
            "Ini sudah dipasang?",
            "Dapat data kami dari mana?"
          ],
          "target": "demo_privacy"
        },
        {
          "key": "asks_price",
          "label": "Menanyakan biaya",
          "examples": [
            "Kalau dibuat berapa?"
          ],
          "target": "price"
        },
        {
          "key": "scope",
          "label": "Menanyakan fitur yang termasuk",
          "examples": [
            "Sudah termasuk apa saja?"
          ],
          "target": "scope_questions"
        },
        {
          "key": "guarantee",
          "label": "Meminta jaminan booking / ranking",
          "examples": [
            "Bisa jamin booking naik?"
          ],
          "target": "guarantees"
        },
        {
          "key": "site_exists",
          "label": "Sudah punya website / agency",
          "examples": [
            "Website kami sudah ada.",
            "Ada agency yang pegang."
          ],
          "target": "existing_site"
        },
        {
          "key": "soft_no",
          "label": "Tidak tertarik",
          "examples": [
            "Tidak dulu, terima kasih."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Meminta tidak dihubungi",
          "examples": [
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        },
        {
          "key": "clarify_fnb_needs",
          "label": "Tanya kebutuhan menu dan informasi bisnis",
          "examples": [
            "Kami punya makanan/minuman dan menu.",
            "Apa saja yang bisa ditampilkan?"
          ],
          "target": "fnb_discovery"
        },
        {
          "key": "asks_booking_features",
          "label": "Menanyakan fitur booking atau operasional bisnis",
          "examples": [
            "Bisa tampilkan menu dan harga?",
            "Bisa order dan bayar langsung dari website?"
          ],
          "target": "fnb_operations"
        },
        {
          "key": "outdated_site",
          "label": "Website sudah ada dan perlu penyegaran",
          "examples": [
            "Website kami sudah ada.",
            "Website kami belum diperbarui lama."
          ],
          "target": "outdated_site_observation"
        },
        {
          "key": "fnb_needs",
          "label": "Membahas kebutuhan F&B",
          "examples": [
            "Kami bisnis makanan/minuman dan menu.",
            "Apa saja yang bisa ditampilkan?"
          ],
          "target": "fnb_discovery"
        },
        {
          "key": "operational_features",
          "label": "Bertanya tentang order / booking / fitur operasional",
          "examples": [
            "Bisa booking meja real-time?",
            "Bisa bayar online?"
          ],
          "target": "fnb_operations"
        },
        {
          "key": "need_think",
          "label": "Prospek ingin pikir-pikir",
          "examples": [
            "Aku perlu pikir-pikir dulu."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "Prospek ingin membandingkan",
          "examples": [
            "Aku mau bandingkan dulu."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "Perlu diskusi dengan partner",
          "examples": [
            "Aku diskusi dengan partner dulu."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "Minta informasi terlebih dahulu",
          "examples": [
            "Kirim informasi dulu aja."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing belum tepat",
          "examples": [
            "Sekarang belum waktunya."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "Hanya lihat-lihat",
          "examples": [
            "Aku cuma lihat-lihat dulu."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "Jeda setelah demo atau harga",
          "examples": [
            "Mereka diam setelah demo atau harga."
          ],
          "target": "objection_silence"
        },
        {
          "key": "price_concern_diagnostic",
          "label": "Price feels too high",
          "examples": [
            "Mahal ya."
          ],
          "target": "objection_expensive"
        }
      ]
    },
    {
      "key": "demo_privacy",
      "type": "message",
      "title": "Menjawab pertanyaan tentang demo dan sumber informasi",
      "script": "“Ini hanya preview konsep yang aku buat dari informasi yang tersedia secara publik dan elemen contoh; bukan website resmi dan tidak mengubah website sekarang. Aku tidak masuk ke admin atau memakai kredensial bisnis. Konten final—terutama menu, harga, foto, dan informasi operasional—baru dipakai setelah Bapak/Ibu menyetujui. Kalau ada bagian yang tidak ingin dipakai, aku ganti atau hapus.”",
      "internalNote": "Jangan menggunakan foto berhak cipta atau materi privat tanpa izin. Jika diminta menghapus, ikuti.",
      "branches": [
        {
          "key": "okay_send",
          "label": "Memahami dan tetap ingin melihat",
          "examples": [
            "Oke, kirim saja."
          ],
          "target": "send_channel"
        },
        {
          "key": "wants_portfolio",
          "label": "Meminta portofolio/referensi lain",
          "examples": [
            "Ada website lain yang pernah dibuat?"
          ],
          "target": "trust"
        },
        {
          "key": "remove_demo",
          "label": "Meminta demo dihapus / tidak digunakan",
          "examples": [
            "Tolong hapus preview-nya."
          ],
          "target": "demo_removed"
        },
        {
          "key": "dnc",
          "label": "Meminta no contact",
          "examples": [
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "fnb_discovery",
      "type": "message",
      "title": "Discovery — pahami model bisnis F&B",
      "script": "“Biar demo refresh-nya relevan, boleh tahu bisnis ini lebih fokus dine-in, takeaway, delivery, catering, atau kombinasi? Di website sekarang, bagian mana yang paling sering ingin diperbarui—menu/harga, foto, jam buka, promo, atau kontak? Dan pelanggan biasanya perlu paling cepat menemukan apa?”",
      "internalNote": "Tanyakan maksimal dua pertanyaan. Dengarkan, jangan membuat discovery terasa seperti interogasi.",
      "branches": [
        {
          "key": "dine_in_takeaway",
          "label": "Fokus dine-in / takeaway",
          "examples": [
            "Kami bisnis makanan/minuman saja.",
            "Mayoritas dine-in."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "cars",
          "label": "Fokus delivery / takeaway",
          "examples": [
            "Kami lebih banyak menu."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "both",
          "label": "Dine-in, takeaway, dan delivery",
          "examples": [
            "Semua ada."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "asks_price",
          "label": "Menanyakan harga website",
          "examples": [
            "Biaya bikin website berapa?"
          ],
          "target": "price"
        },
        {
          "key": "busy",
          "label": "Tidak bisa berdiskusi sekarang",
          "examples": [
            "Saya sedang melayani customer."
          ],
          "target": "callback"
        }
      ]
    },
    {
      "key": "fnb_operations",
      "type": "message",
      "title": "Pertanyaan fitur operasional F&B",
      "script": "“Untuk Essential, aku fokus pada website informatif dan jalur kontak yang jelas. Fitur seperti order online dengan keranjang, pembayaran online, sinkronisasi POS/stok, booking meja real-time, atau integrasi aplikasi delivery perlu scope dan estimasi terpisah. Kita bisa mulai dari kebutuhan paling penting dulu.”",
      "internalNote": "Jangan menjanjikan sistem operasional kompleks sebagai bagian paket Rp1,5 juta.",
      "branches": [
        {
          "key": "basic_ok",
          "label": "Fitur website dasar sudah cukup",
          "examples": [
            "Kami hanya butuh katalog dan WhatsApp."
          ],
          "target": "price"
        },
        {
          "key": "needs_booking_system",
          "label": "Membutuhkan sistem booking atau ketersediaan real-time",
          "examples": [
            "Bisa pilih tanggal dan cek menu tersedia?"
          ],
          "target": "custom_scope"
        },
        {
          "key": "needs_payment",
          "label": "Membutuhkan pembayaran online",
          "examples": [
            "Bisa langsung bayar DP di website?"
          ],
          "target": "custom_scope"
        },
        {
          "key": "asks_demo",
          "label": "Minta melihat demo",
          "examples": [
            "Bisa saya lihat dulu?"
          ],
          "target": "send_channel"
        }
      ]
    },
    {
      "key": "price",
      "type": "message",
      "title": "Harga Paket Essential Rp1.500.000",
      "script": "“Paket Essential yang aku tawarkan Rp1.500.000 untuk scope yang disepakati tertulis. Aku pernah melihat beberapa penawaran dengan scope sebanding di kisaran Rp2.500.000–Rp3.000.000, tetapi tiap penyedia dan deliverable bisa berbeda. Boleh aku tahu yang paling ingin dipastikan dulu—budget, apa saja yang termasuk, atau apakah ini cocok untuk kebutuhan bisnis?”",
      "internalNote": "Sebut kisaran Rp2,5–3 juta hanya jika memang punya dasar dari penawaran nyata dengan scope sebanding. Setelah menyebut harga, jeda. Jangan langsung memberi diskon atau mengklaim ini harga pasar universal.",
      "branches": [
        {
          "key": "price_accepted",
          "label": "Harga terdengar masuk akal",
          "examples": [
            "Oke, masih masuk.",
            "Boleh, jelaskan."
          ],
          "target": "scope_questions"
        },
        {
          "key": "compare",
          "label": "Membandingkan dengan harga pasar / vendor lain",
          "examples": [
            "Kenapa lebih murah?",
            "Vendor lain bilang 2,5 juta."
          ],
          "target": "objection_compare"
        },
        {
          "key": "expensive",
          "label": "Masih terlalu mahal",
          "examples": [
            "Budget kami belum cukup."
          ],
          "target": "objection_expensive"
        },
        {
          "key": "included",
          "label": "Menanyakan apa yang termasuk",
          "examples": [
            "Halaman dan fitur apa saja?"
          ],
          "target": "scope_questions"
        },
        {
          "key": "discount",
          "label": "Meminta diskon / harga lebih rendah",
          "examples": [
            "Bisa kurang lagi?"
          ],
          "target": "discount_request"
        },
        {
          "key": "payment",
          "label": "Menanyakan termin pembayaran",
          "examples": [
            "Bayarnya bagaimana?"
          ],
          "target": "payment_terms"
        },
        {
          "key": "advanced",
          "label": "Meminta fitur lanjutan / sistem booking kompleks",
          "examples": [
            "Termasuk payment gateway dan sistem booking?"
          ],
          "target": "custom_scope"
        },
        {
          "key": "trust",
          "label": "Curiga harga terlalu murah",
          "examples": [
            "Kok murah sekali?"
          ],
          "target": "trust"
        },
        {
          "key": "soft_no",
          "label": "Menolak setelah tahu harga",
          "examples": [
            "Kalau begitu belum dulu."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "need_think",
          "label": "Prospek ingin pikir-pikir",
          "examples": [
            "Aku perlu pikir-pikir dulu."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "Prospek ingin membandingkan",
          "examples": [
            "Aku mau bandingkan dulu."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "Perlu diskusi dengan partner",
          "examples": [
            "Aku diskusi dengan partner dulu."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "Minta informasi terlebih dahulu",
          "examples": [
            "Kirim informasi dulu aja."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing belum tepat",
          "examples": [
            "Sekarang belum waktunya."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "Hanya lihat-lihat",
          "examples": [
            "Aku cuma lihat-lihat dulu."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "Jeda setelah demo atau harga",
          "examples": [
            "Mereka diam setelah demo atau harga."
          ],
          "target": "objection_silence"
        },
        {
          "key": "price_concern_diagnostic",
          "label": "Price feels too high",
          "examples": [
            "Mahal ya."
          ],
          "target": "objection_expensive"
        }
      ]
    },
    {
      "key": "price_comparison",
      "type": "message",
      "title": "Menjawab perbandingan harga",
      "script": "“Wajar kok kalau mau membandingkan. Boleh aku tahu satu hal utama yang sedang dibandingkan—harga, scope, desain, atau dukungan setelah website live?”",
      "internalNote": "Jangan menjelekkan kompetitor atau langsung membela harga. Setelah tahu kriteria, bandingkan deliverable secara terbuka.",
      "branches": [
        {
          "key": "compare_scope",
          "label": "Ingin membandingkan scope",
          "examples": [
            "Boleh kirim rinciannya."
          ],
          "target": "scope_questions"
        },
        {
          "key": "competitor_cheaper",
          "label": "Mendapat penawaran lebih murah",
          "examples": [
            "Ada yang lebih murah dari itu."
          ],
          "target": "budget_objection"
        },
        {
          "key": "quality",
          "label": "Khawatir kualitas karena murah",
          "examples": [
            "Takut hasilnya kurang bagus."
          ],
          "target": "trust"
        },
        {
          "key": "no",
          "label": "Tidak ingin melanjutkan",
          "examples": [
            "Tidak perlu, terima kasih."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "need_think",
          "label": "Prospek ingin pikir-pikir",
          "examples": [
            "Aku perlu pikir-pikir dulu."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "Prospek ingin membandingkan",
          "examples": [
            "Aku mau bandingkan dulu."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "Perlu diskusi dengan partner",
          "examples": [
            "Aku diskusi dengan partner dulu."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "Minta informasi terlebih dahulu",
          "examples": [
            "Kirim informasi dulu aja."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing belum tepat",
          "examples": [
            "Sekarang belum waktunya."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "Hanya lihat-lihat",
          "examples": [
            "Aku cuma lihat-lihat dulu."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "Jeda setelah demo atau harga",
          "examples": [
            "Mereka diam setelah demo atau harga."
          ],
          "target": "objection_silence"
        }
      ]
    },
    {
      "key": "scope_questions",
      "type": "message",
      "title": "Jelaskan scope Essential sebelum komitmen",
      "script": "“Supaya jelas, scope final akan tertulis: halaman/section yang dibuat, menu dan foto yang disediakan, tombol WhatsApp atau reservasi, lokasi dan jam buka, responsive mobile, revisi, timeline, serta apa yang tidak termasuk. Domain, hosting, penulisan konten, dan biaya pihak ketiga akan aku tandai terpisah sesuai kesepakatan.”",
      "internalNote": "Jangan menetapkan jumlah halaman/revisi atau layanan hosting yang belum diputuskan. Isi placeholder scope sebelum penawaran.",
      "branches": [
        {
          "key": "fits",
          "label": "Scope dasar cukup",
          "examples": [
            "Iya, cukup untuk mulai."
          ],
          "target": "proposal"
        },
        {
          "key": "domain",
          "label": "Menanyakan domain, hosting, atau biaya tahunan",
          "examples": [
            "Domain dan hosting termasuk?"
          ],
          "target": "domain_hosting"
        },
        {
          "key": "more_pages",
          "label": "Minta lebih banyak halaman / fitur",
          "examples": [
            "Bisa tambah banyak paket dan bahasa?"
          ],
          "target": "custom_scope"
        },
        {
          "key": "timeline",
          "label": "Menanyakan waktu pengerjaan",
          "examples": [
            "Berapa lama selesai?"
          ],
          "target": "timeline"
        },
        {
          "key": "budget",
          "label": "Merasa scope tidak sebanding dengan budget",
          "examples": [
            "Masih belum cocok harganya."
          ],
          "target": "budget_objection"
        },
        {
          "key": "written_quote",
          "label": "Minta rincian tertulis",
          "examples": [
            "Kirim detail resminya."
          ],
          "target": "proposal"
        },
        {
          "key": "need_think",
          "label": "Prospek ingin pikir-pikir",
          "examples": [
            "Aku perlu pikir-pikir dulu."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "Prospek ingin membandingkan",
          "examples": [
            "Aku mau bandingkan dulu."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "Perlu diskusi dengan partner",
          "examples": [
            "Aku diskusi dengan partner dulu."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "Minta informasi terlebih dahulu",
          "examples": [
            "Kirim informasi dulu aja."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing belum tepat",
          "examples": [
            "Sekarang belum waktunya."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "Hanya lihat-lihat",
          "examples": [
            "Aku cuma lihat-lihat dulu."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "Jeda setelah demo atau harga",
          "examples": [
            "Mereka diam setelah demo atau harga."
          ],
          "target": "objection_silence"
        }
      ]
    },
    {
      "key": "domain_hosting",
      "type": "message",
      "title": "Pertanyaan domain, hosting, dan biaya recurring",
      "script": "“Aku akan jelaskan terpisah mana biaya pembuatan sekali bayar dan mana biaya domain/hosting tahunan atau layanan pihak ketiga. Aku tidak mau ada biaya berulang yang baru diketahui belakangan. Detailnya aku tulis di proposal sebelum Bapak/Ibu setuju.”",
      "internalNote": "Jangan bilang hosting/domain gratis selamanya. Verifikasi biaya aktual dan kepemilikan akun.",
      "branches": [
        {
          "key": "clear",
          "label": "Penjelasan sudah cukup",
          "examples": [
            "Oke, jelas."
          ],
          "target": "proposal"
        },
        {
          "key": "recurring_concern",
          "label": "Khawatir biaya tahunan",
          "examples": [
            "Saya tidak mau biaya rutin besar."
          ],
          "target": "budget_objection"
        },
        {
          "key": "need_verify",
          "label": "Perlu cek dulu",
          "examples": [
            "Saya pikirkan dulu."
          ],
          "target": "follow_up_date"
        }
      ]
    },
    {
      "key": "timeline",
      "type": "message",
      "title": "Pertanyaan timeline pengerjaan",
      "script": "“Estimasi aku [X hari kerja] setelah scope disepakati dan materi seperti menu, harga, foto, alamat, serta jam operasional lengkap. Kalau materi belum siap, timeline bisa bergeser; aku akan konfirmasi tanggal yang realistis sebelum mulai.”",
      "internalNote": "Jangan menjanjikan tanggal pasti sebelum cek beban kerja dan kesiapan konten.",
      "branches": [
        {
          "key": "timeline_ok",
          "label": "Timeline sesuai",
          "examples": [
            "Oke, cocok."
          ],
          "target": "proposal"
        },
        {
          "key": "urgent",
          "label": "Minta sangat cepat",
          "examples": [
            "Bisa jadi besok?"
          ],
          "target": "custom_scope"
        },
        {
          "key": "later",
          "label": "Belum punya waktu/materi",
          "examples": [
            "Materinya belum siap."
          ],
          "target": "follow_up_date"
        }
      ]
    },
    {
      "key": "discount_request",
      "type": "message",
      "title": "Permintaan diskon tambahan",
      "script": "“Aku paham ingin menjaga budget. Rp1.500.000 sudah harga Essential untuk scope dasar yang aku tawarkan. Kalau perlu lebih rendah, kita bisa kurangi scope secara jelas—bukan menghilangkan hal penting lalu hasilnya tidak sesuai ekspektasi.”",
      "internalNote": "Jangan menurunkan harga tanpa mengurangi scope atau memahami margin.",
      "branches": [
        {
          "key": "accept_fixed",
          "label": "Menerima harga Essential",
          "examples": [
            "Ya sudah, sesuai scope itu."
          ],
          "target": "scope_questions"
        },
        {
          "key": "reduce",
          "label": "Bersedia mengurangi scope",
          "examples": [
            "Bagian tertentu bisa dihilangkan."
          ],
          "target": "reduced_scope"
        },
        {
          "key": "insists_discount",
          "label": "Tetap minta diskon tanpa mengurangi scope",
          "examples": [
            "Tetap bisa kurang?"
          ],
          "target": "budget_objection"
        },
        {
          "key": "declines",
          "label": "Tidak jadi",
          "examples": [
            "Tidak dulu."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "budget_objection",
      "type": "message",
      "title": "Menangani keberatan budget",
      "script": "“Oke, berarti budget jadi faktor utama. Boleh aku tahu kisaran yang memang sudah disiapkan, atau lebih cocok kalau kita cek dulu scope inti yang paling penting? Aku nggak mau sekadar menurunkan harga untuk scope yang sama tanpa pembahasan.”",
      "internalNote": "Lanjutkan dari alasan yang sudah dijelaskan prospek. Sesuaikan scope hanya jika memang masuk akal; jangan otomatis memberi diskon.",
      "branches": [
        {
          "key": "essential_fit",
          "label": "Scope Essential sudah cukup",
          "examples": [
            "Mulai dari yang dasar saja."
          ],
          "target": "scope_questions"
        },
        {
          "key": "reduce_scope",
          "label": "Mau mengecilkan scope",
          "examples": [
            "Bisa dibuat lebih sederhana?"
          ],
          "target": "reduced_scope"
        },
        {
          "key": "later",
          "label": "Budget tersedia nanti",
          "examples": [
            "Mungkin bulan depan."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "no_budget",
          "label": "Belum ada budget dan tidak ingin lanjut",
          "examples": [
            "Belum ada budget sama sekali."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "need_think",
          "label": "Prospek ingin pikir-pikir",
          "examples": [
            "Aku perlu pikir-pikir dulu."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "Prospek ingin membandingkan",
          "examples": [
            "Aku mau bandingkan dulu."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "Perlu diskusi dengan partner",
          "examples": [
            "Aku diskusi dengan partner dulu."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "Minta informasi terlebih dahulu",
          "examples": [
            "Kirim informasi dulu aja."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing belum tepat",
          "examples": [
            "Sekarang belum waktunya."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "Hanya lihat-lihat",
          "examples": [
            "Aku cuma lihat-lihat dulu."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "Jeda setelah demo atau harga",
          "examples": [
            "Mereka diam setelah demo atau harga."
          ],
          "target": "objection_silence"
        },
        {
          "key": "price_concern_diagnostic",
          "label": "Price feels too high",
          "examples": [
            "Mahal ya."
          ],
          "target": "objection_expensive"
        }
      ]
    },
    {
      "key": "reduced_scope",
      "type": "message",
      "title": "Menyusun versi yang lebih kecil",
      "script": "“Bisa kita buat lebih sederhana sesuai budget—misalnya fokus pada menu, lokasi/jam buka, dan tombol WhatsApp dulu. Aku akan hitung ulang berdasarkan scope yang lebih kecil dan kirim harga tertulis sebelum ada komitmen.”",
      "internalNote": "Jangan menjanjikan harga baru sebelum menghitung scope.",
      "branches": [
        {
          "key": "agrees_quote",
          "label": "Mau meminta penawaran baru",
          "examples": [
            "Buatkan versi sederhana."
          ],
          "target": "custom_quote_followup"
        },
        {
          "key": "returns_essential",
          "label": "Memilih paket Essential standar",
          "examples": [
            "Paket standar saja."
          ],
          "target": "scope_questions"
        },
        {
          "key": "still_too_much",
          "label": "Tetap terlalu mahal",
          "examples": [
            "Tetap di luar budget."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "existing_site",
      "type": "message",
      "title": "Keberatan: “kami sudah punya website” — jelaskan ini tawaran refresh, bukan paksaan ganti",
      "script": "“Oh, berarti website sudah ada, bagus. Aku nggak berasumsi website sekarang bermasalah. Boleh tahu, website itu sudah membantu kebutuhan utama bisnis, atau masih ada bagian yang ingin dibuat lebih mudah untuk pelanggan?”",
      "internalNote": "Gali tugas website saat ini sebelum menyarankan redesign. Jika mereka puas dan tidak punya kebutuhan, terima jawabannya.",
      "branches": [
        {
          "key": "working_well",
          "label": "Website masih berfungsi dan owner merasa puas",
          "examples": [
            "Sudah cukup, booking masuk."
          ],
          "target": "website_good_fit"
        },
        {
          "key": "outdated",
          "label": "Website sudah ada tetapi tampilannya/informasinya terlihat perlu disegarkan",
          "examples": [
            "Tampilan lama, menu sulit ditemukan.",
            "Informasi di website tampak belum diperbarui."
          ],
          "target": "outdated_site_observation"
        },
        {
          "key": "agency_manages",
          "label": "Website dikelola agency/developer lain",
          "examples": [
            "Ada vendor yang mengurus."
          ],
          "target": "agency"
        },
        {
          "key": "social_only",
          "label": "Website ada tapi booking lebih banyak lewat sosial media",
          "examples": [
            "Orang lebih sering chat Instagram/WhatsApp."
          ],
          "target": "social_only"
        },
        {
          "key": "no_changes",
          "label": "Tidak ingin mengubah apa pun",
          "examples": [
            "Belum mau mengubah."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "need_think",
          "label": "Prospek ingin pikir-pikir",
          "examples": [
            "Aku perlu pikir-pikir dulu."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "Prospek ingin membandingkan",
          "examples": [
            "Aku mau bandingkan dulu."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "Perlu diskusi dengan partner",
          "examples": [
            "Aku diskusi dengan partner dulu."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "Minta informasi terlebih dahulu",
          "examples": [
            "Kirim informasi dulu aja."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing belum tepat",
          "examples": [
            "Sekarang belum waktunya."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "Hanya lihat-lihat",
          "examples": [
            "Aku cuma lihat-lihat dulu."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "Jeda setelah demo atau harga",
          "examples": [
            "Mereka diam setelah demo atau harga."
          ],
          "target": "objection_silence"
        }
      ]
    },
    {
      "key": "website_good_fit",
      "type": "message",
      "title": "Website saat ini sudah bekerja baik",
      "script": "“Kalau website sekarang sudah bekerja baik dan Bapak/Ibu puas, aku menghargai itu. Aku bisa berhenti di sini. Kalau berkenan, aku hanya bisa kirim demo sebagai referensi—tetapi kalau tidak perlu, tidak masalah.”",
      "internalNote": "Terima jawaban mereka tanpa mencari-cari masalah.",
      "branches": [
        {
          "key": "see_demo",
          "label": "Tetap mau melihat sebagai referensi",
          "examples": [
            "Boleh, saya lihat."
          ],
          "target": "send_channel"
        },
        {
          "key": "no_need",
          "label": "Tidak perlu",
          "examples": [
            "Tidak usah, terima kasih."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Minta tidak dihubungi",
          "examples": [
            "Tidak usah dan jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "social_only",
      "type": "message",
      "title": "Keberatan: pelanggan datang dari Instagram / WhatsApp / delivery",
      "script": "“Itu bisa tetap jadi channel utama. Website tidak harus menggantikan Instagram, WhatsApp, atau platform delivery; ia bisa jadi halaman ringkas untuk menu, lokasi, jam buka, dan link ke channel yang sudah digunakan. Kalau alur sekarang sudah cukup, tidak perlu dipaksakan.”",
      "internalNote": "Jangan menjanjikan website otomatis mendatangkan pelanggan.",
      "branches": [
        {
          "key": "wants_demo",
          "label": "Mau melihat cara kerjanya",
          "examples": [
            "Coba tunjukkan."
          ],
          "target": "send_channel"
        },
        {
          "key": "referrals_only",
          "label": "Puas dengan referral saja",
          "examples": [
            "Kami cukup dari referral."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "no_interest",
          "label": "Tidak melihat manfaat",
          "examples": [
            "Tidak perlu website."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "agency",
      "type": "message",
      "title": "Keberatan: sudah bekerja sama dengan agency / web developer",
      "script": "“Bagus, aku tidak bermaksud mengganggu kerja sama yang ada. Demo ini hanya alternatif konsep. Kalau ada aturan dari agency saat ini, tentu hormati itu; aku tidak akan menghubungi pihak lain tanpa izin.”",
      "internalNote": "Hindari merusak hubungan vendor dan tidak meminta akses sistem mereka.",
      "branches": [
        {
          "key": "send_to_agency",
          "label": "Mau melihat/membagikan demo",
          "examples": [
            "Kirim link-nya, nanti saya diskusikan."
          ],
          "target": "send_channel"
        },
        {
          "key": "approval_needed",
          "label": "Perlu persetujuan tim/agency",
          "examples": [
            "Saya harus tanya partner dulu."
          ],
          "target": "decision_process"
        },
        {
          "key": "no_need",
          "label": "Tidak perlu vendor lain",
          "examples": [
            "Kami sudah punya semuanya."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Minta tidak dihubungi",
          "examples": [
            "Jangan follow-up lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "trust",
      "type": "message",
      "title": "Keberatan soal kepercayaan / kualitas / identitas",
      "script": "“Wajar untuk berhati-hati. Aku bisa kirim portofolio [URL], demo preview, dan scope tertulis. Bapak/Ibu tidak perlu membagikan password atau akses admin untuk sekadar melihat demo. Silakan cek dulu, tidak ada kewajiban lanjut.”",
      "internalNote": "Gunakan identitas dan portofolio asli. Jangan meminta kredensial saat cold call.",
      "branches": [
        {
          "key": "wants_portfolio",
          "label": "Meminta portofolio atau bukti kerja",
          "examples": [
            "Boleh lihat hasil kerja lain?"
          ],
          "target": "send_channel"
        },
        {
          "key": "wants_written_scope",
          "label": "Ingin detail dan syarat tertulis",
          "examples": [
            "Kirim semuanya secara tertulis."
          ],
          "target": "proposal"
        },
        {
          "key": "asks_location",
          "label": "Menanyakan lokasi / apakah di Northbay",
          "examples": [
            "Anda domisili di mana?"
          ],
          "target": "location_transparency"
        },
        {
          "key": "payment_concern",
          "label": "Khawatir pembayaran / keamanan",
          "examples": [
            "Bayar dulu atau bagaimana?"
          ],
          "target": "payment_terms"
        },
        {
          "key": "still_not_trust",
          "label": "Masih belum percaya",
          "examples": [
            "Saya belum yakin."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "location_transparency",
      "type": "message",
      "title": "Menjawab pertanyaan lokasi dan cara kerja",
      "script": "“Aku berbasis di [lokasi sebenarnya] dan proses kerja aku [remote/on-site sesuai kondisi]. Komunikasi, scope, pembayaran, timeline, dan serah terima aku jelaskan tertulis supaya jelas.”",
      "internalNote": "Jangan mengaku berada di Northbay atau menjanjikan kunjungan bila tidak benar.",
      "branches": [
        {
          "key": "remote_ok",
          "label": "Remote dapat diterima",
          "examples": [
            "Tidak masalah online."
          ],
          "target": "trust"
        },
        {
          "key": "needs_local",
          "label": "Harus bertemu atau vendor lokal di Northbay",
          "examples": [
            "Kami butuh orang datang langsung."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "wants_proof",
          "label": "Minta portofolio dan identitas",
          "examples": [
            "Kirim portofolio dulu."
          ],
          "target": "send_channel"
        },
        {
          "key": "no_fit",
          "label": "Tidak cocok",
          "examples": [
            "Kalau begitu tidak dulu."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "guarantees",
      "type": "message",
      "title": "Pertanyaan jaminan penjualan / reservasi / ranking",
      "script": "“Aku tidak bisa menjamin jumlah pelanggan, omzet, reservasi, atau ranking Google karena itu dipengaruhi banyak faktor. Yang bisa aku komitkan adalah deliverable website sesuai scope, tampilan mobile, dan jalur informasi/kontak yang jelas.”",
      "internalNote": "Hindari klaim hasil bisnis atau SEO yang tidak dapat dijamin.",
      "branches": [
        {
          "key": "understands",
          "label": "Memahami batasan hasil",
          "examples": [
            "Oke, masuk akal."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "wants_marketing",
          "label": "Mencari SEO/ads/booking engine juga",
          "examples": [
            "Saya butuh SEO dan sistem booking."
          ],
          "target": "custom_scope"
        },
        {
          "key": "guarantee_required",
          "label": "Tetap meminta jaminan booking",
          "examples": [
            "Kalau tidak jamin booking, tidak mau."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "custom_scope",
      "type": "message",
      "title": "Permintaan fitur di luar Essential",
      "script": "“Fitur seperti online ordering, payment gateway, POS/inventory, table booking real-time, loyalty program, multi-bahasa, atau integrasi delivery perlu dinilai terpisah. Aku bisa catat kebutuhannya dan mengirim estimasi setelah cek teknis—aku tidak akan menyebutnya termasuk Essential sebelum jelas.”",
      "internalNote": "Tandai fitur custom sebagai out of scope dan jangan membuat janji teknis saat telepon.",
      "branches": [
        {
          "key": "essential_enough",
          "label": "Mau mulai dari Essential",
          "examples": [
            "Yang dasar dulu cukup."
          ],
          "target": "scope_questions"
        },
        {
          "key": "needs_quote",
          "label": "Minta penawaran fitur lanjutan",
          "examples": [
            "Tolong hitung fitur tambahannya."
          ],
          "target": "custom_quote_followup"
        },
        {
          "key": "reduce",
          "label": "Mau mengurangi kebutuhan",
          "examples": [
            "Kalau dibuat lebih sederhana?"
          ],
          "target": "reduced_scope"
        },
        {
          "key": "not_now",
          "label": "Tidak lanjut",
          "examples": [
            "Nanti saja."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "decision_process",
      "type": "message",
      "title": "Perlu diskusi dengan partner / manager",
      "script": "“Siap. Menurut Pak/Bu, apa yang kemungkinan paling ingin dipastikan partner—biaya, desain, fitur, atau timing? Aku bisa siapkan ringkasan untuk dibahas bersama, kalau itu membantu.”",
      "internalNote": "Jangan mengasumsikan keberatan pihak lain. Minta izin sebelum mengirim ringkasan atau mengatur follow-up.",
      "branches": [
        {
          "key": "share_demo",
          "label": "Minta demo dan ringkasan untuk partner",
          "examples": [
            "Kirim link dan ringkasannya."
          ],
          "target": "send_channel"
        },
        {
          "key": "joint_call",
          "label": "Mau jadwalkan pembicaraan bersama",
          "examples": [
            "Bisa call dengan partner besok?"
          ],
          "target": "schedule_review"
        },
        {
          "key": "later",
          "label": "Belum tahu kapan bisa putuskan",
          "examples": [
            "Kami bicarakan dulu."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "no_decision",
          "label": "Akhirnya tidak ingin lanjut",
          "examples": [
            "Belum perlu."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "need_think",
          "label": "Prospek ingin pikir-pikir",
          "examples": [
            "Aku perlu pikir-pikir dulu."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "Prospek ingin membandingkan",
          "examples": [
            "Aku mau bandingkan dulu."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "Perlu diskusi dengan partner",
          "examples": [
            "Aku diskusi dengan partner dulu."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "Minta informasi terlebih dahulu",
          "examples": [
            "Kirim informasi dulu aja."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing belum tepat",
          "examples": [
            "Sekarang belum waktunya."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "Hanya lihat-lihat",
          "examples": [
            "Aku cuma lihat-lihat dulu."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "Jeda setelah demo atau harga",
          "examples": [
            "Mereka diam setelah demo atau harga."
          ],
          "target": "objection_silence"
        }
      ]
    },
    {
      "key": "send_channel",
      "type": "message",
      "title": "Memilih kanal untuk mengirim demo",
      "script": "“Baik. Kanal mana yang nyaman dan memang boleh aku gunakan untuk mengirim preview—WhatsApp bisnis atau email? Aku hanya akan mengirim lewat kanal yang Bapak/Ibu setujui.”",
      "internalNote": "Jangan mengirim link sebelum ada izin eksplisit.",
      "branches": [
        {
          "key": "whatsapp",
          "label": "Memilih WhatsApp bisnis",
          "examples": [
            "WhatsApp ke nomor ini saja.",
            "Boleh kirim WA."
          ],
          "target": "whatsapp_permission"
        },
        {
          "key": "email",
          "label": "Memilih email",
          "examples": [
            "Email saja ya."
          ],
          "target": "email_contact"
        },
        {
          "key": "other",
          "label": "Memilih kanal lain",
          "examples": [
            "DM Instagram bisnis saja."
          ],
          "target": "other_channel"
        },
        {
          "key": "wants_price",
          "label": "Sebelum menerima link ingin tahu harga",
          "examples": [
            "Harga detailnya dulu."
          ],
          "target": "price"
        },
        {
          "key": "declines_send",
          "label": "Tidak ingin menerima materi",
          "examples": [
            "Tidak usah dikirim."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Meminta tidak dihubungi lagi",
          "examples": [
            "Jangan kontak lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "whatsapp_permission",
      "type": "message",
      "title": "Memastikan izin WhatsApp dan nomor tujuan",
      "script": "“Boleh aku kirim satu pesan WhatsApp ke nomor bisnis ini berisi link demo dan ringkasan singkat? Kalau tidak berkenan, tidak apa-apa.”",
      "internalNote": "Catat izin dan kanal yang disetujui. Jika menolak, jangan kirim.",
      "branches": [
        {
          "key": "yes",
          "label": "Mengizinkan satu pesan WhatsApp",
          "examples": [
            "Boleh, kirim ke sini."
          ],
          "target": "demo_followup_permission"
        },
        {
          "key": "different_number",
          "label": "Memberikan nomor/kanal berbeda",
          "examples": [
            "Kirim ke nomor admin kami."
          ],
          "target": "other_channel"
        },
        {
          "key": "email_instead",
          "label": "Lebih memilih email",
          "examples": [
            "Email saja."
          ],
          "target": "email_contact"
        },
        {
          "key": "no",
          "label": "Tidak mengizinkan kirim WhatsApp",
          "examples": [
            "Jangan kirim lewat WhatsApp."
          ],
          "target": "polite_close"
        },
        {
          "key": "dnc",
          "label": "Meminta tidak dihubungi lagi",
          "examples": [
            "Jangan menghubungi kami lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "email_contact",
      "type": "message",
      "title": "Mengumpulkan email bisnis atas izin prospek",
      "script": "“Email bisnis mana yang boleh aku gunakan untuk mengirim preview dan rincian singkat? Aku hanya akan menggunakannya untuk hal yang Bapak/Ibu setujui.”",
      "internalNote": "Jangan menebak atau mengambil alamat pribadi tanpa izin.",
      "branches": [
        {
          "key": "email_given",
          "label": "Email diberikan",
          "examples": [
            "Kirim ke hello@contohbisnis.com."
          ],
          "target": "demo_followup_permission"
        },
        {
          "key": "other_channel",
          "label": "Lebih nyaman kanal lain",
          "examples": [
            "WhatsApp saja."
          ],
          "target": "whatsapp_permission"
        },
        {
          "key": "no_email",
          "label": "Tidak ingin memberikan email",
          "examples": [
            "Saya tidak ingin memberikan email."
          ],
          "target": "polite_close"
        },
        {
          "key": "dnc",
          "label": "Meminta stop contact",
          "examples": [
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "other_channel",
      "type": "message",
      "title": "Mengonfirmasi kanal alternatif",
      "script": "“Baik, sebutkan kanal atau alamat yang memang boleh menerima link demo. Kalau tidak ingin menerima apa pun, aku juga menghormati itu.”",
      "internalNote": "Jangan meminta kanal alternatif setelah explicit no-contact.",
      "branches": [
        {
          "key": "provided",
          "label": "Kanal tujuan diberikan",
          "examples": [
            "Gunakan WhatsApp admin ini.",
            "DM ke akun bisnis kami."
          ],
          "target": "demo_followup_permission"
        },
        {
          "key": "back_to_wa",
          "label": "Kembali memilih WhatsApp",
          "examples": [
            "Kirim ke nomor bisnis tadi."
          ],
          "target": "whatsapp_permission"
        },
        {
          "key": "no_channel",
          "label": "Tidak ingin membagikan kanal",
          "examples": [
            "Tidak perlu dikirim."
          ],
          "target": "polite_close"
        },
        {
          "key": "dnc",
          "label": "Meminta no contact",
          "examples": [
            "Jangan kontak lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "demo_followup_permission",
      "type": "message",
      "title": "Minta izin follow-up setelah demo dikirim",
      "script": "“Setelah aku kirim, apakah berkenan kalau aku cek satu kali dalam 2–3 hari kerja untuk mendengar pendapat Bapak/Ibu? Kalau tidak, aku cukup kirim demo tanpa follow-up.”",
      "internalNote": "Follow-up bukan default; simpan pilihan prospek.",
      "branches": [
        {
          "key": "yes_followup",
          "label": "Mengizinkan satu follow-up",
          "examples": [
            "Boleh, cek lagi dua hari lagi."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "send_only",
          "label": "Hanya ingin menerima link",
          "examples": [
            "Kirim saja, saya lihat sendiri."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "no_followup",
          "label": "Tidak ingin dihubungi kembali soal demo",
          "examples": [
            "Tidak perlu follow-up."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "dnc",
          "label": "Meminta stop contact",
          "examples": [
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "follow_up_date",
      "type": "message",
      "title": "Menyepakati waktu follow-up yang spesifik",
      "script": "“Baik, hari dan jam berapa yang nyaman untuk aku cek sekali? Aku catat sesuai waktu Northbay/WITA dan tidak akan menghubungi di luar waktu itu.”",
      "internalNote": "Ulangi tanggal dan waktu untuk konfirmasi.",
      "branches": [
        {
          "key": "date_set",
          "label": "Menyepakati hari/jam",
          "examples": [
            "Rabu sore boleh.",
            "Jumat pukul 10."
          ],
          "target": "demo_sent_followup"
        },
        {
          "key": "no_time",
          "label": "Belum bisa menentukan waktu",
          "examples": [
            "Nanti saya kabari kalau tertarik."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "no_followup",
          "label": "Tidak ingin follow-up",
          "examples": [
            "Tidak perlu cek lagi."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "dnc",
          "label": "Meminta tidak dihubungi",
          "examples": [
            "Jangan kontak lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "callback",
      "type": "message",
      "title": "Owner atau staf sedang sibuk",
      "script": "“Tidak masalah, aku tidak ingin mengganggu operasional. Kapan lebih nyaman aku telepon lagi—hari dan jam berapa? Kalau tidak perlu callback, beri tahu saja.”",
      "internalNote": "Callback hanya bila mereka mengundang atau menyetujui waktu.",
      "branches": [
        {
          "key": "time_given",
          "label": "Memberikan jadwal telepon",
          "examples": [
            "Besok pagi.",
            "Hari ini setelah jam 4."
          ],
          "target": "callback_scheduled"
        },
        {
          "key": "send_demo",
          "label": "Meminta link dikirim",
          "examples": [
            "Kirim WhatsApp saja."
          ],
          "target": "send_channel"
        },
        {
          "key": "not_interested",
          "label": "Tidak ingin callback atau demo",
          "examples": [
            "Tidak usah, terima kasih."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Meminta tidak dihubungi lagi",
          "examples": [
            "Jangan telepon lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "schedule_review",
      "type": "message",
      "title": "Menjadwalkan walkthrough demo singkat",
      "script": "“Aku bisa walkthrough sekitar 5–10 menit untuk memperlihatkan menu, informasi lokasi/jam buka, dan tombol kontak. Kapan waktu yang paling nyaman untuk Bapak/Ibu?”",
      "internalNote": "Konfirmasi tanggal, jam WITA, dan kanal.",
      "branches": [
        {
          "key": "time_confirmed",
          "label": "Menetapkan waktu",
          "examples": [
            "Besok pukul 11. cocok.",
            "Kamis sore."
          ],
          "target": "meeting_booked"
        },
        {
          "key": "link_first",
          "label": "Ingin melihat link dulu",
          "examples": [
            "Kirim link dulu ya."
          ],
          "target": "send_channel"
        },
        {
          "key": "later",
          "label": "Belum bisa menjadwalkan",
          "examples": [
            "Hubungi minggu depan."
          ],
          "target": "callback"
        },
        {
          "key": "cancel",
          "label": "Tidak ingin melanjutkan",
          "examples": [
            "Tidak jadi dulu."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "proposal",
      "type": "message",
      "title": "Menawarkan rincian tertulis",
      "script": "“Aku akan kirim ringkasan tertulis yang memuat scope, harga Rp1.500.000, timeline, revisi, domain/hosting dan biaya recurring jika ada, serta pengecualian fitur custom. Bapak/Ibu bisa meninjau tanpa kewajiban untuk lanjut.”",
      "internalNote": "Pastikan proposal konsisten dengan yang benar-benar dapat dikerjakan.",
      "branches": [
        {
          "key": "ready",
          "label": "Mau lanjut berdasarkan rincian",
          "examples": [
            "Kirim proposalnya."
          ],
          "target": "deal_next_step"
        },
        {
          "key": "needs_partner",
          "label": "Perlu persetujuan partner",
          "examples": [
            "Saya diskusikan dulu."
          ],
          "target": "decision_process"
        },
        {
          "key": "negotiate",
          "label": "Minta perubahan scope/harga",
          "examples": [
            "Bisa ubah fitur atau budget?"
          ],
          "target": "budget_objection"
        },
        {
          "key": "later",
          "label": "Minta waktu sebelum memutuskan",
          "examples": [
            "Nanti saya cek dulu."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "decline",
          "label": "Menolak proposal",
          "examples": [
            "Belum mau lanjut."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "need_think",
          "label": "Prospek ingin pikir-pikir",
          "examples": [
            "Aku perlu pikir-pikir dulu."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "Prospek ingin membandingkan",
          "examples": [
            "Aku mau bandingkan dulu."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "Perlu diskusi dengan partner",
          "examples": [
            "Aku diskusi dengan partner dulu."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "Minta informasi terlebih dahulu",
          "examples": [
            "Kirim informasi dulu aja."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing belum tepat",
          "examples": [
            "Sekarang belum waktunya."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "Hanya lihat-lihat",
          "examples": [
            "Aku cuma lihat-lihat dulu."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "Jeda setelah demo atau harga",
          "examples": [
            "Mereka diam setelah demo atau harga."
          ],
          "target": "objection_silence"
        }
      ]
    },
    {
      "key": "payment_terms",
      "type": "message",
      "title": "Pertanyaan pembayaran, invoice, dan kesepakatan",
      "script": "“Aku akan jelaskan proses pembayaran, invoice, termin, revisi, dan serah terima secara tertulis sebelum mulai. Aku baru mulai setelah scope dan ketentuan disetujui kedua pihak.”",
      "internalNote": "Isi metode pembayaran/termin yang benar; jangan mengarang legal terms.",
      "branches": [
        {
          "key": "acceptable",
          "label": "Menerima proses yang dijelaskan",
          "examples": [
            "Oke, kirim saja detailnya."
          ],
          "target": "proposal"
        },
        {
          "key": "needs_contract",
          "label": "Meminta kontrak/invoice resmi",
          "examples": [
            "Saya perlu invoice dan kesepakatan tertulis."
          ],
          "target": "proposal"
        },
        {
          "key": "concern",
          "label": "Masih ragu dengan pembayaran",
          "examples": [
            "Saya belum yakin untuk transfer."
          ],
          "target": "trust"
        },
        {
          "key": "unacceptable",
          "label": "Tidak setuju dengan ketentuan",
          "examples": [
            "Kalau begitu belum dulu."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "deal_next_step",
      "type": "message",
      "title": "Konfirmasi langkah berikutnya sebelum deal",
      "script": "“Supaya tidak ada salah paham, aku rangkum: deliverable [scope], harga [harga final], timeline [estimasi], revisi [ketentuan], biaya domain/hosting [rincian], dan pembayaran [termin]. Apakah rangkuman ini sudah benar sebelum aku kirim dokumen final?”",
      "internalNote": "Jangan tandai deal hanya karena prospek tertarik; butuh persetujuan scope dan next step.",
      "branches": [
        {
          "key": "terms_accepted",
          "label": "Semua scope dan ketentuan sudah disepakati",
          "examples": [
            "Scope dan pembayarannya sudah jelas, kita lanjut.",
            "Saya setuju, silakan mulai sesuai kesepakatan."
          ],
          "target": "project_ready"
        },
        {
          "key": "send_terms",
          "label": "Meminta dokumen final",
          "examples": [
            "Iya, kirim proposal/invoice."
          ],
          "target": "proposal_follow_up"
        },
        {
          "key": "needs_adjustment",
          "label": "Masih ada penyesuaian scope",
          "examples": [
            "Ada beberapa fitur yang harus diubah."
          ],
          "target": "custom_scope"
        },
        {
          "key": "think",
          "label": "Mau berpikir dulu",
          "examples": [
            "Saya cek dulu, nanti kabari."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "not_ready",
          "label": "Belum siap memutuskan",
          "examples": [
            "Belum sekarang."
          ],
          "target": "proposal_no_followup"
        }
      ]
    },
    {
      "key": "soft_rejection",
      "type": "message",
      "title": "Penolakan halus — minta izin simpan kontak secara sopan",
      "script": "“Baik, Pak/Bu, aku mengerti dan tidak akan memaksa. Sebelum aku tutup, boleh aku tanya satu kali saja: apakah Bapak/Ibu berkenan menerima satu pesan WhatsApp singkat berisi nama dan portofolio aku, supaya kalau suatu saat butuh penyegaran website bisa menyimpan kontak? Kalau tidak berkenan, tidak masalah—aku tidak akan mengirim apa pun.”",
      "internalNote": "Hanya dipakai untuk penolakan halus seperti “belum perlu sekarang”. Jika mereka sudah mengatakan jangan hubungi, stop langsung ke do_not_contact tanpa meminta izin WhatsApp. Jika mereka menolak pesan, langsung ke polite_close dan jangan kirim apa pun.",
      "branches": [
        {
          "key": "allows_whatsapp",
          "label": "Mengizinkan satu pesan WhatsApp",
          "examples": [
            "Boleh, kirim satu pesan saja."
          ],
          "target": "whatsapp_permission"
        },
        {
          "key": "declines",
          "label": "Menolak pesan atau tidak ingin menyimpan kontak",
          "examples": [
            "Tidak usah, terima kasih."
          ],
          "target": "polite_close"
        },
        {
          "key": "later",
          "label": "Memberi waktu spesifik untuk dihubungi",
          "examples": [
            "Coba hubungi lagi bulan depan."
          ],
          "target": "callback_scheduled"
        },
        {
          "key": "dnc",
          "label": "Meminta tidak dihubungi lagi",
          "examples": [
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "polite_close",
      "type": "outcome",
      "title": "Penutupan sopan — tidak ada follow-up",
      "script": "“Baik, Pak/Bu. Terima kasih sudah meluangkan waktu. Aku tidak akan mengirim pesan atau melakukan follow-up. Semoga operasional [Nama Bisnis] lancar.”",
      "outcomeKey": "not_interested",
      "internalNote": "Gunakan ketika mereka menolak pesan atau tidak memberi izin follow-up."
    },
    {
      "key": "do_not_contact",
      "type": "outcome",
      "title": "Jangan hubungi lagi — tandai DNC",
      "script": "“Baik, aku mengerti. Maaf sudah mengganggu. Aku akan menandai nomor ini agar tidak dihubungi lagi. Terima kasih.”",
      "internalNote": "Akhiri segera. Jangan meminta izin WhatsApp, email, atau follow-up. Tandai Do Not Contact.",
      "outcomeKey": "not_interested"
    },
    {
      "key": "wrong_contact",
      "type": "outcome",
      "title": "Nomor salah / bukan bisnis yang dimaksud",
      "script": "“Maaf atas kekeliruannya. Terima kasih sudah memberi tahu. Aku akan memperbaiki catatan dan tidak melanjutkan panggilan ini.”",
      "outcomeKey": "other",
      "internalNote": "Jangan meminta nomor owner dari nomor yang salah kecuali mereka menawarkan."
    },
    {
      "key": "demo_sent_followup",
      "type": "outcome",
      "title": "Demo dikirim — follow-up disetujui",
      "script": "“Terima kasih. Aku akan mengirim preview dan ringkasan sesuai kanal yang disetujui, lalu menghubungi sekali pada [tanggal/jam] seperti yang kita sepakati. Silakan abaikan jika belum sempat melihat; tidak ada kewajiban lanjut.”",
      "outcomeKey": "follow_up_later",
      "internalNote": "Pastikan follow-up punya izin dan tanggal yang jelas."
    },
    {
      "key": "demo_sent_no_followup",
      "type": "outcome",
      "title": "Demo dikirim — tanpa follow-up",
      "script": "“Baik, aku kirim link dan ringkasan sesuai permintaan. Aku tidak akan melakukan follow-up; kalau nanti ada pertanyaan, Bapak/Ibu bisa menghubungi aku lewat [kontak]. Terima kasih.”",
      "outcomeKey": "interested_no_meeting",
      "internalNote": "Tidak membuat pengingat follow-up jika prospek menolak."
    },
    {
      "key": "callback_scheduled",
      "type": "outcome",
      "title": "Callback disepakati",
      "script": "“Terima kasih, aku catat [hari/tanggal] pukul [jam] WITA dan akan menelepon kembali pada waktu tersebut. Kalau jadwal berubah, Bapak/Ibu boleh mengabaikan panggilan atau mengabari lewat [kontak].”",
      "outcomeKey": "follow_up_later",
      "internalNote": "Konfirmasi waktu lokal Northbay/WITA."
    },
    {
      "key": "meeting_booked",
      "type": "outcome",
      "title": "Demo walkthrough terjadwal",
      "script": "“Baik, kita jadwalkan [hari/tanggal] pukul [jam] WITA selama 5–10 menit. Aku akan mengirim konfirmasi melalui [kanal yang disetujui]. Terima kasih.”",
      "outcomeKey": "meeting_booked",
      "internalNote": "Kirim konfirmasi hanya melalui kanal yang disetujui."
    },
    {
      "key": "proposal_follow_up",
      "type": "outcome",
      "title": "Proposal diminta — follow-up diizinkan",
      "script": "“Aku akan kirim rincian scope dan biaya sesuai pembicaraan. Aku catat untuk follow-up sekali pada [tanggal/jam] jika Bapak/Ibu setuju. Terima kasih.”",
      "outcomeKey": "follow_up_later",
      "internalNote": "Jika tidak ada izin follow-up, gunakan node proposal_no_followup."
    },
    {
      "key": "proposal_no_followup",
      "type": "outcome",
      "title": "Proposal diminta — tidak ada follow-up",
      "script": "“Baik, aku kirim rincian yang diminta. Aku tidak akan follow-up; silakan hubungi aku bila ada pertanyaan atau ingin melanjutkan.”",
      "outcomeKey": "interested_no_meeting",
      "internalNote": "Hormati batasan kontak."
    },
    {
      "key": "custom_quote_followup",
      "type": "outcome",
      "title": "Permintaan quote lanjutan / scope khusus",
      "script": "“Terima kasih. Aku catat kebutuhan tambahan [fitur]. Aku akan mengecek scope dan kelayakan teknis sebelum memberi estimasi tertulis. Apakah boleh aku mengirim estimasi melalui [kanal yang disetujui]?”",
      "outcomeKey": "follow_up_later",
      "internalNote": "Jangan mengunci harga fitur custom sebelum evaluasi."
    },
    {
      "key": "project_ready",
      "type": "outcome",
      "title": "Scope disetujui — siapkan administrasi proyek",
      "script": "“Terima kasih atas persetujuannya. Aku akan mengirim dokumen final untuk ditinjau, termasuk scope, aset yang dibutuhkan, timeline, revisi, pembayaran, dan biaya recurring bila ada. Pengerjaan dimulai setelah semuanya disepakati.”",
      "outcomeKey": "interested_no_meeting",
      "internalNote": "Pastikan kesepakatan tertulis sebelum memulai."
    },
    {
      "key": "demo_removed",
      "type": "outcome",
      "title": "Permintaan hapus demo dipenuhi",
      "script": "“Baik, aku akan menghentikan penggunaan preview ini dan menghapus tautan/materi demo yang berada dalam kendali aku. Terima kasih sudah memberi tahu.”",
      "internalNote": "Lakukan penghapusan yang dijanjikan dan jangan gunakan materi bisnis tersebut lagi.",
      "outcomeKey": "other"
    },
    {
      "key": "objection_think",
      "type": "message",
      "title": "Objection — “I need to think about it”",
      "script": "“Santai, Pak/Bu, tentu boleh dipikirkan dulu. Supaya aku nggak asal menjelaskan, bagian mana yang masih jadi pertimbangan—budget, desain/demo, waktu yang tepat, atau apakah website ini benar-benar membantu kebutuhan bisnis?”",
      "internalNote": "Ajukan satu pertanyaan saja lalu diam dan dengarkan. Jangan rebuttal panjang. Kalau jawaban sudah jelas, langsung menuju node yang sesuai.",
      "branches": [
        {
          "key": "budget",
          "label": "Budget / harga",
          "examples": [
            "Budget-nya dulu yang perlu dipastikan.",
            "The budget is the main question."
          ],
          "target": "objection_expensive"
        },
        {
          "key": "demo",
          "label": "Desain/demo",
          "examples": [
            "Aku masih belum yakin dengan desainnya.",
            "I’m not sure about the design yet."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "timing",
          "label": "Waktu belum tepat",
          "examples": [
            "Belum waktu yang pas.",
            "The timing isn’t right."
          ],
          "target": "objection_timing"
        },
        {
          "key": "business_value",
          "label": "Manfaat bisnis belum jelas",
          "examples": [
            "Aku belum lihat manfaatnya.",
            "I’m not sure it’s worth it."
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "partner",
          "label": "Perlu diskusi dengan partner",
          "examples": [
            "Aku perlu diskusi dengan partner.",
            "I need to discuss it with my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "no_detail",
          "label": "Belum bisa menjelaskan / mau pikir dulu",
          "examples": [
            "Belum bisa bilang sekarang.",
            "I need a bit more time."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "declines",
          "label": "Tidak ingin melanjutkan",
          "examples": [
            "Kayaknya nggak dulu.",
            "I’ll pass for now."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Jangan hubungi lagi",
          "examples": [
            "Please don’t contact me again.",
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "objection_expensive",
      "type": "message",
      "title": "Objection — “It’s too expensive” / “Mahal”",
      "script": "“Paham, terima kasih sudah bilang terus terang. Boleh aku tahu, yang terasa berat itu budget yang sudah disiapkan, sedang membandingkan penawaran lain, atau manfaatnya belum terasa sepadan?”",
      "internalNote": "Jangan langsung memberi diskon. Cari tahu dulu sumber keberatannya. Jelaskan deliverable setelah mengetahui faktor yang penting bagi prospek.",
      "branches": [
        {
          "key": "budget_limit",
          "label": "Budget yang tersedia terbatas",
          "examples": [
            "Budget yang tersedia memang terbatas.",
            "The budget is limited."
          ],
          "target": "budget_objection"
        },
        {
          "key": "comparing",
          "label": "Sedang membandingkan penawaran",
          "examples": [
            "Aku sedang bandingkan harga.",
            "I’m comparing quotes."
          ],
          "target": "objection_compare"
        },
        {
          "key": "value_unclear",
          "label": "Nilai/manfaat belum jelas",
          "examples": [
            "Belum yakin manfaatnya sepadan.",
            "I’m not sure the value is there."
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "scope_unclear",
          "label": "Belum paham yang termasuk",
          "examples": [
            "Aku belum jelas apa yang termasuk.",
            "I’m not clear what’s included."
          ],
          "target": "scope_questions"
        },
        {
          "key": "discount",
          "label": "Minta diskon langsung",
          "examples": [
            "Bisa kurang lagi?",
            "Can you do a better price?"
          ],
          "target": "price"
        },
        {
          "key": "not_budgeted",
          "label": "Belum ada budget",
          "examples": [
            "Belum ada anggarannya.",
            "There isn’t a budget for this."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Jangan hubungi lagi",
          "examples": [
            "Please stop contacting me.",
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "objection_partner",
      "type": "message",
      "title": "Objection — “I need to speak with my partner”",
      "script": "“Siap, wajar dibicarakan dulu. Menurut Pak/Bu, hal apa yang paling mungkin jadi pertimbangan partner—biaya, desain, fitur, atau timing? Aku bisa siapkan ringkasan pendek, atau kalau lebih nyaman kita lihat demo bareng.”",
      "internalNote": "Jangan menebak atau mengatasnamakan partner. Bantu calon klien mengidentifikasi pertimbangan, lalu tawarkan langkah yang hanya dilakukan dengan izin.",
      "branches": [
        {
          "key": "partner_cost",
          "label": "Partner kemungkinan fokus pada biaya",
          "examples": [
            "Paling mungkin soal biaya.",
            "They’ll probably focus on cost."
          ],
          "target": "price"
        },
        {
          "key": "partner_scope",
          "label": "Partner perlu memahami scope",
          "examples": [
            "Mereka perlu tahu apa yang termasuk.",
            "They’ll want to understand the scope."
          ],
          "target": "scope_questions"
        },
        {
          "key": "joint_review",
          "label": "Ingin review bersama",
          "examples": [
            "Bisa presentasi ke kami berdua?",
            "Could you walk us both through it?"
          ],
          "target": "schedule_review"
        },
        {
          "key": "summary",
          "label": "Minta ringkasan tertulis",
          "examples": [
            "Kirim ringkasannya dulu.",
            "Send a short summary first."
          ],
          "target": "send_channel"
        },
        {
          "key": "date_later",
          "label": "Belum tahu kapan dibahas",
          "examples": [
            "Aku belum tahu kapan bisa diskusi.",
            "I’m not sure when we can discuss it."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "partner_declines",
          "label": "Partner tidak tertarik / tidak ada langkah lanjut",
          "examples": [
            "Sepertinya kami tidak lanjut.",
            "We probably won’t proceed."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Jangan hubungi lagi",
          "examples": [
            "Please don’t contact us again.",
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "objection_send_info",
      "type": "message",
      "title": "Objection — “Just send me some information”",
      "script": "“Bisa. Biar yang aku kirim benar-benar berguna, informasi apa yang masih ingin dilihat—demo, rincian harga/scope, contoh pekerjaan, atau ada pertanyaan tertentu yang belum terjawab?”",
      "internalNote": "Tanyakan apa yang ingin mereka ketahui sebelum mengirim sesuatu. Bila mereka hanya minta kirim, hormati batasan no-follow-up.",
      "branches": [
        {
          "key": "wants_demo",
          "label": "Ingin melihat demo",
          "examples": [
            "Kirim link demonya.",
            "Send me the demo."
          ],
          "target": "send_channel"
        },
        {
          "key": "wants_pricing",
          "label": "Ingin harga dan scope",
          "examples": [
            "Kirim harga dan apa saja yang termasuk.",
            "Send the price and inclusions."
          ],
          "target": "price"
        },
        {
          "key": "wants_proof",
          "label": "Ingin contoh kerja / bukti",
          "examples": [
            "Ada contoh website lain?",
            "Do you have examples?"
          ],
          "target": "trust"
        },
        {
          "key": "specific_question",
          "label": "Ada kekhawatiran tertentu",
          "examples": [
            "Aku masih ada pertanyaan.",
            "I still have a question."
          ],
          "target": "objection_think"
        },
        {
          "key": "send_only",
          "label": "Hanya ingin informasi tanpa follow-up",
          "examples": [
            "Kirim saja, nggak perlu follow-up.",
            "Send it, but no follow-up."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "declines_info",
          "label": "Tidak perlu dikirim",
          "examples": [
            "Nggak usah, terima kasih.",
            "No need, thanks."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Jangan hubungi lagi",
          "examples": [
            "Please remove us from your list.",
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "objection_compare",
      "type": "message",
      "title": "Objection — “I’m shopping around”",
      "script": "“Wajar kok kalau mau membandingkan. Dari beberapa opsi, satu hal apa yang paling penting buat Pak/Bu—harga, kualitas desain, fitur, proses pengerjaan, atau dukungan setelah website live?”",
      "internalNote": "Jangan menjelekkan developer atau agency lain. Bandingkan deliverable secara transparan hanya setelah tahu kriteria prospect.",
      "branches": [
        {
          "key": "compare_price",
          "label": "Faktor utama adalah harga",
          "examples": [
            "Yang utama harga.",
            "Price is the main factor."
          ],
          "target": "price_comparison"
        },
        {
          "key": "compare_design",
          "label": "Faktor utama adalah desain",
          "examples": [
            "Aku mau desain yang cocok.",
            "Design is the main factor."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "compare_features",
          "label": "Faktor utama adalah fitur/scope",
          "examples": [
            "Aku bandingkan fitur.",
            "I’m comparing features."
          ],
          "target": "scope_questions"
        },
        {
          "key": "compare_support",
          "label": "Faktor utama adalah dukungan dan kepercayaan",
          "examples": [
            "Aku perlu yakin soal support.",
            "Support and trust matter most."
          ],
          "target": "trust"
        },
        {
          "key": "compare_unsure",
          "label": "Belum tahu kriteria utama",
          "examples": [
            "Belum tahu juga.",
            "I’m not sure yet."
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "compare_declines",
          "label": "Tidak tertarik melanjutkan",
          "examples": [
            "Terima kasih, tapi nggak dulu.",
            "Thanks, but I’ll pass."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Jangan hubungi lagi",
          "examples": [
            "Do not contact me again.",
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "objection_timing",
      "type": "message",
      "title": "Objection — “Now is not a good time”",
      "script": "“Paham, aku nggak mau mengganggu saat lagi sibuk. Di luar soal timing, ada hal lain yang masih bikin ragu, atau memang lebih baik aku hubungi lagi pada waktu tertentu?”",
      "internalNote": "Jangan memaksa tanggal follow-up. Simpan hanya waktu yang disepakati prospek dan jangan menindaklanjuti tanpa izin.",
      "branches": [
        {
          "key": "timing_only",
          "label": "Hanya soal timing",
          "examples": [
            "Sekarang lagi sibuk, coba bulan depan.",
            "It’s just timing; try next month."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "other_concern",
          "label": "Ada keberatan lain juga",
          "examples": [
            "Sebenarnya ada hal lain juga.",
            "There is something else too."
          ],
          "target": "objection_think"
        },
        {
          "key": "no_followup",
          "label": "Tidak ingin follow-up",
          "examples": [
            "Nggak usah follow-up.",
            "No follow-up, please."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "partner",
          "label": "Perlu diskusi dengan partner",
          "examples": [
            "Aku perlu diskusi dulu.",
            "I need to discuss it first."
          ],
          "target": "objection_partner"
        },
        {
          "key": "declines",
          "label": "Memutuskan tidak lanjut",
          "examples": [
            "Kami tidak lanjut ya.",
            "We won’t proceed."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Jangan hubungi lagi",
          "examples": [
            "Please don’t call again.",
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "objection_just_looking",
      "type": "message",
      "title": "Objection — “I’m just looking”",
      "script": "“Oke, nggak masalah. Boleh aku tanya satu hal saja? Kalau website bisnis ini bekerja sesuai kebutuhan, hal apa yang paling ingin dibantu—lebih mudah dapat inquiry/booking, menjelaskan layanan, atau mempermudah pelanggan menghubungi tim?”",
      "internalNote": "Tujuannya memahami masalah, bukan memaksa mereka menciptakan kebutuhan. Jika belum ada kebutuhan, terima dan tutup dengan baik.",
      "branches": [
        {
          "key": "clear_goal",
          "label": "Ada kebutuhan yang ingin diperbaiki",
          "examples": [
            "Paling ingin lebih mudah dihubungi.",
            "We want enquiries to be easier."
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "wants_demo",
          "label": "Ingin melihat demonya dulu",
          "examples": [
            "Boleh lihat demo dulu.",
            "I’d like to see the demo first."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "not_clear",
          "label": "Belum tahu kebutuhan yang jelas",
          "examples": [
            "Belum ada hal spesifik.",
            "Nothing specific yet."
          ],
          "target": "send_channel"
        },
        {
          "key": "later",
          "label": "Mungkin pada waktu lain",
          "examples": [
            "Mungkin nanti.",
            "Maybe later."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "not_interested",
          "label": "Tidak tertarik",
          "examples": [
            "Nggak tertarik, terima kasih.",
            "Not interested, thanks."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Jangan hubungi lagi",
          "examples": [
            "Please don’t contact me.",
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "objection_silence",
      "type": "message",
      "title": "Objection — Silence / pause after demo or price",
      "script": "Setelah menunjukkan demo atau menyebut harga, berhenti bicara beberapa detik. Jangan segera menambahkan daftar fitur. Kalau mereka masih diam, tanyakan dengan tenang: “Gimana menurut Pak/Bu sejauh ini? Ada bagian yang ingin aku jelaskan lagi?” Lalu dengarkan.",
      "internalNote": "Diam bukan otomatis penolakan. Beri jeda. Jangan menanyakan lebih dari satu pertanyaan jika jawaban sudah jelas.",
      "branches": [
        {
          "key": "asks_clarification",
          "label": "Mereka menyampaikan pertanyaan atau kekhawatiran",
          "examples": [
            "Aku masih belum yakin soal harga.",
            "I have a question about the price."
          ],
          "target": "objection_think"
        },
        {
          "key": "needs_time",
          "label": "Mereka butuh waktu",
          "examples": [
            "Beri aku waktu sebentar.",
            "I need a little time."
          ],
          "target": "objection_timing"
        },
        {
          "key": "interested",
          "label": "Mereka ingin melihat langkah berikutnya",
          "examples": [
            "Oke, apa langkah selanjutnya?",
            "What’s the next step?"
          ],
          "target": "schedule_review"
        },
        {
          "key": "no_response",
          "label": "Tetap diam / tidak ingin lanjut",
          "examples": [
            "Tidak menjawab atau bilang cukup.",
            "No response or says that’s all."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Meminta tidak dihubungi",
          "examples": [
            "Do not contact me again.",
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "outcome_discovery",
      "type": "message",
      "title": "Discover the real business need",
      "script": "“Kalau website ini benar-benar membantu operasional, apa yang paling ingin dipermudah—pelanggan melihat menu dan jam buka, menemukan lokasi, bertanya soal reservasi/catering, atau menghubungi lewat WhatsApp?”",
      "internalNote": "Hubungkan jawaban dengan satu bagian demo atau scope yang relevan. Jangan menjanjikan kenaikan omzet, ranking, booking, pasien, atau jumlah leads.",
      "branches": [
        {
          "key": "goal_enquiries",
          "label": "Ingin inquiry / booking / contact path lebih jelas",
          "examples": [
            "Ingin pelanggan lebih gampang menghubungi.",
            "Lebih mudah mendapat inquiry."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "goal_information",
          "label": "Ingin informasi layanan lebih mudah dipahami",
          "examples": [
            "Biar orang lebih gampang paham layanannya.",
            "Supaya info lebih jelas."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "goal_scope",
          "label": "Kebutuhannya ternyata fitur khusus",
          "examples": [
            "Kami butuh fitur tertentu.",
            "Ada kebutuhan khusus."
          ],
          "target": "scope_questions"
        },
        {
          "key": "no_priority",
          "label": "Belum ada masalah prioritas",
          "examples": [
            "Belum ada prioritas sekarang.",
            "Website sekarang cukup."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "not_sure",
          "label": "Belum yakin apa kebutuhannya",
          "examples": [
            "Belum tahu juga.",
            "Masih mau lihat-lihat."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "dnc",
          "label": "Jangan hubungi lagi",
          "examples": [
            "Jangan hubungi lagi."
          ],
          "target": "do_not_contact"
        }
      ]
    }
  ]
};
