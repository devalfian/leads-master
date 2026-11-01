import { ListChecks, MessageSquareQuote, Target, Wrench } from "lucide-react";

/**
 * The source-guide reference block: call objectives, discovery checklist,
 * objections and recommended tools. Reference material only — it is not an
 * interactive branching script.
 */
export function GuideReferencePanel({
  callObjectives,
  checklist,
  objections,
  tools,
  sessionGoals = [],
}: {
  callObjectives: string[];
  checklist: string[];
  objections: Array<{ objectionText: string; suggestedResponse: string }>;
  tools: Array<{ toolName: string; toolDescription: string }>;
  sessionGoals?: string[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-card border border-border-subtle bg-surface p-4">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <Target className="size-4 text-accent-soft" aria-hidden="true" />
          Call objectives
        </h2>
        <ol className="mt-2.5 space-y-1.5">
          {callObjectives.map((objective, index) => (
            <li key={objective} className="flex gap-2 text-[13px] leading-relaxed text-secondary">
              <span className="text-muted">{index + 1}.</span>
              <span>{objective}</span>
            </li>
          ))}
        </ol>
        {sessionGoals.length > 0 ? (
          <>
            <h3 className="mt-4 text-[12px] font-medium uppercase tracking-wider text-muted">
              Session goals
            </h3>
            <ul className="mt-1.5 space-y-1.5">
              {sessionGoals.map((goal) => (
                <li key={goal} className="text-[13px] leading-relaxed text-secondary">
                  {goal}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className="rounded-card border border-border-subtle bg-surface p-4">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <ListChecks className="size-4 text-accent-soft" aria-hidden="true" />
          Information to uncover
        </h2>
        <ol className="mt-2.5 space-y-1.5">
          {checklist.map((item, index) => (
            <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-secondary">
              <span className="text-muted">{index + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-card border border-border-subtle bg-surface p-4">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <MessageSquareQuote className="size-4 text-accent-soft" aria-hidden="true" />
          Common objections
        </h2>
        <ul className="mt-2.5 space-y-2.5">
          {objections.map((objection) => (
            <li
              key={objection.objectionText}
              className="rounded-[10px] border border-border-subtle bg-surface-elevated px-3 py-2"
            >
              <p className="text-[13px] font-medium text-foreground">“{objection.objectionText}”</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-secondary">
                {objection.suggestedResponse}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card border border-border-subtle bg-surface p-4">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <Wrench className="size-4 text-accent-soft" aria-hidden="true" />
          Recommended tools
        </h2>
        <ul className="mt-2.5 space-y-1.5">
          {tools.map((tool) => (
            <li key={tool.toolName} className="text-[13px] leading-relaxed text-secondary">
              <span className="font-medium text-foreground">{tool.toolName}</span>
              {tool.toolDescription ? <span> — {tool.toolDescription}</span> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}