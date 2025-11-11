import mongoose from 'mongoose';
import readline from 'readline';
import { config } from '../config';
import { User } from '../models';

// Definir UserRole localmente para evitar problemas de importação circular
enum UserRole {
  USER = 'user',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin',
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function getArgValue(flag: string): string | undefined {
  const index = process.argv.findIndex((arg) => arg === flag || arg.startsWith(`${flag}=`));
  if (index === -1) {
    return undefined;
  }

  const arg = process.argv[index];
  if (arg.includes('=')) {
    return arg.split('=')[1];
  }

  return process.argv[index + 1];
}

async function demoteAdmin() {
  try {
    console.log('🔐 Rebaixando utilizador (removendo privilégios de admin)...\n');

    // Conectar ao MongoDB
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Conectado ao MongoDB\n');

    const emailArg = getArgValue('--email') || getArgValue('-e');
    let email = emailArg;

    if (!email) {
      email = await question('Email do utilizador a rebaixar: ');
    }

    email = email?.toLowerCase().trim();

    if (!email) {
      console.log('\n❌ Erro: Email não fornecido.');
      process.exit(1);
    }

    // Buscar utilizador
    const user = await User.findOne({ email });
    if (!user) {
      console.log('\n❌ Erro: Utilizador não encontrado!');
      process.exit(1);
    }

    if (user.role !== UserRole.ADMIN) {
      console.log(
        `\nℹ️  Utilizador ${user.email} não é administrador (role atual: ${user.role}). Nenhuma alteração efetuada.`
      );
      process.exit(0);
    }

    user.role = UserRole.USER;
    await user.save();

    console.log('\n✅ Utilizador rebaixado para "user" com sucesso!');
    console.log(`\n📧 Email: ${user.email}`);
    console.log(`👤 Nome: ${user.name}`);
    console.log(`🔑 Role atual: ${user.role}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao rebaixar utilizador:', error);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

demoteAdmin();


