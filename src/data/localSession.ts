const LOCAL_SESSION_KEY = "shopping-mall-session";

export type UserSession = {
  memberId: number;
  nickname: string;
  email: string;
};

export function getCurrentSession(): UserSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(LOCAL_SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as UserSession;
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LOCAL_SESSION_KEY);
}
