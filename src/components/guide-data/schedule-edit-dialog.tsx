"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FieldHint, Input, Label, Textarea } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiPatch } from "@/lib/api/client";
import type { MarketSchedule } from "@/lib/guides/types";

function toList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/** Edits one schedule block. Times stay as entered — nothing is recalculated. */
export function ScheduleEditDialog({
  schedule,
  open,
  onOpenChange,
}: {
  schedule: MarketSchedule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(schedule.title);
  const [startTimeWib, setStart] = useState(schedule.startTimeWib);
  const [endTimeWib, setEnd] = useState(schedule.endTimeWib);
  const [localTimeLabel, setLocalLabel] = useState(schedule.localTimeLabel ?? "");
  const [timezoneLabel, setTimezoneLabel] = useState(schedule.timezoneLabel ?? "");
  const [cities, setCities] = useState(schedule.cityLabels.join(", "));
  const [priorities, setPriorities] = useState(schedule.priorityLabels.join(", "));
  const [scheduleNote, setNote] = useState(schedule.scheduleNote ?? "");
  const [isActive, setActive] = useState(schedule.isActive);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(null);

    const result = await apiPatch(`/api/schedules/${schedule.id}`, {
      title: title.trim(),
      startTimeWib,
      endTimeWib,
      localTimeLabel: localTimeLabel.trim() ? localTimeLabel.trim() : null,
      timezoneLabel: timezoneLabel.trim() ? timezoneLabel.trim() : null,
      cityLabels: toList(cities),
      priorityLabels: toList(priorities),
      scheduleNote: scheduleNote.trim() ? scheduleNote.trim() : null,
      isActive,
    });
    setBusy(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setSaved("Schedule block saved.");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit schedule block</DialogTitle>
          <DialogDescription>
            Times are the WIB times used for calling. Local-time and timezone labels are stored exactly
            as written here and are never derived from an offset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`schedule-title-${schedule.id}`}>Block title</Label>
            <Input
              id={`schedule-title-${schedule.id}`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`start-${schedule.id}`}>Start (WIB)</Label>
              <Input
                id={`start-${schedule.id}`}
                value={startTimeWib}
                onChange={(event) => setStart(event.target.value)}
                placeholder="09:00"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`end-${schedule.id}`}>End (WIB)</Label>
              <Input
                id={`end-${schedule.id}`}
                value={endTimeWib}
                onChange={(event) => setEnd(event.target.value)}
                placeholder="09:30"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`local-${schedule.id}`}>Source local-time label</Label>
              <Input
                id={`local-${schedule.id}`}
                value={localTimeLabel}
                onChange={(event) => setLocalLabel(event.target.value)}
                placeholder="10:00–11:00 local"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`tz-${schedule.id}`}>Timezone label</Label>
              <Input
                id={`tz-${schedule.id}`}
                value={timezoneLabel}
                onChange={(event) => setTimezoneLabel(event.target.value)}
                placeholder="WIB"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`cities-${schedule.id}`}>Target cities / areas</Label>
            <Textarea
              id={`cities-${schedule.id}`}
              value={cities}
              onChange={(event) => setCities(event.target.value)}
              className="min-h-[70px]"
            />
            <FieldHint>Separate entries with a comma or a new line.</FieldHint>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`priorities-${schedule.id}`}>Priority focus</Label>
            <Textarea
              id={`priorities-${schedule.id}`}
              value={priorities}
              onChange={(event) => setPriorities(event.target.value)}
              className="min-h-[70px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`note-${schedule.id}`}>Block note (optional)</Label>
            <Textarea
              id={`note-${schedule.id}`}
              value={scheduleNote}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-[60px]"
              maxLength={1000}
            />
          </div>

          <label className="flex items-center gap-2 text-[13px] text-secondary">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setActive(event.target.checked)}
            />
            Active (available when creating a session)
          </label>

          {error ? <Alert tone="danger" title="The schedule was not saved">{error}</Alert> : null}
          {saved ? <Alert tone="success" title={saved} /> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={save} loading={busy}>
            <Check aria-hidden="true" />
            Save schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}