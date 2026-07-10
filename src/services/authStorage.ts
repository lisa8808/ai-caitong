export interface AuthUser {
  id: string;
  nickname: string;
  account: string;
  password: string;
  level: '免费版' | '专业版';
  createdAt: string;
}

const USERS_KEY = 'caitong.auth.users';
const CURRENT_USER_KEY = 'caitong.auth.currentUser';

export const demoUser: AuthUser = {
  id: 'demo-user',
  nickname: '李女士',
  account: 'mx_9hgz3w3knx',
  password: 'demo123',
  level: '专业版',
  createdAt: '2026-07-09T00:00:00.000Z',
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getAuthUsers(): AuthUser[] {
  const users = readJson<AuthUser[]>(USERS_KEY, []);
  return users.some((user) => user.account === demoUser.account) ? users : [demoUser, ...users];
}

export function saveAuthUsers(users: AuthUser[]) {
  writeJson(USERS_KEY, users);
}

export function getCurrentUser(): AuthUser | null {
  return readJson<AuthUser | null>(CURRENT_USER_KEY, null);
}

export function saveCurrentUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;

  if (user) {
    writeJson(CURRENT_USER_KEY, user);
  } else {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }
}
