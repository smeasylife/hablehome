const LOCAL_SESSION_KEY = "shopping-mall-session";

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LOCAL_SESSION_KEY);
}
