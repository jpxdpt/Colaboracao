// Vercel serverless function handler
// Importa a app Express compilada do TypeScript
try {
  const server = require('../dist/server.js');
  
  // O TypeScript compila export default para exports.default em CommonJS
  // Exporta a app Express como handler serverless
  const app = server.default || server;
  
  if (!app) {
    throw new Error('App não encontrada no módulo server.js');
  }
  
  module.exports = app;
} catch (error) {
  console.error('Erro ao carregar server.js:', error);
  // Criar uma app Express básica para evitar crash total
  const express = require('express');
  const app = express();
  app.get('*', (req, res) => {
    res.status(500).json({ 
      error: 'Erro ao carregar aplicação',
      message: error.message 
    });
  });
  module.exports = app;
}
