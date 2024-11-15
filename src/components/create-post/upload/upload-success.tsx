import { SectionContainer } from "../caption-display";

import { Account } from "@/state/create-post-state";
import { PostContentResponse } from "@/utils/upload/helpers";
import { CircleCheck, CircleX, ExternalLink } from "lucide-react";

export const UploadSuccess = ({
  data,
  groupedAccounts,
}: {
  data: PostContentResponse;
  groupedAccounts: Record<string, Account[]>;
}) => (
  <div className="animate-in fade-in zoom-in flex flex-col gap-4 pr-4">
    <div className="flex flex-col gap-4">
      {Object.keys(groupedAccounts).map((key, i) => {
        const platformResponse = data[key];
        return (
          <SectionContainer key={i} title={key}>
            <div className="text-sm flex flex-row gap-2 items-center">
              {platformResponse.success ? (
                <>
                  <CircleCheck className="w-4 h-4 text-emerald-500" />
                  <span>Post is successful</span>
                  <a
                    href={data[key].postURL}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-500" />
                  </a>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <CircleX className="w-4 h-4 text-red-500" />
                    <span>Post did not upload</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {platformResponse.error}
                  </span>
                </div>
              )}
            </div>
          </SectionContainer>
        );
      })}
    </div>
  </div>
);
