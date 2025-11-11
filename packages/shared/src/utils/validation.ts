/**
 * Utilitários de validação partilhados
 */

/**
 * Valida se um email é válido
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida se uma password é forte o suficiente
 */
export const isStrongPassword = (password: string): boolean => {
  // Pelo menos 8 caracteres, uma letra maiúscula, uma minúscula e um número
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Sanitiza uma string removendo caracteres perigosos
 */
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};


