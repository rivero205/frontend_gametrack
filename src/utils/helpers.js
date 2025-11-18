/**
 * Validates game data before saving
 * @param {Object} gameData - The game data to validate
 * @returns {Object} - Clean game data
 */
export const validateGameData = (gameData) => {
  return {
    titulo: gameData.titulo?.trim() || '',
    genero: gameData.genero || null,
    plataforma: gameData.plataforma || null,
    añoLanzamiento: gameData.añoLanzamiento ? parseInt(gameData.añoLanzamiento) : null,
    desarrollador: gameData.desarrollador?.trim() || null,
    imagenPortada: gameData.imagenPortada?.trim() || null,
    descripcion: gameData.descripcion?.trim() || null,
  // horasTotalesJugadas: número de horas reportadas por el usuario al completar (puede ser null)
  horasTotalesJugadas: (gameData.horasTotalesJugadas !== undefined && gameData.horasTotalesJugadas !== null) ? parseFloat(gameData.horasTotalesJugadas) : null,
    // Estado: 'pendiente'|'jugando'|'completado'
    estado: gameData.estado || (gameData.completado ? 'completado' : 'pendiente'),
    completado: Boolean(gameData.completado)
  };
};

/**
 * Formats a date to a readable string
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncates text to a specific length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

/**
 * Resolve an image URL coming from the API/database into an absolute URL
 * using the configured backend origin (VITE_API_BASE). This helps when
 * stored URLs include localhost paths from developer machines or are
 * relative (start with `/assets/...`).
 */
export function resolveImageUrl(url) {
  if (!url) return null;
  try {
    const base = import.meta.env.VITE_API_BASE || '/api';
    const backendOrigin = base.startsWith('http') ? base.replace(/\/api$/,'') : '';

    // Absolute URL already
    if (/^https?:\/\//i.test(url)) {
      // If the URL points to localhost (developer upload), map it to backend origin when available
      if (url.includes('localhost') && backendOrigin) {
        const idx = url.indexOf('/assets');
        return idx >= 0 ? backendOrigin + url.slice(idx) : backendOrigin + url;
      }
      return url;
    }

    // Relative path (starts with '/'), prefix backend origin if available
    if (url.startsWith('/')) {
      return backendOrigin ? backendOrigin + url : url;
    }

    // Fallback: return as-is
    return url;
  } catch {
    return url;
  }
}