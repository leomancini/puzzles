const STORAGE_KEY = 'puzzles_username';

export function getUsername() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setUsername(name) {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // silently fail if storage unavailable
  }
}
