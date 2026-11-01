import type { CallbookTemplate } from "./types";

/**
 * Consultative, demo-first outreach callbook. Edit placeholders and verify every factual claim before use.
 */
export const australiaPlumberOutdatedWebsiteOutreach: CallbookTemplate = {
  "id": "australia-plumber-outdated-website-demo-refresh",
  "name": "Australia Plumber — Outdated Website Refresh",
  "description": "Consultative cold-call callbook for Australian plumbing businesses with an existing website that may need a refresh. A business-specific demo has been prepared; the goal is a short review, not an immediate hard sell.",
  "targetAudience": "Owner-operated plumbing businesses and small plumbing contractors in Australia (residential, commercial, maintenance, renovations and new builds).",
  "primaryGoal": "book_meeting",
  "marketCode": "AU",
  "nicheName": "Plumbing",
  "guidance": "Assume the business greets first. Respond, then ask for the owner or the person responsible for the website/marketing. Demo has been made specifically for this business, but it is an unpublished concept—not the official site and not an approved project. No fixed Australian-dollar price was supplied for this template, so do not invent one; scope and quote must be confirmed in writing. Keep the call calm and short. Ask before sending a link or following up. If they ask not to be contacted, end immediately and mark DNC. For Australian telemarketing, check the latest ACMA/Do Not Call Register requirements, call only within permitted times, identify yourself and the business/purpose, use caller ID, and terminate immediately on request. Consultative objection handling: acknowledge first, ask one diagnostic question, listen, respond only to the stated issue, and agree on a next step. Do not rebut immediately, over-explain features, or discount before understanding the concern. Pause after demo and price. Respect do-not-contact requests immediately.",
  "startKey": "opening",
  "nodes": [
    {
      "key": "opening",
      "type": "message",
      "title": "Opening — after they greet you, ask for the owner",
      "script": "Hi, thanks for answering. My name is [Your Name] from [Your Business]. Quick question—am I speaking with the owner of [Plumbing Business], or would the owner or person who looks after the website be available for a moment?",
      "internalNote": "Start after their greeting. Speak plainly and do not pretend to be a customer. Identify yourself, your business and the purpose promptly.",
      "branches": [
        {
          "key": "owner",
          "label": "They are the owner/decision-maker",
          "examples": [
            "Speaking.",
            "I’m the owner.",
            "I look after the website."
          ],
          "target": "owner_intro"
        },
        {
          "key": "transfer",
          "label": "They offer to transfer",
          "examples": [
            "I’ll see if they’re available.",
            "One moment."
          ],
          "target": "transfer_result"
        },
        {
          "key": "gatekeeper",
          "label": "They are staff or the owner is away",
          "examples": [
            "I’m on the front desk.",
            "The owner isn’t here."
          ],
          "target": "gatekeeper"
        },
        {
          "key": "asks_why",
          "label": "They ask what the call is about",
          "examples": [
            "What’s this regarding?",
            "Who’s calling?"
          ],
          "target": "gatekeeper_reason"
        },
        {
          "key": "busy",
          "label": "They are busy",
          "examples": [
            "I’m on a job.",
            "Now’s not a good time."
          ],
          "target": "callback"
        },
        {
          "key": "soft_no",
          "label": "General soft rejection",
          "examples": [
            "Not interested, thanks.",
            "We’re all good."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "They explicitly ask not to be contacted",
          "examples": [
            "Don’t call again.",
            "Remove this number."
          ],
          "target": "do_not_contact"
        },
        {
          "key": "wrong",
          "label": "Wrong business or number",
          "examples": [
            "You’ve got the wrong number.",
            "We’re not a plumbing business."
          ],
          "target": "wrong_contact"
        }
      ]
    },
    {
      "key": "transfer_result",
      "type": "message",
      "title": "Transfer to owner",
      "script": "Thanks, I appreciate it. [Pause and wait for the transfer.]",
      "branches": [
        {
          "key": "connected",
          "label": "Owner comes on the line",
          "examples": [
            "Hi, speaking."
          ],
          "target": "owner_intro"
        },
        {
          "key": "unavailable",
          "label": "Owner is unavailable",
          "examples": [
            "They’re out on a job.",
            "Try later."
          ],
          "target": "callback"
        },
        {
          "key": "asks_reason",
          "label": "They ask what it is about",
          "examples": [
            "What’s this call about?"
          ],
          "target": "gatekeeper_reason"
        },
        {
          "key": "soft_no",
          "label": "They decline",
          "examples": [
            "Not interested."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "They request no further calls",
          "examples": [
            "Don’t call again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "gatekeeper",
      "type": "message",
      "title": "Speaking with a receptionist, office manager or staff member",
      "script": "No worries. I’m [Your Name] from [Your Business]. I’ve prepared a website concept specifically for [Business Name] and wanted to ask the owner one quick question about it. Is there a good time to reach them, or would you prefer to pass on my details?",
      "branches": [
        {
          "key": "transfer",
          "label": "Can transfer now",
          "examples": [
            "I’ll put you through."
          ],
          "target": "transfer_result"
        },
        {
          "key": "time",
          "label": "Gives the owner’s availability",
          "examples": [
            "Try after 3pm.",
            "They’re in tomorrow morning."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "share",
          "label": "Can pass on a message",
          "examples": [
            "I can pass that on.",
            "Send me your details."
          ],
          "target": "gatekeeper_reason"
        },
        {
          "key": "declines",
          "label": "Cannot help / not interested",
          "examples": [
            "We don’t pass on sales calls."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Requests no further contact",
          "examples": [
            "Please remove us."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "gatekeeper_reason",
      "type": "message",
      "title": "Explain the reason to staff",
      "script": "It’s a website concept for [Business Name], not a request to change anything today. I noticed [one verified observation / that I couldn’t find an active official site] and made a private demo so the owner can decide whether it’s useful. I’m happy to send a short note if they’re open to it. What’s the best way to pass that on?",
      "branches": [
        {
          "key": "transfer",
          "label": "Transfer to owner",
          "examples": [
            "I’ll put you through."
          ],
          "target": "transfer_result"
        },
        {
          "key": "contact_time",
          "label": "Suggests a time to reach owner",
          "examples": [
            "Call around 4pm."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "send_allowed",
          "label": "Permits sending a short message",
          "examples": [
            "Send your details."
          ],
          "target": "send_channel"
        },
        {
          "key": "no_info",
          "label": "Won’t share contact details",
          "examples": [
            "I can’t give out their number."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Requests no further contact",
          "examples": [
            "Don’t contact us again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "owner_intro",
      "type": "message",
      "title": "Owner identified — short, respectful introduction",
      "script": "Thanks for taking a moment. I’m [Your Name] from [Your Business]. I had a look at your current website and noticed [one specific, verified observation]. I’ve put together a private refresh concept—not because the current site is necessarily failing, but so you can compare another approach. Would you be open to a quick 20-second explanation?",
      "internalNote": "Do not criticise the current site or claim the new site will generate jobs. State only a verified observation and ask permission to continue.",
      "branches": [
        {
          "key": "hear_pitch",
          "label": "They are open to hearing more",
          "examples": [
            "Sure, go ahead.",
            "What have you put together?"
          ],
          "target": "demo_pitch"
        },
        {
          "key": "show_demo",
          "label": "They want to see the demo",
          "examples": [
            "Show me.",
            "Can you send it?"
          ],
          "target": "send_channel"
        },
        {
          "key": "asks_price",
          "label": "They ask about price",
          "examples": [
            "What does it cost?",
            "How much are you charging?"
          ],
          "target": "price"
        },
        {
          "key": "existing_site",
          "label": "They say they already have a website",
          "examples": [
            "We already have a site.",
            "Our website is fine."
          ],
          "target": "existing_site"
        },
        {
          "key": "busy",
          "label": "They are busy",
          "examples": [
            "I’m heading to a job.",
            "Can you call later?"
          ],
          "target": "callback"
        },
        {
          "key": "partner",
          "label": "They need to discuss with someone",
          "examples": [
            "I need to speak to my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "think",
          "label": "They need time to think",
          "examples": [
            "I’ll think about it."
          ],
          "target": "objection_think"
        },
        {
          "key": "not_interested",
          "label": "They decline",
          "examples": [
            "Not interested, thanks."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "They ask not to be contacted",
          "examples": [
            "Don’t call again."
          ],
          "target": "do_not_contact"
        },
        {
          "key": "think_objection",
          "label": "Needs time to think",
          "examples": [
            "I need to think about it."
          ],
          "target": "objection_think"
        },
        {
          "key": "price_objection",
          "label": "Price feels too high",
          "examples": [
            "That’s expensive."
          ],
          "target": "objection_expensive"
        },
        {
          "key": "partner_objection",
          "label": "Needs to speak with partner",
          "examples": [
            "I need to ask my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_info_objection",
          "label": "Just send information",
          "examples": [
            "Just send me some information."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "compare_objection",
          "label": "Wants to shop around",
          "examples": [
            "I’m comparing providers."
          ],
          "target": "objection_compare"
        },
        {
          "key": "timing_objection",
          "label": "Timing is not right",
          "examples": [
            "Now’s not a good time."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking_objection",
          "label": "Just looking",
          "examples": [
            "I’m just looking."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_objection",
          "label": "Silence after pitch/price",
          "examples": [
            "[Pause after pitch or price]"
          ],
          "target": "objection_silence"
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
      "title": "Pitch the website concept, then pause",
      "script": "I made a tailored concept to make it straightforward for a customer to see the services you offer, the areas you cover, and how to call or request a quote. I focused on [elements actually present in the demo]. It’s just an alternative to review—not a promise of extra jobs or a claim that your current site is bad. Would a five-minute look be useful, or would you rather I send a link if you’re happy to receive it?",
      "internalNote": "Keep the pitch under 25 seconds. After the final question, stop speaking and listen. Use one diagnostic question instead of rebutting an objection.",
      "branches": [
        {
          "key": "walkthrough",
          "label": "Interested in a short walkthrough",
          "examples": [
            "Could you show me?",
            "Let’s have a look."
          ],
          "target": "schedule_review"
        },
        {
          "key": "link_only",
          "label": "Wants the link only",
          "examples": [
            "Send the link.",
            "Email it to me."
          ],
          "target": "send_channel"
        },
        {
          "key": "why_demo",
          "label": "Asks why you made it or about privacy",
          "examples": [
            "Why did you make this?",
            "Is this live?"
          ],
          "target": "demo_privacy"
        },
        {
          "key": "price",
          "label": "Asks price",
          "examples": [
            "How much?",
            "What’s your fee?"
          ],
          "target": "price"
        },
        {
          "key": "features",
          "label": "Asks about service pages, areas, quote form or booking",
          "examples": [
            "Can it show service areas?",
            "Can customers request quotes?"
          ],
          "target": "scope"
        },
        {
          "key": "think",
          "label": "Needs to think",
          "examples": [
            "I need to think about it."
          ],
          "target": "objection_think"
        },
        {
          "key": "expensive",
          "label": "Says it is expensive",
          "examples": [
            "That sounds expensive."
          ],
          "target": "objection_expensive"
        },
        {
          "key": "partner",
          "label": "Needs partner input",
          "examples": [
            "I should run it past my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "info",
          "label": "Just send information",
          "examples": [
            "Send me some information."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "compare",
          "label": "Shopping around",
          "examples": [
            "I’m getting a few quotes."
          ],
          "target": "objection_compare"
        },
        {
          "key": "timing",
          "label": "Timing is not right",
          "examples": [
            "Now isn’t a good time."
          ],
          "target": "objection_timing"
        },
        {
          "key": "looking",
          "label": "Just looking",
          "examples": [
            "I’m just looking."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence",
          "label": "They go quiet after the pitch",
          "examples": [
            "[Pause / no answer]"
          ],
          "target": "objection_silence"
        },
        {
          "key": "soft_no",
          "label": "Soft rejection",
          "examples": [
            "Not right now, thanks."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Explicit no-contact request",
          "examples": [
            "Do not contact me again."
          ],
          "target": "do_not_contact"
        },
        {
          "key": "think_objection",
          "label": "Needs time to think",
          "examples": [
            "I need to think about it."
          ],
          "target": "objection_think"
        },
        {
          "key": "price_objection",
          "label": "Price feels too high",
          "examples": [
            "That’s expensive."
          ],
          "target": "objection_expensive"
        },
        {
          "key": "partner_objection",
          "label": "Needs to speak with partner",
          "examples": [
            "I need to ask my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_info_objection",
          "label": "Just send information",
          "examples": [
            "Just send me some information."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "compare_objection",
          "label": "Wants to shop around",
          "examples": [
            "I’m comparing providers."
          ],
          "target": "objection_compare"
        },
        {
          "key": "timing_objection",
          "label": "Timing is not right",
          "examples": [
            "Now’s not a good time."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking_objection",
          "label": "Just looking",
          "examples": [
            "I’m just looking."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_objection",
          "label": "Silence after pitch/price",
          "examples": [
            "[Pause after pitch or price]"
          ],
          "target": "objection_silence"
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
      "key": "existing_site",
      "type": "message",
      "title": "They say they already have a website",
      "script": "That makes sense—having a site already may mean you don’t need a replacement. May I ask: does the current site make it easy for customers to see your services and service areas and request a quote, or is there anything you would like it to do better?",
      "branches": [
        {
          "key": "works_well",
          "label": "Current website is doing the job",
          "examples": [
            "It works fine for us.",
            "We’re happy with it."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "needs_refresh",
          "label": "Wants to compare a refreshed design",
          "examples": [
            "Could be better on mobile.",
            "I’d look at an alternative."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "agency",
          "label": "Another person/agency handles it",
          "examples": [
            "Our agency manages that.",
            "My son handles our site."
          ],
          "target": "agency"
        },
        {
          "key": "updating",
          "label": "Already updating the site",
          "examples": [
            "We’re rebuilding it now."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "unknown",
          "label": "Unsure whether current site works well",
          "examples": [
            "I’m not sure."
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Please don’t contact us again."
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
        }
      ]
    },
    {
      "key": "demo_privacy",
      "type": "message",
      "title": "Transparency about the demo",
      "script": "The preview is a concept I made using publicly available business information and assumptions that need your approval. It isn’t live, it doesn’t replace your current website, and I won’t publish it or claim you’re a client without permission. If you’d like, I can show the preview or remove it if you prefer.",
      "branches": [
        {
          "key": "okay_demo",
          "label": "Interested in reviewing the demo",
          "examples": [
            "That’s fine, show me."
          ],
          "target": "schedule_review"
        },
        {
          "key": "portfolio",
          "label": "Wants portfolio or identity details",
          "examples": [
            "Can I see other work?",
            "Who are you working with?"
          ],
          "target": "trust"
        },
        {
          "key": "remove",
          "label": "Asks for the demo to be removed",
          "examples": [
            "Please take it down.",
            "Remove it."
          ],
          "target": "demo_removed"
        },
        {
          "key": "no",
          "label": "Does not want to proceed",
          "examples": [
            "No thanks."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "No further contact",
          "examples": [
            "Do not contact us again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "need_discovery",
      "type": "message",
      "title": "Discover the plumbing business priority",
      "script": "So I don’t build around the wrong thing, what kind of work is most important for you to communicate online—residential repairs, maintenance, hot water, blocked drains, renovations, commercial work, or something else? And what areas do you cover?",
      "branches": [
        {
          "key": "simple_info",
          "label": "Main need is service and area information",
          "examples": [
            "Mainly services and suburbs.",
            "We need to show the areas we cover."
          ],
          "target": "scope"
        },
        {
          "key": "quote_path",
          "label": "Main need is quote or call enquiries",
          "examples": [
            "We need more straightforward quote requests.",
            "Make it easier to call us."
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "specific_service",
          "label": "Needs dedicated pages for services",
          "examples": [
            "We want each service listed."
          ],
          "target": "scope"
        },
        {
          "key": "complex_system",
          "label": "Needs dispatch, live booking, payments or job system",
          "examples": [
            "We need live booking/dispatch.",
            "Can it integrate with our job system?"
          ],
          "target": "scope"
        },
        {
          "key": "not_sure",
          "label": "Not sure yet",
          "examples": [
            "We’re not sure."
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "no_need",
          "label": "No current need",
          "examples": [
            "We don’t need anything at the moment."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "price",
      "type": "message",
      "title": "Price question — clarify scope before quoting",
      "script": "I don’t want to quote a made-up number before I understand the scope. Is the main concern the budget you’ve set, what the site would include, or whether a website would solve a real business problem? Once I understand that, I can send a clear written quote in AUD.",
      "branches": [
        {
          "key": "budget",
          "label": "Budget is the concern",
          "examples": [
            "I have a budget in mind.",
            "That’s a bit expensive."
          ],
          "target": "objection_expensive"
        },
        {
          "key": "scope",
          "label": "Wants to know what is included",
          "examples": [
            "What would be included?"
          ],
          "target": "scope"
        },
        {
          "key": "value",
          "label": "Not sure it is worth it",
          "examples": [
            "Will it actually help?"
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "fixed_quote",
          "label": "Wants a clear written quote",
          "examples": [
            "Can you send a quote?"
          ],
          "target": "proposal"
        },
        {
          "key": "ballpark",
          "label": "Insists on a price range",
          "examples": [
            "Can you at least give me a range?"
          ],
          "target": "quote_range"
        },
        {
          "key": "custom",
          "label": "Needs custom systems",
          "examples": [
            "We need online scheduling and dispatch."
          ],
          "target": "scope"
        },
        {
          "key": "declines",
          "label": "No budget or no interest",
          "examples": [
            "We won’t spend on a website."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Don’t call again."
          ],
          "target": "do_not_contact"
        },
        {
          "key": "think_objection",
          "label": "Needs time to think",
          "examples": [
            "I need to think about it."
          ],
          "target": "objection_think"
        },
        {
          "key": "price_objection",
          "label": "Price feels too high",
          "examples": [
            "That’s expensive."
          ],
          "target": "objection_expensive"
        },
        {
          "key": "partner_objection",
          "label": "Needs to speak with partner",
          "examples": [
            "I need to ask my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_info_objection",
          "label": "Just send information",
          "examples": [
            "Just send me some information."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "compare_objection",
          "label": "Wants to shop around",
          "examples": [
            "I’m comparing providers."
          ],
          "target": "objection_compare"
        },
        {
          "key": "timing_objection",
          "label": "Timing is not right",
          "examples": [
            "Now’s not a good time."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking_objection",
          "label": "Just looking",
          "examples": [
            "I’m just looking."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_objection",
          "label": "Silence after pitch/price",
          "examples": [
            "[Pause after pitch or price]"
          ],
          "target": "objection_silence"
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
      "key": "quote_range",
      "type": "message",
      "title": "If they insist on a price range",
      "script": "I can give you a useful range once I confirm the scope. I haven’t quoted a number yet because I don’t want to mislead you. If you tell me the pages, service areas, enquiry method and whether any integrations are needed, I’ll send a clear written quote. If you have a budget range already, I can also tell you honestly whether it fits.",
      "branches": [
        {
          "key": "share_scope",
          "label": "Willing to clarify requirements",
          "examples": [
            "It’s mainly services and contact details."
          ],
          "target": "need_discovery"
        },
        {
          "key": "share_budget",
          "label": "Shares a budget",
          "examples": [
            "Our budget is around [AUD budget]."
          ],
          "target": "scope"
        },
        {
          "key": "written_quote",
          "label": "Wants written quote",
          "examples": [
            "Send that through."
          ],
          "target": "proposal"
        },
        {
          "key": "not_ready",
          "label": "Not ready",
          "examples": [
            "I’ll leave it for now."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Please don’t contact me again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "scope",
      "type": "message",
      "title": "Scope and feature qualification",
      "script": "The written scope should make clear the pages, service-area information, contact/quote path, content and image responsibilities, revisions, timeline, hosting/domain costs and post-launch support. Online booking calendars, live dispatch, payments, job-management/CRM integrations and complex customer portals are not automatically included; I’d quote those separately after understanding requirements. Which parts are essential for your first version?",
      "branches": [
        {
          "key": "basic",
          "label": "Basic website fits",
          "examples": [
            "Services, areas and contact are enough."
          ],
          "target": "proposal"
        },
        {
          "key": "add_pages",
          "label": "Needs more service/area pages",
          "examples": [
            "We need several suburbs and services."
          ],
          "target": "proposal"
        },
        {
          "key": "integration",
          "label": "Needs custom integration",
          "examples": [
            "We use job software.",
            "We need online booking."
          ],
          "target": "custom_scope"
        },
        {
          "key": "hosting",
          "label": "Asks about domain/hosting/maintenance",
          "examples": [
            "What about hosting and updates?"
          ],
          "target": "proposal"
        },
        {
          "key": "price",
          "label": "Scope sounds too expensive",
          "examples": [
            "That sounds like a lot."
          ],
          "target": "objection_expensive"
        },
        {
          "key": "not_fit",
          "label": "Not a fit",
          "examples": [
            "That’s more than we need."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "think_objection",
          "label": "Needs time to think",
          "examples": [
            "I need to think about it."
          ],
          "target": "objection_think"
        },
        {
          "key": "price_objection",
          "label": "Price feels too high",
          "examples": [
            "That’s expensive."
          ],
          "target": "objection_expensive"
        },
        {
          "key": "partner_objection",
          "label": "Needs to speak with partner",
          "examples": [
            "I need to ask my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "send_info_objection",
          "label": "Just send information",
          "examples": [
            "Just send me some information."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "compare_objection",
          "label": "Wants to shop around",
          "examples": [
            "I’m comparing providers."
          ],
          "target": "objection_compare"
        },
        {
          "key": "timing_objection",
          "label": "Timing is not right",
          "examples": [
            "Now’s not a good time."
          ],
          "target": "objection_timing"
        },
        {
          "key": "just_looking_objection",
          "label": "Just looking",
          "examples": [
            "I’m just looking."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "silence_objection",
          "label": "Silence after pitch/price",
          "examples": [
            "[Pause after pitch or price]"
          ],
          "target": "objection_silence"
        }
      ]
    },
    {
      "key": "custom_scope",
      "type": "message",
      "title": "Custom feature outside initial scope",
      "script": "That may be possible, but I don’t want to promise an integration before checking what your existing system supports. I’d separate the core website from the extra workflow, confirm the software/API and responsibilities, and quote the extra work in writing. Would you prefer to start with the simple service site or review the integration separately?",
      "branches": [
        {
          "key": "core_first",
          "label": "Start with the core site",
          "examples": [
            "Start with the basics."
          ],
          "target": "proposal"
        },
        {
          "key": "separate_quote",
          "label": "Review integration separately",
          "examples": [
            "Quote the integration separately."
          ],
          "target": "proposal"
        },
        {
          "key": "needs_discovery",
          "label": "Need more technical detail",
          "examples": [
            "What do you need to check?"
          ],
          "target": "need_discovery"
        },
        {
          "key": "not_fit",
          "label": "Not a fit",
          "examples": [
            "We need a full platform."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "agency",
      "type": "message",
      "title": "An existing agency or developer manages the site",
      "script": "No problem—I don’t want to interfere with a working relationship. Is there a specific improvement you’re considering, or is your current provider already handling everything you need?",
      "branches": [
        {
          "key": "share_demo",
          "label": "Open to showing the concept to provider",
          "examples": [
            "I can show it to them."
          ],
          "target": "send_channel"
        },
        {
          "key": "needs_approval",
          "label": "Needs approval first",
          "examples": [
            "I need to ask them."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "provider_good",
          "label": "Provider handles it well",
          "examples": [
            "They’re doing a good job."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "specific_gap",
          "label": "There is a gap to explore",
          "examples": [
            "We do want better service pages."
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "dnc",
          "label": "No further contact",
          "examples": [
            "Please don’t contact us again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "trust",
      "type": "message",
      "title": "Trust, portfolio and working arrangement",
      "script": "Fair question. I’m [Your Name] from [Your Business], and you can verify my work here: [Portfolio URL]. The demo is a private concept, not a live client website. I’ll provide the deliverables, payment stages, timeline, exclusions and ongoing costs in writing before you commit. What would you want to verify before considering it?",
      "branches": [
        {
          "key": "portfolio",
          "label": "Wants portfolio",
          "examples": [
            "Send your portfolio."
          ],
          "target": "send_channel"
        },
        {
          "key": "scope",
          "label": "Wants written deliverables",
          "examples": [
            "Put the scope in writing."
          ],
          "target": "proposal"
        },
        {
          "key": "identity",
          "label": "Wants to verify identity or business",
          "examples": [
            "Where are you based?",
            "Can I check your references?"
          ],
          "target": "send_channel"
        },
        {
          "key": "concern",
          "label": "Has a specific concern",
          "examples": [
            "I’m still unsure."
          ],
          "target": "objection_think"
        },
        {
          "key": "no",
          "label": "Does not trust enough to continue",
          "examples": [
            "I’ll pass."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "decision_process",
      "type": "message",
      "title": "Someone else must approve",
      "script": "“Of course. What do you think your partner will want to understand first—the cost, design, features, or timing? I can prepare a short summary for you to review together if that helps.”",
      "branches": [
        {
          "key": "cost",
          "label": "Cost is their main concern",
          "examples": [
            "They’ll ask about price."
          ],
          "target": "price"
        },
        {
          "key": "scope",
          "label": "Scope is their main concern",
          "examples": [
            "They’ll want to know what’s included."
          ],
          "target": "scope"
        },
        {
          "key": "joint",
          "label": "Wants joint review",
          "examples": [
            "Can you talk to both of us?"
          ],
          "target": "schedule_review"
        },
        {
          "key": "summary",
          "label": "Wants summary",
          "examples": [
            "Send a summary."
          ],
          "target": "send_channel"
        },
        {
          "key": "later",
          "label": "No timeline yet",
          "examples": [
            "We need to discuss first."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "no",
          "label": "Decision is no",
          "examples": [
            "We won’t proceed."
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
      ],
      "internalNote": "Do not assume the partner’s objection. Ask permission before sending a summary or following up."
    },
    {
      "key": "send_channel",
      "type": "message",
      "title": "Ask permission before sending the demo",
      "script": "Would you be comfortable with me sending the demo link by email or WhatsApp? I’ll send only what you agree to receive. Would you like a message only, or are you also happy for me to check back once after you’ve had a look?",
      "branches": [
        {
          "key": "email",
          "label": "Email",
          "examples": [
            "Email it to [Email]."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "whatsapp",
          "label": "WhatsApp",
          "examples": [
            "WhatsApp is fine."
          ],
          "target": "whatsapp_permission"
        },
        {
          "key": "message_only",
          "label": "Send only; no follow-up",
          "examples": [
            "Send it only, please."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "wants_info",
          "label": "Needs specific information first",
          "examples": [
            "Send me the price/scope too."
          ],
          "target": "objection_send_info"
        },
        {
          "key": "declines",
          "label": "Does not want it sent",
          "examples": [
            "No, thanks."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Please don’t contact me."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "whatsapp_permission",
      "type": "message",
      "title": "Confirm permission and number",
      "script": "Thanks. Just confirming you’re happy for me to send one message with the demo link and my details to this number. I won’t add you to a marketing list or keep following up unless you ask me to. Is that okay?",
      "branches": [
        {
          "key": "yes",
          "label": "Explicitly agrees",
          "examples": [
            "Yes, that’s fine."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "email_instead",
          "label": "Prefers email",
          "examples": [
            "Email instead."
          ],
          "target": "send_channel"
        },
        {
          "key": "no",
          "label": "Declines message",
          "examples": [
            "Actually, no."
          ],
          "target": "polite_close"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Don’t message or call again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "proposal",
      "type": "message",
      "title": "Written scope and quote",
      "script": "I’ll put the proposed scope in writing: pages, service-area coverage, enquiry path, who supplies content, revisions, timeline, price, domain/hosting, support and exclusions. I’ll avoid making any promise about lead volume or job numbers. Would you like to review the quote yourself first, or should I arrange a short walkthrough?",
      "branches": [
        {
          "key": "quote_self",
          "label": "Review the quote yourself",
          "examples": [
            "Email the quote to me."
          ],
          "target": "proposal_no_followup"
        },
        {
          "key": "follow_ok",
          "label": "Agrees to one follow-up",
          "examples": [
            "Send it and check in on [date]."
          ],
          "target": "proposal_follow_up"
        },
        {
          "key": "walkthrough",
          "label": "Wants walkthrough",
          "examples": [
            "Let’s go through it."
          ],
          "target": "schedule_review"
        },
        {
          "key": "partner",
          "label": "Needs partner approval",
          "examples": [
            "I need to discuss it first."
          ],
          "target": "decision_process"
        },
        {
          "key": "negotiate",
          "label": "Has price concern",
          "examples": [
            "Can you lower the price?"
          ],
          "target": "objection_expensive"
        },
        {
          "key": "declines",
          "label": "Declines",
          "examples": [
            "We won’t proceed."
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
      "key": "schedule_review",
      "type": "message",
      "title": "Book a short demo walkthrough",
      "script": "Happy to keep it brief—about 5 to 10 minutes. What day and time works for you? I’ll confirm the time and send the link only if you’d like me to.",
      "branches": [
        {
          "key": "confirmed",
          "label": "Confirms a time",
          "examples": [
            "Tomorrow at 10am."
          ],
          "target": "meeting_booked"
        },
        {
          "key": "link_first",
          "label": "Wants link first",
          "examples": [
            "Send the link before booking."
          ],
          "target": "send_channel"
        },
        {
          "key": "later",
          "label": "Not ready to book",
          "examples": [
            "Maybe another time."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "cancel",
          "label": "Declines meeting",
          "examples": [
            "Let’s leave it."
          ],
          "target": "soft_rejection"
        }
      ]
    },
    {
      "key": "callback",
      "type": "message",
      "title": "They are busy",
      "script": "No worries—I’ll let you get back to it. Is there a particular day or time that works better for a brief call, or would you prefer not to schedule another call?",
      "branches": [
        {
          "key": "time",
          "label": "Agrees on a time",
          "examples": [
            "Call Thursday afternoon."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "send",
          "label": "Asks for a link instead",
          "examples": [
            "Just email me the details."
          ],
          "target": "send_channel"
        },
        {
          "key": "no_followup",
          "label": "Doesn’t want another call",
          "examples": [
            "No need to call back."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "no",
          "label": "Declines",
          "examples": [
            "Not interested."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not call again",
          "examples": [
            "Don’t call again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "follow_up_date",
      "type": "message",
      "title": "Agree a specific follow-up only with permission",
      "script": "Would you like me to follow up on a specific date after you’ve reviewed it, or should I simply send the material without contacting you again?",
      "branches": [
        {
          "key": "date_set",
          "label": "Agrees on a date",
          "examples": [
            "Call next Wednesday."
          ],
          "target": "follow_up_scheduled"
        },
        {
          "key": "send_only",
          "label": "No follow-up",
          "examples": [
            "Just send it."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "no_contact",
          "label": "Does not want further contact",
          "examples": [
            "Please don’t follow up."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Please don’t contact me."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "soft_rejection",
      "type": "message",
      "title": "Soft rejection — ask once about saving the contact",
      "script": "No worries at all, and thanks for being clear. One last question, only if you’re comfortable: would it be okay if I sent one short WhatsApp message with my name and portfolio so you can save my details in case a website project comes up later? Completely fine if not—I won’t send anything without permission.",
      "branches": [
        {
          "key": "allows_contact",
          "label": "Explicit permission",
          "examples": [
            "Sure, send one message."
          ],
          "target": "whatsapp_permission"
        },
        {
          "key": "declines",
          "label": "Declines the message",
          "examples": [
            "No thanks.",
            "Please don’t message me."
          ],
          "target": "polite_close"
        },
        {
          "key": "dnc",
          "label": "Explicit no-contact request",
          "examples": [
            "Don’t call or message again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "polite_close",
      "type": "outcome",
      "title": "Polite close — no message or follow-up",
      "script": "Thanks for your time. I appreciate it. I’ll leave it there and won’t send a message or follow up. Have a good day.",
      "outcomeKey": "not_interested"
    },
    {
      "key": "do_not_contact",
      "type": "outcome",
      "title": "Do not contact — respect request immediately",
      "script": "Understood. I’ll end the call now and record that you don’t want further contact. Goodbye.",
      "outcomeKey": "not_interested",
      "internalNote": "End immediately. Do not ask for WhatsApp permission or set a follow-up. Keep a minimal suppression record so the number is not contacted again."
    },
    {
      "key": "wrong_contact",
      "type": "outcome",
      "title": "Wrong number/business",
      "script": "Sorry about that, and thanks for letting me know. I’ll correct my notes and won’t continue the pitch.",
      "outcomeKey": "other"
    },
    {
      "key": "demo_sent_no_followup",
      "type": "outcome",
      "title": "Demo/info sent — no follow-up permitted",
      "script": "Send only the item the prospect agreed to receive, to the agreed channel. Do not send additional marketing or follow-up messages unless they initiate contact or explicitly agree.",
      "outcomeKey": "interested_no_meeting"
    },
    {
      "key": "proposal_follow_up",
      "type": "outcome",
      "title": "Quote sent — one follow-up agreed",
      "script": "Send the written quote and follow up only on the agreed date, using the agreed channel. If there is no reply, do not keep chasing beyond the agreed permission.",
      "outcomeKey": "follow_up_later"
    },
    {
      "key": "proposal_no_followup",
      "type": "outcome",
      "title": "Quote sent — no follow-up requested",
      "script": "Send the requested written quote and do not schedule a sales follow-up. Let the prospect re-initiate if they want to proceed.",
      "outcomeKey": "interested_no_meeting"
    },
    {
      "key": "follow_up_scheduled",
      "type": "outcome",
      "title": "Follow-up scheduled",
      "script": "Record the exact date, time zone (Australian local time for the prospect), channel and what they agreed you may contact them about.",
      "outcomeKey": "follow_up_later"
    },
    {
      "key": "meeting_booked",
      "type": "outcome",
      "title": "Walkthrough booked",
      "script": "Confirm the date/time in the prospect’s local Australian time zone, send the meeting link if requested, and prepare only the demo elements relevant to the prospect’s stated priorities.",
      "outcomeKey": "meeting_booked"
    },
    {
      "key": "demo_removed",
      "type": "outcome",
      "title": "Demo removal requested",
      "script": "Acknowledge the request, remove/unpublish the concept anywhere under your control, remove prospect data from active outreach where appropriate, and confirm completion without pitching.",
      "outcomeKey": "other"
    },
    {
      "key": "outcome_discovery",
      "type": "message",
      "title": "Discover the real business need",
      "script": "For this plumbing business, what would be most useful first: making service and service-area details clearer, making it easier to request a quote, or helping customers find the right phone number? I’m asking so I can focus the demo on a real priority instead of assuming that a new website automatically creates more jobs.",
      "branches": [
        {
          "key": "enquiries",
          "label": "Clearer enquiries or quote requests",
          "examples": [
            "Quote requests need to be easier.",
            "Customers call for basic details."
          ],
          "target": "need_discovery"
        },
        {
          "key": "service_info",
          "label": "Clearer service and area information",
          "examples": [
            "We need to show our service area."
          ],
          "target": "scope"
        },
        {
          "key": "custom_need",
          "label": "Specific technical need",
          "examples": [
            "We need a booking or job system."
          ],
          "target": "scope"
        },
        {
          "key": "no_priority",
          "label": "No current priority",
          "examples": [
            "We’re okay as we are."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "not_sure",
          "label": "Not sure yet",
          "examples": [
            "I’m just exploring."
          ],
          "target": "objection_just_looking"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Do not contact me again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "objection_think",
      "type": "message",
      "title": "Objection — “I need to think about it”",
      "script": "That’s completely fair. So I don’t guess at what’s holding you back, what part would you like to think through—the budget, the demo/design, the timing, or whether the website would solve a real business need?",
      "branches": [
        {
          "key": "budget",
          "label": "Budget",
          "examples": [
            "The budget."
          ],
          "target": "objection_expensive"
        },
        {
          "key": "design",
          "label": "Design / demo",
          "examples": [
            "I’m not sold on the design."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "timing",
          "label": "Timing",
          "examples": [
            "Now isn’t right."
          ],
          "target": "objection_timing"
        },
        {
          "key": "value",
          "label": "Value unclear",
          "examples": [
            "I’m not convinced it’s useful."
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "partner",
          "label": "Partner approval",
          "examples": [
            "I need to check with my partner."
          ],
          "target": "objection_partner"
        },
        {
          "key": "more_time",
          "label": "Just needs time",
          "examples": [
            "I need a few days."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "soft_no",
          "label": "Pass",
          "examples": [
            "I’ll leave it."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Don’t contact again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "objection_expensive",
      "type": "message",
      "title": "Objection — “That’s expensive”",
      "script": "I understand. Can I ask whether it feels expensive because the budget is already set, because you’re comparing a few quotes, or because the value isn’t clear yet?",
      "branches": [
        {
          "key": "budget",
          "label": "Budget ceiling",
          "examples": [
            "We have a fixed budget."
          ],
          "target": "price"
        },
        {
          "key": "compare",
          "label": "Comparing quotes",
          "examples": [
            "I’m comparing quotes."
          ],
          "target": "objection_compare"
        },
        {
          "key": "value",
          "label": "Value unclear",
          "examples": [
            "Not sure it’s worth it."
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "scope",
          "label": "Scope unclear",
          "examples": [
            "What’s included?"
          ],
          "target": "scope"
        },
        {
          "key": "discount",
          "label": "Asks for discount",
          "examples": [
            "Can you do it cheaper?"
          ],
          "target": "price"
        },
        {
          "key": "no_budget",
          "label": "No budget",
          "examples": [
            "We have no budget for this."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Please stop contacting us."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "objection_partner",
      "type": "message",
      "title": "Objection — partner or co-owner approval",
      "script": "Of course. What do you think your partner will want to evaluate first—the cost, the design, the scope, or the timing? I can send a short summary or arrange a brief review for both of you if that would help.",
      "branches": [
        {
          "key": "cost",
          "label": "Cost concern",
          "examples": [
            "They’ll ask about cost."
          ],
          "target": "price"
        },
        {
          "key": "scope",
          "label": "Scope concern",
          "examples": [
            "They need to see what’s included."
          ],
          "target": "scope"
        },
        {
          "key": "joint",
          "label": "Joint review",
          "examples": [
            "Could we both look at it?"
          ],
          "target": "schedule_review"
        },
        {
          "key": "summary",
          "label": "Short summary",
          "examples": [
            "Send the details."
          ],
          "target": "send_channel"
        },
        {
          "key": "later",
          "label": "Timing unknown",
          "examples": [
            "We need to discuss it."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "no",
          "label": "Not proceeding",
          "examples": [
            "We won’t go ahead."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Don’t contact us again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "objection_send_info",
      "type": "message",
      "title": "Objection — “Just send me information”",
      "script": "Happy to. What would be most useful to see so I don’t send a generic message—the demo, the proposed scope and quote, examples of previous work, or an answer to a specific question?",
      "branches": [
        {
          "key": "demo",
          "label": "Demo",
          "examples": [
            "Send the demo."
          ],
          "target": "send_channel"
        },
        {
          "key": "quote",
          "label": "Price and inclusions",
          "examples": [
            "Send a quote and scope."
          ],
          "target": "price"
        },
        {
          "key": "portfolio",
          "label": "Portfolio",
          "examples": [
            "Show me other work."
          ],
          "target": "trust"
        },
        {
          "key": "question",
          "label": "Specific concern",
          "examples": [
            "I have a question first."
          ],
          "target": "objection_think"
        },
        {
          "key": "no_followup",
          "label": "Send only, no follow-up",
          "examples": [
            "Send it but don’t call again."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "declines",
          "label": "Does not want info",
          "examples": [
            "No need."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Remove us from your list."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "objection_compare",
      "type": "message",
      "title": "Objection — comparing developers",
      "script": "That’s reasonable. What’s the one thing you most want to compare—price, design, the pages and features included, or support after launch? I can make those details clear without guessing what another provider offers.",
      "branches": [
        {
          "key": "price",
          "label": "Price",
          "examples": [
            "Price is the key thing."
          ],
          "target": "price"
        },
        {
          "key": "design",
          "label": "Design",
          "examples": [
            "I want the best fit for our business."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "features",
          "label": "Features and scope",
          "examples": [
            "Features are most important."
          ],
          "target": "scope"
        },
        {
          "key": "support",
          "label": "Support and trust",
          "examples": [
            "I want to know who will support it."
          ],
          "target": "trust"
        },
        {
          "key": "unsure",
          "label": "Not sure",
          "examples": [
            "I’m just looking at options."
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "no",
          "label": "Declines",
          "examples": [
            "We’ll pass."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Please don’t contact us."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "objection_timing",
      "type": "message",
      "title": "Objection — “Now is not a good time”",
      "script": "Understood. Apart from timing, is anything else making you hesitate, or would it be better to reconnect at a time that suits you? I don’t want to keep following up without a reason or your permission.",
      "branches": [
        {
          "key": "timing_only",
          "label": "Timing only",
          "examples": [
            "Try next month."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "other",
          "label": "Another concern",
          "examples": [
            "There is something else."
          ],
          "target": "objection_think"
        },
        {
          "key": "partner",
          "label": "Partner discussion",
          "examples": [
            "I need to discuss it first."
          ],
          "target": "objection_partner"
        },
        {
          "key": "no_followup",
          "label": "No follow-up",
          "examples": [
            "No need to call back."
          ],
          "target": "demo_sent_no_followup"
        },
        {
          "key": "soft_no",
          "label": "No thanks",
          "examples": [
            "We’ll leave it."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Don’t call again."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "objection_just_looking",
      "type": "message",
      "title": "Objection — “I’m just looking”",
      "script": "No problem. If a website were useful for your business, what would you most want it to make easier—explaining the services and suburbs you cover, helping customers request a quote, or making the right contact details obvious?",
      "branches": [
        {
          "key": "clear_need",
          "label": "Has a clear need",
          "examples": [
            "We need the quote path to be clearer."
          ],
          "target": "outcome_discovery"
        },
        {
          "key": "see_demo",
          "label": "Wants to see demo",
          "examples": [
            "I’ll look at the demo."
          ],
          "target": "demo_pitch"
        },
        {
          "key": "not_sure",
          "label": "No clear need yet",
          "examples": [
            "I’m just browsing."
          ],
          "target": "send_channel"
        },
        {
          "key": "later",
          "label": "Maybe later",
          "examples": [
            "Possibly in a few months."
          ],
          "target": "follow_up_date"
        },
        {
          "key": "not_interested",
          "label": "Not interested",
          "examples": [
            "Not interested."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Do not contact us."
          ],
          "target": "do_not_contact"
        }
      ]
    },
    {
      "key": "objection_silence",
      "type": "message",
      "title": "Silence after demo or price",
      "script": "Pause for a few seconds. Don’t fill the silence with more features or a discount. If it feels appropriate, ask: “What are your thoughts so far? Is there anything you’d like me to clarify?” Then listen.",
      "branches": [
        {
          "key": "question",
          "label": "They raise a concern",
          "examples": [
            "I’m not sure about the price."
          ],
          "target": "objection_think"
        },
        {
          "key": "need_time",
          "label": "They need time",
          "examples": [
            "I need to think about it."
          ],
          "target": "objection_timing"
        },
        {
          "key": "next_step",
          "label": "They are ready",
          "examples": [
            "Can you send the quote?"
          ],
          "target": "proposal"
        },
        {
          "key": "close",
          "label": "No response / wants to finish",
          "examples": [
            "That’s all, thanks."
          ],
          "target": "soft_rejection"
        },
        {
          "key": "dnc",
          "label": "Do not contact",
          "examples": [
            "Don’t contact me again."
          ],
          "target": "do_not_contact"
        }
      ]
    }
  ]
};
