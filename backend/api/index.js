// Vercel serverless function handler
// Importa a app compilada do TypeScript
const server = require('../dist/server.js');

// Exporta a app Express como handler serverless
module.exports = server.default || server;
