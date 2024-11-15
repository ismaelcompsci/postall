import { useCreatePostStore } from "@/state/create-post-state";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";

export const ErrorDialog = ({
  open,
  onOpenChange,
  title,
  description,
  cancelText = "Cancel",
  actionText,
  onAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  cancelText?: string;
  actionText?: string;
  onAction?: () => void;
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-gesit-mono">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          {actionText && onAction && (
            <Button onClick={onAction}>{actionText}</Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const SamePlatfromErrorDialog = ({
  open,
  errorMessage,
  setOpen,
}: {
  open: boolean;
  errorMessage: string[];
  setOpen: (open: boolean) => void;
}) => {
  const setStep = useCreatePostStore((state) => state.setStep);

  return (
    <ErrorDialog
      open={open}
      onOpenChange={setOpen}
      title="Multiple Accounts Warning"
      description={
        <>
          <div className="text-xs">
            You have selected multiple accounts for the same platform(s):
            <ul className="list-disc pl-4 text-sm">
              {errorMessage.map((message) => (
                <li key={message} className="font-semibold">
                  {message}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs">
            Posting the same video to the same platform multiple times will
            suppress your account's reach.
          </p>
        </>
      }
      actionText="Change Accounts"
      onAction={() => setStep("choose-accounts")}
    />
  );
};
