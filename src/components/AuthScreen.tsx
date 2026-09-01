import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  User as UserIcon, 
  BadgeCheck, 
  Building2, 
  Briefcase, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  saveUserProfile 
} from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthModalProps {
  onSuccess: () => void;
}

export const AuthScreen: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [badge, setBadge] = useState('');
  const [role, setRole] = useState('Inspetor de Polícia');
  const [department, setDepartment] = useState('Cartório de Inquéritos');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(
          // Firebase auth requires valid email format
          email.includes('@') ? email : `${email.toLowerCase().replace(/[^a-z0-9]/g, '')}@policiacivil.ce.gov.br`,
          password
        );
      } else {
        const finalEmail = email.includes('@') ? email : `${email.toLowerCase().replace(/[^a-z0-9]/g, '')}@policiacivil.ce.gov.br`;
        const cred = await createUserWithEmailAndPassword(finalEmail, password);
        
        const profile: UserProfile = {
          userId: cred.user.uid,
          name: name.trim() || 'Servidor Policial',
          email: finalEmail,
          badge: badge.trim() || '300.' + Math.floor(100 + Math.random() * 900) + '-1-A',
          role: role,
          department: department,
          createdAt: new Date().toISOString(),
        };

        await saveUserProfile(profile);
      }
      onSuccess();
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Credenciais inválidas. Verifique seu e-mail funcional e senha.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado no sistema da 1ª DP.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError(err.message || 'Ocorreu um erro ao processar a autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Accounts for fast inspection
  const handleQuickDemo = async (demoRole: 'inspetor' | 'escrivao' | 'delegado') => {
    setLoading(true);
    setError(null);
    
    const demoConfigs = {
      inspetor: {
        email: 'inspetor.maracanau@policiacivil.ce.gov.br',
        pass: 'policia123',
        name: 'Inspetor Carlos Eduardo Melo',
        badge: '302.441-1-B',
        role: 'Inspetor de Polícia Civil',
        department: 'Setor de Investigações (GIE)',
      },
      escrivao: {
        email: 'escriva.maracanau@policiacivil.ce.gov.br',
        pass: 'policia123',
        name: 'Escrivã Ana Beatriz Santana',
        badge: '201.889-1-A',
        role: 'Escrivã de Polícia Civil',
        department: 'Cartório do 1º Distrito Policial',
      },
      delegado: {
        email: 'delegado.maracanau@policiacivil.ce.gov.br',
        pass: 'policia123',
        name: 'Dr. Roberto Vasconcelos',
        badge: '104.992-1-X',
        role: 'Delegado de Polícia Civil',
        department: 'Gabinete do Titular - 1ª DP',
      },
    };

    const target = demoConfigs[demoRole];

    try {
      let cred: { user: { uid: string } };
      try {
        cred = await signInWithEmailAndPassword(target.email, target.pass);
      } catch (loginErr: any) {
        cred = await createUserWithEmailAndPassword(target.email, target.pass);
      }
      
      const profile: UserProfile = {
        userId: cred.user.uid,
        name: target.name,
        email: target.email,
        badge: target.badge,
        role: target.role,
        department: target.department,
        createdAt: new Date().toISOString(),
      };
      await saveUserProfile(profile);
      onSuccess();
    } catch (err: any) {
      console.error('Demo login error:', err);
      setError('Falha ao autenticar perfil de demonstração. Tente criar uma nova conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Police Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e3a8a_0%,transparent_55%)] opacity-40 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-slate-800/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-6 py-6 border-b border-slate-700/80 text-center relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 shadow-inner">
            <Shield className="w-9 h-9" />
          </div>
          <div className="text-xs font-bold tracking-widest uppercase text-amber-400/90 mb-1">
            Polícia Civil do Ceará • PCCE
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            1ª Delegacia de Polícia de Maracanaú
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Sistema de Cronograma Diário, Gestão de Pautas e Procedimentos em Tempo Real
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-700">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors duration-150 flex items-center justify-center gap-2 ${
              isLogin 
                ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-800' 
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
            }`}
          >
            <Lock className="w-4 h-4" />
            Entrar no Sistema
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors duration-150 flex items-center justify-center gap-2 ${
              !isLogin 
                ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-800' 
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
            }`}
          >
            <BadgeCheck className="w-4 h-4" />
            Cadastrar Servidor
          </button>
        </div>

        {/* Form body */}
        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nome Completo do Servidor
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: João da Silva Santos"
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Matrícula Funcional
                    </label>
                    <div className="relative">
                      <BadgeCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={badge}
                        onChange={(e) => setBadge(e.target.value)}
                        placeholder="Ex: 301.882-1-A"
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Cargo / Função
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      >
                        <option value="Inspetor de Polícia">Inspetor(a) de Polícia</option>
                        <option value="Escrivão de Polícia">Escrivão / Escrivã de Polícia</option>
                        <option value="Delegado de Polícia">Delegado(a) de Polícia</option>
                        <option value="Agente de Polícia">Agente de Polícia</option>
                        <option value="Chefe de Cartório">Chefe de Cartório</option>
                        <option value="Chefe de Investigação">Chefe de Investigação</option>
                        <option value="Policial Plantonista">Policial Plantonista</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Setor / Cartório (1ª DP)
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      >
                        <option value="Cartório de Inquéritos">Cartório de Inquéritos</option>
                        <option value="Setor de Investigações (GIE)">Setor de Investigações (GIE)</option>
                        <option value="Cartório do Plantão">Cartório do Plantão</option>
                        <option value="Cartório de TCOs">Cartório de TCOs</option>
                        <option value="Gabinete do Delegado Titular">Gabinete do Titular</option>
                        <option value="Setor de Expediente e Remessas">Setor de Expediente</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail Funcional ou Usuário
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@policiacivil.ce.gov.br ou seu.nome"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Acessar Cronograma da 1ª DP' : 'Concluir Cadastro de Servidor'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Preset Buttons for Testing */}
          <div className="pt-4 border-t border-slate-700/60">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Acesso Rápido de Demonstração (1 Clique)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('inspetor')}
                disabled={loading}
                className="px-3 py-2 bg-slate-900/90 hover:bg-slate-700/90 border border-slate-700 hover:border-slate-500 rounded-xl text-left transition text-xs group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-amber-400 flex items-center justify-between">
                  <span>Inspetor</span>
                  <BadgeCheck className="w-3.5 h-3.5 text-amber-400/80" />
                </div>
                <div className="text-[10px] text-slate-400 truncate">Investigações (GIE)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('escrivao')}
                disabled={loading}
                className="px-3 py-2 bg-slate-900/90 hover:bg-slate-700/90 border border-slate-700 hover:border-slate-500 rounded-xl text-left transition text-xs group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-amber-400 flex items-center justify-between">
                  <span>Escrivã</span>
                  <BadgeCheck className="w-3.5 h-3.5 text-amber-400/80" />
                </div>
                <div className="text-[10px] text-slate-400 truncate">Cartório 1ª DP</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('delegado')}
                disabled={loading}
                className="px-3 py-2 bg-slate-900/90 hover:bg-slate-700/90 border border-slate-700 hover:border-slate-500 rounded-xl text-left transition text-xs group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-amber-400 flex items-center justify-between">
                  <span>Delegado</span>
                  <BadgeCheck className="w-3.5 h-3.5 text-amber-400/80" />
                </div>
                <div className="text-[10px] text-slate-400 truncate">Titular 1ª DP</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 text-center text-[11px] text-slate-400">
          Secretaria da Segurança Pública e Defesa Social • Estado do Ceará
        </div>
      </div>
    </div>
  );
};
