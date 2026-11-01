import type { CallbookTemplate } from "./types";

/**
 * Example material only — a starting point to edit, not a guaranteed sales script.
 */
export const proposalFollowUp: CallbookTemplate = {
  id: "proposal-follow-up",
  name: "Follow-up After Sending a Proposal",
  description:
    "Second-touch call after a proposal has been sent. Goal: confirm they read it, handle questions, and lock in a decision date.",
  targetAudience: "Prospects who received a written proposal",
  primaryGoal: "follow_up",
  guidance:
    "Assumes the proposal is already sent. Keeps each answer to one decision and always ends with a concrete next date.",
  startKey: "opening",
  nodes: [
    {
      key: "opening",
      type: "message",
      title: "Opening",
      script:
        "Hi, it's [Your Name] — I sent the proposal through for the new site on Tuesday. Is now a bad time for a two-minute check-in on it?",
      internalNote: "Say 'two minutes' out loud. It lowers the cost of saying yes to the call.",
      branches: [
        {
          key: "read",
          label: "Read it",
          examples: ["Yeah, I had a look.", "I read through it."],
          target: "feedback",
        },
        {
          key: "not_yet",
          label: "Haven't read it",
          examples: ["Not yet, it's been flat out."],
          target: "not_yet",
        },
        {
          key: "went_elsewhere",
          label: "Went with someone else",
          examples: ["We've gone with another company."],
          target: "lost",
        },
        {
          key: "busy",
          label: "Busy",
          examples: ["I can't talk right now."],
          target: "reschedule",
        },
      ],
    },
    {
      key: "feedback",
      type: "message",
      title: "What they thought",
      script:
        "Great. Was there anything in it that didn't line up with what you had in mind — the scope, the timeline, or the price?",
      internalNote:
        "Ask this before they volunteer an objection. It usually surfaces the real blocker.",
      branches: [
        {
          key: "happy",
          label: "Looked good",
          examples: ["It all looked good.", "Seems fine to me."],
          target: "close_decision",
        },
        {
          key: "questions",
          label: "Has questions",
          examples: ["I had a couple of questions about the timeline."],
          target: "answers",
        },
        {
          key: "price",
          label: "Price concern",
          examples: ["The price is higher than we expected."],
          target: "price_objection",
        },
      ],
    },
    {
      key: "answers",
      type: "message",
      title: "Answer questions",
      script:
        "Of course — ask away. I'd rather get this exactly right now than have surprises later.",
      internalNote: "Answer one question fully, then ask: 'Does that clear it up?'",
      branches: [
        {
          key: "resolved",
          label: "Resolved",
          examples: ["Okay, that makes sense."],
          target: "close_decision",
        },
        {
          key: "unresolved",
          label: "Still unsure",
          examples: ["I need to think about it."],
          target: "decision_date",
        },
      ],
    },
    {
      key: "price_objection",
      type: "message",
      title: "Price objection",
      script:
        "I understand. The quote covers the rebuild, the booking form and the first round of changes. If the range is the issue, I can stage it — start with the core pages and add the rest later. Would that be easier?",
      branches: [
        {
          key: "staged",
          label: "Staged option works",
          examples: ["That could work."],
          target: "close_decision",
        },
        {
          key: "no_budget",
          label: "Budget is gone",
          examples: ["We just don't have it right now."],
          target: "nurture",
        },
      ],
    },
    {
      key: "not_yet",
      type: "message",
      title: "Not reviewed yet",
      script:
        "No problem — I know how it goes. Do you want me to resend it with a short summary at the top, and check back Thursday?",
      branches: [
        {
          key: "resend",
          label: "Resend and follow up",
          examples: ["Yeah, resend it."],
          target: "nurture",
        },
        {
          key: "later",
          label: "Push it back",
          examples: ["Ask me next week."],
          target: "decision_date",
        },
      ],
    },
    {
      key: "reschedule",
      type: "message",
      title: "Reschedule",
      script: "All good. When's a better time — later today or tomorrow morning?",
      branches: [
        {
          key: "time",
          label: "Gives a time",
          examples: ["Tomorrow around 10."],
          target: "nurture",
        },
        {
          key: "email",
          label: "Prefers email",
          examples: ["Email is easier."],
          target: "nurture",
        },
      ],
    },
    {
      key: "close_decision",
      type: "outcome",
      title: "Ready to decide",
      outcomeKey: "interested_no_meeting",
      script:
        "Good — then the next step is a 15-minute call to confirm scope and a start date. Does Thursday morning suit?",
      internalNote: "If they hesitate, go to the decision-date branch instead of pushing.",
    },
    {
      key: "decision_date",
      type: "outcome",
      title: "Decision date agreed",
      outcomeKey: "follow_up_later",
      script:
        "That's fine. Let's lock in a day so it doesn't drift — if I haven't heard by Friday, I'll send one short email. Does that work?",
    },
    {
      key: "nurture",
      type: "outcome",
      title: "Nurture later",
      outcomeKey: "follow_up_later",
      script: "Perfect, I'll follow up then. Thanks for the time.",
    },
    {
      key: "lost",
      type: "outcome",
      title: "Lost the deal",
      outcomeKey: "not_interested",
      script:
        "Totally understand — thanks for letting me know. If anything changes or the project comes back around, I'm happy to revisit it.",
    },
  ],
};