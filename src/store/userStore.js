import { useEffect, useState } from "react";

const STORAGE_KEY = "aurora-user";

const listeners = new Set();
let state = {
  user: null,
  isLoading: false,
  hasLoaded: false,
};

function emit(nextState) {
  state = nextState;
  listeners.forEach((listener) => listener());
}

function readStoredUser() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(nextUser) {
  if (typeof window === "undefined") return;

  try {
    if (nextUser) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      return;
    }

    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignora falhas de storage em ambientes restritivos
  }
}

export function subscribeUser(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getUserSnapshot() {
  return {
    ...state,
    user: state.user ?? readStoredUser(),
  };
}

export function useUserStore() {
  const [snapshot, setSnapshot] = useState(getUserSnapshot);

  useEffect(() => {
    const listener = () => setSnapshot(getUserSnapshot());
    const unsubscribe = subscribeUser(listener);
    setSnapshot(getUserSnapshot());
    return unsubscribe;
  }, []);

  return snapshot;
}

export function setUser(nextUser) {
  const nextState = {
    ...state,
    user: nextUser ?? null,
    hasLoaded: true,
  };

  writeStoredUser(nextState.user);
  emit(nextState);
}

export function clearUser() {
  setUser(null);
}

export async function loadUser(force = false) {
  const cachedUser = state.user ?? readStoredUser();

  if (!force && cachedUser) {
    emit({ ...state, user: cachedUser, hasLoaded: true });
    return cachedUser;
  }

  if (state.isLoading) {
    return state.user ?? readStoredUser();
  }

  emit({ ...state, isLoading: true });

  try {
    const response = await fetch("http://localhost:3001/api/auth/me", {
      credentials: "include",
    });

    if (!response.ok) {
      clearUser();
      return null;
    }

    const data = await response.json();
    const nextUser = data?.user ?? null;
    setUser(nextUser);
    return nextUser;
  } catch {
    clearUser();
    return null;
  } finally {
    emit({ ...state, isLoading: false, hasLoaded: true });
  }
}

export function getCurrentUser() {
  return state.user ?? readStoredUser();
}

export function initializeUserStore() {
  const cachedUser = readStoredUser();

  if (cachedUser) {
    emit({ ...state, user: cachedUser, hasLoaded: true });
    return;
  }

  emit({ ...state, hasLoaded: true });
}

if (typeof window !== "undefined") {
  initializeUserStore();
}
