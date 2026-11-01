import type { CallbookTemplate } from "./types";

/**
 * Consultative, demo-first outreach callbook. Edit placeholders and verify every factual claim before use.
 */
export const medSpaCosmeticDentistryOutreach: CallbookTemplate = {
  "id": "medspa-cosmetic-dentistry-demo-outreach",
  "name": "Med Spa & Cosmetic Dentistry — Demo-First Outreach",
  "description": "Cold-call flow for med spas and cosmetic dentistry practices after preparing an unpublished, business-specific website concept. Lead with the demo, quote a clearly scoped $400 launch package, and handle objections without overpromising.",
  "targetAudience": "Med spas, aesthetic clinics, injectors, cosmetic dentists, veneer and smile-makeover practices in the metro area",
  "primaryGoal": "book_meeting",
  "marketCode": "USA",
  "nicheName": "Med Spa & Aesthetic",
  "guidance": "Use the prospect-specific demo as the reason for calling. Ask permission, keep the first pitch under 25 seconds, and aim for a 5–10 minute walkthrough or permission to send the preview. Quote $400 USD only for the written, limited launch scope. Do not call it an enterprise platform unless the scope truly supports that label; never claim guaranteed leads, rankings, patient outcomes, competitor prices, HIPAA compliance, or client approval without evidence. If they clearly ask not to be contacted, end immediately and mark do-not-contact—do not ask to save WhatsApp. Consultative objection handling: acknowledge first, ask one diagnostic question, listen, respond only to the stated issue, and agree on a next step. Do not rebut immediately, over-explain features, or discount before understanding the concern. Pause after demo and price. Respect do-not-contact requests immediately.",
  "startKey": "opening",
  "nodes": [
    {
      "key": "opening",
      "type": "message",
      "title": "Opening — respond to their greeting, then ask for the owner",
      "script": "Hi! Thanks for taking my call. This is [Your Name. Quick question—am I speaking with the owner of [Practice Name], or would the owner or person who handles the website be available for a moment?",
      "internalNote": "Assume the receptionist or staff member greets first (for example, 'Hello, [Practice Name]'). Respond naturally before asking for the owner. Don't launch into the pitch before identifying whether this is the owner/decision-maker. Replace all placeholders before dialing.",
      "branches": [
        {
          "key": "owner_yes",
          "label": "They say they are the owner or website decision-maker",
          "examples": [
            "Speaking.",
            "I'm the owner.",
            "I handle the website."
          ],
          "target": "owner_intro"
        },
        {
          "key": "owner_transfer",
          "label": "They offer to transfer the call to the owner",
          "examples": [
            "I'll see if she's available.",
            "One moment, please."
          ],
          "target": "owner_transfer_result"
        },
        {
          "key": "not_owner",
          "label": "They are staff, receptionist, or practice manager—not the owner",
          "examples": [
            "No, I'm the front desk.",
            "The owner isn't here.",
            "Our manager handles that."
          ],
          "target": "gatekeeper"
        },
        {
          "key": "asks_reason",
          "label": "They ask what the call is about before transferring",
          "examples": [
            "What is this regarding?",
            "Can I tell them who's calling?"
          ],
          "target": "gatekeeper_reason"
        },
        {
          "key": "busy",
          "label": "They say the owner or staff are busy",
          "examples": [
            "We're with patients.",
            "It's a busy time."
          ],
          "target": "callback"
        },
        {
          "key": "not_interested_gatekeeper",
          "label": "They say the practice is not interested",
          "examples": [
            "We're not interested.",
            "We don't take sales calls."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "do_not_contact",
          "label": "They explicitly ask not to be contacted again",
          "examples": [
            "Don't call this number again.",
            "Remove us from your list."
          ],
          "target": "do_not_contact"
        },
        {
          "key": "wrong_number",
          "label": "Wrong number or wrong business",
          "examples": [
            "You have the wrong number.",
            "This isn't that practice."
          ],
          "target": "wrong_contact"
        }
      ]
    },
    {
      "key": "owner_transfer_result",
      "type": "message",
      "title": "Transfer result — did the owner pick up?",
      "script": "Hi, thanks for taking the call. I'm [Your Name]. I made a private website concept for [Practice Name] and wanted to ask the owner one quick question about whether they'd be open to seeing it.",
      "internalNote": "Use this node only if the call is transferred and the owner/decision-maker answers. If nobody picks up or the transfer fails, return to the gatekeeper politely and ask for a suitable callback time; don't pretend the transfer happened.",
      "branches": [
        {
          "key": "owner_picked_up",
          "label": "Owner is on the line and willing to hear the reason",
          "examples": [
            "That's me—what's this about?",
            "Okay, go ahead."
          ],
          "target": "owner_intro"
        },
        {
          "key": "transfer_failed",
          "label": "Transfer fails or owner doesn't answer",
          "examples": [
            "They're unavailable.",
            "It went to voicemail."
          ],
          "target": "gatekeeper"
        },
        {
          "key": "owner_busy",
          "label": "Owner picks up but is busy",
          "examples": [
            "I'm in the middle of something.",
            "Can you call later?"
          ],
          "target": "callback"
        },
        {
          "key": "owner_dnc",
          "label": "Owner says not to contact them again",
          "examples": [
            "Don't call here again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "gatekeeper_reason",
      "type": "message",
      "title": "Gatekeeper asks why you're calling",
      "script": "Of course. I'm [Your Name], a web developer. I put together a private website concept for [Practice Name] using publicly available business information—it's just a preview, not a live site. I'd like to offer the owner a quick look and explain a fixed-scope $400 launch option if it's relevant. Is the owner or practice manager the right person for that?",
      "internalNote": "Be transparent that the demo is unsolicited and unpublished. Don't imply the business commissioned it. If they ask you not to send it or contact them, respect that immediately.",
      "branches": [
        {
          "key": "connect_owner",
          "label": "They agree to connect you with the owner",
          "examples": [
            "I'll transfer you.",
            "Let me check if they're free."
          ],
          "target": "owner_transfer_result"
        },
        {
          "key": "share_contact",
          "label": "They give the correct decision-maker or business contact",
          "examples": [
            "Our practice manager is Alex.",
            "Try the owner tomorrow morning."
          ],
          "target": "gatekeeper"
        },
        {
          "key": "gatekeeper_busy",
          "label": "They ask you to call back at a better time",
          "examples": [
            "Call after 2 p.m.",
            "Try Friday."
          ],
          "target": "callback"
        },
        {
          "key": "gatekeeper_no",
          "label": "They decline or won't connect you",
          "examples": [
            "We don't pass calls through.",
            "No thanks."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "gatekeeper_dnc",
          "label": "They request no further contact",
          "examples": [
            "Please don't call this business again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "owner_intro",
      "type": "message",
      "title": "Owner identified — explain the custom demo",
      "script": "Great, thanks for taking a moment. I’m [Your Name] from [Your Business]. I put together a private website concept for [Practice Name], so you can review something specific rather than listen to a generic pitch. I focused on clear service information and a straightforward consultation enquiry path. Would you be open to a quick 20-second overview?",
      "internalNote": "Now that the owner/decision-maker is identified, introduce the demo and ask permission to continue. For med spas, personalize around treatment/service pages and consultation requests. For cosmetic dentistry, personalize around veneers, smile makeovers, cosmetic consultations, and before/after gallery only if the practice has approved assets. Don't make medical, patient-outcome, or lead-volume guarantees.",
      "branches": [
        {
          "key": "owner_yes_demo",
          "label": "Owner is open to seeing the demo",
          "examples": [
            "Sure, show me.",
            "Send it over.",
            "You've got five minutes."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "owner_price_first",
          "label": "Owner asks the price before viewing the demo",
          "examples": [
            "How much is it?",
            "What's the cost?"
          ],
          "target": "price"
        },
        {
          "key": "owner_already_site",
          "label": "Owner already has a website or agency",
          "examples": [
            "We already have a website.",
            "Our agency does that."
          ],
          "target": "existing_site"
        },
        {
          "key": "owner_busy",
          "label": "Owner is busy and asks for a callback",
          "examples": [
            "I'm with a patient.",
            "Can you call tomorrow?"
          ],
          "target": "callback"
        },
        {
          "key": "owner_wants_link",
          "label": "Owner only wants the demo link",
          "examples": [
            "Just text me the link.",
            "Email it to me."
          ],
          "target": "send_channel"
        },
        {
          "key": "owner_soft_no",
          "label": "Owner declines without explicitly asking for no contact",
          "examples": [
            "Not interested right now.",
            "We're fine for now."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "owner_dnc",
          "label": "Owner asks not to be contacted again",
          "examples": [
            "Don't call me again.",
            "Take us off your list."
          ],
          "target": "do_not_contact"
        },
        {
          "key": "need_think",
          "label": "They need time to think",
          "examples": [
            "I need to think about it."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "They want to compare providers",
          "examples": [
            "I want to shop around."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "They need to discuss with a partner",
          "examples": [
            "I need to speak with my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "They ask to be sent information",
          "examples": [
            "Just send me some information."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing is the issue",
          "examples": [
            "Now is not a good time."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "They are only browsing",
          "examples": [
            "I’m just looking."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "They pause after the pitch or price",
          "examples": [
            "They go quiet after the demo or price."
          ],
          "target": "objection_silence"
        },
        {
          "key": "price_concern_diagnostic",
          "label": "Price feels too high",
          "examples": [
            "That’s too expensive."
          ],
          "target": "objection_expensive"
        }
      ]
    },
    {
      "key": "demo_pitch",
      "type": "message",
      "title": "Explain why the demo is relevant",
      "script": "Thanks. I made the concept so you can judge something concrete rather than listen to a generic sales pitch. It focuses on making your services easy to understand on mobile, presenting the practice professionally, and giving visitors a clear way to request a consultation. Would you be open to a five-minute look?",
      "internalNote": "Do not say the redesign will definitely bring more patients. Talk about the experience and enquiry path, not guaranteed outcomes. Ask one question and pause. If an objection appears, diagnose the underlying reason before responding. Never promise patient volume, treatment outcomes, search rankings, HIPAA compliance, or practice approval without evidence.",
      "branches": [
        {
          "key": "wants_walkthrough",
          "label": "Open to a quick walkthrough",
          "examples": [
            "Okay, show me.",
            "I've got five minutes."
          ],
          "target": "schedule_review"
        },
        {
          "key": "wants_link_only",
          "label": "Wants the preview link only",
          "examples": [
            "Just email me the link.",
            "Send it over and I'll look later."
          ],
          "target": "send_channel"
        },
        {
          "key": "asks_why_or_privacy",
          "label": "Asks how the demo was made or whether it is live",
          "examples": [
            "How did you get our information?",
            "Is this already on our website?"
          ],
          "target": "demo_privacy"
        },
        {
          "key": "asks_location",
          "label": "Asks where the developer is based",
          "examples": [
            "Are you based in the metro area?",
            "Where are you based?"
          ],
          "target": "location_transparency"
        },
        {
          "key": "price_question",
          "label": "Asks about price",
          "examples": [
            "What would this cost?",
            "What's the catch?"
          ],
          "target": "price"
        },
        {
          "key": "guarantee_question",
          "label": "Asks whether it guarantees more leads or patients",
          "examples": [
            "Can you guarantee more bookings?",
            "Will this rank us first on Google?"
          ],
          "target": "guarantees"
        },
        {
          "key": "agency_objection",
          "label": "Says an agency already handles the site",
          "examples": [
            "Our agency does all of that.",
            "We already have a marketing company."
          ],
          "target": "agency"
        },
        {
          "key": "soft_no",
          "label": "Declines",
          "examples": [
            "No, thanks.",
            "Not something we're looking at."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "need_think",
          "label": "They need time to think",
          "examples": [
            "I need to think about it."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "They want to compare providers",
          "examples": [
            "I want to shop around."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "They need to discuss with a partner",
          "examples": [
            "I need to speak with my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "They ask to be sent information",
          "examples": [
            "Just send me some information."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing is the issue",
          "examples": [
            "Now is not a good time."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "They are only browsing",
          "examples": [
            "I’m just looking."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "They pause after the pitch or price",
          "examples": [
            "They go quiet after the demo or price."
          ],
          "target": "objection_silence"
        },
        {
          "key": "price_concern_diagnostic",
          "label": "Price feels too high",
          "examples": [
            "That’s too expensive."
          ],
          "target": "objection_expensive"
        }
      ]
    },
    {
      "key": "send_channel",
      "type": "message",
      "title": "Ask permission and choose a delivery channel",
      "script": "Of course. What's easiest for you—email, text, or WhatsApp? I'll send the private preview and a short summary of what's included. Would you also be okay with one brief check-in two business days later, or would you prefer that I send the link only and leave it with you?",
      "internalNote": "Use only the channel they choose and explicitly agree to. Do not send unsolicited SMS/WhatsApp messages. If they want the link only, respect that and do not follow up. Confirm the email/number before ending.",
      "branches": [
        {
          "key": "allows_followup",
          "label": "Chooses a channel and agrees to one follow-up",
          "examples": [
            "Email it to me and check back Thursday.",
            "WhatsApp is fine; you can follow up once."
          ],
          "target": "demo_sent_followup"
        },
        {
          "key": "link_only",
          "label": "Wants the link but no follow-up",
          "examples": [
            "Send it, but I'll reach out if I'm interested.",
            "Just the link, please."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "needs_proposal",
          "label": "Wants scope and price in writing too",
          "examples": [
            "Send the link and a quote.",
            "Can you include what's covered?"
          ],
          "target": "proposal"
        },
        {
          "key": "declines_message",
          "label": "Doesn't want to receive anything",
          "examples": [
            "No, don't send anything.",
            "Actually, never mind."
          ],
          "target": "not_interested_close"
        }
      ]
    },
    {
      "key": "price",
      "type": "message",
      "title": "Quote the $400 launch package",
      "script": "The demo-to-launch package is a one-time $400 USD for the written, limited scope. It is not an unlimited build or an enterprise/patient-management system. Before I explain further, is your main question the budget, exactly what is included, or whether this would address a real need for the practice?",
      "internalNote": "State the price once and pause. Do not imply the $400 covers unlimited work, ongoing hosting, custom patient systems, or a full enterprise platform. If the prospect asks about the $1,000–$1,500 comparison, use the separate price-comparison node.",
      "branches": [
        {
          "key": "price_works",
          "label": "Price seems acceptable; asks what's included",
          "examples": [
            "That's reasonable. What's included?",
            "Okay, tell me the scope."
          ],
          "target": "package_scope"
        },
        {
          "key": "compare_market",
          "label": "Compares the offer with $1,000–$1,500 quotes",
          "examples": [
            "Other people quoted me $1,200.",
            "Why are you cheaper than agencies?"
          ],
          "target": "objection_compare"
        },
        {
          "key": "too_expensive",
          "label": "Says $400 is too expensive",
          "examples": [
            "That's over budget.",
            "We can't spend that right now."
          ],
          "target": "objection_expensive"
        },
        {
          "key": "custom_features",
          "label": "Needs features beyond the standard package",
          "examples": [
            "We need online booking and CRM integration.",
            "Can it connect to our patient system?"
          ],
          "target": "scope_extras"
        },
        {
          "key": "needs_guarantees",
          "label": "Wants guaranteed leads, bookings, or rankings",
          "examples": [
            "How many new patients will this bring?",
            "Can you guarantee page one?"
          ],
          "target": "guarantees"
        },
        {
          "key": "think_about_it",
          "label": "Needs time to think",
          "examples": [
            "Let me think about it.",
            "I need to discuss it with my partner."
          ],
          "target": "objection_think"
        },
        {
          "key": "need_think",
          "label": "They need time to think",
          "examples": [
            "I need to think about it."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "They want to compare providers",
          "examples": [
            "I want to shop around."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "They need to discuss with a partner",
          "examples": [
            "I need to speak with my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "They ask to be sent information",
          "examples": [
            "Just send me some information."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing is the issue",
          "examples": [
            "Now is not a good time."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "They are only browsing",
          "examples": [
            "I’m just looking."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "They pause after the pitch or price",
          "examples": [
            "They go quiet after the demo or price."
          ],
          "target": "objection_silence"
        },
        {
          "key": "price_concern_diagnostic",
          "label": "Price feels too high",
          "examples": [
            "That’s too expensive."
          ],
          "target": "objection_expensive"
        }
      ]
    },
    {
      "key": "package_scope",
      "type": "message",
      "title": "Make the deliverables concrete",
      "script": "The proposed $400 scope is: up to five standard pages or equivalent sections, a responsive layout based on the demo, a services presentation, a contact or consultation CTA routed to a contact method or booking link you approve, basic on-page SEO titles and descriptions, mobile checks, one consolidated revision round, and deployment to an account you control. Domain and hosting fees, ongoing maintenance, paid tools, copywriting or photo shoots, ads, custom booking/CRM/EHR integrations, and handling patient health information are excluded. I'd confirm all of that in writing first. Does that match what you need?",
      "internalNote": "Only promise deliverables you can actually provide. Adapt page count, revision limit, timeline, and deployment details to your real capacity before the call. A simple contact form must not be presented as a compliant patient-intake system.",
      "branches": [
        {
          "key": "scope_fits",
          "label": "The scope fits",
          "examples": [
            "Yes, that sounds like enough.",
            "That would work for us."
          ],
          "target": "proposal"
        },
        {
          "key": "needs_compliance",
          "label": "Asks about patient information, privacy, or HIPAA",
          "examples": [
            "Can patients submit their medical details?",
            "Is the form HIPAA compliant?"
          ],
          "target": "health_data_compliance"
        },
        {
          "key": "needs_extra_features",
          "label": "Needs more integrations or advanced features",
          "examples": [
            "We need a custom booking flow.",
            "Can you build patient login and reminders?"
          ],
          "target": "scope_extras"
        },
        {
          "key": "asks_for_guarantee",
          "label": "Still expects guaranteed business results",
          "examples": [
            "Will we definitely get more bookings?",
            "Can you promise more leads?"
          ],
          "target": "guarantees"
        },
        {
          "key": "not_a_fit",
          "label": "Decides the package isn't right",
          "examples": [
            "That's not what we need.",
            "We need something much more advanced."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "need_think",
          "label": "They need time to think",
          "examples": [
            "I need to think about it."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "They want to compare providers",
          "examples": [
            "I want to shop around."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "They need to discuss with a partner",
          "examples": [
            "I need to speak with my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "They ask to be sent information",
          "examples": [
            "Just send me some information."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing is the issue",
          "examples": [
            "Now is not a good time."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "They are only browsing",
          "examples": [
            "I’m just looking."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "They pause after the pitch or price",
          "examples": [
            "They go quiet after the demo or price."
          ],
          "target": "objection_silence"
        }
      ]
    },
    {
      "key": "price_comparison",
      "type": "message",
      "title": "Handle the $1,000–$1,500 comparison honestly",
      "script": "“That’s reasonable. What’s the main thing you’re comparing—price, scope, design, or support after launch?”",
      "internalNote": "Do not disparage other providers or defend the price before you know the comparison criteria.",
      "branches": [
        {
          "key": "wants_scope",
          "label": "Wants to review the written scope",
          "examples": [
            "Yes, send me the details.",
            "Okay, let's see what's included."
          ],
          "target": "proposal"
        },
        {
          "key": "needs_enterprise_platform",
          "label": "Actually needs an advanced enterprise system",
          "examples": [
            "We need a full patient platform.",
            "We need a complex multi-location system."
          ],
          "target": "scope_extras"
        },
        {
          "key": "not_convinced",
          "label": "Still isn't convinced",
          "examples": [
            "I still don't see the value.",
            "I'll pass."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "need_think",
          "label": "They need time to think",
          "examples": [
            "I need to think about it."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "They want to compare providers",
          "examples": [
            "I want to shop around."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "They need to discuss with a partner",
          "examples": [
            "I need to speak with my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "They ask to be sent information",
          "examples": [
            "Just send me some information."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing is the issue",
          "examples": [
            "Now is not a good time."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "They are only browsing",
          "examples": [
            "I’m just looking."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "They pause after the pitch or price",
          "examples": [
            "They go quiet after the demo or price."
          ],
          "target": "objection_silence"
        }
      ]
    },
    {
      "key": "budget_objection",
      "type": "message",
      "title": "Price objection without pressure",
      "script": "“I understand. Before suggesting an option, can I ask what’s behind the concern—is it the budget you’ve set, the scope not feeling right, or the value not being clear yet?”",
      "branches": [
        {
          "key": "smaller_scope",
          "label": "Open to a smaller landing page",
          "examples": [
            "A landing page might work.",
            "What would a one-page version include?"
          ],
          "target": "reduced_scope_quote"
        },
        {
          "key": "later_budget",
          "label": "Maybe at a later date",
          "examples": [
            "Maybe next quarter.",
            "Try me in a few months."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "no_budget",
          "label": "Declines because of budget",
          "examples": [
            "No, we'll leave it.",
            "We don't have the budget."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "need_think",
          "label": "They need time to think",
          "examples": [
            "I need to think about it."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "They want to compare providers",
          "examples": [
            "I want to shop around."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "They need to discuss with a partner",
          "examples": [
            "I need to speak with my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "They ask to be sent information",
          "examples": [
            "Just send me some information."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing is the issue",
          "examples": [
            "Now is not a good time."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "They are only browsing",
          "examples": [
            "I’m just looking."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "They pause after the pitch or price",
          "examples": [
            "They go quiet after the demo or price."
          ],
          "target": "objection_silence"
        },
        {
          "key": "price_concern_diagnostic",
          "label": "Price feels too high",
          "examples": [
            "That’s too expensive."
          ],
          "target": "objection_expensive"
        }
      ],
      "internalNote": "Listen first. Only offer reduced scope if it genuinely fits; do not automatically discount."
    },
    {
      "key": "scope_extras",
      "type": "message",
      "title": "Advanced features or a request outside scope",
      "script": "That sounds like it may go beyond the $400 launch package. I don't want to guess or promise a feature before checking the requirements. I can separate the core marketing website from any booking, CRM, EHR, patient portal, multilingual, or automation work, then quote the extra scope clearly. Would you like to start with the core site, or should I send a follow-up after reviewing the requirements?",
      "internalNote": "Do not improvise pricing for integrations on the call. Capture the exact system name and requirement, then scope it separately. Never ask for production passwords or patient data during prospecting.",
      "branches": [
        {
          "key": "core_first",
          "label": "Wants the core website first",
          "examples": [
            "Let's start with the website.",
            "The core site is enough for now."
          ],
          "target": "proposal"
        },
        {
          "key": "needs_separate_quote",
          "label": "Wants a separate quote for advanced work",
          "examples": [
            "Review it and send me a quote.",
            "I'll email our requirements."
          ],
          "target": "extra_scope_followup"
        },
        {
          "key": "too_complex",
          "label": "The requirements are too complex for this offer",
          "examples": [
            "We need the full system, not just a website.",
            "That won't cover our needs."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "reduced_scope_quote",
      "type": "message",
      "title": "Offer a smaller scope without inventing a price",
      "script": "I can outline a simpler one-page landing page with fewer deliverables. That would be a separate, smaller scope, so I don't want to make up a lower price before defining what's included. What's the best business email for that option? Would one check-in after two business days be okay, or would you prefer no follow-up?",
      "internalNote": "Do not invent a lower price on the call. Price the smaller scope after defining its content, CTA, assets, revisions, and deployment requirements.",
      "branches": [
        {
          "key": "reduced_quote_followup_ok",
          "label": "Wants the smaller quote and agrees to one follow-up",
          "examples": [
            "Send it over and check back Thursday.",
            "A one-page quote would help; one follow-up is fine."
          ],
          "target": "reduced_scope_followup"
        },
        {
          "key": "reduced_quote_no_followup",
          "label": "Wants the smaller quote but no follow-up",
          "examples": [
            "Email it and I'll come back to you.",
            "Send the quote only."
          ],
          "target": "reduced_scope_no_followup"
        },
        {
          "key": "reduced_quote_declined",
          "label": "Doesn't want to consider a smaller scope",
          "examples": [
            "No, let's leave it.",
            "That still isn't a fit."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "extra_scope_followup",
      "type": "message",
      "title": "Collect details for an advanced-scope quote",
      "script": "Please send the system name and a short description of what you need to [business email/contact]—no patient data, passwords, or sensitive records. I'll review whether the requirement needs a separate quote. What's the best business email, and may I check back once after two business days? If you'd rather have no follow-up, that's fine too.",
      "internalNote": "Collect only non-sensitive requirements. Never request patient data, production credentials, or access tokens during prospecting. Confirm the exact contact before sending anything.",
      "branches": [
        {
          "key": "advanced_quote_followup_ok",
          "label": "Sends requirements and allows one follow-up",
          "examples": [
            "I'll email our requirements; you can check back Thursday.",
            "Send the details and follow up once."
          ],
          "target": "separate_scope_quote_followup"
        },
        {
          "key": "advanced_quote_no_followup",
          "label": "Wants a separate quote with no follow-up",
          "examples": [
            "I'll send the requirements; no need to follow up.",
            "Just review it and reply by email."
          ],
          "target": "separate_scope_quote_no_followup"
        },
        {
          "key": "advanced_core_only",
          "label": "Chooses the core $400 website instead",
          "examples": [
            "Let's keep it to the website for now.",
            "The core pages are enough."
          ],
          "target": "proposal"
        },
        {
          "key": "advanced_declined",
          "label": "No longer wants to proceed",
          "examples": [
            "We'll leave it for now.",
            "Not a priority."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "health_data_compliance",
      "type": "message",
      "title": "Patient data, booking, and HIPAA questions",
      "script": "Good question. The $400 package does not include storing patient records or building a custom patient-intake system, and I won't claim HIPAA compliance for a form without the proper architecture and review. The safest starting point is to link the consultation button to your existing booking or practice-management provider, then have your team or compliance adviser confirm the required setup. Would linking to your existing provider work?",
      "internalNote": "This is a scope boundary, not legal advice. Avoid collecting protected health information through a basic contact form. If they need regulated data handling, stop and scope it with qualified vendors before offering it.",
      "branches": [
        {
          "key": "existing_provider_ok",
          "label": "An existing booking provider is fine",
          "examples": [
            "We already use a booking platform.",
            "A link to our existing system is fine."
          ],
          "target": "proposal"
        },
        {
          "key": "custom_patient_system",
          "label": "They require custom patient-data functionality",
          "examples": [
            "We need patients to upload records.",
            "We need a compliant custom intake form."
          ],
          "target": "scope_extras"
        },
        {
          "key": "compliance_uncertain",
          "label": "They need a compliance review before deciding",
          "examples": [
            "Our compliance team needs to check.",
            "Send the details to our IT person."
          ],
          "target": "proposal_follow_up"
        }
      ]
    },
    {
      "key": "guarantees",
      "type": "message",
      "title": "Guarantees, SEO, and patient acquisition",
      "script": "I want to be clear: I can't guarantee a number of new patients, bookings, revenue, or a particular Google ranking. What I can control is the agreed website scope, mobile experience, clear calls to action, and basic on-page SEO setup. Results depend on factors beyond the website, including competition, reviews, offer, and ongoing marketing. Is that a reasonable starting point, or are you specifically looking for a guaranteed lead-generation service?",
      "internalNote": "Never promise medical outcomes, patient volume, SEO rankings, or revenue. Keep all cosmetic/treatment claims and before-and-after imagery supplied and approved by the practice.",
      "branches": [
        {
          "key": "realistic_expectations",
          "label": "Accepts the limitation and wants to continue",
          "examples": [
            "That's fair.",
            "We just need a better website."
          ],
          "target": "package_scope"
        },
        {
          "key": "needs_lead_service",
          "label": "Wants more extensive SEO or lead generation",
          "examples": [
            "We need someone to run SEO too.",
            "We need guaranteed leads."
          ],
          "target": "scope_extras"
        },
        {
          "key": "guarantee_is_required",
          "label": "Will only proceed with a guarantee",
          "examples": [
            "We need guaranteed results.",
            "Without that, it's not worth it."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "existing_site",
      "type": "message",
      "title": "They already have a website",
      "script": "That makes sense—you may not need a replacement. May I ask whether the current site makes it straightforward for someone on a phone to understand your services and request a consultation, or is there anything you’d like to improve?",
      "branches": [
        {
          "key": "site_needs_improvement",
          "label": "The site is dated or not generating enquiries",
          "examples": [
            "It's pretty old.",
            "We don't get enquiries from it."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "site_performs_well",
          "label": "The current site is working well",
          "examples": [
            "It's doing its job.",
            "We're happy with the site."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "agency_handles_site",
          "label": "An agency or marketing partner manages it",
          "examples": [
            "Our agency handles the website.",
            "Our marketing director owns that."
          ],
          "target": "agency"
        },
        {
          "key": "not_sure_site_results",
          "label": "They aren't sure how well it works",
          "examples": [
            "I don't know; marketing checks that.",
            "We've never measured it."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "need_think",
          "label": "They need time to think",
          "examples": [
            "I need to think about it."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "They want to compare providers",
          "examples": [
            "I want to shop around."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "They need to discuss with a partner",
          "examples": [
            "I need to speak with my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "They ask to be sent information",
          "examples": [
            "Just send me some information."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing is the issue",
          "examples": [
            "Now is not a good time."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "They are only browsing",
          "examples": [
            "I’m just looking."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "They pause after the pitch or price",
          "examples": [
            "They go quiet after the demo or price."
          ],
          "target": "objection_silence"
        }
      ]
    },
    {
      "key": "agency",
      "type": "message",
      "title": "An agency already handles marketing",
      "script": "No problem; I don’t want to interfere with a working relationship. Is there a specific website issue you’re looking to address, or is your current agency already handling everything you need?",
      "branches": [
        {
          "key": "can_share_with_team",
          "label": "Open to sharing it with their team",
          "examples": [
            "Send it over.",
            "Email it to our marketing manager."
          ],
          "target": "send_channel"
        },
        {
          "key": "needs_agency_approval",
          "label": "Needs to check with the agency or manager",
          "examples": [
            "I need to ask our agency first.",
            "Let me run it past the owner."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "agency_no_need",
          "label": "The agency relationship means no opportunity",
          "examples": [
            "We're covered, thanks.",
            "We don't need another supplier."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "demo_privacy",
      "type": "message",
      "title": "Explain the demo and data source transparently",
      "script": "I used publicly visible business information and generic placeholder content to create a private concept. It isn't live, it isn't connected to your systems, and I haven't used patient information or changed your current website. I can send the preview for you to inspect, or remove the concept if you'd prefer. What would you prefer?",
      "internalNote": "Only say this if it is accurate. Remove the demo promptly if requested. Do not use unapproved patient images, testimonials, or treatment claims in the concept.",
      "branches": [
        {
          "key": "okay_send_demo",
          "label": "Accepts the explanation and wants the demo",
          "examples": [
            "Okay, send me the link.",
            "That's fine; I'll take a look."
          ],
          "target": "send_channel"
        },
        {
          "key": "wants_portfolio",
          "label": "Wants portfolio or references first",
          "examples": [
            "Can I see your previous work?",
            "Do you have examples?"
          ],
          "target": "trust_and_proof"
        },
        {
          "key": "wants_demo_removed",
          "label": "Doesn't want the concept retained",
          "examples": [
            "Please delete it.",
            "I'd rather you remove our demo."
          ],
          "target": "demo_removed"
        }
      ]
    },
    {
      "key": "trust_and_proof",
      "type": "message",
      "title": "Trust, portfolio, and proof",
      "script": "Absolutely. I can share my portfolio at [Portfolio URL] and any live examples I'm permitted to show. The concept for your practice is only a proposal, not a claim that you've hired or endorsed me. You can review the link and written scope first, and there's no commitment just to look. Would you like me to send those details?",
      "internalNote": "Only share portfolio examples you are authorized to show. Never invent client names, testimonials, case-study results, or endorsements.",
      "branches": [
        {
          "key": "wants_details",
          "label": "Wants to review the examples",
          "examples": [
            "Yes, send me your portfolio.",
            "Okay, email me the links."
          ],
          "target": "send_channel"
        },
        {
          "key": "asks_where_based",
          "label": "Asks about location or identity",
          "examples": [
            "Where are you actually based?",
            "Are you a local company?"
          ],
          "target": "location_transparency"
        },
        {
          "key": "still_distrusts",
          "label": "Still doesn't feel comfortable",
          "examples": [
            "I'm not comfortable with this.",
            "I'll pass."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "location_transparency",
      "type": "message",
      "title": "Be transparent about working remotely",
      "script": "I'm based in Indonesia and work remotely with clients. I don't want to mislead you by presenting myself as a local agency. We can keep the scope and communication in writing, and your practice keeps control of its domain and accounts. Would you still like to see the concept, or is a local provider a requirement for you?",
      "branches": [
        {
          "key": "remote_is_fine",
          "label": "Remote collaboration is fine",
          "examples": [
            "Remote is fine.",
            "As long as communication is clear."
          ],
          "target": "send_channel"
        },
        {
          "key": "local_required",
          "label": "They require a local provider",
          "examples": [
            "We only work with local agencies.",
            "We need someone local."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "callback",
      "type": "message",
      "title": "They are busy — schedule a callback",
      "script": "No problem—I don't want to interrupt your day. Would a quick call later today or another day this week be better? I'm happy to keep it to five minutes.",
      "branches": [
        {
          "key": "gives_callback_time",
          "label": "Gives a specific callback time",
          "examples": [
            "Try me tomorrow at 10.",
            "Call Thursday afternoon."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "wants_email_instead",
          "label": "Would rather receive the demo by email or message",
          "examples": [
            "Just email it to me.",
            "Send a text with the link."
          ],
          "target": "send_channel"
        },
        {
          "key": "busy_no_interest",
          "label": "Doesn't want a callback or further discussion",
          "examples": [
            "No, we're not interested.",
            "Let's leave it."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "callback_dnc",
          "label": "Asks not to be contacted again",
          "examples": [
            "Don't call again.",
            "Take us off your list."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "gatekeeper",
      "type": "message",
      "title": "Reach the decision-maker respectfully",
      "script": "Understood. I made a private website concept for the practice and don't want to take up your time if someone else handles that. Who would be the right person to share it with, or is there a general business email I should use?",
      "branches": [
        {
          "key": "gets_contact_or_name",
          "label": "Provides the right name or business contact",
          "examples": [
            "Talk to Jamie, our practice manager.",
            "Use info@..."
          ],
          "target": "send_channel"
        },
        {
          "key": "owner_unavailable",
          "label": "Decision-maker is unavailable; offers a time",
          "examples": [
            "The owner is in on Friday.",
            "Call after lunch tomorrow."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "cannot_share_contact",
          "label": "Won't share details or isn't able to help",
          "examples": [
            "I can't give that information.",
            "We don't pass on calls."
          ],
          "target": "not_interested_close"
        },
        {
          "key": "gatekeeper_dnc",
          "label": "Asks not to contact the practice again",
          "examples": [
            "Please don't contact this business again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "proposal",
      "type": "message",
      "title": "Confirm the written scope before asking for a decision",
      "script": "Great. I'll send a short written scope showing the $400 one-time price, the included pages and CTA, one revision round, the timeline, and the exclusions we discussed. Before I send it, what's the best business email? Would it be okay to check back once in two business days, or would you prefer to contact me if it looks right?",
      "internalNote": "Do not take payment or start work on an ambiguous verbal scope. Confirm the exact pages, copy/assets supplied by the client, timeline, revision limit, hosting/domain responsibilities, and payment terms in writing.",
      "branches": [
        {
          "key": "proposal_followup_ok",
          "label": "Wants the written scope and agrees to one follow-up",
          "examples": [
            "Send it over and check in Thursday.",
            "Email the quote; a follow-up is fine."
          ],
          "target": "proposal_follow_up"
        },
        {
          "key": "proposal_no_followup",
          "label": "Wants the proposal but no follow-up",
          "examples": [
            "Send it and I'll get back to you.",
            "No need to follow up."
          ],
          "target": "proposal_no_followup"
        },
        {
          "key": "wants_review_call",
          "label": "Prefers to discuss the scope live",
          "examples": [
            "Let's review it on a call.",
            "Can you walk me through it?"
          ],
          "target": "schedule_review"
        },
        {
          "key": "scope_not_right",
          "label": "Doesn't agree with the scope or price",
          "examples": [
            "That's not what we had in mind.",
            "We need a different setup."
          ],
          "target": "scope_extras"
        },
        {
          "key": "need_think",
          "label": "They need time to think",
          "examples": [
            "I need to think about it."
          ],
          "target": "objection_think"
        },
        {
          "key": "compare_options",
          "label": "They want to compare providers",
          "examples": [
            "I want to shop around."
          ],
          "target": "objection_compare"
        },
        {
          "key": "need_partner_input",
          "label": "They need to discuss with a partner",
          "examples": [
            "I need to speak with my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_specific_info",
          "label": "They ask to be sent information",
          "examples": [
            "Just send me some information."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "not_now_timing",
          "label": "Timing is the issue",
          "examples": [
            "Now is not a good time."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking",
          "label": "They are only browsing",
          "examples": [
            "I’m just looking."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_pause",
          "label": "They pause after the pitch or price",
          "examples": [
            "They go quiet after the demo or price."
          ],
          "target": "objection_silence"
        }
      ]
    },
    {
      "key": "schedule_review",
      "type": "message",
      "title": "Book a 5–10 minute demo review",
      "script": "Happy to walk you through it. It should take around five to ten minutes. What day and time works for you in Eastern Time? I'll confirm the slot and send the preview link or calendar invite to your preferred business contact.",
      "internalNote": "The metro area uses Eastern Time. Confirm the exact date, time zone, email address, and whether they expect a phone call or video meeting. Do not invent an available slot.",
      "branches": [
        {
          "key": "confirms_time",
          "label": "Agrees on a specific time",
          "examples": [
            "Tuesday at 11 a.m. Eastern works.",
            "Thursday at 2 is good."
          ],
          "target": "meeting_booked"
        },
        {
          "key": "wants_link_first",
          "label": "Wants to see the preview before booking",
          "examples": [
            "Send the link first.",
            "I'll review it, then we can talk."
          ],
          "target": "send_channel"
        },
        {
          "key": "needs_later",
          "label": "Cannot pick a time yet",
          "examples": [
            "Check with me next week.",
            "I need to look at my calendar."
          ],
          "target": "follow_up_date"
        }
      ]
    },
    {
      "key": "follow_up_date",
      "type": "message",
      "title": "Agree on a specific next step",
      "script": "No problem. To avoid interrupting you at random, what's a reasonable day for me to check back? I can also send the preview and leave it with you if that's easier.",
      "branches": [
        {
          "key": "specific_followup_date",
          "label": "Agrees to a specific follow-up date or callback",
          "examples": [
            "Try me next Wednesday.",
            "Check back on November 5."
          ],
          "target": "follow_up_scheduled"
        },
        {
          "key": "send_without_followup",
          "label": "Wants the link but no follow-up",
          "examples": [
            "Just email it and I'll reach out.",
            "Send it with no follow-up."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "no_next_step",
          "label": "Does not want to schedule anything",
          "examples": [
            "Let's leave it for now.",
            "No need to follow up."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "soft_rejection",
      "type": "message",
      "title": "Soft rejection — ask permission to share WhatsApp contact",
      "script": "No worries at all, and thanks for being direct. One last thing, only if you use WhatsApp: would you be comfortable with me sending one short message with my contact details so you can save my number in case a website project comes up later? No pressure, and I won't send sales follow-ups unless you invite me to. Totally fine if not.",
      "internalNote": "Use this only after a soft rejection—not after an explicit request to stop contact, a do-not-call request, or a privacy complaint. If they say no or hesitate, close politely. Do not send WhatsApp unless they explicitly agree and applicable rules/policies allow it.",
      "branches": [
        {
          "key": "allows_contact_message",
          "label": "Explicitly agrees to one WhatsApp contact message",
          "examples": [
            "Sure, send your contact.",
            "Okay, I'll save it."
          ],
          "target": "whatsapp_contact_permission"
        },
        {
          "key": "declines_contact_message",
          "label": "Declines or gives an uncertain answer",
          "examples": [
            "No, thanks.",
            "I'd rather not.",
            "Maybe not."
          ],
          "target": "not_interested_close"
        },
        {
          "key": "does_not_use_whatsapp",
          "label": "Doesn't use WhatsApp",
          "examples": [
            "I don't use WhatsApp.",
            "Email is enough."
          ],
          "target": "not_interested_close"
        }
      ]
    },
    {
      "key": "whatsapp_contact_permission",
      "type": "outcome",
      "title": "Permission granted — send one contact message",
      "outcomeKey": "other",
      "script": "Thanks, I appreciate it. I'll send one short WhatsApp message with my name, portfolio at [Portfolio URL], and the demo link at [Demo URL] so you can save the contact. I'll leave it there unless you reach out or invite me to follow up.",
      "internalNote": "Send only the single message they agreed to. Do not put them into a broadcast list or marketing sequence. Record the permission and any limits they stated."
    },
    {
      "key": "demo_sent_followup",
      "type": "outcome",
      "title": "Demo sent — one follow-up permitted",
      "outcomeKey": "follow_up_later",
      "script": "Perfect. I'll send the private preview at [Demo URL] to [approved channel/contact] today and check back once in two business days, as agreed. The preview is for review only; nothing will go live unless you approve the written scope.",
      "internalNote": "Record the approved channel, exact contact, and agreed follow-up date. Follow up only once unless they invite further contact."
    },
    {
      "key": "demo_sent_no_followup",
      "type": "outcome",
      "title": "Demo sent — no follow-up requested",
      "outcomeKey": "interested_no_meeting",
      "script": "Absolutely. I'll send the private preview at [Demo URL] to [approved channel/contact] and leave it with you. No follow-up from me—if it looks useful, you can reach me using the contact details in the message.",
      "internalNote": "Do not create a follow-up task for this prospect. Wait for them to reply or re-open the conversation themselves."
    },
    {
      "key": "reduced_scope_followup",
      "type": "outcome",
      "title": "Smaller-scope quote requested — follow-up agreed",
      "outcomeKey": "follow_up_later",
      "script": "I'll prepare a separately priced one-page option and send it to [business email]. I'll check back once on [agreed date], as requested. The final price and deliverables will be written clearly before you decide.",
      "internalNote": "Don't assume the $400 five-page price applies to a smaller scope. Confirm the actual deliverables and quote before sending it."
    },
    {
      "key": "reduced_scope_no_followup",
      "type": "outcome",
      "title": "Smaller-scope quote requested — no follow-up",
      "outcomeKey": "interested_no_meeting",
      "script": "I'll prepare a separately priced one-page option and send it to [business email]. I'll leave the next step with you and won't follow up unless you ask me to.",
      "internalNote": "Do not schedule a follow-up task for this prospect."
    },
    {
      "key": "separate_scope_quote_followup",
      "type": "outcome",
      "title": "Advanced-scope review requested — follow-up agreed",
      "outcomeKey": "follow_up_later",
      "script": "Thanks. Once I receive the non-sensitive requirements at [business email/contact], I'll review whether the work is feasible and send a separate written quote. I'll check back once on [agreed date], as agreed.",
      "internalNote": "This is not a fixed quote or a commitment to implement the integration. Review feasibility and compliance needs first."
    },
    {
      "key": "separate_scope_quote_no_followup",
      "type": "outcome",
      "title": "Advanced-scope review requested — no follow-up",
      "outcomeKey": "interested_no_meeting",
      "script": "Once I receive the non-sensitive requirements at [business email/contact], I'll review feasibility and reply with the next step. I'll leave it with you and won't send a separate follow-up.",
      "internalNote": "Do not schedule unsolicited follow-ups; don't accept credentials or patient information as part of this outreach."
    },
    {
      "key": "proposal_follow_up",
      "type": "outcome",
      "title": "Written scope sent — follow-up agreed",
      "outcomeKey": "follow_up_later",
      "script": "Thanks. I'll send the written scope and quote to [business email], then check back on [agreed date]. You'll be able to review the deliverables and exclusions before deciding.",
      "internalNote": "Add the agreed follow-up date to the CRM. Send a real, written scope; don't imply that the prospect has already approved the work."
    },
    {
      "key": "proposal_no_followup",
      "type": "outcome",
      "title": "Written scope sent — prospect will respond",
      "outcomeKey": "interested_no_meeting",
      "script": "I'll send the written scope and quote to [business email]. Thanks for taking a look. I'll leave the next step with you and won't follow up unless you ask me to.",
      "internalNote": "Do not schedule unsolicited follow-ups. Wait for a reply."
    },
    {
      "key": "follow_up_scheduled",
      "type": "outcome",
      "title": "Callback or follow-up scheduled",
      "outcomeKey": "follow_up_later",
      "script": "Great, I'll contact you on [agreed date/time] using [agreed channel]. Thanks for your time, and I'll keep it brief.",
      "internalNote": "Record the exact local date/time, Eastern Time zone, channel, and agreed purpose. If they asked for a callback only, do not send extra messages as well."
    },
    {
      "key": "meeting_booked",
      "type": "outcome",
      "title": "Demo review booked",
      "outcomeKey": "meeting_booked",
      "script": "Perfect—we're set for [date] at [time] Eastern. I'll send the calendar invitation and private demo link to [business email/contact]. We'll review the concept, confirm whether the scope fits, and I'll answer any questions. Thanks for your time.",
      "internalNote": "Confirm the actual appointment details and delivery channel before ending the call. Do not mark the deal as won; this is a demo-review booking, not a completed sale."
    },
    {
      "key": "demo_removed",
      "type": "outcome",
      "title": "Demo removal requested",
      "outcomeKey": "other",
      "script": "Understood. I'll remove the private concept and won't use it in outreach. Thanks for letting me know, and I apologize for the interruption.",
      "internalNote": "Actually remove or disable the demo promptly, and record the request. If they also asked not to be contacted, mark do-not-contact."
    },
    {
      "key": "not_interested_close",
      "type": "outcome",
      "title": "Polite close — no contact permission",
      "outcomeKey": "not_interested",
      "script": "No problem at all. Thanks for your time, and I hope you have a good rest of your day.",
      "internalNote": "Don't ask again to save WhatsApp after a refusal. If the prospect's answer was an explicit do-not-contact request, use the do-not-contact outcome instead."
    },
    {
      "key": "do_not_contact",
      "type": "outcome",
      "title": "Do not contact — respect the request",
      "outcomeKey": "not_interested",
      "script": "Understood. I'll mark this number/business as do-not-contact and won't call or message again. Sorry for the interruption.",
      "internalNote": "Immediately add the relevant number/business to your suppression or do-not-contact list. Do not ask to send WhatsApp, email, or any other follow-up."
    },
    {
      "key": "wrong_contact",
      "type": "outcome",
      "title": "Wrong contact or number",
      "outcomeKey": "other",
      "script": "Sorry about that, and thanks for letting me know. I won't keep you. Have a good day.",
      "internalNote": "Correct or suppress the number in your prospect list so it isn't dialed again by mistake."
    },
    {
      "key": "objection_think",
      "type": "message",
      "title": "Objection — “I need to think about it”",
      "script": "“Absolutely, take your time. So I don’t guess at what you need, what part are you still weighing up—the budget, the design/demo, the timing, or whether the website would solve a real business need?”",
      "internalNote": "Ask one question, then pause and listen. Avoid a long rebuttal. Route to the specific issue once they answer.",
      "branches": [
        {
          "key": "budget",
          "label": "Budget / price",
          "examples": [
            "Budget-nya dulu yang perlu dipastikan.",
            "The budget is the main question."
          ],
          "target": "objection_expensive"
        },
        {
          "key": "demo",
          "label": "Design/demo",
          "examples": [
            "Aku masih belum yakin dengan desainnya.",
            "I’m not sure about the design yet."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "timing",
          "label": "Timing is not right",
          "examples": [
            "Belum waktu yang pas.",
            "The timing isn’t right."
          ],
          "target": "objection_timing"
        },
        {
          "key": "business_value",
          "label": "Business value is unclear",
          "examples": [
            "Aku belum lihat manfaatnya.",
            "I’m not sure it’s worth it."
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "partner",
          "label": "Partner approval",
          "examples": [
            "Aku perlu diskusi dengan partner.",
            "I need to discuss it with my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "no_detail",
          "label": "Needs more time",
          "examples": [
            "Belum bisa bilang sekarang.",
            "I need a bit more time."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "declines",
          "label": "Not proceeding",
          "examples": [
            "Kayaknya nggak dulu.",
            "I’ll pass for now."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
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
      "script": "“That’s fair, thanks for being upfront. Can I ask whether it feels expensive because of the budget you’ve set, because you’re comparing other quotes, or because the value isn’t clear yet?”",
      "internalNote": "Do not discount immediately. Identify the reason first, then explain only the relevant scope or value.",
      "branches": [
        {
          "key": "budget_limit",
          "label": "Limited budget",
          "examples": [
            "Budget yang tersedia memang terbatas.",
            "The budget is limited."
          ],
          "target": "budget_objection"
        },
        {
          "key": "comparing",
          "label": "Comparing quotes",
          "examples": [
            "Aku sedang bandingkan harga.",
            "I’m comparing quotes."
          ],
          "target": "objection_compare"
        },
        {
          "key": "value_unclear",
          "label": "Value is unclear",
          "examples": [
            "Belum yakin manfaatnya sepadan.",
            "I’m not sure the value is there."
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "scope_unclear",
          "label": "Scope is unclear",
          "examples": [
            "Aku belum jelas apa yang termasuk.",
            "I’m not clear what’s included."
          ],
          "target": "package_scope"
        },
        {
          "key": "discount",
          "label": "Asking for a discount",
          "examples": [
            "Bisa kurang lagi?",
            "Can you do a better price?"
          ],
          "target": "price"
        },
        {
          "key": "not_budgeted",
          "label": "No budget",
          "examples": [
            "Belum ada anggarannya.",
            "There isn’t a budget for this."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
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
      "script": "“Of course, it makes sense to discuss it together. What do you think your partner will care about most—the cost, design, features, or timing? I can prepare a short summary, or we can walk through the demo together.”",
      "internalNote": "Do not assume what the partner thinks. Help identify likely criteria and offer a next step only with permission.",
      "branches": [
        {
          "key": "partner_cost",
          "label": "Partner likely focused on cost",
          "examples": [
            "Paling mungkin soal biaya.",
            "They’ll probably focus on cost."
          ],
          "target": "price"
        },
        {
          "key": "partner_scope",
          "label": "Partner needs scope details",
          "examples": [
            "Mereka perlu tahu apa yang termasuk.",
            "They’ll want to understand the scope."
          ],
          "target": "package_scope"
        },
        {
          "key": "joint_review",
          "label": "Joint review",
          "examples": [
            "Bisa presentasi ke kami berdua?",
            "Could you walk us both through it?"
          ],
          "target": "schedule_review"
        },
        {
          "key": "summary",
          "label": "Written summary requested",
          "examples": [
            "Kirim ringkasannya dulu.",
            "Send a short summary first."
          ],
          "target": "send_channel"
        },
        {
          "key": "date_later",
          "label": "No discussion timeline yet",
          "examples": [
            "Aku belum tahu kapan bisa diskusi.",
            "I’m not sure when we can discuss it."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "partner_declines",
          "label": "Partner is not interested / no next step",
          "examples": [
            "Sepertinya kami tidak lanjut.",
            "We probably won’t proceed."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
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
      "script": "“Happy to. So I send something useful rather than a generic brochure, what would you like to see—the demo, pricing and scope, examples of my work, or an answer to a specific question?”",
      "internalNote": "Clarify what they want before sending. If they request no follow-up, record that and honour it.",
      "branches": [
        {
          "key": "wants_demo",
          "label": "Wants to see the demo",
          "examples": [
            "Kirim link demonya.",
            "Send me the demo."
          ],
          "target": "send_channel"
        },
        {
          "key": "wants_pricing",
          "label": "Wants pricing and scope",
          "examples": [
            "Kirim harga dan apa saja yang termasuk.",
            "Send the price and inclusions."
          ],
          "target": "price"
        },
        {
          "key": "wants_proof",
          "label": "Wants work examples / proof",
          "examples": [
            "Ada contoh website lain?",
            "Do you have examples?"
          ],
          "target": "trust_and_proof"
        },
        {
          "key": "specific_question",
          "label": "Has a specific concern",
          "examples": [
            "Aku masih ada pertanyaan.",
            "I still have a question."
          ],
          "target": "objection_think"
        },
        {
          "key": "send_only",
          "label": "Information only, no follow-up",
          "examples": [
            "Kirim saja, nggak perlu follow-up.",
            "Send it, but no follow-up."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "declines_info",
          "label": "Does not want information sent",
          "examples": [
            "Nggak usah, terima kasih.",
            "No need, thanks."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
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
      "script": "“That makes sense. When comparing options, what’s the one thing that matters most to you—price, design quality, features, the build process, or support after launch?”",
      "internalNote": "Never disparage other developers. Compare written deliverables transparently once you know their criteria.",
      "branches": [
        {
          "key": "compare_price",
          "label": "Main criterion: price",
          "examples": [
            "Yang utama harga.",
            "Price is the main factor."
          ],
          "target": "price_comparison"
        },
        {
          "key": "compare_design",
          "label": "Main criterion: design",
          "examples": [
            "Aku mau desain yang cocok.",
            "Design is the main factor."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "compare_features",
          "label": "Main criterion: features/scope",
          "examples": [
            "Aku bandingkan fitur.",
            "I’m comparing features."
          ],
          "target": "package_scope"
        },
        {
          "key": "compare_support",
          "label": "Main criterion: support and trust",
          "examples": [
            "Aku perlu yakin soal support.",
            "Support and trust matter most."
          ],
          "target": "trust_and_proof"
        },
        {
          "key": "compare_unsure",
          "label": "Criteria not clear",
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
          "label": "Do not contact",
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
      "script": "“Understood—I don’t want to interrupt a busy period. Apart from timing, is anything else holding you back, or would it be better to reconnect at a particular time?”",
      "internalNote": "Do not push for a follow-up date. Record only an agreed time, and do not follow up without permission.",
      "branches": [
        {
          "key": "timing_only",
          "label": "Timing only",
          "examples": [
            "Sekarang lagi sibuk, coba bulan depan.",
            "It’s just timing; try next month."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "other_concern",
          "label": "Another concern",
          "examples": [
            "Sebenarnya ada hal lain juga.",
            "There is something else too."
          ],
          "target": "objection_think"
        },
        {
          "key": "no_followup",
          "label": "No follow-up",
          "examples": [
            "Nggak usah follow-up.",
            "No follow-up, please."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "partner",
          "label": "Partner approval",
          "examples": [
            "Aku perlu diskusi dulu.",
            "I need to discuss it first."
          ],
          "target": "objection_partner"
        },
        {
          "key": "declines",
          "label": "Decided not to proceed",
          "examples": [
            "Kami tidak lanjut ya.",
            "We won’t proceed."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
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
      "script": "“No problem. Could I ask just one thing? If the website worked exactly as you needed, what would you want it to improve—making enquiries easier, explaining your services, or helping customers contact you?”",
      "internalNote": "The goal is to understand a real need, not manufacture one. If there is no need, accept that and close politely.",
      "branches": [
        {
          "key": "clear_goal",
          "label": "Has a need to improve",
          "examples": [
            "Paling ingin lebih mudah dihubungi.",
            "We want enquiries to be easier."
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "wants_demo",
          "label": "Wants to see the demo first",
          "examples": [
            "Boleh lihat demo dulu.",
            "I’d like to see the demo first."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "not_clear",
          "label": "No clear need yet",
          "examples": [
            "Belum ada hal spesifik.",
            "Nothing specific yet."
          ],
          "target": "send_channel"
        },
        {
          "key": "later",
          "label": "Maybe later",
          "examples": [
            "Mungkin nanti.",
            "Maybe later."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "not_interested",
          "label": "Not interested",
          "examples": [
            "Nggak tertarik, terima kasih.",
            "Not interested, thanks."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
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
      "script": "After showing the demo or stating the price, pause for a few seconds. Don’t fill the silence with more features. If needed, ask calmly: “What are your thoughts so far? Is there anything you’d like me to clarify?” Then listen.",
      "internalNote": "Silence is not automatically rejection. Give space and ask only one calm question if needed.",
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
      "script": "“For your practice, what would a useful website improve first—helping visitors understand services, find accurate practice information, or request a consultation? I’m asking so I can focus on the part that matters to you, not assume what you need.”",
      "internalNote": "Tie their answer to one relevant part of the demo or scope. Never promise revenue, rankings, bookings, patients, or lead volume.",
      "branches": [
        {
          "key": "goal_enquiries",
          "label": "Wants a clearer enquiry/booking/contact path",
          "examples": [
            "Clearer enquiries and contact path.",
            "More booking or quote enquiries."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "goal_information",
          "label": "Wants clearer service information",
          "examples": [
            "Make services and details clearer.",
            "Customers need clearer information."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "goal_scope",
          "label": "Needs a specific feature",
          "examples": [
            "We need a specific feature.",
            "There are some custom requirements."
          ],
          "target": "package_scope"
        },
        {
          "key": "no_priority",
          "label": "No priority at the moment",
          "examples": [
            "Nothing is a priority right now.",
            "The current setup is fine."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "not_sure",
          "label": "Not sure what the need is yet",
          "examples": [
            "I’m not sure yet.",
            "Just exploring for now."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Please do not contact us again."
          ],
          "target": "do_not_contact"
        }
      ]
    }
  ]
};
