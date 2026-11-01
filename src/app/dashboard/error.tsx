"use client";

import { useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** Error boundary for the dashboard segment. Nothing is shown as "saved" here. */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] render failed", error);
  }, [error]);

  return (
    <div className="px-5 py-8 md:px-8">
      <Alert tone="danger" title="This page could not be rendered">
        The workspace hit an unexpected error. Nothing was saved. Try again, and check the database
        binding if it keeps happening.
      </Alert>
      <div className="mt-3">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}