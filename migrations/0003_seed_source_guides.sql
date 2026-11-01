-- Seed: the three source guides (Indonesia, Australia, United States).
--
-- Source of truth for every price, package inclusion, schedule block, niche
-- label, call objective, objection and tool listed in the build specification.
-- Values are stored exactly as supplied. "+" prices are represented by
-- is_starting_price = 1 and never by a string.
--
-- Idempotent: INSERT OR IGNORE relies on the unique constraints in 0002, so
-- re-running this file never duplicates rows and never overwrites an edited
-- price. Session rows are never seeded.
--
-- Seed timestamp is a constant so the import is reproducible.

INSERT OR IGNORE INTO markets (
  id, code, name, currency_code, currency_label, recommended_package_id,
  target_price_amount, target_price_is_minimum, timezone_note,
  schedule_note_review_required, sort_order, is_active, created_at, updated_at
) VALUES
  ('market_id', 'ID', 'Indonesia', 'IDR', 'Rp', NULL, 3500000, 1, NULL, 0, 1, 1,
   '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('market_au', 'AU', 'Australia', 'AUD', 'A$', NULL, 1200, 1, NULL, 0, 2, 1,
   '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('market_usa', 'USA', 'United States', 'USD', 'US$', NULL, 750, 1,
   'Jadwal waktu dalam WIB. Berlaku area sampai 1 November 2026. Mulai 2 November, jadwal bergerak 1 jam lebih awal (karena berakhirnya daylight saving time).',
   1, 3, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

-- Packages -------------------------------------------------------------------

INSERT OR IGNORE INTO packages (
  id, market_id, slug, name, price_amount, is_starting_price, timeline,
  is_recommended, display_order, is_active, created_at, updated_at
) VALUES
  ('pkg_id_essential', 'market_id', 'essential', 'Essential', 1500000, 0, '5–7 hari kerja', 0, 1, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('pkg_id_growth', 'market_id', 'growth', 'Growth', 3500000, 0, '10–14 hari kerja', 1, 2, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('pkg_id_premium', 'market_id', 'premium', 'Premium', 7500000, 0, '3–4 minggu', 0, 3, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('pkg_id_company', 'market_id', 'company-custom', 'Company / Custom', 15000000, 1, '4–6 minggu', 0, 4, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('pkg_au_essential', 'market_au', 'essential', 'Essential', 700, 0, '5–7 hari kerja', 0, 1, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('pkg_au_professional', 'market_au', 'professional', 'Professional', 1200, 0, '10–14 hari kerja', 1, 2, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('pkg_au_premium', 'market_au', 'premium', 'Premium', 2000, 0, '3–4 minggu', 0, 3, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('pkg_au_business', 'market_au', 'business-custom', 'Business / Custom', 3500, 1, '4–8 minggu', 0, 4, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('pkg_usa_starter', 'market_usa', 'starter', 'Starter', 400, 0, '5–7 business days', 0, 1, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('pkg_usa_growth', 'market_usa', 'growth', 'Growth', 750, 0, '10–14 business days', 1, 2, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('pkg_usa_premium', 'market_usa', 'premium', 'Premium', 1500, 0, '3–4 weeks', 0, 3, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('pkg_usa_enterprise', 'market_usa', 'enterprise-custom', 'Enterprise / Custom', 3000, 1, '4–8 weeks', 0, 4, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

-- The recommendation is a market setting; the guard keeps a manually changed
-- recommendation from being reset when this file is replayed.
UPDATE markets SET recommended_package_id = 'pkg_id_growth'
 WHERE id = 'market_id' AND recommended_package_id IS NULL;
UPDATE markets SET recommended_package_id = 'pkg_au_professional'
 WHERE id = 'market_au' AND recommended_package_id IS NULL;
UPDATE markets SET recommended_package_id = 'pkg_usa_growth'
 WHERE id = 'market_usa' AND recommended_package_id IS NULL;

-- Package inclusions ---------------------------------------------------------
-- Each inclusion is its own record, in source order.

INSERT OR IGNORE INTO package_features (id, package_id, feature_text, sort_order, created_at, updated_at) VALUES
  ('feat_id_essential_1', 'pkg_id_essential', 'Landing page (1 halaman).', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_essential_2', 'pkg_id_essential', 'Desain profesional & responsive.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_essential_3', 'pkg_id_essential', 'CTA WhatsApp & form kontak.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_essential_4', 'pkg_id_essential', 'SEO dasar.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_essential_5', 'pkg_id_essential', 'Integrasi Google Maps.', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_essential_6', 'pkg_id_essential', '1 kali revisi.', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_growth_1', 'pkg_id_growth', 'Hingga 5 halaman.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_growth_2', 'pkg_id_growth', 'Desain custom sesuai brand.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_growth_3', 'pkg_id_growth', 'Halaman layanan.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_growth_4', 'pkg_id_growth', 'Form inquiry & WhatsApp.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_growth_5', 'pkg_id_growth', 'Integrasi Google Maps.', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_growth_6', 'pkg_id_growth', 'SEO dasar.', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_growth_7', 'pkg_id_growth', 'CMS untuk update konten.', 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_growth_8', 'pkg_id_growth', '2 kali revisi.', 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_premium_1', 'pkg_id_premium', 'Hingga 10 halaman.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_premium_2', 'pkg_id_premium', 'Desain premium & eksklusif.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_premium_3', 'pkg_id_premium', 'Struktur layanan lengkap.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_premium_4', 'pkg_id_premium', 'Blog / artikel.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_premium_5', 'pkg_id_premium', 'SEO teknis dasar.', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_premium_6', 'pkg_id_premium', 'Google Analytics & tracking.', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_premium_7', 'pkg_id_premium', 'CMS mudah digunakan.', 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_premium_8', 'pkg_id_premium', '2–3 kali revisi.', 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_company_1', 'pkg_id_company', '20+ halaman.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_company_2', 'pkg_id_company', 'Desain custom premium.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_company_3', 'pkg_id_company', 'Integrasi API / sistem pihak ketiga.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_company_4', 'pkg_id_company', 'Multi-language (ID/EN).', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_company_5', 'pkg_id_company', 'Fitur khusus sesuai kebutuhan.', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_company_6', 'pkg_id_company', 'SEO & performa optimal.', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_company_7', 'pkg_id_company', 'Training penggunaan.', 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_id_company_8', 'pkg_id_company', 'Revisi sesuai kesepakatan.', 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

INSERT OR IGNORE INTO package_features (id, package_id, feature_text, sort_order, created_at, updated_at) VALUES
  ('feat_au_essential_1', 'pkg_au_essential', 'Website hingga 3 halaman.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_essential_2', 'pkg_au_essential', 'Desain profesional & responsive.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_essential_3', 'pkg_au_essential', 'Service overview.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_essential_4', 'pkg_au_essential', 'Contact form & click-to-call.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_essential_5', 'pkg_au_essential', 'Google Maps.', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_essential_6', 'pkg_au_essential', 'SEO dasar.', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_essential_7', 'pkg_au_essential', '1 kali revisi.', 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_professional_1', 'pkg_au_professional', 'Website hingga 5 halaman.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_professional_2', 'pkg_au_professional', 'Desain custom sesuai brand.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_professional_3', 'pkg_au_professional', 'Halaman layanan per service.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_professional_4', 'pkg_au_professional', 'Service area section.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_professional_5', 'pkg_au_professional', 'Quote request form.', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_professional_6', 'pkg_au_professional', 'Integrasi Google Reviews.', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_professional_7', 'pkg_au_professional', 'SEO on-page dasar.', 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_professional_8', 'pkg_au_professional', 'Google Analytics (basic).', 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_professional_9', 'pkg_au_professional', 'CMS untuk update konten.', 9, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_professional_10', 'pkg_au_professional', '2 rounds of revision.', 10, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_premium_1', 'pkg_au_premium', 'Website hingga 8–10 halaman.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_premium_2', 'pkg_au_premium', 'Desain premium & eksklusif.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_premium_3', 'pkg_au_premium', 'Multiple service pages.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_premium_4', 'pkg_au_premium', 'Portfolio / galeri proyek.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_premium_5', 'pkg_au_premium', 'Testimonial & trust section.', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_premium_6', 'pkg_au_premium', 'Quote request form lanjutan.', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_premium_7', 'pkg_au_premium', 'SEO teknis dasar.', 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_premium_8', 'pkg_au_premium', 'Analytics & conversion tracking.', 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_premium_9', 'pkg_au_premium', 'CMS + training.', 9, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_premium_10', 'pkg_au_premium', '2–3 rounds of revision.', 10, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_business_1', 'pkg_au_business', '20+ halaman.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_business_2', 'pkg_au_business', 'Desain custom premium.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_business_3', 'pkg_au_business', 'Multi-location website.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_business_4', 'pkg_au_business', 'Integrasi CRM / booking system.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_business_5', 'pkg_au_business', 'Fitur khusus sesuai kebutuhan.', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_business_6', 'pkg_au_business', 'SEO & performa optimal.', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_business_7', 'pkg_au_business', 'Training pengguna.', 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_au_business_8', 'pkg_au_business', 'Revisi sesuai kesepakatan.', 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

INSERT OR IGNORE INTO package_features (id, package_id, feature_text, sort_order, created_at, updated_at) VALUES
  ('feat_usa_starter_1', 'pkg_usa_starter', 'Up to 3 pages.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_starter_2', 'pkg_usa_starter', 'Professional & responsive design.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_starter_3', 'pkg_usa_starter', 'Contact form & click-to-call.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_starter_4', 'pkg_usa_starter', 'Basic on-page SEO.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_starter_5', 'pkg_usa_starter', 'Google Maps integration.', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_starter_6', 'pkg_usa_starter', '1 round of revision.', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_growth_1', 'pkg_usa_growth', 'Up to 5 pages.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_growth_2', 'pkg_usa_growth', 'Custom design sesuai brand.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_growth_3', 'pkg_usa_growth', 'Service pages.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_growth_4', 'pkg_usa_growth', 'Lead form & click-to-call.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_growth_5', 'pkg_usa_growth', 'Google Maps & Reviews.', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_growth_6', 'pkg_usa_growth', 'Basic SEO & Analytics setup.', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_growth_7', 'pkg_usa_growth', 'CMS untuk update konten.', 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_growth_8', 'pkg_usa_growth', '2 rounds of revision.', 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_premium_1', 'pkg_usa_premium', 'Up to 8–10 pages.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_premium_2', 'pkg_usa_premium', 'Premium & exclusive design.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_premium_3', 'pkg_usa_premium', 'Multiple service pages.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_premium_4', 'pkg_usa_premium', 'Portfolio / gallery.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_premium_5', 'pkg_usa_premium', 'Testimonial & trust section.', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_premium_6', 'pkg_usa_premium', 'Advanced quote request form.', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_premium_7', 'pkg_usa_premium', 'Advanced SEO setup.', 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_premium_8', 'pkg_usa_premium', 'Analytics & conversion tracking.', 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_premium_9', 'pkg_usa_premium', 'CMS + training.', 9, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_premium_10', 'pkg_usa_premium', '2–3 rounds of revision.', 10, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_enterprise_1', 'pkg_usa_enterprise', '20+ pages.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_enterprise_2', 'pkg_usa_enterprise', 'Custom premium design.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_enterprise_3', 'pkg_usa_enterprise', 'Multi-location website.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_enterprise_4', 'pkg_usa_enterprise', 'CRM / booking integration.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_enterprise_5', 'pkg_usa_enterprise', 'Advanced SEO & performance.', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_enterprise_6', 'pkg_usa_enterprise', 'Blog / content strategy.', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_enterprise_7', 'pkg_usa_enterprise', 'Analytics, tracking & reporting.', 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_enterprise_8', 'pkg_usa_enterprise', 'Training & documentation.', 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('feat_usa_enterprise_9', 'pkg_usa_enterprise', 'Revision sesuai kesepakatan.', 9, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

-- Calling schedules. Times are the supplied WIB times; local-time and timezone
-- labels are stored exactly as the source guide writes them and are never
-- recalculated by the application.

INSERT OR IGNORE INTO market_schedules (
  id, market_id, schedule_code, title, start_time_wib, end_time_wib,
  local_time_label, timezone_label, city_labels_json, priority_labels_json,
  schedule_note, sort_order, is_active, created_at, updated_at
) VALUES
  ('sched_id_1', 'market_id', 'ID-1', 'Northbay', '09:00', '09:30', NULL, 'WIB',
   '["Northbay"]', '["Klinik gigi","klinik kecantikan","kontraktor","wellness"]',
   NULL, 1, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('sched_id_2', 'market_id', 'ID-2', 'Northbay Coast, Harbour, Old Town, Hillside, Marina, Bay Point', '09:30', '10:00', NULL, 'WIB',
   '["Northbay Coast","Harbour","Old Town","Hillside","Marina","Bay Point"]',
   '["Villa management","Property management","Hotel","Wellness","Wedding organizer"]',
   NULL, 2, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('sched_id_3', 'market_id', 'ID-3', 'Jakarta Selatan, Jakarta Pusat', '10:00', '10:30', NULL, 'WIB',
   '["Jakarta Selatan","Jakarta Pusat"]',
   '["Klinik","Konsultan","Law firm","Jasa profesional","Properti"]',
   NULL, 3, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('sched_id_4', 'market_id', 'ID-4', 'Tangerang, BSD, Gading Serpong, Bandung, Surabaya', '10:30', '11:00', NULL, 'WIB',
   '["Tangerang","BSD","Gading Serpong","Bandung","Surabaya"]',
   '["Klinik","Kontraktor","Properti","Pendidikan","F&B","Jasa profesional"]',
   NULL, 4, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('sched_au_1', 'market_au', 'AU-1', 'Sydney (NSW), Melbourne (VIC)', '06:00', '07:00', '10:00–11:00 local', NULL,
   '["Sydney (NSW)","Melbourne (VIC)"]',
   '["Plumbing","Electrical","Roofing","Builders","Renovation","Landscaping","Cleaning","Pest control"]',
   NULL, 1, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('sched_au_2', 'market_au', 'AU-2', 'Adelaide (SA)', '06:30', '07:30', '10:00–11:00 local', NULL,
   '["Adelaide (SA)"]',
   '["Plumbing","Electrical","Roofing","Builders","Landscaping","Home renovation","Pest control","Property services"]',
   NULL, 2, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('sched_au_3', 'market_au', 'AU-3', 'Brisbane (QLD), Gold Coast (QLD)', '07:00', '08:00', '10:00–11:00 local', NULL,
   '["Brisbane (QLD)","Gold Coast (QLD)"]',
   '["HVAC","Plumbing","Roofing","Landscaping","Pool services","Cleaning","Pest control","Home renovation"]',
   NULL, 3, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('sched_usa_1', 'market_usa', 'USA-1', 'Miami, Florida', '21:00', '21:30', '10:00–11:00', 'Local / ET',
   '["Miami, Florida"]',
   '["Med spa","Cosmetic dentistry","Dental clinic","Plastic surgery","Wellness clinic","IV therapy","High-end salon"]',
   NULL, 1, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('sched_usa_2', 'market_usa', 'USA-2', 'Atlanta, Georgia; Charlotte, NC', '21:30', '22:00', '10:00–11:00', 'Local / ET',
   '["Atlanta, Georgia","Charlotte, NC"]',
   '["Roofing","HVAC","Landscaping","Plumbing","Home remodeling","Pest control","Dental clinic"]',
   NULL, 2, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('sched_usa_3', 'market_usa', 'USA-3', 'Dallas, Texas', '22:00', '22:30', '10:00–11:00', 'Local / CT',
   '["Dallas, Texas"]',
   '["HVAC","Roofing","Plumbing","Electrical","Home remodeling","Landscaping","Pest control"]',
   NULL, 3, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('sched_usa_4', 'market_usa', 'USA-4', 'Houston, Texas', '22:30', '23:00', '10:00–11:00', 'Local / CT',
   '["Houston, Texas"]',
   '["Electrical","Plumbing","Roofing","HVAC","Landscaping","Home remodeling","Industrial services"]',
   NULL, 4, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

-- Niche catalog (category cards) ---------------------------------------------

INSERT OR IGNORE INTO niche_categories (
  id, market_id, slug, name, sort_order, is_active, created_at, updated_at
) VALUES
  ('niche_id_klinik_gigi', 'market_id', 'klinik-gigi', 'Klinik Gigi', 1, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_id_klinik_kecantikan', 'market_id', 'klinik-kecantikan', 'Klinik Kecantikan', 2, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_id_villa_property', 'market_id', 'villa-property', 'Villa & Property', 3, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_id_kontraktor_renovasi', 'market_id', 'kontraktor-renovasi', 'Kontraktor & Renovasi', 4, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_id_hotel_hospitality', 'market_id', 'hotel-hospitality', 'Hotel & Hospitality', 5, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_id_konsultan_profesional', 'market_id', 'konsultan-profesional', 'Konsultan & Profesional', 6, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_id_pendidikan', 'market_id', 'pendidikan', 'Pendidikan', 7, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_id_fnb', 'market_id', 'fnb', 'F&B', 8, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_au_plumbing', 'market_au', 'plumbing', 'Plumbing', 1, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_au_electrical', 'market_au', 'electrical', 'Electrical', 2, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_au_roofing', 'market_au', 'roofing', 'Roofing', 3, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_au_builders', 'market_au', 'builders-renovation', 'Builders & Renovation', 4, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_au_hvac', 'market_au', 'hvac', 'HVAC', 5, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_au_landscaping', 'market_au', 'landscaping', 'Landscaping', 6, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_au_pool', 'market_au', 'pool-services', 'Pool Services', 7, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_au_cleaning', 'market_au', 'cleaning', 'Cleaning', 8, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_au_pest_control', 'market_au', 'pest-control', 'Pest Control', 9, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_au_property_management', 'market_au', 'property-management', 'Property Management', 10, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_usa_med_spa', 'market_usa', 'med-spa-aesthetic', 'Med Spa & Aesthetic', 1, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_usa_dental', 'market_usa', 'dental-orthodontics', 'Dental & Orthodontics', 2, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_usa_roofing', 'market_usa', 'roofing', 'Roofing', 3, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_usa_hvac', 'market_usa', 'hvac', 'HVAC', 4, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_usa_plumbing', 'market_usa', 'plumbing', 'Plumbing', 5, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_usa_electrical', 'market_usa', 'electrical', 'Electrical', 6, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_usa_landscaping', 'market_usa', 'landscaping', 'Landscaping', 7, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_usa_home_remodeling', 'market_usa', 'home-remodeling', 'Home Remodeling', 8, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_usa_pest_control', 'market_usa', 'pest-control', 'Pest Control', 9, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('niche_usa_law_firm', 'market_usa', 'law-firm-professional', 'Law Firm & Professional', 10, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

-- Niche child labels ---------------------------------------------------------

INSERT OR IGNORE INTO niche_services (id, niche_category_id, name, sort_order, created_at, updated_at) VALUES
  ('svc_id_gigi_1', 'niche_id_klinik_gigi', 'Praktik gigi umum', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_gigi_2', 'niche_id_klinik_gigi', 'Ortodonti', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_gigi_3', 'niche_id_klinik_gigi', 'Implan gigi', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_gigi_4', 'niche_id_klinik_gigi', 'Klinik keluarga', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_kecantikan_1', 'niche_id_klinik_kecantikan', 'Skin clinic', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_kecantikan_2', 'niche_id_klinik_kecantikan', 'Dermatology', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_kecantikan_3', 'niche_id_klinik_kecantikan', 'Aesthetic clinic', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_kecantikan_4', 'niche_id_klinik_kecantikan', 'Wellness center', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_villa_1', 'niche_id_villa_property', 'Villa management', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_villa_2', 'niche_id_villa_property', 'Property management', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_villa_3', 'niche_id_villa_property', 'Real estate agency', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_villa_4', 'niche_id_villa_property', 'Rental villa', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_kontraktor_1', 'niche_id_kontraktor_renovasi', 'Builders & renovasi', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_kontraktor_2', 'niche_id_kontraktor_renovasi', 'Interior contractor', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_kontraktor_3', 'niche_id_kontraktor_renovasi', 'Jasa arsitek', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_kontraktor_4', 'niche_id_kontraktor_renovasi', 'Tukang bangunan', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_hotel_1', 'niche_id_hotel_hospitality', 'Hotel', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_hotel_2', 'niche_id_hotel_hospitality', 'Resort', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_hotel_3', 'niche_id_hotel_hospitality', 'Guest house', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_hotel_4', 'niche_id_hotel_hospitality', 'Tour & travel', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_konsultan_1', 'niche_id_konsultan_profesional', 'Konsultan bisnis', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_konsultan_2', 'niche_id_konsultan_profesional', 'Law firm / notaris', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_konsultan_3', 'niche_id_konsultan_profesional', 'Akuntan / pajak', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_konsultan_4', 'niche_id_konsultan_profesional', 'HR & training', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_pendidikan_1', 'niche_id_pendidikan', 'Sekolah', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_pendidikan_2', 'niche_id_pendidikan', 'Kursus / les', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_pendidikan_3', 'niche_id_pendidikan', 'Training center', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_pendidikan_4', 'niche_id_pendidikan', 'Bimbel', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_fnb_1', 'niche_id_fnb', 'Restoran', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_fnb_2', 'niche_id_fnb', 'Cafe', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_fnb_3', 'niche_id_fnb', 'Catering', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_id_fnb_4', 'niche_id_fnb', 'Bakery', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

INSERT OR IGNORE INTO niche_services (id, niche_category_id, name, sort_order, created_at, updated_at) VALUES
  ('svc_au_plumbing_1', 'niche_au_plumbing', 'Residential plumbing', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_plumbing_2', 'niche_au_plumbing', 'Emergency plumber', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_plumbing_3', 'niche_au_plumbing', 'Gas fitting', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_plumbing_4', 'niche_au_plumbing', 'Drainage services', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_electrical_1', 'niche_au_electrical', 'Electrician', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_electrical_2', 'niche_au_electrical', 'Solar installation', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_electrical_3', 'niche_au_electrical', 'Switchboard upgrade', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_electrical_4', 'niche_au_electrical', 'EV charger installation', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_roofing_1', 'niche_au_roofing', 'Roof replacement', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_roofing_2', 'niche_au_roofing', 'Roof repair', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_roofing_3', 'niche_au_roofing', 'Gutter installation', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_roofing_4', 'niche_au_roofing', 'Roof inspections', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_builders_1', 'niche_au_builders', 'Home builders', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_builders_2', 'niche_au_builders', 'Home renovation', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_builders_3', 'niche_au_builders', 'Extensions', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_builders_4', 'niche_au_builders', 'Deck & outdoor area', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_hvac_1', 'niche_au_hvac', 'Air conditioning', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_hvac_2', 'niche_au_hvac', 'Heating systems', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_hvac_3', 'niche_au_hvac', 'Installation & repair', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_hvac_4', 'niche_au_hvac', 'Ducted systems', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_landscaping_1', 'niche_au_landscaping', 'Garden design', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_landscaping_2', 'niche_au_landscaping', 'Lawn & turf', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_landscaping_3', 'niche_au_landscaping', 'Irrigation systems', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_landscaping_4', 'niche_au_landscaping', 'Retaining walls', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_pool_1', 'niche_au_pool', 'Pool installation', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_pool_2', 'niche_au_pool', 'Pool cleaning', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_pool_3', 'niche_au_pool', 'Pool maintenance', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_pool_4', 'niche_au_pool', 'Equipment repair', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_cleaning_1', 'niche_au_cleaning', 'Residential cleaning', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_cleaning_2', 'niche_au_cleaning', 'Commercial cleaning', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_cleaning_3', 'niche_au_cleaning', 'End of lease cleaning', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_cleaning_4', 'niche_au_cleaning', 'Window cleaning', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_pest_1', 'niche_au_pest_control', 'General pest control', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_pest_2', 'niche_au_pest_control', 'Termite treatment', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_pest_3', 'niche_au_pest_control', 'Rodent control', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_pest_4', 'niche_au_pest_control', 'Inspection & prevention', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_property_1', 'niche_au_property_management', 'Rental management', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_property_2', 'niche_au_property_management', 'Property agency', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_property_3', 'niche_au_property_management', 'Real estate services', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_au_property_4', 'niche_au_property_management', 'Investment property', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

INSERT OR IGNORE INTO niche_services (id, niche_category_id, name, sort_order, created_at, updated_at) VALUES
  ('svc_usa_medspa_1', 'niche_usa_med_spa', 'Med spa', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_medspa_2', 'niche_usa_med_spa', 'Aesthetic clinic', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_medspa_3', 'niche_usa_med_spa', 'IV therapy', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_medspa_4', 'niche_usa_med_spa', 'Skin clinic', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_medspa_5', 'niche_usa_med_spa', 'Plastic surgery', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_dental_1', 'niche_usa_dental', 'General dentist', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_dental_2', 'niche_usa_dental', 'Cosmetic dentistry', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_dental_3', 'niche_usa_dental', 'Orthodontist', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_dental_4', 'niche_usa_dental', 'Implant dentist', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_dental_5', 'niche_usa_dental', 'Pediatric dentist', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_roofing_1', 'niche_usa_roofing', 'Roofing contractor', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_roofing_2', 'niche_usa_roofing', 'Roof repair', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_roofing_3', 'niche_usa_roofing', 'Gutter installation', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_roofing_4', 'niche_usa_roofing', 'Roof inspection', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_roofing_5', 'niche_usa_roofing', 'Storm damage repair', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_hvac_1', 'niche_usa_hvac', 'HVAC installation', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_hvac_2', 'niche_usa_hvac', 'AC repair', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_hvac_3', 'niche_usa_hvac', 'Heating systems', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_hvac_4', 'niche_usa_hvac', 'Duct cleaning', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_hvac_5', 'niche_usa_hvac', 'Indoor air quality', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_plumbing_1', 'niche_usa_plumbing', 'Residential plumbing', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_plumbing_2', 'niche_usa_plumbing', 'Emergency plumber', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_plumbing_3', 'niche_usa_plumbing', 'Water heater', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_plumbing_4', 'niche_usa_plumbing', 'Drain cleaning', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_plumbing_5', 'niche_usa_plumbing', 'Pipe repair', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_electrical_1', 'niche_usa_electrical', 'Electrical contractor', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_electrical_2', 'niche_usa_electrical', 'Panel upgrade', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_electrical_3', 'niche_usa_electrical', 'EV charger installation', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_electrical_4', 'niche_usa_electrical', 'Lighting installation', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_electrical_5', 'niche_usa_electrical', 'Residential & commercial', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_landscaping_1', 'niche_usa_landscaping', 'Lawn care', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_landscaping_2', 'niche_usa_landscaping', 'Landscape design', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_landscaping_3', 'niche_usa_landscaping', 'Irrigation systems', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_landscaping_4', 'niche_usa_landscaping', 'Tree services', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_landscaping_5', 'niche_usa_landscaping', 'Outdoor living', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

INSERT OR IGNORE INTO niche_services (id, niche_category_id, name, sort_order, created_at, updated_at) VALUES
  ('svc_usa_remodeling_1', 'niche_usa_home_remodeling', 'Kitchen remodeling', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_remodeling_2', 'niche_usa_home_remodeling', 'Bathroom remodeling', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_remodeling_3', 'niche_usa_home_remodeling', 'Home renovation', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_remodeling_4', 'niche_usa_home_remodeling', 'General contractor', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_remodeling_5', 'niche_usa_home_remodeling', 'Deck & patio', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_pest_1', 'niche_usa_pest_control', 'General pest control', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_pest_2', 'niche_usa_pest_control', 'Termite treatment', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_pest_3', 'niche_usa_pest_control', 'Rodent control', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_pest_4', 'niche_usa_pest_control', 'Bed bug removal', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_pest_5', 'niche_usa_pest_control', 'Commercial pest control', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_law_1', 'niche_usa_law_firm', 'Personal injury law', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_law_2', 'niche_usa_law_firm', 'Family law', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_law_3', 'niche_usa_law_firm', 'Business law', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_law_4', 'niche_usa_law_firm', 'Accounting firm', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('svc_usa_law_5', 'niche_usa_law_firm', 'Consulting firm', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

-- Niche price grid -----------------------------------------------------------
-- One record per (niche row x package): 9 Indonesian, 10 Australian and 12 US
-- niche rows, each with the three package columns the source guide provides.
-- The custom tiers are deliberately absent — the source supplies no per-niche
-- prices for them.

INSERT OR IGNORE INTO niche_price_rows (
  id, market_id, niche_category_id, niche_label, package_id, price_amount,
  source_order, created_at, updated_at
) VALUES
  ('npr_id_gigi_essential', 'market_id', 'niche_id_klinik_gigi', 'Klinik gigi', 'pkg_id_essential', 1500000, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_gigi_growth', 'market_id', 'niche_id_klinik_gigi', 'Klinik gigi', 'pkg_id_growth', 3500000, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_gigi_premium', 'market_id', 'niche_id_klinik_gigi', 'Klinik gigi', 'pkg_id_premium', 7500000, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_kecantikan_essential', 'market_id', 'niche_id_klinik_kecantikan', 'Klinik kecantikan', 'pkg_id_essential', 1500000, 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_kecantikan_growth', 'market_id', 'niche_id_klinik_kecantikan', 'Klinik kecantikan', 'pkg_id_growth', 3500000, 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_kecantikan_premium', 'market_id', 'niche_id_klinik_kecantikan', 'Klinik kecantikan', 'pkg_id_premium', 7500000, 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_villa_management_essential', 'market_id', 'niche_id_villa_property', 'Villa management', 'pkg_id_essential', 1500000, 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_villa_management_growth', 'market_id', 'niche_id_villa_property', 'Villa management', 'pkg_id_growth', 3500000, 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_villa_management_premium', 'market_id', 'niche_id_villa_property', 'Villa management', 'pkg_id_premium', 7500000, 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_property_management_essential', 'market_id', 'niche_id_villa_property', 'Property management', 'pkg_id_essential', 1500000, 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_property_management_growth', 'market_id', 'niche_id_villa_property', 'Property management', 'pkg_id_growth', 3500000, 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_property_management_premium', 'market_id', 'niche_id_villa_property', 'Property management', 'pkg_id_premium', 7500000, 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_kontraktor_essential', 'market_id', 'niche_id_kontraktor_renovasi', 'Kontraktor', 'pkg_id_essential', 1500000, 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_kontraktor_growth', 'market_id', 'niche_id_kontraktor_renovasi', 'Kontraktor', 'pkg_id_growth', 3500000, 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_kontraktor_premium', 'market_id', 'niche_id_kontraktor_renovasi', 'Kontraktor', 'pkg_id_premium', 7500000, 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_hotel_essential', 'market_id', 'niche_id_hotel_hospitality', 'Hotel & hospitality', 'pkg_id_essential', 1500000, 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_hotel_growth', 'market_id', 'niche_id_hotel_hospitality', 'Hotel & hospitality', 'pkg_id_growth', 3500000, 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_hotel_premium', 'market_id', 'niche_id_hotel_hospitality', 'Hotel & hospitality', 'pkg_id_premium', 7500000, 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_konsultan_essential', 'market_id', 'niche_id_konsultan_profesional', 'Konsultan profesional', 'pkg_id_essential', 1500000, 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_konsultan_growth', 'market_id', 'niche_id_konsultan_profesional', 'Konsultan profesional', 'pkg_id_growth', 3500000, 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_konsultan_premium', 'market_id', 'niche_id_konsultan_profesional', 'Konsultan profesional', 'pkg_id_premium', 7500000, 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_pendidikan_essential', 'market_id', 'niche_id_pendidikan', 'Pendidikan', 'pkg_id_essential', 1500000, 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_pendidikan_growth', 'market_id', 'niche_id_pendidikan', 'Pendidikan', 'pkg_id_growth', 3500000, 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_pendidikan_premium', 'market_id', 'niche_id_pendidikan', 'Pendidikan', 'pkg_id_premium', 7500000, 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_fnb_essential', 'market_id', 'niche_id_fnb', 'F&B (restoran, cafe)', 'pkg_id_essential', 1500000, 9, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_fnb_growth', 'market_id', 'niche_id_fnb', 'F&B (restoran, cafe)', 'pkg_id_growth', 3500000, 9, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_id_fnb_premium', 'market_id', 'niche_id_fnb', 'F&B (restoran, cafe)', 'pkg_id_premium', 7500000, 9, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

INSERT OR IGNORE INTO niche_price_rows (
  id, market_id, niche_category_id, niche_label, package_id, price_amount,
  source_order, created_at, updated_at
) VALUES
  ('npr_au_plumbing_essential', 'market_au', 'niche_au_plumbing', 'Plumbing', 'pkg_au_essential', 700, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_plumbing_professional', 'market_au', 'niche_au_plumbing', 'Plumbing', 'pkg_au_professional', 1200, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_plumbing_premium', 'market_au', 'niche_au_plumbing', 'Plumbing', 'pkg_au_premium', 2000, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_electrical_essential', 'market_au', 'niche_au_electrical', 'Electrical', 'pkg_au_essential', 700, 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_electrical_professional', 'market_au', 'niche_au_electrical', 'Electrical', 'pkg_au_professional', 1200, 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_electrical_premium', 'market_au', 'niche_au_electrical', 'Electrical', 'pkg_au_premium', 2000, 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_roofing_essential', 'market_au', 'niche_au_roofing', 'Roofing', 'pkg_au_essential', 700, 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_roofing_professional', 'market_au', 'niche_au_roofing', 'Roofing', 'pkg_au_professional', 1200, 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_roofing_premium', 'market_au', 'niche_au_roofing', 'Roofing', 'pkg_au_premium', 2000, 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_builders_essential', 'market_au', 'niche_au_builders', 'Builders & Renovation', 'pkg_au_essential', 700, 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_builders_professional', 'market_au', 'niche_au_builders', 'Builders & Renovation', 'pkg_au_professional', 1200, 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_builders_premium', 'market_au', 'niche_au_builders', 'Builders & Renovation', 'pkg_au_premium', 2000, 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_hvac_essential', 'market_au', 'niche_au_hvac', 'HVAC', 'pkg_au_essential', 700, 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_hvac_professional', 'market_au', 'niche_au_hvac', 'HVAC', 'pkg_au_professional', 1200, 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_hvac_premium', 'market_au', 'niche_au_hvac', 'HVAC', 'pkg_au_premium', 2000, 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_landscaping_essential', 'market_au', 'niche_au_landscaping', 'Landscaping', 'pkg_au_essential', 700, 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_landscaping_professional', 'market_au', 'niche_au_landscaping', 'Landscaping', 'pkg_au_professional', 1200, 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_landscaping_premium', 'market_au', 'niche_au_landscaping', 'Landscaping', 'pkg_au_premium', 2000, 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

INSERT OR IGNORE INTO niche_price_rows (
  id, market_id, niche_category_id, niche_label, package_id, price_amount,
  source_order, created_at, updated_at
) VALUES
  ('npr_au_pool_essential', 'market_au', 'niche_au_pool', 'Pool Services', 'pkg_au_essential', 700, 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_pool_professional', 'market_au', 'niche_au_pool', 'Pool Services', 'pkg_au_professional', 1200, 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_pool_premium', 'market_au', 'niche_au_pool', 'Pool Services', 'pkg_au_premium', 2000, 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_cleaning_essential', 'market_au', 'niche_au_cleaning', 'Cleaning Company', 'pkg_au_essential', 700, 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_cleaning_professional', 'market_au', 'niche_au_cleaning', 'Cleaning Company', 'pkg_au_professional', 1200, 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_cleaning_premium', 'market_au', 'niche_au_cleaning', 'Cleaning Company', 'pkg_au_premium', 2000, 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_pest_control_essential', 'market_au', 'niche_au_pest_control', 'Pest Control', 'pkg_au_essential', 700, 9, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_pest_control_professional', 'market_au', 'niche_au_pest_control', 'Pest Control', 'pkg_au_professional', 1200, 9, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_pest_control_premium', 'market_au', 'niche_au_pest_control', 'Pest Control', 'pkg_au_premium', 2000, 9, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_property_management_essential', 'market_au', 'niche_au_property_management', 'Property Management', 'pkg_au_essential', 700, 10, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_property_management_professional', 'market_au', 'niche_au_property_management', 'Property Management', 'pkg_au_professional', 1200, 10, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_au_property_management_premium', 'market_au', 'niche_au_property_management', 'Property Management', 'pkg_au_premium', 2000, 10, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

INSERT OR IGNORE INTO niche_price_rows (
  id, market_id, niche_category_id, niche_label, package_id, price_amount,
  source_order, created_at, updated_at
) VALUES
  ('npr_usa_med_spa_starter', 'market_usa', 'niche_usa_med_spa', 'Med Spa', 'pkg_usa_starter', 400, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_med_spa_growth', 'market_usa', 'niche_usa_med_spa', 'Med Spa', 'pkg_usa_growth', 750, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_med_spa_premium', 'market_usa', 'niche_usa_med_spa', 'Med Spa', 'pkg_usa_premium', 1500, 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_cosmetic_dentistry_starter', 'market_usa', 'niche_usa_dental', 'Cosmetic Dentistry', 'pkg_usa_starter', 400, 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_cosmetic_dentistry_growth', 'market_usa', 'niche_usa_dental', 'Cosmetic Dentistry', 'pkg_usa_growth', 750, 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_cosmetic_dentistry_premium', 'market_usa', 'niche_usa_dental', 'Cosmetic Dentistry', 'pkg_usa_premium', 1500, 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_general_dentistry_starter', 'market_usa', 'niche_usa_dental', 'General Dentistry', 'pkg_usa_starter', 400, 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_general_dentistry_growth', 'market_usa', 'niche_usa_dental', 'General Dentistry', 'pkg_usa_growth', 750, 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_general_dentistry_premium', 'market_usa', 'niche_usa_dental', 'General Dentistry', 'pkg_usa_premium', 1500, 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_hvac_starter', 'market_usa', 'niche_usa_hvac', 'HVAC', 'pkg_usa_starter', 400, 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_hvac_growth', 'market_usa', 'niche_usa_hvac', 'HVAC', 'pkg_usa_growth', 750, 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_hvac_premium', 'market_usa', 'niche_usa_hvac', 'HVAC', 'pkg_usa_premium', 1500, 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

INSERT OR IGNORE INTO niche_price_rows (
  id, market_id, niche_category_id, niche_label, package_id, price_amount,
  source_order, created_at, updated_at
) VALUES
  ('npr_usa_roofing_starter', 'market_usa', 'niche_usa_roofing', 'Roofing', 'pkg_usa_starter', 400, 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_roofing_growth', 'market_usa', 'niche_usa_roofing', 'Roofing', 'pkg_usa_growth', 750, 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_roofing_premium', 'market_usa', 'niche_usa_roofing', 'Roofing', 'pkg_usa_premium', 1500, 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_plumbing_starter', 'market_usa', 'niche_usa_plumbing', 'Plumbing', 'pkg_usa_starter', 400, 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_plumbing_growth', 'market_usa', 'niche_usa_plumbing', 'Plumbing', 'pkg_usa_growth', 750, 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_plumbing_premium', 'market_usa', 'niche_usa_plumbing', 'Plumbing', 'pkg_usa_premium', 1500, 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_electrical_starter', 'market_usa', 'niche_usa_electrical', 'Electrical', 'pkg_usa_starter', 400, 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_electrical_growth', 'market_usa', 'niche_usa_electrical', 'Electrical', 'pkg_usa_growth', 750, 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_electrical_premium', 'market_usa', 'niche_usa_electrical', 'Electrical', 'pkg_usa_premium', 1500, 7, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_landscaping_starter', 'market_usa', 'niche_usa_landscaping', 'Landscaping', 'pkg_usa_starter', 400, 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_landscaping_growth', 'market_usa', 'niche_usa_landscaping', 'Landscaping', 'pkg_usa_growth', 750, 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_landscaping_premium', 'market_usa', 'niche_usa_landscaping', 'Landscaping', 'pkg_usa_premium', 1500, 8, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

INSERT OR IGNORE INTO niche_price_rows (
  id, market_id, niche_category_id, niche_label, package_id, price_amount,
  source_order, created_at, updated_at
) VALUES
  ('npr_usa_home_remodeling_starter', 'market_usa', 'niche_usa_home_remodeling', 'Home Remodeling', 'pkg_usa_starter', 400, 9, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_home_remodeling_growth', 'market_usa', 'niche_usa_home_remodeling', 'Home Remodeling', 'pkg_usa_growth', 750, 9, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_home_remodeling_premium', 'market_usa', 'niche_usa_home_remodeling', 'Home Remodeling', 'pkg_usa_premium', 1500, 9, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_pest_control_starter', 'market_usa', 'niche_usa_pest_control', 'Pest Control', 'pkg_usa_starter', 400, 10, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_pest_control_growth', 'market_usa', 'niche_usa_pest_control', 'Pest Control', 'pkg_usa_growth', 750, 10, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_pest_control_premium', 'market_usa', 'niche_usa_pest_control', 'Pest Control', 'pkg_usa_premium', 1500, 10, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_law_firm_starter', 'market_usa', 'niche_usa_law_firm', 'Law Firm', 'pkg_usa_starter', 750, 11, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_law_firm_growth', 'market_usa', 'niche_usa_law_firm', 'Law Firm', 'pkg_usa_growth', 1500, 11, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_law_firm_premium', 'market_usa', 'niche_usa_law_firm', 'Law Firm', 'pkg_usa_premium', 3000, 11, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_accounting_consulting_starter', 'market_usa', 'niche_usa_law_firm', 'Accounting / Consulting', 'pkg_usa_starter', 750, 12, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_accounting_consulting_growth', 'market_usa', 'niche_usa_law_firm', 'Accounting / Consulting', 'pkg_usa_growth', 1500, 12, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('npr_usa_accounting_consulting_premium', 'market_usa', 'niche_usa_law_firm', 'Accounting / Consulting', 'pkg_usa_premium', 3000, 12, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

-- Call objectives (same four source objectives for every market) -------------

INSERT OR IGNORE INTO market_call_goals (
  id, market_id, goal_kind, goal_text, sort_order, created_at, updated_at
) VALUES
  ('goal_id_1', 'market_id', 'call_objective', 'Berbicara dengan owner atau decision maker.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('goal_id_2', 'market_id', 'call_objective', 'Memahami kebutuhan dan kondisi website saat ini.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('goal_id_3', 'market_id', 'call_objective', 'Menawarkan solusi yang relevan.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('goal_id_4', 'market_id', 'call_objective', 'Mengatur meeting / demo atau langsung closing.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('goal_au_1', 'market_au', 'call_objective', 'Berbicara dengan owner atau decision maker.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('goal_au_2', 'market_au', 'call_objective', 'Memahami kebutuhan dan kondisi website saat ini.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('goal_au_3', 'market_au', 'call_objective', 'Menawarkan solusi yang relevan.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('goal_au_4', 'market_au', 'call_objective', 'Mengatur meeting / demo atau langsung closing.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('goal_usa_1', 'market_usa', 'call_objective', 'Berbicara dengan owner atau decision maker.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('goal_usa_2', 'market_usa', 'call_objective', 'Memahami kebutuhan dan kondisi website saat ini.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('goal_usa_3', 'market_usa', 'call_objective', 'Menawarkan solusi yang relevan.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('goal_usa_4', 'market_usa', 'call_objective', 'Mengatur meeting / demo atau langsung closing.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('sgoal_id_1', 'market_id', 'session_goal', 'Menemukan bisnis lokal yang membutuhkan website profesional.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('sgoal_id_2', 'market_id', 'session_goal', 'Menawarkan paket sesuai kebutuhan dan budget.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('sgoal_id_3', 'market_id', 'session_goal', 'Mengatur meeting atau langsung closing.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

-- Information-discovery checklist -------------------------------------------

INSERT OR IGNORE INTO market_call_checklist_items (
  id, market_id, item_text, sort_order, created_at, updated_at
) VALUES
  ('chk_id_1', 'market_id', 'Perkenalan singkat.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_id_2', 'market_id', 'Apakah mereka sudah punya website?', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_id_3', 'market_id', 'Masalah yang mereka alami, jika ada.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_id_4', 'market_id', 'Menawarkan demo / contoh website.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_id_5', 'market_id', 'Menjelaskan paket sesuai kebutuhan.', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_id_6', 'market_id', 'Menanyakan ketertarikan dan next step.', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_au_1', 'market_au', 'Perkenalan singkat.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_au_2', 'market_au', 'Apakah mereka sudah punya website?', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_au_3', 'market_au', 'Masalah yang mereka alami, jika ada.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_au_4', 'market_au', 'Menawarkan demo / contoh website.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_au_5', 'market_au', 'Menjelaskan paket sesuai kebutuhan.', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_au_6', 'market_au', 'Menanyakan ketertarikan dan next step.', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_usa_1', 'market_usa', 'Perkenalan singkat.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_usa_2', 'market_usa', 'Apakah mereka sudah punya website?', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_usa_3', 'market_usa', 'Masalah yang mereka alami, jika ada.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_usa_4', 'market_usa', 'Menawarkan demo / contoh website.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_usa_5', 'market_usa', 'Menjelaskan paket sesuai kebutuhan.', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('chk_usa_6', 'market_usa', 'Menanyakan ketertarikan dan next step.', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

-- Common objections and the source-guide suggested responses -----------------

INSERT OR IGNORE INTO market_objections (
  id, market_id, objection_text, suggested_response, sort_order, created_at, updated_at
) VALUES
  ('obj_id_1', 'market_id', 'Kami sudah punya website.',
   'Ask whether the business wants to improve the design, speed, or ability to generate inquiries.',
   1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('obj_id_2', 'market_id', 'Lagi tidak ada budget.',
   'Offer the Essential package as a lower-cost starting option, with prices starting from Rp1.500.000.',
   2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('obj_id_3', 'market_id', 'Nanti saja.',
   'Ask for permission to follow up and send a demo link through WhatsApp or email.',
   3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('obj_au_1', 'market_au', 'Kami sudah punya website.',
   'Ask what could be improved, such as website design, speed, SEO, or lead generation.',
   1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('obj_au_2', 'market_au', 'Lagi tidak ada budget.',
   'Offer the Essential package as an entry-level option or begin with a demo before discussing scope.',
   2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('obj_au_3', 'market_au', 'Nanti saja.',
   'Ask for permission to follow up and send the demo through an agreed channel.',
   3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('obj_usa_1', 'market_usa', 'We already have a website.',
   'Ask whether they want to improve the design, speed, SEO, or lead generation.',
   1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('obj_usa_2', 'market_usa', 'We don''t have the budget.',
   'Offer Starter or Growth as appropriate and focus the conversation on relevant business outcomes, ROI, and lead generation. Do not guarantee a particular return.',
   2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('obj_usa_3', 'market_usa', 'Not now.',
   'Ask for permission to follow up and obtain the preferred contact method for sending the demo.',
   3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');

-- Recommended tools ----------------------------------------------------------

INSERT OR IGNORE INTO market_recommended_tools (
  id, market_id, tool_name, tool_description, sort_order, created_at, updated_at
) VALUES
  ('tool_id_1', 'market_id', 'Google Maps', 'cari bisnis lokal.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_id_2', 'market_id', 'Google Business Profile', 'cek informasi dan review.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_id_3', 'market_id', 'Spreadsheet / CRM', 'catat prospek.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_id_4', 'market_id', 'WhatsApp Business', 'follow-up.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_id_5', 'market_id', 'Demo website sesuai niche', '', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_id_6', 'market_id', 'Invoice & proposal template', '', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_au_1', 'market_au', 'Google Maps', 'cari bisnis lokal.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_au_2', 'market_au', 'Google Business Profile', 'cek informasi dan review.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_au_3', 'market_au', 'Spreadsheet / CRM', 'catat prospek.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_au_4', 'market_au', 'WhatsApp Business', 'follow-up.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_au_5', 'market_au', 'Demo website sesuai niche', '', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_au_6', 'market_au', 'Invoice & proposal template', '', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_usa_1', 'market_usa', 'Google Maps', 'find local businesses.', 1, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_usa_2', 'market_usa', 'Google Business Profile', 'inspect business information and reviews.', 2, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_usa_3', 'market_usa', 'Spreadsheet / CRM', 'track prospects.', 3, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_usa_4', 'market_usa', 'WhatsApp Business', 'follow-up.', 4, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_usa_5', 'market_usa', 'Demo website appropriate to the niche', '', 5, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z'),
  ('tool_usa_6', 'market_usa', 'Invoice and proposal template', '', 6, '2026-10-28T00:00:00.000Z', '2026-10-28T00:00:00.000Z');