const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/;

export function normalizeUsername(input: string) {
  return input.trim().toLowerCase();
}

export function isValidUsername(username: string) {
  return USERNAME_RE.test(username);
}
