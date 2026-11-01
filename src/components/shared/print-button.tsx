"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Print action. Uses the browser's own print pipeline against the dedicated
 * print stylesheet — there is no fake "download PDF" button.
 */
export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <Button variant="secondary" onClick={() => window.print()}>
      <Printer aria-hidden="true" />
      {label}
    </Button>
  );
}