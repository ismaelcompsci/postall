import { useCreatePostStore, CreatePostStep } from "@/state/create-post-state";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

export const PagingButtons = () => {
  const step = useCreatePostStore((state) => state.step);
  const setStep = useCreatePostStore((state) => state.setStep);
  const postText = useCreatePostStore((state) => state.postText);
  const selectedAccounts = useCreatePostStore(
    (state) => state.selectedAccounts
  );

  const ButtonContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="pt-4 space-y-4">
      <Separator />
      <div className="flex justify-end gap-4">{children}</div>
    </div>
  );

  const BackButton = ({ step }: { step: CreatePostStep }) => (
    <Button variant={"secondary"} onClick={() => setStep(step)}>
      Back
    </Button>
  );

  const NextButton = ({
    step,
    isDisabled,
  }: {
    step: CreatePostStep;
    isDisabled?: boolean;
  }) => (
    <Button
      className="transition-all duration-150"
      disabled={isDisabled}
      onClick={() => setStep(step)}
    >
      Next
    </Button>
  );

  if (step === "select-file") {
    return null;
  }

  if (step === "choose-accounts") {
    const isNextButtonDisabled = selectedAccounts.length === 0;

    return (
      <ButtonContainer>
        <NextButton step={"details"} isDisabled={isNextButtonDisabled} />
      </ButtonContainer>
    );
  }

  if (step === "details") {
    const hasText =
      !!postText &&
      selectedAccounts.every(
        (account) =>
          account.platform && postText[account.platform]?.text.trim().length > 0
      );

    return (
      <ButtonContainer>
        <BackButton step={"choose-accounts"} />
        <NextButton step={"upload"} isDisabled={!hasText} />
      </ButtonContainer>
    );
  }

  if (step === "upload") {
    return (
      <ButtonContainer>
        <BackButton step={"details"} />
      </ButtonContainer>
    );
  }

  return <div> nothigndetails</div>;
};
