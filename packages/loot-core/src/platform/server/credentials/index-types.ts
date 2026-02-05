// @ts-strict-ignore
// Platform-agnostic credential storage interface

export interface SecureCredentials {
  setCredential(key: string, value: string): Promise<void>;
  getCredential(key: string): Promise<string | null>;
  deleteCredential(key: string): Promise<void>;
  hasCredential(key: string): Promise<boolean>;
}

export declare function init(): Promise<void>;
export type Init = typeof init;

export declare function setCredential(
  key: string,
  value: string,
): Promise<void>;
export type SetCredential = typeof setCredential;

export declare function getCredential(key: string): Promise<string | null>;
export type GetCredential = typeof getCredential;

export declare function deleteCredential(key: string): Promise<void>;
export type DeleteCredential = typeof deleteCredential;

export declare function hasCredential(key: string): Promise<boolean>;
export type HasCredential = typeof hasCredential;
