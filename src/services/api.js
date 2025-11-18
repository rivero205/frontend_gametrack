// Read API base URL from Vite env var. Set VITE_API_BASE in your .env files.
// Fallback to '/api' which is suitable for production deployments behind a proxy.
const BASE = import.meta.env.VITE_API_BASE || "/api";

// Build headers without reading localStorage token. Authentication is via httpOnly cookie.
// Build authentication headers.
// If a token is stored in localStorage (key `token`) include it as Bearer token.
function authHeaders(extra = {}) {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      return { Authorization: `Bearer ${token}`, ...extra };
    }
  } catch {
    // ignore localStorage errors (e.g., SSR or restricted environments)
  }
  return { ...extra };
}

// Default fetch options for requests that require authentication via cookie
function fetchAuthOptions(options = {}) {
  return { credentials: 'include', ...options };
}

async function handleResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  if (!res.ok) {
    const errorBody = isJson
      ? await res.json().catch(() => ({}))
      : { message: await res.text().catch(() => "") };
    // Log response body to help debugging 4xx/5xx errors
    try {
      console.warn('[api] Request failed', { status: res.status, body: errorBody });
    } catch {
      // ignore logging errors
    }
    const err = new Error(errorBody.message || "API request failed");
    err.status = res.status;
    err.body = errorBody;
    throw err;
  }
  return isJson ? res.json() : null;
}

export async function getGames({
  search,
  genero,
  plataforma,
  completado,
} = {}) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (genero) params.append("genero", genero);
  if (plataforma) params.append("plataforma", plataforma);
  if (typeof completado !== "undefined" && completado !== "")
    params.append("completado", completado);
  const res = await fetch(`${BASE}/games?${params}`, fetchAuthOptions({ headers: authHeaders() }));
  return handleResponse(res);
}

export async function getReviews() {
  const res = await fetch(`${BASE}/reviews`, fetchAuthOptions({ headers: authHeaders() }));
  return handleResponse(res);
}

// UserGames (biblioteca) endpoints
export async function getUserGames({ estado, page, limit } = {}) {
  const params = new URLSearchParams();
  if (estado) params.append('estado', estado);
  if (page) params.append('page', String(page));
  if (limit) params.append('limit', String(limit));
  const res = await fetch(`${BASE}/usergames?${params.toString()}`, fetchAuthOptions({ headers: authHeaders() }));
  return handleResponse(res);
}

export async function getUserGame(id) {
  const res = await fetch(`${BASE}/usergames/${id}`, fetchAuthOptions({ headers: authHeaders() }));
  return handleResponse(res);
}

export async function getGame(id) {
  const res = await fetch(`${BASE}/games/${id}`, fetchAuthOptions({ headers: authHeaders() }));
  return handleResponse(res);
}

export async function upsertUserGame(data) {
  const res = await fetch(`${BASE}/usergames`, fetchAuthOptions({
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  }));
  return handleResponse(res);
}

export async function updateUserGame(id, data) {
  const res = await fetch(`${BASE}/usergames/${id}`, fetchAuthOptions({
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  }));
  return handleResponse(res);
}

export async function deleteUserGame(id) {
  const res = await fetch(`${BASE}/usergames/${id}`, fetchAuthOptions({ method: 'DELETE', headers: authHeaders() }));
  return handleResponse(res);
}

export async function createGame(data) {
  const res = await fetch(`${BASE}/games`, fetchAuthOptions({
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  }));
  return handleResponse(res);
}

export async function linkOrCreateGame(data) {
  const res = await fetch(`${BASE}/games/link-or-create`, fetchAuthOptions({
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  }));
  return handleResponse(res);
}

export async function updateGame(id, data) {
  const res = await fetch(`${BASE}/games/${id}`, fetchAuthOptions({
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  }));
  return handleResponse(res);
}

export async function deleteGame(id) {
  const res = await fetch(`${BASE}/games/${id}`, fetchAuthOptions({ method: "DELETE", headers: authHeaders() }));
  return handleResponse(res);
}

export async function createReview(gameId, data) {
  const res = await fetch(`${BASE}/games/${gameId}/reviews`, fetchAuthOptions({
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  }));
  return handleResponse(res);
}

export async function deleteReview(id) {
  const res = await fetch(`${BASE}/reviews/${id}`, fetchAuthOptions({ method: "DELETE", headers: authHeaders() }));
  return handleResponse(res);
}

export async function registerUser(data) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateReview(id, data) {
  const res = await fetch(`${BASE}/reviews/${id}`, fetchAuthOptions({
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  }));
  return handleResponse(res);
}

export async function loginUser(data) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function logoutUser() {
  const res = await fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function getCurrentUser() {
  const res = await fetch(`${BASE}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function updateProfile(data) {
  const res = await fetch(`${BASE}/auth/me`, fetchAuthOptions({
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  }));
  return handleResponse(res);
}

export async function getImportedGames({ limit = 20, sort = '-metacritic' } = {}) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (sort) params.append('sort', sort);
  
  // Endpoint público - no requiere autenticación
  const res = await fetch(`${BASE}/games/importados?${params.toString()}`, {
    method: 'GET',
  });
  const data = await handleResponse(res);
  // Asegurar contrato estable: siempre devolver objeto con 'juegos'
  if (!data || typeof data !== 'object') {
    return { juegos: [] };
  }
  if (!Array.isArray(data.juegos)) {
    return { juegos: [] };
  }
  return data;
}

// Upload an image file to the backend. Expects a FormData with field 'file'.
export async function uploadImage(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/uploads`, fetchAuthOptions({ method: 'POST', body: form }));
  return handleResponse(res);
}

// Buscar juegos importados por nombre (público)
export async function searchImportedGames(query, { limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (query) params.append('search', query);
  if (limit) params.append('limit', String(limit));
  const res = await fetch(`${BASE}/games/importados?${params.toString()}`, { method: 'GET' });
  const data = await handleResponse(res);
  return data?.juegos || [];
}

// Comunidad: listar reseñas públicas por juego
export async function getCommunityReviews(gameId, { sort = 'recientes' } = {}) {
  const params = new URLSearchParams();
  if (sort) params.append('sort', sort);
  const res = await fetch(`${BASE}/community/games/${gameId}/reviews?${params.toString()}`, { method: 'GET' });
  return handleResponse(res);
}

// Obtener reseñas públicas globales de la comunidad
export async function getAllCommunityReviews({ sort = 'recientes', page, limit } = {}) {
  const params = new URLSearchParams();
  if (sort) params.append('sort', sort);
  if (page) params.append('page', String(page));
  if (limit) params.append('limit', String(limit));
  const res = await fetch(`${BASE}/community/reviews?${params.toString()}`, { method: 'GET' });
  return handleResponse(res);
}

// Comunidad: crear reseña (requiere auth vía cookie)
export async function createCommunityReview(gameId, data) {
  const res = await fetch(`${BASE}/community/games/${gameId}/reviews`, fetchAuthOptions({
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  }));
  return handleResponse(res);
}

// Dar like a una reseña (requiere auth)
export async function likeReview(reviewId) {
  const res = await fetch(`${BASE}/reviews/${reviewId}/like`, fetchAuthOptions({ method: 'POST', headers: authHeaders() }));
  return handleResponse(res);
}

export default {
  getGames,
  getReviews,
  getUserGames,
  getUserGame,
  upsertUserGame,
  updateUserGame,
  deleteUserGame,
  createGame,
  linkOrCreateGame,
  updateGame,
  deleteGame,
  createReview,
  deleteReview,
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getImportedGames,
  searchImportedGames,
  getCommunityReviews,
  createCommunityReview,
  likeReview,
  uploadImage,
  updateProfile,
};
