import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Building2, UserPlus, Sparkles } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { queryClient } from '../main';

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    name?: string;
    department?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme a senha';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    if (!formData.name) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.department) {
      newErrors.department = 'Departamento é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<{
        success: boolean;
        data: {
          user: {
            _id: string;
            email: string;
            name: string;
            avatar?: string;
            role: string;
          };
          tokens: {
            accessToken: string;
            refreshToken: string;
          };
        };
      }>('/api/auth/register', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        department: formData.department,
      });

      if (response.success && response.data) {
        // Limpar cache ao fazer registro para garantir dados limpos
        queryClient.clear();
        
        setAuth(
          {
            id: response.data.user._id,
            email: response.data.user.email,
            name: response.data.user.name,
            avatar: response.data.user.avatar,
            role: response.data.user.role,
          },
          response.data.tokens.accessToken,
          response.data.tokens.refreshToken
        );
        toast.success('Registo realizado com sucesso! 🎉');
        // Pequeno delay para garantir que o estado seja persistido antes de navegar
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer registo');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 dark:from-purple-900 dark:via-pink-900 dark:to-orange-900 p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-3xl shadow-2xl dark:shadow-gray-900/50 p-8 space-y-6 border border-white/20 dark:border-gray-700/50">
          {/* Logo e Título */}
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="flex justify-center"
            >
              <div className="w-20 h-20 bg-gradient-purple rounded-full flex items-center justify-center shadow-glow-purple">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h1 className="text-4xl font-bold text-gradient-purple">Gamify</h1>
            <p className="text-gray-600 dark:text-gray-300">Crie sua conta e comece a gamificar!</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="text"
              label="Nome"
              value={formData.name}
              onChange={handleChange('name')}
              error={errors.name}
              icon={<User className="w-5 h-5" />}
              placeholder="Seu nome completo"
            />

            <Input
              type="email"
              label="Email"
              value={formData.email}
              onChange={handleChange('email')}
              error={errors.email}
              icon={<Mail className="w-5 h-5" />}
              placeholder="seu@email.com"
            />

            <Input
              type="text"
              label="Departamento"
              value={formData.department}
              onChange={handleChange('department')}
              error={errors.department}
              icon={<Building2 className="w-5 h-5" />}
              placeholder="Ex: Desenvolvimento, Marketing..."
            />

            <Input
              type="password"
              label="Senha"
              value={formData.password}
              onChange={handleChange('password')}
              error={errors.password}
              icon={<Lock className="w-5 h-5" />}
              placeholder="Mínimo 8 caracteres"
            />

            <Input
              type="password"
              label="Confirmar Senha"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={errors.confirmPassword}
              icon={<Lock className="w-5 h-5" />}
              placeholder="Digite a senha novamente"
            />

            <Button
              type="submit"
              variant="gamified"
              loading={loading}
              icon={<UserPlus className="w-5 h-5" />}
              className="w-full"
            >
              Criar Conta
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Já tem conta?{' '}
              <Link to="/login" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

