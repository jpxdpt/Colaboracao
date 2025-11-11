import mongoose from 'mongoose';
import { config } from '../config';
import readline from 'readline';
import bcrypt from 'bcrypt';

// Definir UserRole localmente
enum UserRole {
  USER = 'user',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin',
}

// Schema do User inline para evitar problemas de importação
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
    avatar: {
      type: String,
      default: null,
    },
    preferences: {
      notifications: {
        achievements: { type: Boolean, default: true },
        tasks: { type: Boolean, default: true },
        goals: { type: Boolean, default: true },
        challenges: { type: Boolean, default: true },
        recognition: { type: Boolean, default: true },
        streaks: { type: Boolean, default: true },
        levelUps: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
      },
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
      },
      language: {
        type: String,
        default: 'pt',
      },
      privacy: {
        showProfile: { type: Boolean, default: true },
        showStats: { type: Boolean, default: true },
        showBadges: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password antes de salvar
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

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

