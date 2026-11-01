import type { CallbookTemplate } from "./types";

/**
 * Consultative, demo-first outreach callbook. Edit placeholders and verify every factual claim before use.
 */
export const northbayTourTravelNoWebsiteOutreach: CallbookTemplate = {
  "id": "northbay-tour-travel-no-website-outreach",
  "name": "Northbay Tour & Travel — No Website / Custom Demo",
  "description": "Callbook untuk bisnis tour & travel di Northbay yang belum memiliki website resmi yang ditemukan saat riset; demo konsep sudah dibuat khusus. Alur dimulai setelah bisnis menyapa, memastikan owner/decision-maker, lalu menangani demo, Essential Rp1.500.000, keberatan, follow-up berizin, deal, atau penolakan.",
  "targetAudience": "Usaha tour & travel, penyedia paket wisata, private driver, airport transfer, aktivitas wisata, dan operator perjalanan di Northbay",
  "primaryGoal": "book_meeting",
  "marketCode": "ID",
  "nicheName": "Hotel & Hospitality",
  "guidance": "Gunakan untuk prospek yang telah Anda cek dan tidak Anda temukan website resminya. Jangan menyatakan pasti tidak punya website jika pencarian Anda belum lengkap; ucapkan bahwa Anda belum menemukan website resmi. Awali setelah bisnis menyapa, tanya apakah yang menjawab owner/pengurus website. Demo adalah preview privat, bukan website live atau proyek disetujui. Essential Rp1.500.000 harus punya scope tertulis; bandingkan Rp2.500.000–Rp3.000.000 hanya jika Anda memang melihat penawaran sebanding. Minta izin sebelum mengirim demo/follow-up. Untuk penolakan halus boleh sekali meminta izin kirim satu WhatsApp agar mereka dapat menyimpan kontak; jika ditolak jangan kirim. Jika diminta berhenti kontak, tandai DNC. Prinsip keberatan terbaru: validasi dulu, ajukan satu pertanyaan untuk menggali alasan sebenarnya, dengarkan, baru tanggapi secara spesifik dan sepakati langkah berikutnya. Jangan langsung membantah, menjelaskan semua fitur, atau memberi diskon. Setelah demo/harga, beri jeda. Bahasa caller dibuat lebih hangat dengan “aku” dan sapaan sopan; gunakan “Pak/Bu” atau “Kak” sesuai konteks. Izin WhatsApp hanya diminta satu kali pada penolakan halus; jika ditolak, tutup. Permintaan DNC harus langsung dihormati.",
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
            "Lagi melayani tamu.",
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
            "Ini bukan nomor travel itu."
          ],
          "target": "wrong_contact"
        }
      ]
    },
    {
      "key": "transfer_result",
      "type": "message",
      "title": "Hasil transfer ke owner",
      "script": "“Halo, Pak/Bu. Terima kasih sudah menerima telepon. Aku [Nama Bapak/Ibu]. Aku sudah menyiapkan konsep demo website untuk [Nama Travel] dan ingin meminta waktu sebentar untuk menjelaskan maksudnya.”",
      "internalNote": "Jangan menganggap transfer berhasil jika owner belum benar-benar menjawab.",
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
            "Lagi ada tamu.",
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
      "script": "“Baik, terima kasih. Aku tidak ingin mengganggu pekerjaan Bapak/Ibu. Siapa yang paling tepat aku hubungi untuk urusan website atau pemasaran, dan kapan biasanya beliau tersedia?”",
      "internalNote": "Hormati fungsi gatekeeper. Jangan meminta nomor pribadi secara memaksa dan jangan mencoba mengakali staf.",
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
      "script": "“Aku web developer. Aku menemukan [Nama Travel] saat riset dan membuat konsep demo website khusus sebagai contoh, bukan website live dan bukan proyek yang sudah disetujui. Aku ingin menawarkan owner kesempatan melihatnya, lalu kalau cocok aku punya paket Essential mulai Rp1.500.000 dengan scope tertulis. Apakah owner atau pengelola marketing yang tepat untuk aku hubungi?”",
      "internalNote": "Transparan bahwa demo dibuat atas inisiatif kamu menggunakan informasi bisnis yang tersedia secara publik. Jangan menyebutnya sebagai desain yang sudah dipesan klien.",
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
      "script": "“Terima kasih. Biar aku tidak salah waktu, kapan paling baik menghubungi beliau? Kalau lebih nyaman, aku juga bisa mengirim satu pesan singkat berisi link demo ke kanal bisnis yang memang boleh digunakan.”",
      "internalNote": "Catat nama, peran, waktu, dan kanal yang diizinkan. Jangan menyimpan nomor pribadi yang diberikan tanpa izin.",
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
            "Kirim ke email travel."
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
      "title": "Owner teridentifikasi — jelaskan demo secara singkat",
      "script": "“Makasih ya, Pak/Bu. Aku [Nama Anda] dari [Brand]. Saat riset aku belum menemukan website resmi [Nama Travel] yang aktif—mungkin aku kelewatan. Jadi aku bikin demo konsep khusus supaya Bapak/Ibu bisa melihat cara menampilkan paket wisata, itinerary, informasi inclusions, dan jalur inquiry. Demo ini belum live dan bukan website resmi. Boleh aku jelaskan sebentar?”",
      "internalNote": "Gunakan gaya ramah dan tenang. Identifikasi owner dulu, jelaskan demo tanpa menghakimi, lalu berhenti dan dengarkan. Ganti placeholder sebelum menelepon.",
      "branches": [
        {
          "key": "hear_pitch",
          "label": "Mau mendengar penjelasan",
          "examples": [
            "Silakan.",
            "Oke, lanjut."
          ],
          "target": "demo_pitch"
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
            "Saya sedang urus tamu.",
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
      "key": "demo_pitch",
      "type": "message",
      "title": "Pitch demo — fokus pada kebutuhan usaha tour & travel",
      "script": "“Aku menyesuaikan konsepnya untuk bisnis tour & travel: calon tamu bisa lebih mudah melihat paket atau aktivitas, gambaran itinerary, apa yang termasuk dan tidak termasuk, foto, titik penjemputan jika relevan, serta tombol WhatsApp atau formulir inquiry. Detailnya tentu harus disesuaikan dengan layanan dan informasi resmi Bapak/Ibu. Aku tidak menjanjikan jumlah booking tertentu; aku ingin menunjukkan struktur dan pengalaman pengguna yang bisa kita bangun. Lebih nyaman melihat demo sekarang atau aku kirim link-nya?”",
      "internalNote": "Sesuaikan contoh layanan dengan demo yang benar-benar kamu buat. Jangan mengklaim fitur yang belum ada di demo. Setelah mengajukan pertanyaan terakhir, berhenti bicara dan beri jeda. Jika ada keberatan, gali penyebabnya melalui node objection_* sebelum menjelaskan atau menawarkan diskon.",
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
      "script": "“Demo ini masih berupa preview privat, bukan website live dan belum dipublikasikan. Aku membuatnya sebagai contoh konsep berdasarkan informasi bisnis yang tersedia secara publik. Aku tidak mengklaim Bapak/Ibu pernah menyetujuinya, dan aku tidak akan mempublikasikan atau memakai materi yang belum diizinkan. Kalau Bapak/Ibu tidak nyaman, aku bisa berhenti mengirim atau menghapus preview tersebut.”",
      "internalNote": "Jangan menggunakan logo, foto, ulasan, atau foto pelanggan seolah-olah sudah mendapat persetujuan. Hapus materi jika diminta.",
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
      "script": "“Aku ingin memastikan semuanya transparan. Untuk Paket Essential Rp1.500.000, rincian finalnya akan aku tulis: [jumlah halaman/section], [jenis konten dan halaman paket], [CTA WhatsApp/form yang benar-benar termasuk], [jumlah revisi], [timeline], serta status domain dan hosting. Item yang belum tertulis tidak otomatis termasuk; tambahan seperti booking engine atau payment gateway perlu dicek terpisah. Apakah scope dasar seperti ini sesuai kebutuhan Bapak/Ibu?”",
      "internalNote": "Penting: isi semua tanda kurung siku sesuai layanan yang benar-benar siap kamu berikan. Jangan menjanjikan domain, hosting, revisi, jumlah halaman, copywriting, foto, SEO, atau maintenance sebelum dipastikan.",
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
      "script": "“Itu perlu aku tulis dengan jelas agar tidak ada biaya tersembunyi. Untuk paket ini, [domain: termasuk/tidak termasuk], [hosting: termasuk/tidak termasuk], dan perkiraan biaya perpanjangan adalah [nominal/periode jika sudah diverifikasi]. Aku akan pisahkan biaya pembuatan dari biaya tahunan atau layanan pihak ketiga.”",
      "internalNote": "Isi angka dan status include/exclude sebelum menelepon. Jangan mengarang tarif domain/hosting atau menyebut layanan pihak ketiga gratis tanpa mengecek.",
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
      "script": "“Estimasi yang bisa aku komitkan adalah [X hari kerja] setelah scope disetujui dan materi yang dibutuhkan lengkap. Aku akan tulis milestone dan ketergantungan materi dari pihak travel di penawaran, supaya jadwalnya realistis.”",
      "internalNote": "Jangan mengunci estimasi sebelum melihat scope dan ketersediaan materi.",
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
      "script": "“Aku paham ingin menekan budget. Rp1.500.000 adalah harga Paket Essential untuk scope yang tertulis. Aku tidak mau menerima harga lebih rendah lalu mengurangi kualitas diam-diam. Kalau perlu, kita bisa mengurangi scope secara jelas atau tetap di paket ini dan menambah fitur nanti.”",
      "internalNote": "Jangan menjanjikan potongan di luar margin atau memberi fitur ekstra tanpa memperjelas dampaknya.",
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
      "script": "“Bisa kita bahas versi yang lebih sederhana, tetapi harganya harus mengikuti scope baru secara tertulis. Aku tidak akan menyebutnya masih Paket Essential yang sama jika deliverable-nya berbeda. Aku catat prioritas utama dulu: informasi paket, foto, dan jalur kontak/WhatsApp—atau apa yang paling penting bagi travel Bapak/Ibu?”",
      "internalNote": "Jangan mengarang harga paket mini saat menelepon. Catat kebutuhan dan kirim penawaran terpisah.",
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
      "title": "Keberatan: sudah punya website",
      "script": "“Oh, berarti website sudah ada, bagus. Aku nggak berasumsi website sekarang bermasalah. Boleh tahu, website itu sudah membantu kebutuhan utama bisnis, atau masih ada bagian yang ingin dibuat lebih mudah untuk pelanggan?”",
      "internalNote": "Gali tugas website saat ini sebelum menyarankan redesign. Jika mereka puas dan tidak punya kebutuhan, terima jawabannya.",
      "branches": [
        {
          "key": "working_well",
          "label": "Website sudah bekerja baik",
          "examples": [
            "Sudah cukup, booking masuk."
          ],
          "target": "website_good_fit"
        },
        {
          "key": "outdated",
          "label": "Website lama / informasi sulit diperbarui",
          "examples": [
            "Sudah lama tidak diupdate.",
            "Paketnya sulit dijelaskan."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "agency_manages",
          "label": "Agency/developer lain mengelola website",
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
      "title": "Website yang ada sudah bekerja baik",
      "script": "“Kalau website sekarang sudah membantu dan Bapak/Ibu puas, aku tidak menyarankan mengganti hanya demi mengganti. Demo yang aku buat bisa jadi referensi ide saja. Apakah Bapak/Ibu ingin melihatnya sebagai pembanding, atau lebih baik aku tutup di sini?”",
      "internalNote": "Bersedia kehilangan deal jika tidak ada kebutuhan nyata; jangan menciptakan masalah yang tidak mereka alami.",
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
      "title": "Keberatan: booking hanya dari Instagram / WhatsApp / referral",
      "script": "“Itu bisa tetap jadi channel utama. Website tidak harus menggantikan WhatsApp atau Instagram; bisa menjadi tempat untuk menjelaskan paket, itinerary, fasilitas, kebijakan, dan tautan kontak dengan rapi sebelum calon tamu bertanya. Aku tidak bisa menjamin booking naik, tetapi aku bisa menunjukkan cara alurnya dibuat lebih jelas.”",
      "internalNote": "Jangan mengasumsikan semua bisnis harus punya website; fokus pada kebutuhan mereka.",
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
      "script": "“Bagus, aku tidak bermaksud menyuruh Bapak/Ibu memutus kerja sama yang ada. Demo ini hanya ide alternatif. Kalau relevan, Bapak/Ibu bisa membandingkan atau membagikannya kepada vendor sekarang; kalau tidak ada kebutuhan, tidak masalah.”",
      "internalNote": "Jangan menyarankan menyingkirkan vendor existing tanpa mengetahui hubungan dan kontraknya.",
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
      "script": "“Wajar untuk berhati-hati. Aku bisa kirim portofolio [URL], demo privat, dan rincian scope tertulis. Kita tidak perlu memutuskan melalui telepon; Bapak/Ibu bisa memeriksa hasil dan detailnya dulu. Aku juga akan menjelaskan secara transparan siapa yang mengerjakan, timeline, biaya, dan proses pembayaran.”",
      "internalNote": "Jangan mengarang klien, testimonial, sertifikasi, kantor lokal, atau portofolio. Gunakan bukti yang benar-benar kamu miliki.",
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
      "title": "Menjawab pertanyaan lokasi dan remote work",
      "script": "“Aku berbasis di [lokasi sebenarnya] dan pengerjaannya dilakukan [remote/on-site sesuai kenyataan]. Aku tidak akan mengaku punya kantor atau tim di Northbay kalau memang tidak. Kita tetap bisa koordinasi melalui WhatsApp atau video call, dengan scope dan progres tertulis.”",
      "internalNote": "Ganti [lokasi sebenarnya] dan cara kerja dengan kondisi nyata. Jangan berpura-pura tinggal di Northbay.",
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
      "title": "Pertanyaan jaminan booking / omzet / ranking Google",
      "script": "“Aku tidak bisa menjamin jumlah booking, omzet, atau posisi Google karena itu dipengaruhi banyak faktor seperti traffic, harga paket, ulasan, musim, kompetisi, dan respons tim. Yang bisa aku komitkan adalah deliverable website yang tertulis, tampilan responsif, dan alur informasi/kontak sesuai scope yang disepakati.”",
      "internalNote": "Jangan menjanjikan peringkat, booking, ROI, atau omzet yang tidak dapat dikendalikan.",
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
      "title": "Permintaan fitur di luar paket Essential",
      "script": "“Fitur seperti booking engine dengan availability, payment gateway, multi-bahasa, integrasi channel manager, itinerary builder kompleks, atau dashboard operasional perlu kita definisikan terpisah. Aku tidak ingin memasukkan semuanya ke harga Rp1.500.000 tanpa perhitungan. Aku bisa catat kebutuhan lalu kirim penawaran terpisah; atau kita mulai dari scope Essential dahulu.”",
      "internalNote": "Jangan menjanjikan integration/automation yang belum dikaji. Buat estimasi terpisah untuk sistem yang kompleks.",
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
      "title": "Perlu diskusi dengan partner / manager / keluarga",
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
      "script": "“Baik. Demo ini berupa preview dan belum live. Kanal mana yang memang boleh aku gunakan untuk mengirim link-nya—WhatsApp bisnis ini, email bisnis, atau kanal lain yang Bapak/Ibu pilih?”",
      "internalNote": "Jangan kirim ke nomor pribadi atau alamat yang belum diberikan/diizinkan. Catat kanal yang diminta.",
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
      "script": "“Untuk memastikan, boleh aku kirim satu pesan WhatsApp ke nomor bisnis ini berisi link demo dan ringkasan Paket Essential Rp1.500.000? Kalau berguna, silakan simpan nomor aku agar mudah ditemukan nanti. Tidak perlu membalas kalau belum relevan.”",
      "internalNote": "Minta izin eksplisit. Jangan menganggap nomor telepon otomatis boleh menerima promosi WhatsApp, terutama jika mereka sudah menolak.",
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
      "script": "“Baik, email bisnis mana yang boleh aku gunakan untuk mengirim preview dan rincian singkat? Boleh aku ulang alamatnya untuk memastikan ejaannya benar?”",
      "internalNote": "Ganti contoh email dengan alamat yang benar-benar diberikan. Jangan menebak email.",
      "branches": [
        {
          "key": "email_given",
          "label": "Email diberikan",
          "examples": [
            "Kirim ke hello@contohtravel.com."
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
      "title": "Mengonfirmasi kanal atau nomor alternatif",
      "script": "“Baik, sebutkan kanal/nomor yang memang boleh menerima link demo, atau minta aku mengirim melalui akun bisnis yang Bapak/Ibu tentukan. Aku akan memakai kanal itu saja.”",
      "internalNote": "Jangan mencari atau menggunakan jalur pribadi lain setelah prospek membatasi kanal komunikasi.",
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
      "script": "“Setelah aku kirim, apakah berkenan kalau aku cek satu kali dalam 2–3 hari kerja untuk menanyakan apakah link-nya sudah sempat dibuka? Kalau tidak ingin follow-up, tidak apa-apa—aku hanya kirim preview sesuai permintaan.”",
      "internalNote": "Simpan status izin follow-up. Jangan mengirim rangkaian follow-up jika hanya mengizinkan satu kali.",
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
      "script": "“Baik, supaya tidak mengganggu, kapan waktu yang nyaman untuk aku cek sekali—hari dan jam berapa? Dan lewat kanal yang sama, ya?”",
      "internalNote": "Catat tanggal, waktu, kanal dan batas satu follow-up sesuai izin.",
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
      "script": "“Tidak masalah, aku tidak ingin mengganggu operasional. Kapan lebih nyaman aku telepon kembali—hari ini setelah jam tertentu atau besok? Kalau Bapak/Ibu lebih memilih aku kirim demo dulu, aku bisa lakukan hanya jika diizinkan.”",
      "internalNote": "Ulangi waktu callback untuk mengonfirmasi. Jika mereka bilang tidak tertarik, jangan mengubahnya menjadi callback tanpa izin.",
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
      "title": "Menjadwalkan demo walkthrough singkat",
      "script": "“Baik, aku bisa walkthrough sekitar 5–10 menit untuk memperlihatkan struktur demo dan mendengar koreksi Bapak/Ibu. Tidak ada kewajiban membeli. Hari dan jam berapa yang paling nyaman?”",
      "internalNote": "Konfirmasi zona waktu setempat (WITA jika bisnis di Northbay), kanal meeting, dan email/nomor yang diizinkan.",
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
      "script": "“Aku akan kirim ringkasan tertulis yang memuat scope, harga Rp1.500.000, item yang termasuk/tidak termasuk, revisi, timeline, domain/hosting, biaya berulang, serta tahapan pembayaran. Bapak/Ibu bisa meninjaunya dulu tanpa komitmen. Setelah itu, apakah boleh aku cek sekali pada waktu yang kita sepakati?”",
      "internalNote": "Jangan menyebut proposal terkirim sebelum benar-benar dikirim. Jangan mengunci biaya yang belum dihitung.",
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
      "title": "Pertanyaan pembayaran, invoice, dan kontrak",
      "script": "“Aku akan jelaskan proses pembayaran secara tertulis sebelum mulai: [DP/pembayaran awal], [tahap pelunasan], metode pembayaran, dan apa yang terjadi jika scope berubah. Kita sepakati dulu deliverable dan syaratnya; aku tidak akan memulai pekerjaan sebelum kedua pihak menyetujui rincian tersebut.”",
      "internalNote": "Ganti semua placeholder dengan kebijakan pembayaran kamu yang sebenarnya. Jangan membuat janji refund/termin yang belum diputuskan.",
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
      "script": "“Untuk merapikan, aku akan kirim scope final, harga, timeline, kebijakan revisi, biaya recurring, dan syarat pembayaran. Mohon ditinjau dan disetujui tertulis. Setelah kesepakatan dan pembayaran sesuai termin yang disepakati, baru pekerjaan dimulai. Apakah aku kirimkan dokumen tersebut ke kanal yang tadi Bapak/Ibu izinkan?”",
      "internalNote": "Jangan menandai deal sebagai closed-won sampai persetujuan dan syarat pembayaran benar-benar terpenuhi.",
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
      "title": "Penolakan halus — minta izin simpan kontak, tanpa memaksa",
      "script": "“Baik, Pak/Bu, aku mengerti dan tidak akan memaksa. Sebelum aku tutup, bolehkah aku kirim satu pesan WhatsApp singkat berisi demo dan kontak aku, supaya kalau suatu saat dibutuhkan Bapak/Ibu bisa menyimpan nomor aku? Kalau tidak berkenan juga tidak apa-apa; aku tidak akan follow-up tanpa izin.”",
      "internalNote": "Hanya gunakan node ini untuk penolakan umum/halus. Jangan gunakan jika prospek sudah berkata jangan hubungi lagi, minta dihapus, atau menolak pesan WhatsApp secara eksplisit.",
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
      "script": "“Baik, Pak/Bu. Terima kasih sudah meluangkan waktu. Aku tidak akan mengirim pesan atau menindaklanjuti. Semoga operasional dan booking-nya lancar. Selamat melanjutkan aktivitas.”",
      "outcomeKey": "not_interested"
    },
    {
      "key": "do_not_contact",
      "type": "outcome",
      "title": "Jangan hubungi lagi — tandai DNC",
      "script": "“Baik, aku mengerti. Maaf sudah mengganggu; nomor ini akan aku tandai agar tidak dihubungi lagi. Terima kasih.”",
      "internalNote": "Hentikan percakapan. Tandai Do Not Contact di CRM/callbook. Jangan minta izin WhatsApp, jangan kirim demo, dan jangan mencoba melalui kanal lain.",
      "outcomeKey": "not_interested"
    },
    {
      "key": "wrong_contact",
      "type": "outcome",
      "title": "Nomor salah / bukan bisnis yang dimaksud",
      "script": "“Maaf atas kekeliruannya. Terima kasih sudah memberi tahu. Aku akan memperbaiki catatan kontak aku.”",
      "outcomeKey": "other"
    },
    {
      "key": "demo_sent_followup",
      "type": "outcome",
      "title": "Demo dikirim — follow-up disetujui",
      "script": "“Terima kasih. Aku akan mengirim preview dan ringkasan sesuai kanal yang disetujui, lalu menghubungi sekali pada waktu yang kita sepakati. Kalau ada pertanyaan sebelum itu, silakan hubungi aku di [kontak Bapak/Ibu].”",
      "outcomeKey": "follow_up_later"
    },
    {
      "key": "demo_sent_no_followup",
      "type": "outcome",
      "title": "Demo dikirim — tanpa follow-up",
      "script": "“Baik, aku kirim link dan ringkasan sesuai permintaan. Aku tidak akan melakukan follow-up; silakan hubungi aku jika nanti ingin membahasnya.”",
      "outcomeKey": "interested_no_meeting"
    },
    {
      "key": "callback_scheduled",
      "type": "outcome",
      "title": "Callback disepakati",
      "script": "“Terima kasih, aku catat [hari/tanggal] pukul [jam] WITA dan akan menghubungi melalui [kanal yang disetujui]. Kalau jadwal berubah, silakan beri tahu.”",
      "outcomeKey": "follow_up_later"
    },
    {
      "key": "meeting_booked",
      "type": "outcome",
      "title": "Demo walkthrough terjadwal",
      "script": "“Baik, kita jadwalkan [hari/tanggal] pukul [jam] WITA selama 5–10 menit. Aku akan kirim konfirmasi ke [kanal yang disetujui]. Terima kasih, sampai bertemu.”",
      "outcomeKey": "meeting_booked"
    },
    {
      "key": "proposal_follow_up",
      "type": "outcome",
      "title": "Proposal/rincian diminta — follow-up diizinkan",
      "script": "“Aku akan kirim rincian scope dan biaya sesuai pembicaraan. Aku catat untuk follow-up sekali pada [tanggal/jam]. Terima kasih.”",
      "outcomeKey": "follow_up_later"
    },
    {
      "key": "proposal_no_followup",
      "type": "outcome",
      "title": "Proposal diminta — tidak ada follow-up",
      "script": "“Baik, aku kirim rincian yang diminta. Aku tidak akan follow-up; silakan hubungi aku bila sudah siap berdiskusi.”",
      "outcomeKey": "interested_no_meeting"
    },
    {
      "key": "custom_quote_followup",
      "type": "outcome",
      "title": "Permintaan quote lanjutan / scope khusus",
      "script": "“Terima kasih. Aku catat kebutuhan tambahannya dan akan menilai scope sebelum memberi harga; aku tidak akan menjanjikan angka sebelum dihitung. Kita sepakati kapan aku mengirim estimasinya: [tanggal].”",
      "outcomeKey": "follow_up_later"
    },
    {
      "key": "project_ready",
      "type": "outcome",
      "title": "Scope disetujui — siapkan administrasi proyek",
      "script": "“Terima kasih atas persetujuannya. Aku akan mengirim dokumen final untuk ditinjau. Proyek baru mulai setelah ruang lingkup, jadwal, dan pembayaran disepakati tertulis.”",
      "outcomeKey": "interested_no_meeting"
    },
    {
      "key": "demo_removed",
      "type": "outcome",
      "title": "Permintaan hapus demo dipenuhi",
      "script": "“Baik, aku akan menghentikan penggunaan preview ini dan menghapus tautannya/materi yang berada dalam kendali aku. Terima kasih sudah memberi tahu.”",
      "internalNote": "Lakukan tindakan penghapusan nyata pada tempat penyimpanan/deployment yang kamu kendalikan sebelum menandai selesai.",
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
      "script": "“Kalau website ini membantu sesuai yang dibutuhkan, apa yang paling ingin dipermudah—orang memahami paket dan itinerary, mengirim inquiry, atau langsung menghubungi tim untuk booking? Aku tanya supaya demo dan scope-nya relevan.”",
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
