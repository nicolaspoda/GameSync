export const backendBaseUrl =
  import.meta.env.VITE_BACKEND_URL &&
  import.meta.env.VITE_BACKEND_URL.trim() !== ""
    ? import.meta.env.VITE_BACKEND_URL
    : "http://localhost:3003";
