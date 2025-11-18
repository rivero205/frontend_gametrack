/**
 * Validation schemas and functions for forms
 */

/**
 * Validates game form data
 * @param {Object} data - Game form data
 * @returns {Object} - Validation result with errors
 */
export const validateGame = (data) => {
  const errors = {};

  if (!data.titulo?.trim()) {
    errors.titulo = 'El título es obligatorio';
  } else if (data.titulo.length < 2) {
    errors.titulo = 'El título debe tener al menos 2 caracteres';
  } else if (data.titulo.length > 100) {
    errors.titulo = 'El título no puede exceder 100 caracteres';
  }

  if (data.añoLanzamiento) {
    const year = parseInt(data.añoLanzamiento);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1958 || year > currentYear + 5) {
      errors.añoLanzamiento = `El año debe estar entre 1958 y ${currentYear + 5}`;
    }
  }

  if (data.genero && data.genero.length > 50) {
    errors.genero = 'El género no puede exceder 50 caracteres';
  }

  if (data.plataforma && data.plataforma.length > 50) {
    errors.plataforma = 'La plataforma no puede exceder 50 caracteres';
  }

  if (data.desarrollador && data.desarrollador.length > 100) {
    errors.desarrollador = 'El desarrollador no puede exceder 100 caracteres';
  }

  if (data.descripcion && data.descripcion.length > 1000) {
    errors.descripcion = 'La descripción no puede exceder 1000 caracteres';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates review form data
 * @param {Object} data - Review form data
 * @returns {Object} - Validation result with errors
 */
export const validateReview = (data) => {
  const errors = {};

  if (!data.puntuacion || data.puntuacion < 1 || data.puntuacion > 5) {
    errors.puntuacion = 'La puntuación debe estar entre 1 y 5';
  }

  if (!data.comentario?.trim()) {
    errors.comentario = 'El comentario es obligatorio';
  } else if (data.comentario.length < 10) {
    errors.comentario = 'El comentario debe tener al menos 10 caracteres';
  } else if (data.comentario.length > 2000) {
    errors.comentario = 'El comentario no puede exceder 2000 caracteres';
  }

  // Las horas ya no se recogen desde la reseña; no validamos horas aquí.

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with score and feedback
 */
export const validatePassword = (password) => {
  const errors = [];
  let score = 0;

  if (!password) {
    return { isValid: false, errors: ['La contraseña es obligatoria'], score: 0 };
  }

  if (password.length < 8) {
    errors.push('Debe tener al menos 8 caracteres');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    errors.push('Debe contener al menos un número');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial');
  } else {
    score += 1;
  }

  return {
    isValid: errors.length === 0,
    errors,
    score,
    strength: score <= 2 ? 'débil' : score <= 3 ? 'media' : score <= 4 ? 'fuerte' : 'muy fuerte'
  };
};