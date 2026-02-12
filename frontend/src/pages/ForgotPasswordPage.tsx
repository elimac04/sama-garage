import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/lib/api/auth.api';
import { useToast } from '@/stores/toastStore';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import logo from '@/assets/logo.png';
import frontImage from '@/assets/front-image.png';

const ForgotPasswordPage = () => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (!email) {
      setEmailError('Veuillez entrer votre adresse email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Veuillez entrer une adresse email valide.');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.forgotPassword({ email });
      setSent(true);
      toast.success('Email de réinitialisation envoyé !');

      // En mode dev, afficher le token dans la console pour faciliter les tests
      if (response?.resetToken) {
        console.log('🔗 Lien de réinitialisation (dev) :');
        console.log(`${window.location.origin}/reset-password?token=${response.resetToken}`);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Une erreur est survenue';
      toast.error(message);
      if (error.response?.status === 404) {
        setEmailError('Aucun compte associé à cet email.');
      } else {
        setEmailError(message);
      }
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
          <div className="mb-12">
            <img src={logo} alt="SAMA GARAGE" className="h-28 w-auto" />
          </div>

          {sent ? (
            /* Confirmation d'envoi */
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Email envoyé !
              </h1>
              <p className="text-gray-600 mb-2">
                Un lien de réinitialisation a été envoyé à :
              </p>
              <p className="text-primary-600 font-semibold mb-6">{email}</p>
              <p className="text-sm text-gray-500 mb-8">
                Vérifiez votre boîte de réception et vos spams. Le lien expire dans 1 heure.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSent(false);
                    setEmail('');
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Renvoyer l'email
                </button>
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors py-3"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la connexion
                </Link>
              </div>
            </div>
          ) : (
            /* Formulaire */
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Mot de passe oublié ?
              </h1>
              <p className="text-gray-600 mb-8">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError('');
                      }}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                        emailError ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                      placeholder="votre@email.com"
                      autoFocus
                    />
                  </div>
                  {emailError && (
                    <p className="mt-1 text-sm text-red-500">{emailError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
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

export default ForgotPasswordPage;
