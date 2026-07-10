import { Account } from '../types/account';

const LINKED_ACCOUNTS_KEY = 'caitong.linkedAccounts';
const REMOVED_ACCOUNT_IDS_KEY = 'caitong.removedAccountIds';

export function getLinkedAccounts(): Account[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(LINKED_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) as Account[] : [];
  } catch {
    return [];
  }
}

export function saveLinkedAccounts(accounts: Account[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(LINKED_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getRemovedAccountIds(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(REMOVED_ACCOUNT_IDS_KEY);
    return raw ? JSON.parse(raw) as string[] : [];
  } catch {
    return [];
  }
}

export function saveRemovedAccountIds(accountIds: string[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(REMOVED_ACCOUNT_IDS_KEY, JSON.stringify(accountIds));
}
