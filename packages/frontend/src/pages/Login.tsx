import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { queryClient } from '../main';

const REMEMBER_ME_KEY = 'taskify-remember-me';
const REMEMBERED_EMAIL_KEY = 'taskify-remembered-email';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Carregar credenciais salvas quando o componente monta
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    const shouldRemember = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    
    if (shouldRemember && rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
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
      }>('/api/auth/login', { email, password });

      if (response.success && response.data) {
        // Sempre limpar cache ao fazer login para evitar dados de outra conta
        queryClient.clear();

        // Salvar credenciais se "lembrar-me" estiver marcado
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, 'true');
          localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
        } else {
          // Limpar credenciais salvas se "lembrar-me" não estiver marcado
          localStorage.removeItem(REMEMBER_ME_KEY);
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }

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
        toast.success('Login realizado com sucesso! 🎉');
        // Pequeno delay para garantir que o estado seja persistido antes de navegar
        setTimeout(() => {
        navigate('/dashboard');
        }, 100);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
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
            <h1 className="text-4xl font-bold text-gradient-purple">Taskify</h1>
            <p className="text-gray-600 dark:text-gray-300">Transforme seu trabalho em uma aventura!</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              icon={<Mail className="w-5 h-5" />}
              placeholder="seu@email.com"
            />

            <Input
              type="password"
              label="Senha"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              icon={<Lock className="w-5 h-5" />}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                />
                Lembrar-me
              </label>
              <a href="/forgot-password" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
                Esqueceu a senha?
              </a>
            </div>

            <Button
              type="submit"
              variant="gamified"
              loading={loading}
              icon={<LogIn className="w-5 h-5" />}
              className="w-full"
            >
              Entrar
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Não tem conta?{' '}
              <Link to="/register" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">
                Registre-se agora
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
