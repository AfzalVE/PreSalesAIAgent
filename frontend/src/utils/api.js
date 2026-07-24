export const API_BASE_URL = "http://localhost:8000/api/v1";

/**
 * A wrapper around standard fetch that automatically attaches the
 * Authorization header if a token exists in localStorage.
 * 
 * @param {string} endpoint The path (e.g. "/admin/login")
 * @param {RequestInit} options Standard fetch options
 * @returns {Promise<any>} JSON response or throws error
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = localStorage.getItem("access_token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch (e) {
      // Not JSON
    }
    const message = errorData?.detail || errorData?.message || `Error ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  // If response has no content (e.g. 204), return empty object
  if (response.status === 204) {
    return {};
  }
  
  return response.json();
}
