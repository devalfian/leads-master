"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScheduleBlockCard } from "@/components/shared/schedule-block-card";
import { ScheduleEditDialog } from "@/components/guide-data/schedule-edit-dialog";
import type { MarketSchedule } from "@/lib/guides/types";

/** Schedule settings: stored WIB times, labels, cities, priorities and notes. */
export function ScheduleSettingsList({ schedules }: { schedules: MarketSchedule[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = schedules.find((schedule) => schedule.id === editingId) ?? null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">Schedule blocks</h2>
        <p className="text-[12px] text-muted">
          Times are stored as WIB. Deactivating a block keeps it in history but removes it from new
          sessions.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {schedules.map((schedule) => (
          <ScheduleBlockCard
            key={schedule.id}
            schedule={schedule}
            action={
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setEditingId(schedule.id)}
                aria-label={`Edit schedule ${schedule.scheduleCode}`}
              >
                <Pencil aria-hidden="true" />
              </Button>
            }
          />
        ))}
      </div>

      {schedules.length === 0 ? <Badge tone="warning">No schedule blocks configured</Badge> : null}

      {editing ? (
        <ScheduleEditDialog
          schedule={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditingId(null);
          }}
        />
      ) : null}
    </section>
  );
}