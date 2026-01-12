import { User } from "@/types/auth";

export type Team = {
  id: string;
  name: string;
  description?: string | null;
  members?: { id: string; name?: string; email?: string }[];
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
