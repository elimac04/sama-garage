import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import { Eye, EyeOff, Wrench } from 'lucide-react';
import logo from '@/assets/logo.png';
import frontImage from '@/assets/front-image.png';

const AgentLoginPage = () => {
  const navigate = useNavigate();
  const { loginWithApi, logout } = useAuthStore();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Ce champ est requis.');
      return;
    }
    if (!password) {
      setPasswordError('Ce champ est requis.');
      return;
    }

    setLoading(true);

    try {
      await loginWithApi(email, password);

      // Vérifier que l'utilisateur est bien un agent
      const user = useAuthStore.getState().user;
      if (user?.role !== 'mechanic' && user?.role !== 'cashier') {
        logout();
        toast.error('Cet espace est réservé aux agents. Utilisez la page de connexion administrateur.');
        setLoading(false);
        return;
      }

      toast.success('Connexion réussie !');
      navigate('/');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Email ou mot de passe incorrect';
      toast.error(message);
      setEmailError('Identifiants invalides');
      setPasswordError('Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Côté gauche - Formulaire */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src={logo} 
              alt="SAMA GARAGE" 
              className="h-24 w-auto"
            />
          </div>

          {/* Badge Espace Agent */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full mb-6">
            <Wrench className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Espace Agent</span>
          </div>

          {/* Titre */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connexion Agent</h1>
          <p className="text-gray-500 mb-8">Mécanicien ou Caissier — connectez-vous à votre espace de travail</p>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                className={`w-full px-4 py-3 rounded-lg border ${
                  emailError ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                placeholder="votre.email@example.com"
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-500">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    passwordError ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-sm text-red-500">{passwordError}</p>
              )}
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

        </div>
      </div>

      {/* Côté droit - Image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img 
          src={frontImage} 
          alt="SAMA GARAGE" 
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default AgentLoginPage;
