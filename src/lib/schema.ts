import { z } from "zod";

export const uploadSchema = z.object({
  fileKey: z.string().optional(),
  coverKey: z.string().optional(),
  mediaType: z.string().min(1, "Missing Media Type"),
  platforms: z.string().min(1, "Must have platfroms"),
  platformCaptions: z.string().min(1, "Caption must not be emtpy"),
});

export function getMissingFields(error: z.ZodError): string[] {
  const missingFields: string[] = [];

  for (const errorIssue of error.issues) {
    if (errorIssue.code === "invalid_type") {
      missingFields.push(errorIssue.path[0] as string);
    }
  }

  return missingFields;
}
