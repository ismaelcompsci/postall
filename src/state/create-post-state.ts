import { create } from "zustand";

export interface Account {
  id: string;
  platform: string | null;
  platform_username: string | null;
  platform_profile_picture_url: string | null;
}

export interface PostText {
  [provider: string]: {
    text: string;
  };
}

export type CreatePostStep =
  | "select-file"
  | "choose-accounts"
  | "details"
  | "upload";

type FileType = "video" | "image";

interface CreatePostState {
  step: CreatePostStep;
  accounts: Account[];
  file: File | null;
  selectedAccounts: Account[];
  fileType: FileType;

  postFile: File | null;
  postFileURL: string | null;
  editPerPlatform: boolean;
  postText: PostText;

  postThumbnailURL: string | null;
  postThumbnailFile: File | null;

  setStep: (step: CreatePostStep) => void;
  setAccounts: (accounts: Account[]) => void;
  setFile: (file: File) => void;
  setFileType: (type: FileType) => void;
  setSelectedAccounts: (accounts: Account[]) => void;
  setEditPerPlatform: (editPerPlatform: boolean) => void;
  setPostText: (postText: PostText) => void;
  setPostThumbnailFile: (file: File) => void;
  setPostFileURL: (fileURL: string) => void;
  setPostFile: (file: File) => void;
  setPostThumbnailURL: (url: string) => void;
  reset: () => void;
}

export const useCreatePostStore = create<CreatePostState>()((set) => ({
  step: "select-file",
  accounts: [],
  file: null,
  fileType: "video",
  selectedAccounts: [],
  postFileURL: null,
  editPerPlatform: false,
  postFile: null,
  postText: {
    instagram: {
      text: "",
    },
    youtube: {
      text: "",
    },
    tiktok: {
      text: "",
    },
  },
  postThumbnailFile: null,
  postThumbnailURL: null,
  setStep: (step: CreatePostStep) => set({ step }),
  setAccounts: (newAccounts: Account[]) => set({ accounts: newAccounts }),
  setFile: (file: File) => set({ file }),
  setFileType: (type: FileType) => set({ fileType: type }),
  setSelectedAccounts: (accounts: Account[]) =>
    set({ selectedAccounts: accounts }),
  setPostFileURL: (postFileURL: string) => set({ postFileURL }),
  setPostThumbnailFile: (file) => set({ postThumbnailFile: file }),
  setEditPerPlatform: (perPlatform: boolean) =>
    set({ editPerPlatform: perPlatform }),
  setPostFile: (file: File) => set({ postFile: file }),
  setPostText: (postText: PostText) => set({ postText }),
  setPostThumbnailURL: (thumbnail: string) =>
    set({ postThumbnailURL: thumbnail }),

  reset: () =>
    set((state) => ({
      step: "select-file",
      accounts: state.accounts,
      file: null,
      selectedAccounts: [],
      postFileURL: null,
      postText: {},
      postThumbnail: null,
    })),
}));
