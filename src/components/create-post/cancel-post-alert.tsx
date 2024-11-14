import { useCreatePostStore } from "@/state/create-post-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { X } from "lucide-react";

export const CancelPostAlert = () => {
  const reset = useCreatePostStore((state) => state.reset);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size={"icon"} className="" variant={"ghost"}>
          <X />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel post creation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this post?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>No</AlertDialogCancel>
          <AlertDialogAction onClick={() => reset()}>Yes</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
