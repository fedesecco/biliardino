export const SHARED_ACCOUNT_EMAIL = 'biliardino@teleniasoftware.com';

export function isSharedAccount(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === SHARED_ACCOUNT_EMAIL;
}
