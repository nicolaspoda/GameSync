interface ImportMetaEnv {
  readonly VITE_HANGMAN_BACKEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

export function getHangmanBackendUrl(): string {
  if (
    import.meta.env.VITE_HANGMAN_BACKEND_URL &&
    import.meta.env.VITE_HANGMAN_BACKEND_URL.trim() !== ''
  ) {
    return import.meta.env.VITE_HANGMAN_BACKEND_URL
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:3000'
  }

  return `${window.location.protocol}//${window.location.hostname}:3000`
}
