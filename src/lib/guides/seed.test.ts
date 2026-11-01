import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Dataset integrity against a real SQLite database built from
 * `migrations/*.sql`. Every value below is transcribed from the build
 * specification, so a mismatch means the seed and the guide disagree.
 */

const tempDirPromise = mkdtemp(path.join(tmpdir(), "leads-master-guides-seed-"));
process.env.LOCAL_DATABASE_PATH = path.join(await tempDirPromise, "seed.sqlite");

const { createLocalSqliteExecutor, closeLocalDatabase } = await import("@/lib/db/local-sqlite");
const { validateGuideSeed } = await import("./seed-validation");
const { listMarketGuides } = await import("./repository");

type Executor = Awaited<ReturnType<typeof createLocalSqliteExecutor>>;

let db: Executor;
let tempDir: string;

beforeAll(async () => {
  tempDir = await tempDirPromise;
  db = await createLocalSqliteExecutor();
});

afterAll(async () => {
  closeLocalDatabase();
  await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

describe("seed validation report", () => {
  it("passes every check and reports the expected totals", async () => {
    const report = await validateGuideSeed(db);
    expect(report.ok, JSON.stringify(report.checks.filter((check) => !check.ok), null, 2)).toBe(
      true,
    );
    expect(report.totals).toMatchObject({
      markets: 3,
      schedules: 11,
      packages: 12,
      packageFeatures: 98,
      nicheCategories: 28,
      nicheServices: 122,
      nichePriceRows: 93,
      nichePriceLabels: 31,
      callObjectives: 12,
      sessionGoals: 3,
      checklistItems: 18,
      objections: 9,
      tools: 18,
      sessions: 0,
    });
  });
});

describe("markets", () => {
  it("contains exactly the three source markets in guide order", async () => {
    const guides = await listMarketGuides();
    expect(guides.map((guide) => guide.market.code)).toEqual(["ID", "AU", "USA"]);
    expect(guides.map((guide) => guide.market.currencyCode)).toEqual(["IDR", "AUD", "USD"]);
    expect(guides.map((guide) => guide.market.currencyLabel)).toEqual(["Rp", "A$", "US$"]);
  });

  it("uses the supplied recommended package and reference target", async () => {
    const guides = await listMarketGuides();
    const byCode = new Map(guides.map((guide) => [guide.market.code, guide]));

    const id = byCode.get("ID")!;
    expect(id.market.targetPriceAmount).toBe(3500000);
    expect(id.market.targetPriceIsMinimum).toBe(true);
    expect(id.packages.find((product) => product.id === id.market.recommendedPackageId)?.name).toBe(
      "Growth",
    );

    const au = byCode.get("AU")!;
    expect(au.market.targetPriceAmount).toBe(1200);
    expect(
      au.packages.find((product) => product.id === au.market.recommendedPackageId)?.name,
    ).toBe("Professional");

    const usa = byCode.get("USA")!;
    expect(usa.market.targetPriceAmount).toBe(750);
    expect(
      usa.packages.find((product) => product.id === usa.market.recommendedPackageId)?.name,
    ).toBe("Growth");
  });

  it("keeps the USA daylight-saving note verbatim and flagged for review", async () => {
    const guides = await listMarketGuides();
    const usa = guides.find((guide) => guide.market.code === "USA")!;
    expect(usa.market.timezoneNote).toBe(
      "Jadwal waktu dalam WIB. Berlaku area sampai 1 November 2026. Mulai 2 November, jadwal bergerak 1 jam lebih awal (karena berakhirnya daylight saving time).",
    );
    expect(usa.market.scheduleNoteReviewRequired).toBe(true);
    expect(guides.find((guide) => guide.market.code === "ID")!.market.timezoneNote).toBeNull();
  });
});
describe("calling schedules", () => {
  it("stores the Indonesian timetable exactly as supplied", async () => {
    const guides = await listMarketGuides();
    const id = guides.find((guide) => guide.market.code === "ID")!;
    expect(
      id.schedules.map((schedule) => [
        schedule.startTimeWib,
        schedule.endTimeWib,
        schedule.timezoneLabel,
        schedule.cityLabels,
        schedule.priorityLabels,
      ]),
    ).toEqual([
      [
        "09:00",
        "09:30",
        "WIB",
        ["Northbay"],
        ["Klinik gigi", "klinik kecantikan", "kontraktor", "wellness"],
      ],
      [
        "09:30",
        "10:00",
        "WIB",
        ["Northbay Coast", "Harbour", "Old Town", "Hillside", "Marina", "Bay Point"],
        ["Villa management", "Property management", "Hotel", "Wellness", "Wedding organizer"],
      ],
      [
        "10:00",
        "10:30",
        "WIB",
        ["Jakarta Selatan", "Jakarta Pusat"],
        ["Klinik", "Konsultan", "Law firm", "Jasa profesional", "Properti"],
      ],
      [
        "10:30",
        "11:00",
        "WIB",
        ["Tangerang", "BSD", "Gading Serpong", "Bandung", "Surabaya"],
        ["Klinik", "Kontraktor", "Properti", "Pendidikan", "F&B", "Jasa profesional"],
      ],
    ]);
  });

  it("stores the Australian timetable with its supplied local-time labels", async () => {
    const guides = await listMarketGuides();
    const au = guides.find((guide) => guide.market.code === "AU")!;
    expect(
      au.schedules.map((schedule) => [
        schedule.startTimeWib,
        schedule.endTimeWib,
        schedule.localTimeLabel,
        schedule.cityLabels,
      ]),
    ).toEqual([
      ["06:00", "07:00", "10:00–11:00 local", ["Sydney (NSW)", "Melbourne (VIC)"]],
      ["06:30", "07:30", "10:00–11:00 local", ["Adelaide (SA)"]],
      ["07:00", "08:00", "10:00–11:00 local", ["Brisbane (QLD)", "Gold Coast (QLD)"]],
    ]);
    expect(au.schedules[0].priorityLabels).toEqual([
      "Plumbing",
      "Electrical",
      "Roofing",
      "Builders",
      "Renovation",
      "Landscaping",
      "Cleaning",
      "Pest control",
    ]);
  });

  it("stores the US timetable with the supplied timezone labels", async () => {
    const guides = await listMarketGuides();
    const usa = guides.find((guide) => guide.market.code === "USA")!;
    expect(
      usa.schedules.map((schedule) => [
        schedule.startTimeWib,
        schedule.endTimeWib,
        schedule.localTimeLabel,
        schedule.timezoneLabel,
        schedule.cityLabels,
      ]),
    ).toEqual([
      ["21:00", "21:30", "10:00–11:00", "Local / ET", ["Miami, Florida"]],
      ["21:30", "22:00", "10:00–11:00", "Local / ET", ["Atlanta, Georgia", "Charlotte, NC"]],
      ["22:00", "22:30", "10:00–11:00", "Local / CT", ["Dallas, Texas"]],
      ["22:30", "23:00", "10:00–11:00", "Local / CT", ["Houston, Texas"]],
    ]);
    expect(usa.schedules[0].priorityLabels).toEqual([
      "Med spa",
      "Cosmetic dentistry",
      "Dental clinic",
      "Plastic surgery",
      "Wellness clinic",
      "IV therapy",
      "High-end salon",
    ]);
  });
});
describe("niche catalog", () => {
  it("contains the exact Indonesian and Australian child labels", async () => {
    const guides = await listMarketGuides();
    const catalog = Object.fromEntries(
      guides.flatMap((guide) =>
        guide.nicheCategories.map((category) => [
          `${guide.market.code}:${category.name}`,
          category.services.map((service) => service.name),
        ]),
      ),
    );

    expect(catalog).toMatchObject({
      "ID:Klinik Gigi": ["Praktik gigi umum", "Ortodonti", "Implan gigi", "Klinik keluarga"],
      "ID:Klinik Kecantikan": ["Skin clinic", "Dermatology", "Aesthetic clinic", "Wellness center"],
      "ID:Villa & Property": [
        "Villa management",
        "Property management",
        "Real estate agency",
        "Rental villa",
      ],
      "ID:Kontraktor & Renovasi": [
        "Builders & renovasi",
        "Interior contractor",
        "Jasa arsitek",
        "Tukang bangunan",
      ],
      "ID:Hotel & Hospitality": ["Hotel", "Resort", "Guest house", "Tour & travel"],
      "ID:Konsultan & Profesional": [
        "Konsultan bisnis",
        "Law firm / notaris",
        "Akuntan / pajak",
        "HR & training",
      ],
      "ID:Pendidikan": ["Sekolah", "Kursus / les", "Training center", "Bimbel"],
      "ID:F&B": ["Restoran", "Cafe", "Catering", "Bakery"],
      "AU:Plumbing": [
        "Residential plumbing",
        "Emergency plumber",
        "Gas fitting",
        "Drainage services",
      ],
      "AU:Electrical": [
        "Electrician",
        "Solar installation",
        "Switchboard upgrade",
        "EV charger installation",
      ],
      "AU:Roofing": ["Roof replacement", "Roof repair", "Gutter installation", "Roof inspections"],
      "AU:Builders & Renovation": [
        "Home builders",
        "Home renovation",
        "Extensions",
        "Deck & outdoor area",
      ],
      "AU:HVAC": ["Air conditioning", "Heating systems", "Installation & repair", "Ducted systems"],
      "AU:Landscaping": ["Garden design", "Lawn & turf", "Irrigation systems", "Retaining walls"],
      "AU:Pool Services": [
        "Pool installation",
        "Pool cleaning",
        "Pool maintenance",
        "Equipment repair",
      ],
      "AU:Cleaning": [
        "Residential cleaning",
        "Commercial cleaning",
        "End of lease cleaning",
        "Window cleaning",
      ],
      "AU:Pest Control": [
        "General pest control",
        "Termite treatment",
        "Rodent control",
        "Inspection & prevention",
      ],
      "AU:Property Management": [
        "Rental management",
        "Property agency",
        "Real estate services",
        "Investment property",
      ],
    });
  });

  it("contains the exact US child labels", async () => {
    const guides = await listMarketGuides();
    const usa = guides.find((guide) => guide.market.code === "USA")!;
    const catalog = Object.fromEntries(
      usa.nicheCategories.map((category) => [
        category.name,
        category.services.map((service) => service.name),
      ]),
    );

    expect(catalog).toEqual({
      "Med Spa & Aesthetic": [
        "Med spa",
        "Aesthetic clinic",
        "IV therapy",
        "Skin clinic",
        "Plastic surgery",
      ],
      "Dental & Orthodontics": [
        "General dentist",
        "Cosmetic dentistry",
        "Orthodontist",
        "Implant dentist",
        "Pediatric dentist",
      ],
      Roofing: [
        "Roofing contractor",
        "Roof repair",
        "Gutter installation",
        "Roof inspection",
        "Storm damage repair",
      ],
      HVAC: [
        "HVAC installation",
        "AC repair",
        "Heating systems",
        "Duct cleaning",
        "Indoor air quality",
      ],
      Plumbing: [
        "Residential plumbing",
        "Emergency plumber",
        "Water heater",
        "Drain cleaning",
        "Pipe repair",
      ],
      Electrical: [
        "Electrical contractor",
        "Panel upgrade",
        "EV charger installation",
        "Lighting installation",
        "Residential & commercial",
      ],
      Landscaping: [
        "Lawn care",
        "Landscape design",
        "Irrigation systems",
        "Tree services",
        "Outdoor living",
      ],
      "Home Remodeling": [
        "Kitchen remodeling",
        "Bathroom remodeling",
        "Home renovation",
        "General contractor",
        "Deck & patio",
      ],
      "Pest Control": [
        "General pest control",
        "Termite treatment",
        "Rodent control",
        "Bed bug removal",
        "Commercial pest control",
      ],
      "Law Firm & Professional": [
        "Personal injury law",
        "Family law",
        "Business law",
        "Accounting firm",
        "Consulting firm",
      ],
    });
  });
});
describe("packages", () => {
  it("stores the Indonesian packages with their exact price, timeline and inclusions", async () => {
    const guides = await listMarketGuides();
    const id = guides.find((guide) => guide.market.code === "ID")!;
    const packages = Object.fromEntries(
      id.packages.map((product) => [
        product.name,
        {
          price: product.priceAmount,
          starting: product.isStartingPrice,
          recommended: product.id === id.market.recommendedPackageId,
          timeline: product.timeline,
          features: product.features.map((feature) => feature.featureText),
        },
      ]),
    );

    expect(packages).toEqual({
      Essential: {
        price: 1500000,
        starting: false,
        recommended: false,
        timeline: "5–7 hari kerja",
        features: [
          "Landing page (1 halaman).",
          "Desain profesional & responsive.",
          "CTA WhatsApp & form kontak.",
          "SEO dasar.",
          "Integrasi Google Maps.",
          "1 kali revisi.",
        ],
      },
      Growth: {
        price: 3500000,
        starting: false,
        recommended: true,
        timeline: "10–14 hari kerja",
        features: [
          "Hingga 5 halaman.",
          "Desain custom sesuai brand.",
          "Halaman layanan.",
          "Form inquiry & WhatsApp.",
          "Integrasi Google Maps.",
          "SEO dasar.",
          "CMS untuk update konten.",
          "2 kali revisi.",
        ],
      },
      Premium: {
        price: 7500000,
        starting: false,
        recommended: false,
        timeline: "3–4 minggu",
        features: [
          "Hingga 10 halaman.",
          "Desain premium & eksklusif.",
          "Struktur layanan lengkap.",
          "Blog / artikel.",
          "SEO teknis dasar.",
          "Google Analytics & tracking.",
          "CMS mudah digunakan.",
          "2–3 kali revisi.",
        ],
      },
      "Company / Custom": {
        price: 15000000,
        starting: true,
        recommended: false,
        timeline: "4–6 minggu",
        features: [
          "20+ halaman.",
          "Desain custom premium.",
          "Integrasi API / sistem pihak ketiga.",
          "Multi-language (ID/EN).",
          "Fitur khusus sesuai kebutuhan.",
          "SEO & performa optimal.",
          "Training penggunaan.",
          "Revisi sesuai kesepakatan.",
        ],
      },
    });
  });

  it("stores the Australian packages with their exact price, timeline and inclusions", async () => {
    const guides = await listMarketGuides();
    const au = guides.find((guide) => guide.market.code === "AU")!;
    const packages = Object.fromEntries(
      au.packages.map((product) => [
        product.name,
        {
          price: product.priceAmount,
          starting: product.isStartingPrice,
          recommended: product.id === au.market.recommendedPackageId,
          timeline: product.timeline,
          features: product.features.map((feature) => feature.featureText),
        },
      ]),
    );

    expect(packages).toEqual({
      Essential: {
        price: 700,
        starting: false,
        recommended: false,
        timeline: "5–7 hari kerja",
        features: [
          "Website hingga 3 halaman.",
          "Desain profesional & responsive.",
          "Service overview.",
          "Contact form & click-to-call.",
          "Google Maps.",
          "SEO dasar.",
          "1 kali revisi.",
        ],
      },
      Professional: {
        price: 1200,
        starting: false,
        recommended: true,
        timeline: "10–14 hari kerja",
        features: [
          "Website hingga 5 halaman.",
          "Desain custom sesuai brand.",
          "Halaman layanan per service.",
          "Service area section.",
          "Quote request form.",
          "Integrasi Google Reviews.",
          "SEO on-page dasar.",
          "Google Analytics (basic).",
          "CMS untuk update konten.",
          "2 rounds of revision.",
        ],
      },
      Premium: {
        price: 2000,
        starting: false,
        recommended: false,
        timeline: "3–4 minggu",
        features: [
          "Website hingga 8–10 halaman.",
          "Desain premium & eksklusif.",
          "Multiple service pages.",
          "Portfolio / galeri proyek.",
          "Testimonial & trust section.",
          "Quote request form lanjutan.",
          "SEO teknis dasar.",
          "Analytics & conversion tracking.",
          "CMS + training.",
          "2–3 rounds of revision.",
        ],
      },
      "Business / Custom": {
        price: 3500,
        starting: true,
        recommended: false,
        timeline: "4–8 minggu",
        features: [
          "20+ halaman.",
          "Desain custom premium.",
          "Multi-location website.",
          "Integrasi CRM / booking system.",
          "Fitur khusus sesuai kebutuhan.",
          "SEO & performa optimal.",
          "Training pengguna.",
          "Revisi sesuai kesepakatan.",
        ],
      },
    });
  });
});
describe("US packages", () => {
  it("stores the US packages with their exact price, timeline and inclusions", async () => {
    const guides = await listMarketGuides();
    const usa = guides.find((guide) => guide.market.code === "USA")!;
    const packages = Object.fromEntries(
      usa.packages.map((product) => [
        product.name,
        {
          price: product.priceAmount,
          starting: product.isStartingPrice,
          recommended: product.id === usa.market.recommendedPackageId,
          timeline: product.timeline,
          features: product.features.map((feature) => feature.featureText),
        },
      ]),
    );

    expect(packages).toEqual({
      Starter: {
        price: 400,
        starting: false,
        recommended: false,
        timeline: "5–7 business days",
        features: [
          "Up to 3 pages.",
          "Professional & responsive design.",
          "Contact form & click-to-call.",
          "Basic on-page SEO.",
          "Google Maps integration.",
          "1 round of revision.",
        ],
      },
      Growth: {
        price: 750,
        starting: false,
        recommended: true,
        timeline: "10–14 business days",
        features: [
          "Up to 5 pages.",
          "Custom design sesuai brand.",
          "Service pages.",
          "Lead form & click-to-call.",
          "Google Maps & Reviews.",
          "Basic SEO & Analytics setup.",
          "CMS untuk update konten.",
          "2 rounds of revision.",
        ],
      },
      Premium: {
        price: 1500,
        starting: false,
        recommended: false,
        timeline: "3–4 weeks",
        features: [
          "Up to 8–10 pages.",
          "Premium & exclusive design.",
          "Multiple service pages.",
          "Portfolio / gallery.",
          "Testimonial & trust section.",
          "Advanced quote request form.",
          "Advanced SEO setup.",
          "Analytics & conversion tracking.",
          "CMS + training.",
          "2–3 rounds of revision.",
        ],
      },
      "Enterprise / Custom": {
        price: 3000,
        starting: true,
        recommended: false,
        timeline: "4–8 weeks",
        features: [
          "20+ pages.",
          "Custom premium design.",
          "Multi-location website.",
          "CRM / booking integration.",
          "Advanced SEO & performance.",
          "Blog / content strategy.",
          "Analytics, tracking & reporting.",
          "Training & documentation.",
          "Revision sesuai kesepakatan.",
        ],
      },
    });
  });
});

describe("niche price grid", () => {
  it("stores the exact Indonesian, Australian and US niche rows", async () => {
    const guides = await listMarketGuides();
    const table = Object.fromEntries(
      guides.flatMap((guide) =>
        [...new Set(guide.nichePriceRows.map((row) => row.nicheLabel))]
          .sort(
            (a, b) =>
              (guide.nichePriceRows.find((row) => row.nicheLabel === a)?.sourceOrder ?? 0) -
              (guide.nichePriceRows.find((row) => row.nicheLabel === b)?.sourceOrder ?? 0),
          )
          .map((label) => [
            `${guide.market.code}:${label}`,
            guide.nichePriceRows
              .filter((row) => row.nicheLabel === label)
              .sort(
                (a, b) =>
                  guide.packages.findIndex((product) => product.id === a.packageId) -
                  guide.packages.findIndex((product) => product.id === b.packageId),
              )
              .map((row) => row.priceAmount),
          ]),
      ),
    );

    const idRow = [1500000, 3500000, 7500000];
    const auRow = [700, 1200, 2000];
    const usaStandardRow = [400, 750, 1500];
    const usaSpecialtyRow = [750, 1500, 3000];

    expect(table).toEqual({
      "ID:Klinik gigi": idRow,
      "ID:Klinik kecantikan": idRow,
      "ID:Villa management": idRow,
      "ID:Property management": idRow,
      "ID:Kontraktor": idRow,
      "ID:Hotel & hospitality": idRow,
      "ID:Konsultan profesional": idRow,
      "ID:Pendidikan": idRow,
      "ID:F&B (restoran, cafe)": idRow,
      "AU:Plumbing": auRow,
      "AU:Electrical": auRow,
      "AU:Roofing": auRow,
      "AU:Builders & Renovation": auRow,
      "AU:HVAC": auRow,
      "AU:Landscaping": auRow,
      "AU:Pool Services": auRow,
      "AU:Cleaning Company": auRow,
      "AU:Pest Control": auRow,
      "AU:Property Management": auRow,
      "USA:Med Spa": usaStandardRow,
      "USA:Cosmetic Dentistry": usaStandardRow,
      "USA:General Dentistry": usaStandardRow,
      "USA:HVAC": usaStandardRow,
      "USA:Roofing": usaStandardRow,
      "USA:Plumbing": usaStandardRow,
      "USA:Electrical": usaStandardRow,
      "USA:Landscaping": usaStandardRow,
      "USA:Home Remodeling": usaStandardRow,
      "USA:Pest Control": usaStandardRow,
      "USA:Law Firm": usaSpecialtyRow,
      "USA:Accounting / Consulting": usaSpecialtyRow,
    });
  });

  it("never references a package from another market", async () => {
    const violations = await db.all<{ count: number }>(
      `SELECT COUNT(*) AS count FROM niche_price_rows nr
         JOIN packages p ON p.id = nr.package_id
        WHERE p.market_id <> nr.market_id`,
    );
    expect(violations[0].count).toBe(0);
  });

  it("excludes the custom tiers from the niche grid", async () => {
    const customRows = await db.all<{ count: number }>(
      `SELECT COUNT(*) AS count FROM niche_price_rows nr
         JOIN packages p ON p.id = nr.package_id
        WHERE p.is_starting_price = 1`,
    );
    expect(customRows[0].count).toBe(0);
  });
});
describe("guide reference data", () => {
  it("stores the source call objectives, checklist, objections and tools for each market", async () => {
    const guides = await listMarketGuides();
    for (const guide of guides) {
      expect(guide.callObjectives.map((goal) => goal.goalText)).toEqual([
        "Berbicara dengan owner atau decision maker.",
        "Memahami kebutuhan dan kondisi website saat ini.",
        "Menawarkan solusi yang relevan.",
        "Mengatur meeting / demo atau langsung closing.",
      ]);
      expect(guide.checklist.map((item) => item.itemText)).toEqual([
        "Perkenalan singkat.",
        "Apakah mereka sudah punya website?",
        "Masalah yang mereka alami, jika ada.",
        "Menawarkan demo / contoh website.",
        "Menjelaskan paket sesuai kebutuhan.",
        "Menanyakan ketertarikan dan next step.",
      ]);
      expect(guide.objections).toHaveLength(3);
      expect(guide.tools).toHaveLength(6);
    }
  });

  it("stores the Indonesia session goals from the guide", async () => {
    const guides = await listMarketGuides();
    const id = guides.find((guide) => guide.market.code === "ID")!;
    expect(id.sessionGoals.map((goal) => goal.goalText)).toEqual([
      "Menemukan bisnis lokal yang membutuhkan website profesional.",
      "Menawarkan paket sesuai kebutuhan dan budget.",
      "Mengatur meeting atau langsung closing.",
    ]);
    expect(guides.find((guide) => guide.market.code === "AU")!.sessionGoals).toEqual([]);
  });

  it("stores the exact objection wording per market", async () => {
    const guides = await listMarketGuides();
    const usa = guides.find((guide) => guide.market.code === "USA")!;
    expect(usa.objections.map((objection) => objection.objectionText)).toEqual([
      "We already have a website.",
      "We don't have the budget.",
      "Not now.",
    ]);
    const au = guides.find((guide) => guide.market.code === "AU")!;
    expect(au.objections.map((objection) => objection.objectionText)).toEqual([
      "Kami sudah punya website.",
      "Lagi tidak ada budget.",
      "Nanti saja.",
    ]);
  });

  it("keeps the recommended tools and their source descriptions", async () => {
    const guides = await listMarketGuides();
    const id = guides.find((guide) => guide.market.code === "ID")!;
    expect(id.tools.map((tool) => [tool.toolName, tool.toolDescription])).toEqual([
      ["Google Maps", "cari bisnis lokal."],
      ["Google Business Profile", "cek informasi dan review."],
      ["Spreadsheet / CRM", "catat prospek."],
      ["WhatsApp Business", "follow-up."],
      ["Demo website sesuai niche", ""],
      ["Invoice & proposal template", ""],
    ]);
    const usa = guides.find((guide) => guide.market.code === "USA")!;
    expect(usa.tools.map((tool) => tool.toolName)).toEqual([
      "Google Maps",
      "Google Business Profile",
      "Spreadsheet / CRM",
      "WhatsApp Business",
      "Demo website appropriate to the niche",
      "Invoice and proposal template",
    ]);
  });
});

describe("seed idempotency", () => {
  it("ignores a replayed seed row instead of duplicating it", async () => {
    const before = await db.first<{ count: number }>("SELECT COUNT(*) AS count FROM markets");

    await db.run(
      `INSERT OR IGNORE INTO markets
         (id, code, name, currency_code, currency_label, recommended_package_id,
          target_price_amount, target_price_is_minimum, timezone_note,
          schedule_note_review_required, sort_order, is_active, created_at, updated_at)
       VALUES ('market_id', 'ID', 'Indonesia', 'IDR', 'Rp', 'pkg_id_growth',
               3500000, 1, NULL, 0, 1, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z')`,
    );

    const after = await db.first<{ count: number }>("SELECT COUNT(*) AS count FROM markets");
    expect(after?.count).toBe(before?.count);
  });

  it("never overwrites an edited price when the seed row is replayed", async () => {
    await db.run("UPDATE packages SET price_amount = 3600000 WHERE id = 'pkg_id_growth'");

    await db.run(
      `INSERT OR IGNORE INTO packages
         (id, market_id, slug, name, price_amount, is_starting_price, timeline,
          is_recommended, display_order, is_active, created_at, updated_at)
       VALUES ('pkg_id_growth', 'market_id', 'growth', 'Growth', 3500000, 0, '10–14 hari kerja',
               1, 2, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z')`,
    );

    const row = await db.first<{ price_amount: number }>(
      "SELECT price_amount FROM packages WHERE id = 'pkg_id_growth'",
    );
    expect(row?.price_amount).toBe(3600000);

    // Restore the source value for the remaining assertions.
    await db.run("UPDATE packages SET price_amount = 3500000 WHERE id = 'pkg_id_growth'");
  });

  it("does not seed any sessions", async () => {
    const row = await db.first<{ count: number }>("SELECT COUNT(*) AS count FROM sessions");
    expect(row?.count).toBe(0);
  });
});