import type { CallbookTemplate } from "./types";

/**
 * Consultative, demo-first cold-call book for plumbing businesses.
 * Replace every bracketed placeholder and verify each factual claim before use.
 */
export const digitalLeadsPlumbingColdCall: CallbookTemplate = {
  "id": "digital-leads-plumbing-outdated-website-cold-call",
  "name": "Digital Leads — Plumbing Website Audit & Custom Demo Cold Call",
  "description": "Branching cold-call book for plumbing businesses whose public website may have opportunities in local SEO, mobile experience, and customer flow. Ali from Digital Leads introduces a private, business-specific demo concept and aims to book a 10–15 minute walkthrough, qualify fit, send a clear proposal, and convert only when the prospect agrees. Includes owner/gatekeeper paths, demo transparency, follow-up permissions, objections, meeting discovery, proposal, close, and DNC handling.",
  "targetAudience": "Plumbing contractors and plumbing service companies in the US: drain and sewer, leak detection, water heater, and residential or commercial plumbing teams.",
  "primaryGoal": "book_meeting",
  "marketCode": "USA",
  "nicheName": "Plumbing",
  "guidance": "Caller identity: Ali from Digital Leads, an agency that helps local businesses improve website performance and customer experience. Core angle: a public website review identified specific, verifiable opportunities in local SEO and the customer journey; a private demo concept has already been prepared using publicly available business details. Be transparent that the demo is unsolicited, private, not live, not commissioned, and has not changed the prospect's current website. Primary cold-call conversion is a 10–15 minute walkthrough, not a forced sale on the first call. Use only verified observations: for SEO, cite checks actually performed (for example page titles, page structure, indexability, service-area coverage, or page speed); for customer flow, cite visible issues (for example a hard-to-find phone action, unclear service pages, or confusing estimate path). Never claim access to Google Analytics, Search Console, call records, customer data, or private performance metrics unless the prospect explicitly provides access. Do not claim they are losing jobs or that rankings/leads/revenue will increase. For plumbing-specific examples, mention only services, hours, emergency availability, licenses, guarantees, financing, and service areas that are verified. Ask permission before sending a demo by email, WhatsApp, or SMS; use only the channel they approve and ask whether one follow-up is okay. Respect no-follow-up and do-not-contact requests immediately. Don't invent prices, case studies, client names, certifications, integrations, timelines, or guarantees. Quote only a real, approved price after confirming scope. Diagnose objections with one calm question before responding. Never disparage an existing provider. After a booked meeting, discover the business's target services, service areas, lead quality, customer path, stakeholders, technical requirements, budget/timing, and success measures. Send a written proposal spelling out deliverables, exclusions, ownership, timeline, third-party costs, payment terms, and support. Ask for the business only after fit and scope are clear. Use natural US English for prospect-facing lines; internal guidance is in Indonesian. Replace all bracketed placeholders before calling.",
  "startKey": "opening",
  "nodes": [
    {
      "key": "opening",
      "type": "message",
      "title": "Opening — identify the owner or website decision-maker",
      "script": "“Hi, is this [Business Name]? Great. My name is Ali, calling from Digital Leads. Could I speak with the owner, or whoever looks after the website and marketing for the business?”\n\nIf they ask who is calling before transferring: “Ali from Digital Leads. I’m calling about a website review and a demo concept I put together for [Business Name].”",
      "internalNote": "Sampaikan dengan tenang dan natural. Jangan mulai dengan kritik website atau menyebut hasil audit sebelum tahu sedang bicara dengan siapa. Jangan berpura-pura pernah membuat janji atau punya hubungan sebelumnya.",
      "branches": [
        {
          "key": "owner",
          "label": "They are the owner / decision-maker",
          "examples": [
            "Yes, that's me.",
            "I look after the website."
          ],
          "target": "owner_intro"
        },
        {
          "key": "gatekeeper",
          "label": "Receptionist, dispatcher, office manager, or staff answers",
          "examples": [
            "I'm the office manager.",
            "The owner isn't available."
          ],
          "target": "gatekeeper"
        },
        {
          "key": "asks_reason",
          "label": "They ask what the call is about",
          "examples": [
            "What is this regarding?",
            "What's this about?"
          ],
          "target": "gatekeeper_reason"
        },
        {
          "key": "busy",
          "label": "They are busy or ask for another time",
          "examples": [
            "We're on a job right now.",
            "Can you call back?"
          ],
          "target": "callback"
        },
        {
          "key": "wrong",
          "label": "Wrong company or number",
          "examples": [
            "You have the wrong number.",
            "We aren't that plumbing company."
          ],
          "target": "wrong_contact"
        },
        {
          "key": "not_interested",
          "label": "They decline without requesting no further contact",
          "examples": [
            "No thanks.",
            "We're not interested."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "They explicitly ask not to be contacted again",
          "examples": [
            "Take us off your list.",
            "Don't call here again."
          ],
          "target": "do_not_contact"
        },
        {
          "key": "no_answer",
          "label": "No one answers / voicemail picks up",
          "examples": [
            "You reach voicemail.",
            "No one picks up."
          ],
          "target": "voicemail"
        }
      ]
    },
    {
      "key": "gatekeeper",
      "type": "message",
      "title": "Gatekeeper — respectfully reach the right person",
      "script": "“No problem. Who would be the best person to speak with about the company website— the owner, general manager, or someone in marketing? I can keep the reason brief.”",
      "internalNote": "Jangan mengakali gatekeeper, mengaku sebagai customer, atau meminta nomor pribadi secara memaksa. Tujuan node ini adalah menemukan jalur bisnis yang tepat.",
      "branches": [
        {
          "key": "transfer",
          "label": "They offer to transfer the call",
          "examples": [
            "I'll put you through.",
            "Let me see if the owner is free."
          ],
          "target": "transfer_result"
        },
        {
          "key": "name_time",
          "label": "They provide a name or suitable time",
          "examples": [
            "Speak with Jordan, our owner.",
            "Try after 2 p.m."
          ],
          "target": "gatekeeper_contact"
        },
        {
          "key": "asks_why",
          "label": "They want to know the reason first",
          "examples": [
            "What do you need to speak to them about?"
          ],
          "target": "gatekeeper_reason"
        },
        {
          "key": "send_info",
          "label": "They ask you to email or send details",
          "examples": [
            "Send something to our office email.",
            "Email the manager first."
          ],
          "target": "email_only"
        },
        {
          "key": "refuse",
          "label": "They won't transfer or share a contact",
          "examples": [
            "We don't put sales calls through."
          ],
          "target": "polite_close"
        },
        {
          "key": "not_interested",
          "label": "They decline",
          "examples": [
            "We're all set, thanks."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "They request no further contact",
          "examples": [
            "Don't call this number again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "gatekeeper_reason",
      "type": "message",
      "title": "Brief reason — make the call relevant without over-pitching",
      "script": "“Of course. I'm Ali from Digital Leads. We help local service businesses improve their websites. Our initial website review flagged a couple of possible opportunities on [Business Name]’s public site around [verified website / local SEO observation], and I put together a private demo concept for the business. I'm hoping to show it to the person who makes website decisions—not take up much of their time. Who would that be?”",
      "internalNote": "Sebutkan hanya observasi spesifik yang benar-benar sudah diperiksa. Bila belum bisa menjelaskan satu temuan konkret, katakan sedang melakukan review awal dan jangan mengklaim ada technical audit lengkap.",
      "branches": [
        {
          "key": "transfer",
          "label": "They transfer you",
          "examples": [
            "I'll connect you now."
          ],
          "target": "transfer_result"
        },
        {
          "key": "contact_time",
          "label": "They tell you who / when to call",
          "examples": [
            "The owner handles that; call tomorrow morning."
          ],
          "target": "gatekeeper_contact"
        },
        {
          "key": "email",
          "label": "They ask for an email first",
          "examples": [
            "Send it to office@..."
          ],
          "target": "email_only"
        },
        {
          "key": "demo",
          "label": "They ask to see the demo",
          "examples": [
            "Can you send the preview?"
          ],
          "target": "send_channel"
        },
        {
          "key": "price",
          "label": "They ask about price",
          "examples": [
            "What does something like this cost?"
          ],
          "target": "pricing_scope"
        },
        {
          "key": "decline",
          "label": "They decline",
          "examples": [
            "Not something we're looking at."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "They request no further contact",
          "examples": [
            "Please don't contact us again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "transfer_result",
      "type": "message",
      "title": "Transfer result — confirm the decision-maker is actually on the line",
      "script": "“Hi, [Owner Name]? Ali from Digital Leads here. Thanks for taking the call. I was hoping to ask you one quick question about the [Business Name] website.”",
      "internalNote": "Jangan langsung mengulang seluruh pitch. Pastikan sambungan sudah ke orang yang tepat, lalu minta izin singkat.",
      "branches": [
        {
          "key": "owner",
          "label": "Owner is on the line",
          "examples": [
            "Yes, speaking.",
            "This is the owner."
          ],
          "target": "owner_intro"
        },
        {
          "key": "staff",
          "label": "Another staff member answers",
          "examples": [
            "This is the service manager."
          ],
          "target": "gatekeeper"
        },
        {
          "key": "busy",
          "label": "They are busy",
          "examples": [
            "I'm heading out to a job."
          ],
          "target": "callback"
        },
        {
          "key": "reason",
          "label": "They ask what it is about",
          "examples": [
            "What is this regarding?"
          ],
          "target": "owner_intro"
        },
        {
          "key": "dnc",
          "label": "They ask not to be contacted",
          "examples": [
            "Don't call again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "gatekeeper_contact",
      "type": "message",
      "title": "Confirm a legitimate callback route",
      "script": "“Thanks, that's helpful. What's the best business number or main line to reach [Owner Name], and what time is usually least disruptive? I can also send the short demo link to an official business email if that's easier.”",
      "internalNote": "Gunakan kontak bisnis yang diberikan secara sah. Catat nama, jabatan, waktu, dan kanal yang diizinkan. Jangan meminta nomor pribadi kalau mereka tidak nyaman.",
      "branches": [
        {
          "key": "time",
          "label": "They give a specific callback time",
          "examples": [
            "Try Thursday at 10.",
            "Call after the morning jobs."
          ],
          "target": "callback_scheduled"
        },
        {
          "key": "email",
          "label": "They authorize an email",
          "examples": [
            "Send it to our office inbox."
          ],
          "target": "email_only"
        },
        {
          "key": "transfer",
          "label": "They can transfer now",
          "examples": [
            "I'll see if they're available."
          ],
          "target": "transfer_result"
        },
        {
          "key": "no_route",
          "label": "They cannot help further",
          "examples": [
            "That's all I can share."
          ],
          "target": "polite_close"
        },
        {
          "key": "dnc",
          "label": "They request no further contact",
          "examples": [
            "Please remove us from your list."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "owner_intro",
      "type": "message",
      "title": "Owner introduction — say who you are and ask for 20 seconds",
      "script": "“Hi [Owner Name], I'm Ali from Digital Leads. We help local businesses improve how their websites perform for customers and in local search. Our initial website audit reviewed the public-facing site for [Business Name] and flagged a couple of possible opportunities around [specific, verified SEO observation] and [specific, verified customer-flow / visual-design observation]. I also put together a private demo concept using the business details available publicly. Have I caught you with 20 seconds for me to explain why I called?”",
      "internalNote": "Ini inti positioning. Nada: curious, calm, helpful. Jangan bilang website mereka 'jelek' atau menjanjikan SEO buruk bila belum terukur. Ganti semua placeholder sebelum call. Beri ruang untuk prospect menjawab.",
      "branches": [
        {
          "key": "permission",
          "label": "They give you 20 seconds",
          "examples": [
            "Sure, go ahead.",
            "Okay, what's up?"
          ],
          "target": "owner_pitch"
        },
        {
          "key": "demo_now",
          "label": "They immediately ask to see the demo",
          "examples": [
            "Can I see what you made?",
            "Send me the link."
          ],
          "target": "demo_explanation"
        },
        {
          "key": "why_call",
          "label": "They ask why you're calling them specifically",
          "examples": [
            "Why did you pick our company?"
          ],
          "target": "why_them"
        },
        {
          "key": "price",
          "label": "They ask the price first",
          "examples": [
            "How much are you charging?"
          ],
          "target": "pricing_scope"
        },
        {
          "key": "already_site",
          "label": "They say they already have a website",
          "examples": [
            "We already have a website."
          ],
          "target": "existing_site"
        },
        {
          "key": "agency",
          "label": "They already have a web or marketing agency",
          "examples": [
            "Our agency handles that."
          ],
          "target": "current_agency"
        },
        {
          "key": "busy",
          "label": "They are busy",
          "examples": [
            "I'm in the middle of a job."
          ],
          "target": "callback"
        },
        {
          "key": "not_interested",
          "label": "They aren't interested",
          "examples": [
            "Not interested, thanks."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "They ask not to be contacted",
          "examples": [
            "Don't call me again."
          ],
          "target": "do_not_contact"
        },
        {
          "key": "number_source",
          "label": "They ask where you got their phone number",
          "examples": [
            "Where did you get this number?"
          ],
          "target": "contact_data_question"
        }
      ]
    },
    {
      "key": "why_them",
      "type": "message",
      "title": "Why this business — explain relevance without pretending to know private analytics",
      "script": "“I came across [Business Name] while reviewing plumbing businesses in [Service Area]. Your public website gave me enough information to sketch a concept around the services and areas you list. I don't have access to your private analytics or lead data, so I'm not claiming to know how many customers you're losing. I simply saw a few things worth reviewing and thought a tailored example would make the conversation more useful.”",
      "internalNote": "Jangan mengaku tahu performa lead, conversion, revenue, Google Analytics, atau Search Console jika tidak punya akses. Sebut area layanan hanya jika memang tercantum secara publik.",
      "branches": [
        {
          "key": "okay",
          "label": "They understand and are open",
          "examples": [
            "Fair enough. Go on."
          ],
          "target": "owner_pitch"
        },
        {
          "key": "privacy",
          "label": "They ask how you got their information",
          "examples": [
            "Where did you get our details?"
          ],
          "target": "demo_privacy"
        },
        {
          "key": "not_fit",
          "label": "They say they don't want unsolicited pitches",
          "examples": [
            "We don't entertain cold calls."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "They request no further contact",
          "examples": [
            "Remove this number."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "owner_pitch",
      "type": "message",
      "title": "20-second pitch — connect plumbing customer intent to website flow",
      "script": "“A lot of plumbing customers are looking for help from their phone, often when something needs attention quickly. The site should make it very clear what services you offer, which areas you cover, and how to call or request an estimate without hunting around. Our review flagged [verified issue: e.g. the phone action is hard to find on mobile / service pages are bundled together / key service-area information is missing]. On the search side, we also noticed [verified SEO opportunity]. I made a private demo to show one way those parts could be clearer. Would a 10-minute walkthrough be worth a look?”",
      "internalNote": "Gunakan contoh sesuai fakta dan layanan bisnis. Jangan asumsikan mereka menerima emergency calls, 24/7, water heater, drain cleaning, atau layanan tertentu kecuali terverifikasi. Pitch maksimal 20–30 detik, lalu ajukan meeting.",
      "branches": [
        {
          "key": "meeting_yes",
          "label": "They agree to a walkthrough",
          "examples": [
            "Sure, let's take a look.",
            "I can spare ten minutes."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "demo_first",
          "label": "They want to see the demo before scheduling",
          "examples": [
            "Send the preview and I'll look."
          ],
          "target": "send_channel"
        },
        {
          "key": "asks_detail",
          "label": "They ask what specifically is wrong",
          "examples": [
            "What did you find exactly?"
          ],
          "target": "audit_detail"
        },
        {
          "key": "seo",
          "label": "They challenge the SEO point",
          "examples": [
            "What makes you say our SEO isn't performing?"
          ],
          "target": "seo_skeptic"
        },
        {
          "key": "site_fine",
          "label": "They say the site works fine",
          "examples": [
            "We get calls from the site already."
          ],
          "target": "website_good"
        },
        {
          "key": "price",
          "label": "They want price before a meeting",
          "examples": [
            "What's the investment?"
          ],
          "target": "pricing_scope"
        },
        {
          "key": "busy",
          "label": "They cannot talk now",
          "examples": [
            "I'm on a job. Call later."
          ],
          "target": "callback"
        },
        {
          "key": "decline",
          "label": "They decline",
          "examples": [
            "No, we're good."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "unexpected",
          "label": "They say something that matches none of the above",
          "examples": [
            "That isn't what I asked.",
            "I don't follow what you're offering."
          ],
          "target": "unexpected"
        },
        {
          "key": "dnc",
          "label": "They ask not to be contacted",
          "examples": [
            "Stop calling this business."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "audit_detail",
      "type": "message",
      "title": "Specific audit observations — only state what you can demonstrate",
      "script": "“The two things I noted were: first, [specific public-facing website observation]. Second, [specific SEO observation that you actually checked—for example, missing or duplicated page titles, unclear service-area page structure, or a page that is difficult to navigate from mobile]. I may be missing context, so I'm not assuming these are causing lost jobs. I thought the demo would let you judge whether the alternative is clearer.”",
      "internalNote": "Sebelum menelepon, siapkan 1–2 bukti yang bisa diperlihatkan: URL halaman, screenshot, mobile viewport, PageSpeed result, title/meta, indexing check, atau navigasi. Jangan memakai skor Lighthouse sebagai bukti langsung conversion atau ranking.",
      "branches": [
        {
          "key": "show",
          "label": "They want to see examples",
          "examples": [
            "Can you show me that?"
          ],
          "target": "demo_explanation"
        },
        {
          "key": "challenge",
          "label": "They disagree with the findings",
          "examples": [
            "That's not an issue for us."
          ],
          "target": "website_good"
        },
        {
          "key": "technical",
          "label": "They ask for technical details",
          "examples": [
            "What exactly did you test?"
          ],
          "target": "technical_questions"
        },
        {
          "key": "seo",
          "label": "They focus on SEO",
          "examples": [
            "How would you improve the SEO?"
          ],
          "target": "seo_skeptic"
        },
        {
          "key": "meeting",
          "label": "They are open to discuss",
          "examples": [
            "Let's set up a call."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "decline",
          "label": "They don't want to continue",
          "examples": [
            "We aren't changing it."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "seo_skeptic",
      "type": "message",
      "title": "SEO skepticism — distinguish visible checks from private performance data",
      "script": "“That's a fair question. I can review public, observable items such as page structure, page titles, service-area content, mobile usability, and whether important service pages are easy to find. I can't see your Google Analytics, Search Console, call tracking, or actual lead numbers unless you choose to share them. So I wouldn't claim to know your rankings or lead performance from the outside. The demo focuses on clearer service pages and customer paths; a proper SEO plan would start with baseline data.”",
      "internalNote": "Jangan overstate SEO. Local SEO membutuhkan riset kata kunci, kompetisi lokal, Google Business Profile, citations/reviews, technical baseline, konten dan pengukuran. Hindari garansi ranking. Jadikan meeting untuk melihat prioritas dan data yang tersedia.",
      "branches": [
        {
          "key": "wants_plan",
          "label": "They want to know what you would improve",
          "examples": [
            "What would you actually change?"
          ],
          "target": "seo_plan"
        },
        {
          "key": "already_rank",
          "label": "They say they already rank well",
          "examples": [
            "We're already on page one."
          ],
          "target": "website_good"
        },
        {
          "key": "agency",
          "label": "Their SEO is handled by someone else",
          "examples": [
            "Our SEO company handles it."
          ],
          "target": "current_agency"
        },
        {
          "key": "proof",
          "label": "They ask for proof or results",
          "examples": [
            "Can you prove this works?"
          ],
          "target": "proof_and_guarantees"
        },
        {
          "key": "meeting",
          "label": "They agree to review the plan",
          "examples": [
            "Let's discuss it."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "decline",
          "label": "They don't want to discuss SEO",
          "examples": [
            "We're not interested."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "seo_plan",
      "type": "message",
      "title": "Explain a sensible local SEO plan without promising rankings",
      "script": "“For a plumbing company, I'd first map the actual services and service areas you want to be found for, then check whether the site has clear, useful pages for those services and locations. I'd review titles and headings, internal links, mobile experience, page speed, local business details, and the path from a search landing page to calling or requesting an estimate. Then we'd agree on what to measure. The exact work depends on the current site and competition; no one can responsibly guarantee a specific Google position.”",
      "internalNote": "Klaim hanya pekerjaan yang memang kamu jual dan sanggupi. Pisahkan website build/SEO foundations dari ongoing SEO campaign, content production, link building, GBP management, dan reporting.",
      "branches": [
        {
          "key": "site_build",
          "label": "They mainly want a better website",
          "examples": [
            "We need the site cleaned up first."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "seo_service",
          "label": "They want ongoing SEO",
          "examples": [
            "Can you manage SEO month to month?"
          ],
          "target": "custom_scope"
        },
        {
          "key": "pricing",
          "label": "They ask what it costs",
          "examples": [
            "What would all that cost?"
          ],
          "target": "pricing_scope"
        },
        {
          "key": "meeting",
          "label": "They want a proper review",
          "examples": [
            "Let's book time."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "not_now",
          "label": "They aren't ready",
          "examples": [
            "Maybe later."
          ],
          "target": "timing_objection"
        }
      ]
    },
    {
      "key": "existing_site",
      "type": "message",
      "title": "They already have a website — reframe around improving, not replacing",
      "script": "“Absolutely—and I'm not calling because having a website is the problem. The question is whether the current site is doing the job you want: helping the right local customer understand your services and reach you easily. The demo is just an alternative layout to compare against what you already have. Is there anything about the current site you'd improve, or are you genuinely happy with it?”",
      "internalNote": "Jangan membuat mereka merasa website lama tidak berguna. Cari pain point yang mereka akui sendiri. Kalau mereka puas dan tidak punya prioritas, terima.",
      "branches": [
        {
          "key": "pain",
          "label": "They mention something they'd improve",
          "examples": [
            "It's a bit hard to update.",
            "Mobile could be better."
          ],
          "target": "pain_discovery"
        },
        {
          "key": "happy",
          "label": "They're happy with the current site",
          "examples": [
            "It does everything we need."
          ],
          "target": "website_good"
        },
        {
          "key": "show",
          "label": "They want to compare your demo",
          "examples": [
            "I'll take a look."
          ],
          "target": "demo_explanation"
        },
        {
          "key": "agency",
          "label": "Someone already manages the site",
          "examples": [
            "Our web company looks after it."
          ],
          "target": "current_agency"
        },
        {
          "key": "price",
          "label": "They ask what a refresh costs",
          "examples": [
            "What's a rebuild usually run?"
          ],
          "target": "pricing_scope"
        },
        {
          "key": "decline",
          "label": "They don't want changes",
          "examples": [
            "No plans to change it."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "website_good",
      "type": "message",
      "title": "They say the current website works well — don't argue",
      "script": "“That's good to hear. If it's bringing in the right enquiries and customers can reach you easily, a redesign may not be a priority. Just so I understand, are you happy with how it works on mobile and how clearly it shows your services and service areas, too?”",
      "internalNote": "Validasi dulu, lalu satu pertanyaan diagnostik. Jangan membuat-buat masalah. Jika semua berjalan baik, tutup sopan dan jangan memaksa meeting.",
      "branches": [
        {
          "key": "mobile_issue",
          "label": "They identify a mobile or navigation issue",
          "examples": [
            "The mobile layout could be better."
          ],
          "target": "pain_discovery"
        },
        {
          "key": "seo_issue",
          "label": "They identify a search / visibility issue",
          "examples": [
            "We'd like more local visibility."
          ],
          "target": "seo_skeptic"
        },
        {
          "key": "no_issue",
          "label": "They confirm no issues or priorities",
          "examples": [
            "We're very happy with it."
          ],
          "target": "polite_close"
        },
        {
          "key": "curious",
          "label": "They are still curious about the demo",
          "examples": [
            "I could look at the demo."
          ],
          "target": "demo_explanation"
        },
        {
          "key": "not_interested",
          "label": "They want to end the call",
          "examples": [
            "No thanks."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "pain_discovery",
      "type": "message",
      "title": "Discover the real website problem before recommending anything",
      "script": "“Got it. When you say [their issue], what does that look like day to day? Is it that customers struggle to find the right service, have trouble calling from mobile, don't know whether you cover their area, or something else?”",
      "internalNote": "Dengarkan jawaban. Jangan mengarahkan terlalu keras ke satu problem. Catat kata-kata prospect dan ulangi inti masalahnya sebelum menunjukkan demo.",
      "branches": [
        {
          "key": "service_info",
          "label": "Customers can't find the right service information",
          "examples": [
            "People aren't sure what jobs we do."
          ],
          "target": "plumbing_value"
        },
        {
          "key": "contact",
          "label": "Customers struggle to call or request a quote",
          "examples": [
            "The contact form is clunky."
          ],
          "target": "plumbing_value"
        },
        {
          "key": "service_area",
          "label": "Service areas are unclear",
          "examples": [
            "People call from places we don't cover."
          ],
          "target": "plumbing_value"
        },
        {
          "key": "mobile",
          "label": "Mobile experience is the issue",
          "examples": [
            "It's awkward on a phone."
          ],
          "target": "plumbing_value"
        },
        {
          "key": "leads",
          "label": "They want more enquiries / better qualified calls",
          "examples": [
            "We'd like more of the right calls."
          ],
          "target": "seo_skeptic"
        },
        {
          "key": "other",
          "label": "They have another need",
          "examples": [
            "We need online estimates / something custom."
          ],
          "target": "custom_scope"
        },
        {
          "key": "not_priority",
          "label": "They don't have a current priority",
          "examples": [
            "Nothing urgent right now."
          ],
          "target": "timing_objection"
        }
      ]
    },
    {
      "key": "plumbing_value",
      "type": "message",
      "title": "Translate the problem into relevant plumbing website improvements",
      "script": "“That makes sense. For a plumbing business, the site can be structured so a visitor can quickly identify the service they need, check whether their address is in your service area, see the next step, and call or request an estimate. Depending on what you offer, that may mean clearer pages for [verified services], clearer location information, and a mobile-first contact path. That's the kind of thing I explored in the demo. Would it be useful to walk through it together for ten minutes?”",
      "internalNote": "Jangan asumsikan service list, 24/7 availability, financing, licenses, guarantees, same-day arrival, or emergency response. Pastikan semua konten yang tampil di demo disetujui sebelum website live.",
      "branches": [
        {
          "key": "meeting",
          "label": "They agree to a walkthrough",
          "examples": [
            "Yes, let's see it."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "demo",
          "label": "They want the link first",
          "examples": [
            "Send it over."
          ],
          "target": "send_channel"
        },
        {
          "key": "scope",
          "label": "They ask if specific functions can be built",
          "examples": [
            "Could it include estimate requests?"
          ],
          "target": "scope_questions"
        },
        {
          "key": "price",
          "label": "They ask for cost",
          "examples": [
            "What would that cost?"
          ],
          "target": "pricing_scope"
        },
        {
          "key": "think",
          "label": "They want time to think",
          "examples": [
            "Let me think about it."
          ],
          "target": "think_objection"
        }
      ]
    },
    {
      "key": "current_agency",
      "type": "message",
      "title": "They already have a web / SEO agency or developer",
      "script": "“That's completely fine. I'm not asking you to drop someone you're happy with. Would you say the current team is actively improving the site and local search, or is the website mostly being maintained? I can also send the demo as a second opinion if you'd find that useful.”",
      "internalNote": "Jangan merendahkan kompetitor atau mendorong mereka melanggar kontrak. Cari ruang yang wajar: review kedua, refresh saat kontrak berakhir, atau tidak ada fit.",
      "branches": [
        {
          "key": "happy_agency",
          "label": "They're happy with their agency",
          "examples": [
            "They're doing a great job."
          ],
          "target": "polite_close"
        },
        {
          "key": "maintenance",
          "label": "Agency only maintains the site",
          "examples": [
            "They mostly keep it online."
          ],
          "target": "pain_discovery"
        },
        {
          "key": "contract",
          "label": "They're under contract",
          "examples": [
            "We're locked in for another year."
          ],
          "target": "timing_objection"
        },
        {
          "key": "second_opinion",
          "label": "They'd consider a second opinion",
          "examples": [
            "You can send the concept."
          ],
          "target": "send_channel"
        },
        {
          "key": "agency_problem",
          "label": "They're unhappy with the current provider",
          "examples": [
            "We're not happy with the results."
          ],
          "target": "pain_discovery"
        },
        {
          "key": "decision",
          "label": "Agency / manager owns the decision",
          "examples": [
            "You'd need to speak with my marketing manager."
          ],
          "target": "decision_process"
        },
        {
          "key": "decline",
          "label": "They aren't interested",
          "examples": [
            "We're covered, thanks."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "decision_process",
      "type": "message",
      "title": "Other decision-makers — bring the right people into the next conversation",
      "script": "“Of course. Who else would ideally be part of a website decision—your business partner, operations manager, or marketing person? I'd rather arrange one short walkthrough with the right people than have you repeat everything. Would [option 1] or [option 2] work for a 10–15 minute call?”",
      "internalNote": "Jangan mendesak satu orang membuat keputusan di luar kewenangannya. Upayakan meeting bersama decision-maker, bukan hanya mengirim materi yang sulit diteruskan.",
      "branches": [
        {
          "key": "joint",
          "label": "They agree to include the other decision-maker",
          "examples": [
            "Let's get my partner on the call."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "send_summary",
          "label": "They want a written summary first",
          "examples": [
            "Email me the details to share."
          ],
          "target": "email_only"
        },
        {
          "key": "name",
          "label": "They refer you to the responsible person",
          "examples": [
            "Speak with our operations manager."
          ],
          "target": "gatekeeper_contact"
        },
        {
          "key": "later",
          "label": "They need to consult internally first",
          "examples": [
            "I'll talk to my partner."
          ],
          "target": "partner_objection"
        },
        {
          "key": "no",
          "label": "They decline",
          "examples": [
            "We'll pass."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "demo_explanation",
      "type": "message",
      "title": "Explain the custom demo — transparent, private, and not live",
      "script": "“It's a private preview, not a live replacement for your current website. I put together a concept using the public information I could verify about [Business Name]—for example, the services and service areas shown on your site. The idea is to show a cleaner mobile experience, clearer service pages, and a more obvious path to call or request an estimate. Some details are placeholders until you approve them. I can walk you through it on a quick screen share, or send the preview if you'd prefer.”",
      "internalNote": "Jelaskan status demo secara jujur: tidak live, tidak commissioned, belum mengubah website mereka. Jangan gunakan testimonial, review, badge lisensi, foto, atau klaim yang belum berizin/terverifikasi. Jangan mempublikasikan demo.",
      "branches": [
        {
          "key": "walk",
          "label": "They agree to a live walkthrough",
          "examples": [
            "Let's do a screen share."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "send",
          "label": "They want the link",
          "examples": [
            "Just send me the preview."
          ],
          "target": "send_channel"
        },
        {
          "key": "source",
          "label": "They ask where the information came from",
          "examples": [
            "Where did you get our details?"
          ],
          "target": "demo_privacy"
        },
        {
          "key": "changes",
          "label": "They ask if this replaces their current site",
          "examples": [
            "Would this go live straight away?"
          ],
          "target": "demo_privacy"
        },
        {
          "key": "features",
          "label": "They ask about features or scope",
          "examples": [
            "Does it include online booking?"
          ],
          "target": "scope_questions"
        },
        {
          "key": "price",
          "label": "They ask what it costs",
          "examples": [
            "What's the price?"
          ],
          "target": "pricing_scope"
        },
        {
          "key": "trust",
          "label": "They question whether you're legitimate",
          "examples": [
            "How do I know you're real?"
          ],
          "target": "trust"
        },
        {
          "key": "decline",
          "label": "They don't want to see it",
          "examples": [
            "No need, thanks."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "demo_privacy",
      "type": "message",
      "title": "Demo privacy and source of information",
      "script": "“I used information that was publicly visible on your business website and other public business listings, only to create a private concept. I haven't accessed your private systems, customer records, analytics, or account logins. The preview isn't live and hasn't changed your current site. If you'd rather I didn't keep or send the concept, tell me and I'll remove it.”",
      "internalNote": "Jangan klaim sumber tertentu bila tidak benar. Hanya gunakan aset yang boleh digunakan untuk preview; jangan mengunduh atau menggunakan foto customer, review, atau logo pihak ketiga tanpa izin. Hapus demo jika diminta.",
      "branches": [
        {
          "key": "okay",
          "label": "They are comfortable and want to view it",
          "examples": [
            "Okay, send the link."
          ],
          "target": "send_channel"
        },
        {
          "key": "portfolio",
          "label": "They ask for examples of past work",
          "examples": [
            "Can I see your portfolio?"
          ],
          "target": "trust"
        },
        {
          "key": "remove",
          "label": "They ask you to remove the demo",
          "examples": [
            "Please take it down."
          ],
          "target": "demo_removed"
        },
        {
          "key": "dnc",
          "label": "They request no more contact",
          "examples": [
            "Don't contact us again."
          ],
          "target": "do_not_contact"
        },
        {
          "key": "end",
          "label": "They are satisfied with the explanation but not interested",
          "examples": [
            "Thanks for explaining."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "trust",
      "type": "message",
      "title": "Trust — prove identity without inventing credentials or results",
      "script": "“That's reasonable. I'm Ali from Digital Leads. I can send you our website, business email, and examples of work we're actually allowed to share. You can verify those independently before deciding anything. I won't ask for passwords or access on this call, and there's no obligation to proceed just because I made a demo. Would you prefer the company website and portfolio by email?”",
      "internalNote": "Isi `[agency website]`, `[business email]`, `[real portfolio URL]` sebelum call. Jangan mengarang client logos, testimonials, years in business, certifications, guarantees, or case-study outcomes.",
      "branches": [
        {
          "key": "send_proof",
          "label": "They want your business details or portfolio",
          "examples": [
            "Email me your website and work."
          ],
          "target": "email_only"
        },
        {
          "key": "meeting",
          "label": "They are comfortable booking a call",
          "examples": [
            "Let's talk it through."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "verify",
          "label": "They want to verify first and call you back",
          "examples": [
            "I'll check you out and reach out."
          ],
          "target": "polite_close"
        },
        {
          "key": "concern",
          "label": "They still feel uncomfortable",
          "examples": [
            "I'm not comfortable with this."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "send_channel",
      "type": "message",
      "title": "Get permission and choose the right delivery channel",
      "script": "“Absolutely. What's the best business email for the preview, or would you prefer the business WhatsApp number? I'll send just the demo link and a short note. Is it okay if I follow up once after you've had a chance to look?”",
      "internalNote": "Kirim hanya ke kanal yang secara eksplisit mereka setujui. Konfirmasi ejaan email/nomor. Jangan kirim unsolicited WhatsApp/SMS atau berulang kali follow-up. Tanyakan izin follow-up satu kali.",
      "branches": [
        {
          "key": "email_yes",
          "label": "They provide an email and allow one follow-up",
          "examples": [
            "Email it to me, and call Friday."
          ],
          "target": "demo_sent_followup"
        },
        {
          "key": "email_no_followup",
          "label": "They want the email but no follow-up",
          "examples": [
            "Send it, but don't call me."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "whatsapp_yes",
          "label": "They authorize business WhatsApp and one follow-up",
          "examples": [
            "You can WhatsApp the business number."
          ],
          "target": "demo_sent_followup"
        },
        {
          "key": "link_now",
          "label": "They want to see it right now",
          "examples": [
            "Text me the link while we're on the phone."
          ],
          "target": "demo_sent_followup"
        },
        {
          "key": "decline",
          "label": "They don't want a link",
          "examples": [
            "No, that's okay."
          ],
          "target": "polite_close"
        },
        {
          "key": "dnc",
          "label": "They request no more contact",
          "examples": [
            "Don't send anything or call again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "email_only",
      "type": "message",
      "title": "Email first — ask what to send and agree on whether to follow up",
      "script": "“Sure. I'll keep it brief: a one-paragraph introduction, the private demo link, and the two observations I mentioned. Which business email should I use? And would you like me to follow up after you've reviewed it, or would you prefer no follow-up?”",
      "internalNote": "Email subject idea: `Website concept for [Business Name]`. Jangan kirim attachment besar atau link tanpa konteks. Catat apakah follow-up diizinkan atau tidak.",
      "branches": [
        {
          "key": "followup",
          "label": "They give an email and allow follow-up",
          "examples": [
            "Send it and check back next week."
          ],
          "target": "demo_sent_followup"
        },
        {
          "key": "no_followup",
          "label": "They give an email but say not to follow up",
          "examples": [
            "Send it only; I'll reach out if interested."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "portfolio",
          "label": "They only want the agency portfolio",
          "examples": [
            "Send examples of your work."
          ],
          "target": "trust"
        },
        {
          "key": "no_email",
          "label": "They won't provide an email",
          "examples": [
            "I'd rather not share it."
          ],
          "target": "polite_close"
        },
        {
          "key": "dnc",
          "label": "They request no further contact",
          "examples": [
            "Don't contact us again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "demo_sent_followup",
      "type": "message",
      "title": "Demo sent — establish a specific, permission-based follow-up",
      "script": "“Perfect. I'll send it to [confirmed channel] while we're here. Just so I don't keep chasing you, would [day/time option 1] or [day/time option 2] be better for a quick 10-minute walkthrough after you've had a look?”",
      "internalNote": "Kirim saat call bila memungkinkan. Catat link/kanal, izin follow-up, waktu yang disepakati, dan siapa decision-maker. Jangan menganggap pesan delivered/read kecuali bisa diverifikasi.",
      "branches": [
        {
          "key": "time",
          "label": "They choose a follow-up time",
          "examples": [
            "Friday at 11 works."
          ],
          "target": "callback_scheduled"
        },
        {
          "key": "self_review",
          "label": "They'll review and reach out themselves",
          "examples": [
            "I'll check it and get back to you."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "meeting",
          "label": "They want to schedule a walkthrough now",
          "examples": [
            "Let's book a demo call."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "price",
          "label": "They ask pricing before the review",
          "examples": [
            "Can you include pricing?"
          ],
          "target": "pricing_scope"
        },
        {
          "key": "dnc",
          "label": "They withdraw permission / ask to stop",
          "examples": [
            "Don't follow up after all."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "demo_sent_no_followup",
      "type": "outcome",
      "title": "Demo sent — respect no-follow-up preference",
      "script": "“Absolutely. I'll send the link only and won't follow up. If it becomes relevant, my details will be in the email. Thanks for your time.”",
      "internalNote": "Tandai no-follow-up. Ini berbeda dengan DNC untuk semua kanal, tetapi hormati persis preferensi yang mereka sampaikan.",
      "outcomeKey": "interested_no_meeting"
    },
    {
      "key": "callback",
      "type": "message",
      "title": "Busy — ask for a concrete callback window",
      "script": "“No problem—I know you may be between jobs. Would later today around [time], or tomorrow around [time], be less disruptive?”",
      "internalNote": "Ajukan dua opsi waktu yang realistis menurut jam kerja prospect. Hindari menelepon saat mereka sedang mengemudi/menangani pekerjaan. Kalau mereka tidak ingin callback, tutup.",
      "branches": [
        {
          "key": "specific",
          "label": "They choose a time",
          "examples": [
            "Tomorrow at 9:30.",
            "Call after 3."
          ],
          "target": "callback_scheduled"
        },
        {
          "key": "later_unsure",
          "label": "They say to call later but don't specify",
          "examples": [
            "Try me another time."
          ],
          "target": "callback_scheduled"
        },
        {
          "key": "email",
          "label": "They ask for email instead",
          "examples": [
            "Email me and I'll look."
          ],
          "target": "email_only"
        },
        {
          "key": "not_available",
          "label": "They don't want another call",
          "examples": [
            "Don't call back."
          ],
          "target": "polite_close"
        },
        {
          "key": "dnc",
          "label": "They ask not to be contacted again",
          "examples": [
            "Do not call this number."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "callback_scheduled",
      "type": "message",
      "title": "Callback scheduled — confirm exact details",
      "script": "“Great, I'll call [day] at [time] on this number. I'll keep it to the demo and the website points we discussed. Is there anything you'd like me to have ready, or anyone else who should join?”",
      "internalNote": "Baca ulang hari, tanggal, zona waktu, jam, nomor, dan kanal. Jangan menyebut appointment confirmed bila waktu masih tidak jelas. Simpan hanya data bisnis yang diperlukan.",
      "branches": [
        {
          "key": "confirmed",
          "label": "They confirm the callback",
          "examples": [
            "Yes, that's right."
          ],
          "target": "polite_close"
        },
        {
          "key": "other_person",
          "label": "They want another decision-maker included",
          "examples": [
            "Invite our operations manager."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "send_before",
          "label": "They ask you to send the link before callback",
          "examples": [
            "Send it before you call."
          ],
          "target": "demo_sent_followup"
        },
        {
          "key": "reschedule",
          "label": "They change the time",
          "examples": [
            "Make it Thursday instead."
          ],
          "target": "callback"
        },
        {
          "key": "cancel",
          "label": "They cancel / don't want a callback",
          "examples": [
            "Actually, don't call."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "meeting_schedule",
      "type": "message",
      "title": "Book the 10–15 minute demo walkthrough",
      "script": "“Great. The easiest next step is a 10–15 minute screen share. I'll show you the current-site observations, the demo concept, and how the service pages and contact path could work. No pressure to decide on the call. Would [day] at [time option 1] or [day] at [time option 2] suit you better?”",
      "internalNote": "Minta meeting singkat, bukan presentasi panjang. Sebut tujuan spesifik dan agenda. Gunakan dua slot yang benar-benar tersedia. Jika belum punya calendar, jangan menjanjikan slot sebelum mengecek.",
      "branches": [
        {
          "key": "slot1",
          "label": "They choose the first time",
          "examples": [
            "Tuesday at 10 works."
          ],
          "target": "meeting_confirm"
        },
        {
          "key": "slot2",
          "label": "They choose the second time",
          "examples": [
            "Thursday afternoon is better."
          ],
          "target": "meeting_confirm"
        },
        {
          "key": "other_time",
          "label": "They suggest another time",
          "examples": [
            "Could you do Friday morning?"
          ],
          "target": "meeting_confirm"
        },
        {
          "key": "send_link",
          "label": "They want the demo link before committing",
          "examples": [
            "Send the link first."
          ],
          "target": "send_channel"
        },
        {
          "key": "price",
          "label": "They want price before scheduling",
          "examples": [
            "I need to know the cost first."
          ],
          "target": "pricing_scope"
        },
        {
          "key": "partner",
          "label": "They want another decision-maker involved",
          "examples": [
            "My partner should join."
          ],
          "target": "decision_process"
        },
        {
          "key": "not_now",
          "label": "They aren't ready",
          "examples": [
            "Maybe later in the year."
          ],
          "target": "timing_objection"
        },
        {
          "key": "decline",
          "label": "They decline the meeting",
          "examples": [
            "No, thanks."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "meeting_confirm",
      "type": "message",
      "title": "Confirm the meeting — avoid ambiguity and reduce no-shows",
      "script": "“Perfect—we're set for [weekday, date] at [time and time zone] for 10–15 minutes. I'll send a calendar invite / confirmation to [approved email] with the demo link. We'll cover: (1) the current website observations, (2) the tailored demo, and (3) whether there's a sensible next step. Does that match your understanding?”",
      "internalNote": "Jangan membuat calendar invite ke email yang belum disetujui. Catat channel dan email yang benar. Jangan menjanjikan calendar integration bila tidak tersedia. Konfirmasi timezone sesuai lokasi customer.",
      "branches": [
        {
          "key": "confirmed",
          "label": "They confirm",
          "examples": [
            "Yes, that works."
          ],
          "target": "meeting_booked"
        },
        {
          "key": "needs_email",
          "label": "They give a different email",
          "examples": [
            "Use this email instead."
          ],
          "target": "meeting_booked"
        },
        {
          "key": "reschedule",
          "label": "They need to change time",
          "examples": [
            "Can we move it to Friday?"
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "cancel",
          "label": "They cancel",
          "examples": [
            "Actually, let's leave it."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "meeting_booked",
      "type": "message",
      "title": "Meeting booked — close the cold call cleanly",
      "script": "“Excellent. Thanks, [Name]. I'll send the confirmation to [approved channel]. I'll be ready to walk through the concept and answer your questions. Have a good one.”",
      "internalNote": "Hentikan pitch setelah booking. Update CRM: status meeting booked, date/time, attendees, primary pain point, demo link, permission and next action. Node ini juga membuka alur terpisah untuk saat walkthrough benar-benar dimulai.",
      "branches": [
        {
          "key": "meeting_starts",
          "label": "The scheduled walkthrough begins",
          "examples": [
            "We're on the call for the demo."
          ],
          "target": "meeting_discovery"
        },
        {
          "key": "no_show",
          "label": "They miss the scheduled meeting",
          "examples": [
            "They don't join the call."
          ],
          "target": "meeting_no_show"
        }
      ]
    },
    {
      "key": "pricing_scope",
      "type": "message",
      "title": "Price question — qualify scope before quoting",
      "script": "“It depends on whether you're looking for a website refresh, a more complete rebuild, or ongoing local SEO. I don't want to throw out a number that doesn't match what you need. The next step would be a short walkthrough so I can confirm the pages, features, content, and who will maintain it. Then I'll give you a clear written scope and price. Are you mainly looking at the website itself, local SEO, or both?”",
      "internalNote": "Jangan mengarang harga. Isi `[starting price]` hanya bila agency memang punya harga awal yang aktual dan jelas batasannya. Pisahkan one-time build, hosting/domain, maintenance, third-party fees, dan recurring SEO. Jangan menjanjikan semua fitur masuk harga dasar.",
      "branches": [
        {
          "key": "website",
          "label": "They want a website refresh only",
          "examples": [
            "Mostly the website design and structure."
          ],
          "target": "scope_questions"
        },
        {
          "key": "seo",
          "label": "They want SEO help",
          "examples": [
            "We need more local visibility."
          ],
          "target": "seo_plan"
        },
        {
          "key": "both",
          "label": "They want website and SEO",
          "examples": [
            "Both, ideally."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "exact",
          "label": "They insist on an exact number immediately",
          "examples": [
            "Just tell me what it costs."
          ],
          "target": "price_boundary"
        },
        {
          "key": "budget",
          "label": "They share a budget",
          "examples": [
            "We have around [budget]."
          ],
          "target": "scope_questions"
        },
        {
          "key": "too_high",
          "label": "They say it sounds expensive",
          "examples": [
            "That may be out of our budget."
          ],
          "target": "price_objection"
        },
        {
          "key": "no_budget",
          "label": "There is no budget",
          "examples": [
            "We haven't budgeted for this."
          ],
          "target": "budget_objection"
        },
        {
          "key": "decline",
          "label": "They are not interested after price context",
          "examples": [
            "We'll pass."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "price_boundary",
      "type": "message",
      "title": "They demand a number before a meeting",
      "script": "“I understand—you need to know whether it's even in range. I can only give an accurate figure once I know the number of pages, content requirements, integrations, and whether SEO is a separate ongoing service. If we have a genuine starting price, I can share that with the exact inclusions: [verified starting price and inclusions]. Otherwise I'd rather not misquote you. Would a quick scope check be useful?”",
      "internalNote": "Jika belum ada paket harga yang benar-benar berlaku, jangan menciptakan angka untuk melewati objection. Siapkan rate card internal sebelum call. Tegaskan pajak, domain, hosting, copywriting, maintenance, integrations dan SEO retainers bila relevan.",
      "branches": [
        {
          "key": "yes",
          "label": "They accept a scope check",
          "examples": [
            "Okay, let's review it."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "price_email",
          "label": "They want the price sheet by email",
          "examples": [
            "Send me your packages."
          ],
          "target": "email_only"
        },
        {
          "key": "not_now",
          "label": "They won't proceed without a fixed price",
          "examples": [
            "I can't go ahead without a number."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "budget",
          "label": "They state a budget ceiling",
          "examples": [
            "We can spend up to [amount]."
          ],
          "target": "scope_questions"
        }
      ]
    },
    {
      "key": "scope_questions",
      "type": "message",
      "title": "Clarify what the service actually includes",
      "script": "“To make sure we're talking about the same thing, can I check a few basics? How many main services do you want separate pages for? Which towns or ZIP codes do you cover? Do you want customers to call, submit an estimate request, or both? And who would provide or approve the photos and service descriptions?”",
      "internalNote": "Jangan mengasumsikan CRM, scheduling, online payment, live chat, call tracking, copywriting, SEO content, hosting, ongoing edits, or migration included. Catat requirements dan bawa ke proposal tertulis.",
      "branches": [
        {
          "key": "basic",
          "label": "They need a straightforward informational site",
          "examples": [
            "A few service pages and a contact page."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "estimate",
          "label": "They want quote / estimate request forms",
          "examples": [
            "We'd like customers to request estimates online."
          ],
          "target": "technical_questions"
        },
        {
          "key": "booking",
          "label": "They need booking or dispatch integration",
          "examples": [
            "Can customers book a time slot?"
          ],
          "target": "custom_scope"
        },
        {
          "key": "payments",
          "label": "They ask about online payments",
          "examples": [
            "Can we take deposits online?"
          ],
          "target": "custom_scope"
        },
        {
          "key": "content",
          "label": "They need copy, photos, or service-area content",
          "examples": [
            "We need help writing all of it."
          ],
          "target": "custom_scope"
        },
        {
          "key": "maintenance",
          "label": "They ask about edits, support, and maintenance",
          "examples": [
            "Who updates the site after launch?"
          ],
          "target": "technical_questions"
        },
        {
          "key": "quote",
          "label": "They want a written quote",
          "examples": [
            "Can you send a proposal?"
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "not_sure",
          "label": "They are unsure what is needed",
          "examples": [
            "I'm not sure yet."
          ],
          "target": "meeting_schedule"
        }
      ]
    },
    {
      "key": "technical_questions",
      "type": "message",
      "title": "Technical questions — answer honestly and define boundaries",
      "script": "“That depends on the tools you already use and the setup we agree on. I can confirm the exact approach after checking your current site and requirements. I don't want to promise an integration before verifying compatibility. For the walkthrough, we can list the must-haves—such as estimate forms, CRM notifications, scheduling, call tracking, hosting, backups, and who owns the domain—and I'll mark what's included, optional, or outside scope.”",
      "internalNote": "Jangan claim platform, integrations, uptime, security certification, backups, speed scores, ownership, migration or support SLA sebelum diverifikasi. Jangan meminta login/password lewat cold call.",
      "branches": [
        {
          "key": "simple",
          "label": "They only need basic website features",
          "examples": [
            "A contact form and click-to-call are enough."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "complex",
          "label": "They need complex integrations",
          "examples": [
            "We need ServiceTitan / Housecall Pro / Jobber integration."
          ],
          "target": "custom_scope"
        },
        {
          "key": "seo",
          "label": "They ask about SEO implementation",
          "examples": [
            "Will you set up local SEO too?"
          ],
          "target": "seo_plan"
        },
        {
          "key": "hosting",
          "label": "They ask about domain / hosting / ownership",
          "examples": [
            "Who owns the site and hosting?"
          ],
          "target": "custom_scope"
        },
        {
          "key": "security",
          "label": "They ask about security or guarantees",
          "examples": [
            "How do you handle backups and security?"
          ],
          "target": "custom_scope"
        },
        {
          "key": "meeting",
          "label": "They accept review in a meeting",
          "examples": [
            "Let's go through it on the call."
          ],
          "target": "meeting_schedule"
        }
      ]
    },
    {
      "key": "custom_scope",
      "type": "message",
      "title": "Custom or advanced requirements — don't promise before scoping",
      "script": "“That may be possible, but I would want to verify the platform, API or vendor requirements before saying yes. Let's capture exactly what you need: [repeat their requested integration / workflow]. I'll check the technical fit and come back with what's feasible, the cost, any third-party fees, and what would be out of scope. Would you be open to a short technical discovery with whoever manages that system?”",
      "internalNote": "Jangan mengiyakan integrasi hanya untuk booking meeting. Cantumkan third-party costs, API limitations, data/privacy requirements, support owner, and acceptance criteria in written scope.",
      "branches": [
        {
          "key": "technical_meeting",
          "label": "They want a technical discovery",
          "examples": [
            "Our office manager / IT person can join."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "standard",
          "label": "They can start with a simpler website",
          "examples": [
            "We can do the basic version first."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "quote",
          "label": "They want a custom quote",
          "examples": [
            "Send us a proposal."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "not_possible",
          "label": "They need a feature you cannot provide",
          "examples": [
            "We need a full dispatch platform."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "proof_and_guarantees",
      "type": "message",
      "title": "They ask for proof, rankings, calls, or guaranteed results",
      "script": "“I wouldn't promise a particular Google ranking, number of calls, or revenue increase. Those depend on competition, service area, reviews, budget, operations, and other factors outside the website alone. What I can show you is the actual design, the specific website changes, and the measurement plan we'd agree on. I can also share real examples or case studies if I have permission to share them.”",
      "internalNote": "Hanya gunakan case study dengan izin dan metrik yang benar. Jangan membuat social proof. Pisahkan deliverables yang dapat dikontrol dari outcomes yang tidak dapat dijamin.",
      "branches": [
        {
          "key": "case_study",
          "label": "They want evidence or portfolio",
          "examples": [
            "Send me examples of previous work."
          ],
          "target": "trust"
        },
        {
          "key": "measurement",
          "label": "They want to know how success is measured",
          "examples": [
            "What would you track?"
          ],
          "target": "measurement_plan"
        },
        {
          "key": "guarantee_required",
          "label": "They require guaranteed rankings or leads",
          "examples": [
            "We only work with guaranteed results."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "meeting",
          "label": "They accept a walkthrough and measurement discussion",
          "examples": [
            "Let's discuss it."
          ],
          "target": "meeting_schedule"
        }
      ]
    },
    {
      "key": "measurement_plan",
      "type": "message",
      "title": "Explain a measurable but realistic success plan",
      "script": "“Before launch we'd agree on what matters to your business—perhaps qualified estimate requests, calls from the website, visits to key service pages, or form completion. Where possible, we'd set up appropriate analytics and call / form tracking with your approval, establish a baseline, and review trends. That helps us learn whether the changes are helping, without promising a number before we have data.”",
      "internalNote": "Pastikan tracking benar-benar masuk scope dan sesuai privacy/consent laws. Jangan mengatakan call tracking siap bila belum diimplementasikan. Baseline perlu data owner dan consent akses.",
      "branches": [
        {
          "key": "agree",
          "label": "They want to define KPIs",
          "examples": [
            "That makes sense."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "need_current_data",
          "label": "They can share current data in a meeting",
          "examples": [
            "I can bring our website numbers."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "not_needed",
          "label": "They don't care about tracking",
          "examples": [
            "We just need a better site."
          ],
          "target": "meeting_schedule"
        }
      ]
    },
    {
      "key": "price_objection",
      "type": "message",
      "title": "Price objection — diagnose before responding",
      "script": "“I hear you. When you say it's too expensive, is it mainly that the total is above the budget you had in mind, or that you're not yet sure the website improvements would be worth the investment?”",
      "internalNote": "Jangan langsung diskon. Cari apakah issue budget, value, scope, trust, or timing. Ulangi jawaban prospect sebelum menawarkan alternatif.",
      "branches": [
        {
          "key": "budget",
          "label": "It's above their budget",
          "examples": [
            "It's more than we can spend."
          ],
          "target": "budget_objection"
        },
        {
          "key": "value",
          "label": "They don't see enough value",
          "examples": [
            "I'm not convinced it will pay off."
          ],
          "target": "value_objection"
        },
        {
          "key": "scope",
          "label": "They don't understand what's included",
          "examples": [
            "What exactly do we get?"
          ],
          "target": "scope_questions"
        },
        {
          "key": "compare",
          "label": "A competitor quoted less",
          "examples": [
            "Someone else is cheaper."
          ],
          "target": "competitor_objection"
        },
        {
          "key": "discount",
          "label": "They ask for a discount",
          "examples": [
            "Can you do it for less?"
          ],
          "target": "discount_request"
        },
        {
          "key": "decline",
          "label": "They simply don't want to spend",
          "examples": [
            "It's not worth it to us."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "budget_objection",
      "type": "message",
      "title": "No budget / budget limit — explore timing and scope honestly",
      "script": "“Understood. Is that because there's no budget allocated for the website this quarter, or because the amount is higher than you can justify right now? I don't want to push you into spending that isn't sensible.”",
      "internalNote": "Jangan menyarankan utang atau pressure. Bila ada scope kecil yang feasible, tawarkan hanya jika agency benar-benar dapat mengerjakannya; selain itu jadwalkan ulang atau tutup.",
      "branches": [
        {
          "key": "future",
          "label": "Budget may be available later",
          "examples": [
            "We review budgets next quarter."
          ],
          "target": "timing_objection"
        },
        {
          "key": "smaller",
          "label": "They want a smaller first phase",
          "examples": [
            "Could we start with just a few pages?"
          ],
          "target": "custom_scope"
        },
        {
          "key": "value",
          "label": "They need to understand ROI / value",
          "examples": [
            "I need to justify the spend."
          ],
          "target": "value_objection"
        },
        {
          "key": "none",
          "label": "No budget and no timing",
          "examples": [
            "We don't have budget for this."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "value_objection",
      "type": "message",
      "title": "Value objection — connect to business need, not inflated ROI claims",
      "script": "“That's fair. Let's tie it to the problem you mentioned: [repeat their stated issue]. If that isn't important enough to fix, then it may not make sense to invest right now. If it is important, the walkthrough can show exactly what we'd change and what the project would cost, so you can judge the value without guessing at a return.”",
      "internalNote": "Jangan kalkulasi ROI/lead value tanpa data valid dari prospect. Jangan klaim website otomatis menghasilkan pekerjaan lebih banyak.",
      "branches": [
        {
          "key": "worth_review",
          "label": "They agree to review specifics",
          "examples": [
            "Okay, show me what you mean."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "need_proof",
          "label": "They need examples / measurement",
          "examples": [
            "Can you show a real example?"
          ],
          "target": "proof_and_guarantees"
        },
        {
          "key": "not_priority",
          "label": "They decide it's not a priority",
          "examples": [
            "It's not important right now."
          ],
          "target": "timing_objection"
        },
        {
          "key": "decline",
          "label": "They decline",
          "examples": [
            "We'll leave it for now."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "discount_request",
      "type": "message",
      "title": "Discount request — protect scope and margin",
      "script": "“I can review options, but I'd rather not cut the price and then leave you with a site that doesn't do what you need. If we need to fit a budget, we can look at phasing the work or reducing optional items—without hiding costs or compromising the essentials. What budget range are you trying to stay within?”",
      "internalNote": "Jangan memberi diskon spontan. Setiap perubahan harga harus disertai perubahan scope atau approval internal. Pastikan tetap profitable dan deliverable jelas.",
      "branches": [
        {
          "key": "budget_given",
          "label": "They share a budget",
          "examples": [
            "We were hoping to stay below [amount]."
          ],
          "target": "custom_scope"
        },
        {
          "key": "no_budget",
          "label": "They won't share a budget",
          "examples": [
            "Just give me your best price."
          ],
          "target": "pricing_scope"
        },
        {
          "key": "full_scope",
          "label": "They want full scope at a reduced price",
          "examples": [
            "Can you do all of it for less?"
          ],
          "target": "price_objection"
        },
        {
          "key": "decline",
          "label": "They won't continue",
          "examples": [
            "That's more than we want to spend."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "competitor_objection",
      "type": "message",
      "title": "Comparing another provider — compare like for like",
      "script": "“That's sensible. Quotes can be very different depending on the pages, copy, SEO work, integrations, hosting, support, and who owns the site. If you compare the written scope line by line, you'll get a fairer picture than comparing just the headline price. Is there a particular item in their proposal you're unsure about?”",
      "internalNote": "Jangan membuat klaim buruk tentang kompetitor. Jangan menyebut semua vendor lain mahal/berkualitas rendah. Fokus pada scope, ownership, support, and measurable deliverables.",
      "branches": [
        {
          "key": "price",
          "label": "They compare price",
          "examples": [
            "Their quote is lower."
          ],
          "target": "price_objection"
        },
        {
          "key": "features",
          "label": "They compare features",
          "examples": [
            "They include more pages."
          ],
          "target": "scope_questions"
        },
        {
          "key": "support",
          "label": "They compare maintenance / support",
          "examples": [
            "They include support for a year."
          ],
          "target": "scope_questions"
        },
        {
          "key": "trust",
          "label": "They prefer an established provider",
          "examples": [
            "They have more reviews."
          ],
          "target": "trust"
        },
        {
          "key": "meeting",
          "label": "They want your written comparison",
          "examples": [
            "Can you put your proposal together?"
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "already_chose",
          "label": "They have already selected another provider",
          "examples": [
            "We've signed with someone."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "timing_objection",
      "type": "message",
      "title": "Timing objection — determine whether to schedule or close",
      "script": "“No problem. Is it mainly that you're flat out with plumbing jobs right now, or that a website project isn't on the priority list until a later date?”",
      "internalNote": "Jangan menekan. Kalau mereka menyebut bulan/season/contract end, dapatkan tanggal spesifik dan izin follow-up. Bila tidak memberi izin, jangan membuat task follow-up.",
      "branches": [
        {
          "key": "busy_season",
          "label": "They're in a busy period",
          "examples": [
            "We're slammed at the moment."
          ],
          "target": "callback"
        },
        {
          "key": "later_date",
          "label": "They name a later month / quarter",
          "examples": [
            "Maybe in January."
          ],
          "target": "followup_permission"
        },
        {
          "key": "contract",
          "label": "They are waiting for an existing contract to end",
          "examples": [
            "Our current contract ends in June."
          ],
          "target": "followup_permission"
        },
        {
          "key": "not_priority",
          "label": "It is not a priority at all",
          "examples": [
            "We don't plan to change it."
          ],
          "target": "polite_close"
        },
        {
          "key": "budget",
          "label": "Timing is tied to the budget",
          "examples": [
            "We won't have budget until next quarter."
          ],
          "target": "budget_objection"
        },
        {
          "key": "decline",
          "label": "They don't want further contact",
          "examples": [
            "No need to call later."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "followup_permission",
      "type": "message",
      "title": "Ask explicit permission before a future follow-up",
      "script": "“Would it be useful for me to check back around [specific month/date], or would you rather I leave it with you to reach out if the timing changes?”",
      "internalNote": "Follow-up masa depan hanya jika prospect secara eksplisit setuju. Catat alasan, tanggal dan kanal. Jangan mengubah 'maybe later' menjadi izin follow-up otomatis.",
      "branches": [
        {
          "key": "yes",
          "label": "They authorize a future check-in",
          "examples": [
            "Yes, call me the first week of January."
          ],
          "target": "future_followup_booked"
        },
        {
          "key": "they_call",
          "label": "They prefer to contact you themselves",
          "examples": [
            "I'll get in touch if we need it."
          ],
          "target": "polite_close"
        },
        {
          "key": "no",
          "label": "They decline a follow-up",
          "examples": [
            "No, thanks."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "future_followup_booked",
      "type": "outcome",
      "title": "Future follow-up agreed — confirm timing",
      "script": "“Thanks. I'll make one check-in during the first week of [month], on [agreed channel]. I'll note that it's about revisiting the website demo, not a commitment to proceed. Thanks for clarifying.”",
      "internalNote": "Masukkan follow-up dengan tanggal yang disepakati. Jangan membuat recurring reminders atau menghubungi lewat kanal lain tanpa izin.",
      "outcomeKey": "follow_up_later"
    },
    {
      "key": "think_objection",
      "type": "message",
      "title": "They need to think — find the unresolved question",
      "script": "“Of course. Usually when someone wants to think it over, there's one part they still need to feel comfortable with. Is it the cost, whether the demo fits your business, the timing, or something else?”",
      "internalNote": "Pertanyaan diagnostik satu kali. Jangan menafsirkan 'need to think' sebagai yes. Tujuan: beri ruang atau jadwalkan langkah berikut yang mereka setujui.",
      "branches": [
        {
          "key": "cost",
          "label": "Cost is unresolved",
          "examples": [
            "It's mainly the money."
          ],
          "target": "price_objection"
        },
        {
          "key": "fit",
          "label": "They are unsure the solution fits",
          "examples": [
            "I'm not sure this is right for us."
          ],
          "target": "value_objection"
        },
        {
          "key": "partner",
          "label": "They need another person's opinion",
          "examples": [
            "I need to speak with my partner."
          ],
          "target": "partner_objection"
        },
        {
          "key": "timing",
          "label": "They are unsure about timing",
          "examples": [
            "We have too much on right now."
          ],
          "target": "timing_objection"
        },
        {
          "key": "more_info",
          "label": "They want more details",
          "examples": [
            "I just need more information."
          ],
          "target": "email_only"
        },
        {
          "key": "no_detail",
          "label": "They don't want to explain",
          "examples": [
            "I just need to think."
          ],
          "target": "polite_close"
        },
        {
          "key": "no",
          "label": "They decline",
          "examples": [
            "I've decided not to proceed."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "partner_objection",
      "type": "message",
      "title": "Partner / spouse / co-owner needs to agree",
      "script": "“Absolutely. What do you think they'll want to understand before deciding—price, what changes on the website, or how the project would work? We can set up a short walkthrough with both of you so everyone hears the same details.”",
      "internalNote": "Jangan meminta prospect mengambil keputusan tanpa pihak berwenang. Jangan mengirim materi rahasia tanpa izin. Tujuannya jadwalkan meeting bersama.",
      "branches": [
        {
          "key": "joint",
          "label": "They agree to a joint meeting",
          "examples": [
            "Let's get my partner on the call."
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "summary",
          "label": "They want a brief summary to share",
          "examples": [
            "Email me something I can forward."
          ],
          "target": "email_only"
        },
        {
          "key": "price",
          "label": "Partner's main concern is cost",
          "examples": [
            "They'll want to know the cost."
          ],
          "target": "pricing_scope"
        },
        {
          "key": "scope",
          "label": "Partner's main concern is deliverables",
          "examples": [
            "They'll ask what's included."
          ],
          "target": "scope_questions"
        },
        {
          "key": "later",
          "label": "They will speak to the partner and decide later",
          "examples": [
            "I'll discuss it with them."
          ],
          "target": "followup_permission"
        },
        {
          "key": "decline",
          "label": "Partner has already decided no",
          "examples": [
            "They won't want to do it."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "soft_rejection",
      "type": "message",
      "title": "Soft rejection — one respectful attempt to understand, then exit",
      "script": "“No problem, and I appreciate you telling me. Just so I don't make the wrong assumption, is it that you're happy with your current website, or simply not looking at website work right now?”",
      "internalNote": "Hanya satu pertanyaan klarifikasi bila penolakan masih umum. Jika prospect mengulang no, tutup. Bila ada request stop/no contact, langsung ke DNC tanpa pertanyaan tambahan.",
      "branches": [
        {
          "key": "happy",
          "label": "They are happy with the current website",
          "examples": [
            "We're happy with what we have."
          ],
          "target": "polite_close"
        },
        {
          "key": "timing",
          "label": "It's not the right time",
          "examples": [
            "Maybe another time."
          ],
          "target": "timing_objection"
        },
        {
          "key": "send",
          "label": "They would accept information only",
          "examples": [
            "You can email the demo."
          ],
          "target": "email_only"
        },
        {
          "key": "not_fit",
          "label": "They say the offer isn't relevant",
          "examples": [
            "We don't need this."
          ],
          "target": "polite_close"
        },
        {
          "key": "repeat_no",
          "label": "They repeat that they aren't interested",
          "examples": [
            "No, definitely not."
          ],
          "target": "polite_close"
        },
        {
          "key": "dnc",
          "label": "They request not to be contacted again",
          "examples": [
            "Do not call again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "do_not_contact",
      "type": "outcome",
      "title": "Do not contact — immediate respectful close",
      "script": "“Understood. I apologize for the interruption. I'll mark this number as do not contact. I won't call again. Goodbye.”",
      "internalNote": "Langsung akhiri tanpa menawarkan email/demo, tanpa pertanyaan tambahan, tanpa mencoba jalur lain. Tandai DNC di CRM dan ikuti kebijakan internal serta aturan telemarketing yang berlaku.",
      "outcomeKey": "not_interested"
    },
    {
      "key": "wrong_contact",
      "type": "outcome",
      "title": "Wrong number / wrong business",
      "script": "“Sorry about that, and thanks for letting me know. I'll correct my records. Have a good day.”",
      "internalNote": "Jangan mencoba pitch setelah dikoreksi. Perbaiki record dan jangan menggunakan nomor tersebut untuk outreach bisnis yang salah.",
      "outcomeKey": "other"
    },
    {
      "key": "polite_close",
      "type": "outcome",
      "title": "Polite close — leave a good impression",
      "script": "“Understood. Thanks for taking a moment to speak with me, [Name]. I appreciate it. Have a good day.”",
      "internalNote": "Gunakan ini saat tidak ada next step atau prospect menolak tanpa DNC. Jangan menambahkan pitch di kalimat penutup.",
      "outcomeKey": "not_interested"
    },
    {
      "key": "meeting_discovery",
      "type": "message",
      "title": "Meeting discovery — diagnose business priorities",
      "script": "“Before I walk through the demo, I'd like to understand the business a little better. What are the main plumbing services you want more of? Which towns or ZIP codes are most important? And what would you most like the website to do better—help people call, request estimates, understand your services, or find you in local search?”",
      "internalNote": "Mulai meeting dengan discovery singkat. Catat layanan utama, service area, job types, seasonality, customer fit, service capacity, current lead channels, and success criteria. Jangan menganggap setiap business mengejar lebih banyak lead tanpa capacity.",
      "branches": [
        {
          "key": "more_calls",
          "label": "They want more qualified calls",
          "examples": [
            "We want more calls for our core services."
          ],
          "target": "meeting_demo_walkthrough"
        },
        {
          "key": "estimate",
          "label": "They want more estimate requests",
          "examples": [
            "We want better estimate enquiries."
          ],
          "target": "meeting_demo_walkthrough"
        },
        {
          "key": "local_search",
          "label": "They want better local visibility",
          "examples": [
            "We need to show up for our service area."
          ],
          "target": "meeting_demo_walkthrough"
        },
        {
          "key": "customer_clarity",
          "label": "They want customers to understand services",
          "examples": [
            "Customers don't always know what we do."
          ],
          "target": "meeting_demo_walkthrough"
        },
        {
          "key": "capacity",
          "label": "They need better lead quality / capacity fit",
          "examples": [
            "We don't want calls outside our area."
          ],
          "target": "meeting_demo_walkthrough"
        },
        {
          "key": "unclear",
          "label": "They are not sure",
          "examples": [
            "I need to see the demo first."
          ],
          "target": "meeting_demo_walkthrough"
        }
      ]
    },
    {
      "key": "meeting_demo_walkthrough",
      "type": "message",
      "title": "Walk through the demo — show, don't overwhelm",
      "script": "“Let me show you the concept in the same order a customer might use it. First, the homepage makes the service and service area clear. Next, a visitor can choose the relevant plumbing service. Then the page answers the key questions you want customers to know. Finally, the call and estimate-request actions are easy to find on mobile. As we go, tell me what feels accurate, what doesn't match how you operate, and what's missing.”",
      "internalNote": "Jangan membacakan semua fitur. Tunjukkan 3–4 keputusan desain yang terkait dengan pain point yang prospect sebut. Catat perubahan. Periksa fakta: services, hours, licenses, guarantees, photos, testimonials, areas served.",
      "branches": [
        {
          "key": "likes",
          "label": "They like the direction",
          "examples": [
            "This is much clearer."
          ],
          "target": "meeting_recommendation"
        },
        {
          "key": "changes",
          "label": "They request changes",
          "examples": [
            "We don't offer that service.",
            "We'd want the phone number more prominent."
          ],
          "target": "meeting_recommendation"
        },
        {
          "key": "seo",
          "label": "They want to discuss SEO separately",
          "examples": [
            "How does this help Google?"
          ],
          "target": "seo_plan"
        },
        {
          "key": "features",
          "label": "They ask about extra features",
          "examples": [
            "Can we add financing / online booking?"
          ],
          "target": "custom_scope"
        },
        {
          "key": "price",
          "label": "They ask for exact costs",
          "examples": [
            "What would the full project cost?"
          ],
          "target": "proposal_review"
        },
        {
          "key": "not_fit",
          "label": "They don't like the demo",
          "examples": [
            "This isn't what we're after."
          ],
          "target": "meeting_recommendation"
        }
      ]
    },
    {
      "key": "meeting_recommendation",
      "type": "message",
      "title": "Summarize fit and agree on scope direction",
      "script": "“Let me check I've understood. Your priority is [their priority], the most important services are [services], and the key areas are [service areas]. The concept should [agreed change 1] and [agreed change 2]. Is that right? Based on that, I'd recommend [phase / scope] rather than adding features you don't need. Is there anything important I've missed?”",
      "internalNote": "Ulangi kebutuhan persis dengan kata-kata mereka. Pisahkan must-have vs nice-to-have. Jangan menyarankan fitur yang tidak mendukung objective.",
      "branches": [
        {
          "key": "agree",
          "label": "They agree with the summary",
          "examples": [
            "Yes, that's right."
          ],
          "target": "proposal_review"
        },
        {
          "key": "adjust",
          "label": "They correct the summary",
          "examples": [
            "Actually, our priority is..."
          ],
          "target": "meeting_discovery"
        },
        {
          "key": "need_quote",
          "label": "They want a written quote",
          "examples": [
            "Send over a proposal."
          ],
          "target": "proposal_review"
        },
        {
          "key": "need_partner",
          "label": "They need another stakeholder",
          "examples": [
            "I need my partner to review."
          ],
          "target": "partner_objection"
        },
        {
          "key": "not_now",
          "label": "They aren't ready",
          "examples": [
            "We'll come back to it later."
          ],
          "target": "timing_objection"
        }
      ]
    },
    {
      "key": "proposal_review",
      "type": "message",
      "title": "Present the proposal — scope, price, timeline, and exclusions",
      "script": "“I'll put this into a written proposal so you can assess it clearly. It'll spell out the pages and features, content responsibilities, SEO items if included, platform and hosting assumptions, ownership, timeline, revision rounds, support, third-party costs, payment milestones, and what's excluded. The proposed investment is [actual quoted amount] for [precise scope]. Would you like me to walk through the proposal together now, or send it for review?”",
      "internalNote": "Isi actual amount and delivery schedule only after scope and capacity confirmed. Proposal should identify revision count, copy/assets, hosting/domain, migration, maintenance, recurring costs, taxes, acceptance, cancellation and ownership.",
      "branches": [
        {
          "key": "review_now",
          "label": "They want to review together",
          "examples": [
            "Let's go through it."
          ],
          "target": "closing_decision"
        },
        {
          "key": "send_review",
          "label": "They want to review it internally",
          "examples": [
            "Send me the proposal."
          ],
          "target": "proposal_followup"
        },
        {
          "key": "changes",
          "label": "They request scope or price changes",
          "examples": [
            "Can you remove the blog and adjust the price?"
          ],
          "target": "proposal_revision"
        },
        {
          "key": "price_objection",
          "label": "They object to the price",
          "examples": [
            "That's higher than we expected."
          ],
          "target": "price_objection"
        },
        {
          "key": "need_partner",
          "label": "Another decision-maker must approve",
          "examples": [
            "My business partner needs to sign off."
          ],
          "target": "partner_objection"
        },
        {
          "key": "not_fit",
          "label": "They decide not to proceed",
          "examples": [
            "We'll pass."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "proposal_followup",
      "type": "message",
      "title": "Proposal follow-up — agree on a review date",
      "script": "“No problem. When would be reasonable for me to check whether you've had a chance to review it—[option 1] or [option 2]? I'll use [approved channel] and focus on any questions about the scope, not keep sending reminders.”",
      "internalNote": "Follow up hanya dengan izin dan waktu yang disepakati. Kalau prospect bilang no follow-up, hormati.",
      "branches": [
        {
          "key": "date",
          "label": "They agree to a review date",
          "examples": [
            "Call me next Wednesday."
          ],
          "target": "followup_agreed"
        },
        {
          "key": "self",
          "label": "They will contact you themselves",
          "examples": [
            "I'll get back to you."
          ],
          "target": "proposal_no_followup"
        },
        {
          "key": "questions",
          "label": "They have questions now",
          "examples": [
            "I have a couple of questions."
          ],
          "target": "closing_decision"
        },
        {
          "key": "no",
          "label": "They decline",
          "examples": [
            "No need to follow up."
          ],
          "target": "proposal_no_followup"
        }
      ]
    },
    {
      "key": "proposal_revision",
      "type": "message",
      "title": "Revise scope — confirm trade-offs, don't discount blindly",
      "script": "“We can look at that. If we remove [item], that would reduce [deliverable / capability], while keeping [core requirement]. I'll update the scope and price in writing so we're both clear. Are there any other items you'd like treated as optional rather than essential?”",
      "internalNote": "Requote after confirming impact to outcome, price and timeline. Jangan menawarkan layanan gratis yang tidak sustainable. Setiap tambahan revisi dipresentasikan ulang lewat node proposal (bukan mengulang node ini ke dirinya sendiri), supaya perubahan scope dan harga selalu tertulis.",
      "branches": [
        {
          "key": "approve_revision",
          "label": "They agree to revised scope",
          "examples": [
            "That works for us."
          ],
          "target": "proposal_review"
        },
        {
          "key": "more_changes",
          "label": "They have more changes",
          "examples": [
            "Also remove the booking feature.",
            "Send me the updated version with both changes."
          ],
          "target": "proposal_review"
        },
        {
          "key": "full_scope",
          "label": "They want original full scope at lower price",
          "examples": [
            "We still want all features at that price."
          ],
          "target": "price_objection"
        },
        {
          "key": "decline",
          "label": "They decide not to proceed",
          "examples": [
            "Let's leave it."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "followup_agreed",
      "type": "outcome",
      "title": "Proposal follow-up agreed",
      "script": "“Great. I'll contact you on [agreed date] via [approved channel]. Thanks again for considering Digital Leads. I'll make sure you have the latest proposal before then.”",
      "internalNote": "Record date, channel, stakeholder, proposal version, open questions, and agreed next action.",
      "outcomeKey": "follow_up_later"
    },
    {
      "key": "proposal_no_followup",
      "type": "outcome",
      "title": "Proposal sent — no follow-up requested",
      "script": "“Understood. I'll send the proposal and leave it with you. I won't follow up unless you ask me to. Thanks for reviewing it.”",
      "internalNote": "Mark no follow-up. Do not sequence into automatic reminders.",
      "outcomeKey": "interested_no_meeting"
    },
    {
      "key": "closing_decision",
      "type": "message",
      "title": "Ask for the decision — clear, low-pressure close",
      "script": "“Based on what we've reviewed, does this feel like the right direction for [Business Name]? If it does, the next step is to approve the written scope and agree on the kickoff date. If something still doesn't feel right, I'd rather address that before asking you to commit.”",
      "internalNote": "Minta keputusan hanya setelah scope, price, timeline and responsibility clear. Jangan gunakan fake scarcity atau tekanan. Pastikan penandatangan punya kewenangan.",
      "branches": [
        {
          "key": "yes",
          "label": "They are ready to proceed",
          "examples": [
            "Yes, let's get started."
          ],
          "target": "project_start"
        },
        {
          "key": "question",
          "label": "They have one unresolved question",
          "examples": [
            "I need clarity on hosting / ownership."
          ],
          "target": "proposal_review"
        },
        {
          "key": "partner",
          "label": "They need approval",
          "examples": [
            "I have to get approval from my partner."
          ],
          "target": "partner_objection"
        },
        {
          "key": "more_time",
          "label": "They need more time",
          "examples": [
            "I need a few days."
          ],
          "target": "proposal_followup"
        },
        {
          "key": "price",
          "label": "They hesitate on investment",
          "examples": [
            "I'm still unsure about the cost."
          ],
          "target": "price_objection"
        },
        {
          "key": "no",
          "label": "They decline",
          "examples": [
            "We've decided not to go ahead."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "project_start",
      "type": "message",
      "title": "Project start — confirm approval and onboarding steps",
      "script": "“Excellent. I'll send the agreement and invoice/payment details for the approved scope. Once those are completed, we'll schedule kickoff and collect the materials we need: service list, service areas, approved photos, business hours, contact details, any required license/insurance wording, and access only through a secure, agreed process. We'll confirm ownership, timeline, and who approves each stage before work begins.”",
      "internalNote": "Jangan menyatakan project started sampai agreement, payment/milestone dan onboarding disetujui sesuai proses. Gunakan secure access (password manager / role-based invitations), bukan minta password lewat telepon/email. Jangan go-live tanpa written approval.",
      "branches": [
        {
          "key": "approved",
          "label": "They confirm the paperwork and kickoff",
          "examples": [
            "Send it over."
          ],
          "target": "project_onboarding"
        },
        {
          "key": "question",
          "label": "They ask about contract / payment",
          "examples": [
            "What are the payment terms?"
          ],
          "target": "payment_terms"
        },
        {
          "key": "delay",
          "label": "They need to delay kickoff",
          "examples": [
            "Can we start next month?"
          ],
          "target": "followup_permission"
        }
      ]
    },
    {
      "key": "payment_terms",
      "type": "message",
      "title": "Payment terms — refer to the written agreement",
      "script": "“The payment milestones for this project are [actual terms]. I'll put them in the agreement with the scope, delivery milestones, and what's required from both sides. Please review everything before paying or signing; I want the expectations to be clear on both sides.”",
      "internalNote": "Jangan menciptakan deposit percentage, payment gateway, refund terms, taxes, or financing. Isi dengan terms yang benar-benar dipakai agency dan sesuai hukum setempat.",
      "branches": [
        {
          "key": "accept",
          "label": "They accept the terms",
          "examples": [
            "That works."
          ],
          "target": "project_onboarding"
        },
        {
          "key": "question",
          "label": "They need clarification",
          "examples": [
            "What happens if the timeline changes?"
          ],
          "target": "proposal_review"
        },
        {
          "key": "decline",
          "label": "They reject the terms",
          "examples": [
            "We can't work with those terms."
          ],
          "target": "proposal_revision"
        }
      ]
    },
    {
      "key": "project_onboarding",
      "type": "outcome",
      "title": "Onboarding — start only after signed approval",
      "script": "“Thanks. The next step is a kickoff where we confirm the agreed scope, timeline, content owner, approver, and access requirements. We'll work from the approved brief, share progress at the agreed checkpoints, and get your approval before anything replaces the current website.”",
      "internalNote": "Checklist internal: signed agreement, payment milestone satisfied, domain/hosting ownership confirmed, backups/migration plan, access via secure method, approved copy/assets, contact and service facts validated, SEO redirects if needed, analytics permissions, pre-launch QA, written go-live signoff. Catat hasil 'project approved / kickoff' di notes sesi karena kategori outcome standar tidak punya status menang.",
      "outcomeKey": "other"
    },
    {
      "key": "demo_removed",
      "type": "outcome",
      "title": "Remove demo on request",
      "script": "“Understood. I'll remove the private preview and won't use it in any marketing or publish it. I'm sorry for the concern, and thanks for letting me know.”",
      "internalNote": "Lakukan penghapusan aktual dari hosting/cache/sharing workspace sesuai kemampuan dan kebijakan. Catat completion. Jika juga minta DNC, tandai DNC.",
      "outcomeKey": "other"
    },
    {
      "key": "unexpected",
      "type": "message",
      "title": "Unexpected question — pause, clarify, and don't bluff",
      "script": "“I want to make sure I answer that accurately. Could you say a little more about what you mean? If it's something technical or commercial I can't confirm on this call, I'll note it and come back with a clear answer rather than guessing.”",
      "internalNote": "Gunakan saat respons tidak cocok dengan branch mana pun. Jangan bersikap seolah-olah tahu. Bila tidak ada next step, tutup sopan. Jika mereka meminta berhenti, ke DNC.",
      "branches": [
        {
          "key": "clarified",
          "label": "They clarify their question",
          "examples": [
            "What I mean is..."
          ],
          "target": "owner_pitch"
        },
        {
          "key": "technical",
          "label": "It needs technical verification",
          "examples": [
            "Can you confirm the integration?"
          ],
          "target": "technical_questions"
        },
        {
          "key": "price",
          "label": "It is a pricing question",
          "examples": [
            "How much would it cost?"
          ],
          "target": "pricing_scope"
        },
        {
          "key": "dnc",
          "label": "They request no more contact",
          "examples": [
            "Stop calling."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "voicemail",
      "type": "message",
      "title": "Voicemail — leave a short, non-pushy message",
      "script": "“Hi, this is Ali from Digital Leads calling for [Business Name]. I reviewed your public website and put together a private demo concept showing a few possible improvements to the customer experience and local search structure. If you'd like to take a look, you can reach me at [callback number] or [business email]. Again, this is Ali at Digital Leads, [callback number]. Thanks.”",
      "internalNote": "Tinggalkan pesan hanya jika sesuai kebijakan dan aturan telemarketing wilayah target. Jangan menyebut informasi sensitif atau mengklaim sudah bicara dengan owner. Jangan menelepon berkali-kali dalam waktu singkat; catat upaya call dan hormati DNC.",
      "branches": [
        {
          "key": "callback",
          "label": "They call back",
          "examples": [
            "I'm returning a call from Ali."
          ],
          "target": "owner_intro"
        },
        {
          "key": "no_return",
          "label": "No callback",
          "examples": [
            "No response."
          ],
          "target": "polite_close"
        }
      ]
    },
    {
      "key": "contact_data_question",
      "type": "message",
      "title": "They ask where you got their phone number",
      "script": "“I found the business contact number listed on [actual public source / business listing]. I used it to reach the business about the website—not for anything related to customer records. If this isn't an appropriate number for business enquiries, let me know and I'll correct my records.”",
      "internalNote": "Isi sumber yang sebenarnya dan verifikasi sebelum call. Jangan mengklaim data dari listing tertentu jika tidak benar. Jika diminta hapus / jangan hubungi lagi, langsung ke DNC.",
      "branches": [
        {
          "key": "correct",
          "label": "They confirm this is the right business number",
          "examples": [
            "Yes, this is the business line."
          ],
          "target": "owner_intro"
        },
        {
          "key": "wrong",
          "label": "They say it is not a business contact number",
          "examples": [
            "This is a personal number."
          ],
          "target": "wrong_contact"
        },
        {
          "key": "dnc",
          "label": "They ask you to remove the number",
          "examples": [
            "Remove this number from your list."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "meeting_no_show",
      "type": "message",
      "title": "Prospect misses the booked meeting",
      "script": "“Hi [Name], it's Ali from Digital Leads. We had a 10–15 minute website walkthrough scheduled for [time]. I wanted to check whether now is still convenient, or whether you'd prefer to reschedule. No problem either way.”",
      "internalNote": "Lakukan follow-up hanya melalui kanal yang disetujui dan sesuai reminder yang dijanjikan. Jangan menganggap no-show sebagai izin untuk menghubungi berulang kali.",
      "branches": [
        {
          "key": "reschedule",
          "label": "They want to reschedule",
          "examples": [
            "Can we do tomorrow instead?"
          ],
          "target": "meeting_schedule"
        },
        {
          "key": "busy",
          "label": "They got pulled into a job",
          "examples": [
            "Sorry, I got held up on a callout."
          ],
          "target": "callback"
        },
        {
          "key": "cancel",
          "label": "They no longer want the meeting",
          "examples": [
            "Let's cancel it."
          ],
          "target": "polite_close"
        },
        {
          "key": "dnc",
          "label": "They ask for no further contact",
          "examples": [
            "Don't contact me again."
          ],
          "target": "do_not_contact"
        }
      ]
    }
  ]
};
