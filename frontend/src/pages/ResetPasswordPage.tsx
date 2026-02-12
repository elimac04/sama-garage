import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api/auth.api';
import { useToast } from '@/stores/toastStore';
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertTriangle, Lock, Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';
import frontImage from '@/assets/front-image.png';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  // Vérifier la validité du token au chargement
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false);
        setTokenValid(false);
        return;
      }

      try {
        const result = await authApi.verifyResetToken(token);
        setTokenValid(result.valid === true);
      } catch {
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const validatePassword = (): boolean => {
    setPasswordError('');
    setConfirmError('');

    if (!password) {
      setPasswordError('Veuillez entrer un nouveau mot de passe.');
      return false;
    }

    if (password.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères.');
      return false;
    }

    if (!confirmPassword) {
      setConfirmError('Veuillez confirmer votre mot de passe.');
      return false;
    }

    if (password !== confirmPassword) {
      setConfirmError('Les mots de passe ne correspondent pas.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) return;

    setLoading(true);

    try {
      await authApi.resetPassword({ token, newPassword: password });
      setSuccess(true);
      toast.success('Mot de passe réinitialisé avec succès !');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Une erreur est survenue';
      toast.error(message);
      setPasswordError(message);
    } finally {
      setLoading(false);
    }
  };

  // Calcul de la force du mot de passe
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { label: 'Faible', color: 'bg-red-500', width: '20%' };
    if (score <= 2) return { label: 'Moyen', color: 'bg-orange-500', width: '40%' };
    if (score <= 3) return { label: 'Bon', color: 'bg-yellow-500', width: '60%' };
    if (score <= 4) return { label: 'Fort', color: 'bg-green-500', width: '80%' };
    return { label: 'Excellent', color: 'bg-green-600', width: '100%' };
  };

  const strength = getPasswordStrength(password);

  // Écran de chargement pendant la vérification du token
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Côté gauche */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-12">
            <img src={logo} alt="SAMA GARAGE" className="h-28 w-auto" />
          </div>

          {/* Token invalide ou absent */}
          {!tokenValid && !success && (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Lien invalide
              </h1>
              <p className="text-gray-600 mb-8">
                Ce lien de réinitialisation est invalide ou a expiré. Veuillez faire une nouvelle demande.
              </p>
              <div className="space-y-3">
                <Link
                  to="/forgot-password"
                  className="w-full inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                >
                  Nouvelle demande
                </Link>
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors py-3"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la connexion
                </Link>
              </div>
            </div>
          )}

          {/* Succès */}
          {success && (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Mot de passe modifié !
              </h1>
              <p className="text-gray-600 mb-8">
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Se connecter
              </button>
            </div>
          )}

          {/* Formulaire de nouveau mot de passe */}
          {tokenValid && !success && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Nouveau mot de passe
              </h1>
              <p className="text-gray-600 mb-8">
                Choisissez un nouveau mot de passe sécurisé pour votre compte.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                        passwordError ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                      placeholder="Minimum 6 caractères"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="mt-1 text-sm text-red-500">{passwordError}</p>
                  )}

                  {/* Indicateur de force */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Force du mot de passe</span>
                        <span className="text-xs font-medium text-gray-700">{strength.label}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strength.color} rounded-full transition-all duration-300`}
                          style={{ width: strength.width }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmer mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setConfirmError('');
                      }}
                      className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                        confirmError ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                      placeholder="Retapez le mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {confirmError && (
                    <p className="mt-1 text-sm text-red-500">{confirmError}</p>
                  )}
                  {confirmPassword && password === confirmPassword && !confirmError && (
                    <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Les mots de passe correspondent
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </button>
              </form>

              <div className="mt-8">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
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

export default ResetPasswordPage;
