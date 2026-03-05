export type Id = string;

export type ApiError = {
  code: string;
  message: string;
};

export type Paginated<T> = {
  items: T[];
  nextCursor?: string | null;
};

export type TrustLevel = "new" | "normal" | "trusted" | "restricted";

export const TRUST_LEVELS: TrustLevel[] = ["new", "normal", "trusted", "restricted"];
