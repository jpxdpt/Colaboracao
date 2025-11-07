// Vercel serverless function handler
// Importa a app compilada do TypeScript
const server = require('../dist/server.js');

// O TypeScript compila export default para exports.default em CommonJS
// Tenta diferentes formas de acesso para garantir compatibilidade
let app = server;

// Se tiver exports.default (CommonJS com ES module interop)
if (server.default) {
  app = server.default;
}
// Se for um objeto com propriedade app
else if (server.app) {
  app = server.app;
}
// Se for diretamente a app (fallback)
else if (typeof server === 'function') {
  app = server;
}

module.exports = app;
