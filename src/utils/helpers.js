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