import { connectDB } from '../db/connection.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function createAdmin() {
  try {
    await connectDB();
    console.log('✅ Conectado ao MongoDB\n');

    const name = await question('Nome do administrador: ');
    const email = await question('Email: ');
    const password = await question('Password: ');

    // Verificar se email já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ Email já existe!');
      process.exit(1);
    }

    // Hash da password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Criar admin
    const admin = await User.create({
      email,
      password_hash: passwordHash,
      name,
      role: 'admin',
    });

    console.log('\n✅ Administrador criado com sucesso!');
    console.log(`   ID: ${admin._id}`);
    console.log(`   Nome: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error);
    rl.close();
    process.exit(1);
  }
}

createAdmin();

