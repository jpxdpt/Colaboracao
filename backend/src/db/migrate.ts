import { connectDB } from './connection.js';

async function migrate() {
  try {
    await connectDB();
    console.log('✅ Conexão estabelecida. MongoDB não requer migrações SQL.');
    console.log('✅ Os modelos serão criados automaticamente na primeira inserção.');
    console.log('✅ Base de dados pronta para uso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao conectar:', err);
    process.exit(1);
  }
}

migrate();
