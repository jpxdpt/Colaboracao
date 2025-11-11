import mongoose from 'mongoose';
import { User } from '../models';
import { config } from '../config';
import readline from 'readline';

// Definir UserRole localmente para evitar problemas de importação
enum UserRole {
  USER = 'user',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin',
}

/**
 * Script para criar um usuário administrador
 * Uso: npm run create-admin ou tsx src/scripts/createAdmin.ts
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdmin() {
  try {
    console.log('🔐 Criando usuário administrador...\n');

    // Conectar ao MongoDB
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Conectado ao MongoDB\n');

    // Solicitar dados
    const email = await question('Email: ');
    const name = await question('Nome: ');
    const department = await question('Departamento: ');
    const password = await question('Senha: ');

    // Verificar se email já existe
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      console.log('\n❌ Erro: Email já está em uso!');
      process.exit(1);
    }

    // Criar usuário admin
    const adminUser = new User({
      email: email.toLowerCase().trim(),
      password: password,
      name: name.trim(),
      department: department.trim(),
      role: UserRole.ADMIN,
    });

    await adminUser.save();

    console.log('\n✅ Usuário administrador criado com sucesso!');
    console.log(`\n📧 Email: ${adminUser.email}`);
    console.log(`👤 Nome: ${adminUser.name}`);
    console.log(`🏢 Departamento: ${adminUser.department}`);
    console.log(`🔑 Role: ${adminUser.role}`);
    console.log(`\n💡 Você pode fazer login com estas credenciais.`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao criar usuário admin:', error);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

// Executar script
createAdmin();

