import { Account } from "@/state/create-post-state";

import { SectionContainer } from "../caption-display";
import { Loader2 } from "lucide-react";

export const UploadProgress = ({
  groupedAccounts,
}: {
  groupedAccounts: Record<string, Account[]>;
}) => (
  <div className="animate-in fade-in zoom-in flex flex-col gap-4 pr-4">
    <div className="flex flex-col gap-4">
      {Object.keys(groupedAccounts).map((key, i) => (
        <SectionContainer key={i} title={key}>
          <Loader2 className="animate-spin h-4 w-5" />
        </SectionContainer>
      ))}
    </div>
    <p className="animate-pulse text-xs font-gesit-mono text-muted-foreground">
      This may take a minute. Please don't close the page. Longer videos will
      take longer
    </p>
  </div>
);
