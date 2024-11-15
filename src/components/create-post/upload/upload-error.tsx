export const UploadError = ({ error }: { error: Error | null }) => (
  <div className="animate-in fade-in zoom-in ">
    <p className="text-xs font-gesit-mono text-destructive">
      Something unexpected happened: {error?.message}
    </p>
  </div>
);
