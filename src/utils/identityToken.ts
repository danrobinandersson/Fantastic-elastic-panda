const TOKEN_STORAGE_KEY = "identity-token";

export function getIdentityTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("identity_token");

  if (tokenFromUrl) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, tokenFromUrl);

    window.history.replaceState({}, document.title, window.location.pathname);

    return tokenFromUrl;
  }

  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}
