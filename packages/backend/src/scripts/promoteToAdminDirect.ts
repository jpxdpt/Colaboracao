import mongoose from 'mongoose';
import { config } from '../config';
import readline from 'readline';

// Definir UserRole localmente
enum UserRole {
  USER = 'user',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin',
}

// Schema do User inline
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', UserSchema);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function promoteToAdmin() {
  try {
    console.log('🔐 Promovendo usuário a administrador...\n');

    // Conectar ao MongoDB
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Conectado ao MongoDB\n');

    // Solicitar email
    const email = await question('Email do usuário a promover: ');

    // Buscar usuário
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log('\n❌ Erro: Usuário não encontrado!');
      process.exit(1);
    }

    // Verificar se já é admin
    if (user.role === UserRole.ADMIN) {
      console.log('\n⚠️  Este usuário já é administrador!');
      process.exit(0);
    }

    // Promover a admin
    user.role = UserRole.ADMIN;
    await user.save();

    console.log('\n✅ Usuário promovido a administrador com sucesso!');
    console.log(`\n📧 Email: ${user.email}`);
    console.log(`👤 Nome: ${user.name}`);
    console.log(`🔑 Role: ${user.role}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao promover usuário:', error);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

// Executar script
promoteToAdmin();

