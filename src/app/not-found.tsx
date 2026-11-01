import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="px-5 py-10 md:px-8">
      <EmptyState
        icon={Compass}
        title="That page does not exist"
        description="The Callbook or call you are looking for may have been removed, or the link is out of date."
        actions={
          <Button asChild>
            <Link href="/callbooks">Go to Call Playbooks</Link>
          </Button>
        }
      />
    </div>
  );
}