declare module 'argon2' {
  export type HashOptions = {
    type?: number;
  };

  export const argon2id: number;

  export function hash(password: string, options?: HashOptions): Promise<string>;

  export function verify(hash: string, password: string): Promise<boolean>;
}
