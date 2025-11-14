import React, { useState } from 'react';
import type { UsuarioTecnico } from '../types';
import { Button, Input, LoadingSpinner } from './ui';
import { logoAuthBase64 } from '../assets';

interface LoginProps {
  onLogin: (user: UsuarioTecnico) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@inside.local');
  const [password, setPassword] = useState('Admin123456');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulação de chamada de API com lógica de autenticação dupla
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Em um aplicativo real, essa lógica estaria no backend.
    // Simulamos aqui para demonstração.
    if (email === 'admin@inside.local' && password === 'Admin123456') {
      const mockUser: UsuarioTecnico = {
        id: 1,
        nome: 'Admin Teste',
        email: 'admin@inside.local',
        role: 'ADM',
        setor: 'Administração',
      };
      onLogin(mockUser);
    } else {
      // Exemplo de usuário técnico normal
       const mockUser: UsuarioTecnico = {
        id: 2,
        nome: 'Ronaldo Costa',
        email: 'ronaldo.costa@inside.local',
        role: 'Padrão',
        setor: 'Técnico',
      };
      onLogin(mockUser);
      // setError('Credenciais inválidas. Verifique seu e-mail e senha.');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <img src={logoAuthBase64} alt="Inside Logotipo" className="w-48 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-text-primary">Inside Notes <span className="text-accent">v2.0</span></h1>
            <p className="text-text-secondary mt-2">Acesse para gerenciar suas visitas técnicas.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-secondary shadow-md rounded-lg px-8 pt-6 pb-8 mb-4 border border-border">
          <div className="mb-4">
            <label className="block text-text-primary text-sm font-bold mb-2" htmlFor="email">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              placeholder="seu.nome@inside.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-text-primary text-sm font-bold mb-2" htmlFor="password">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              placeholder="******************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-danger text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <LoadingSpinner/> : 'Entrar'}
            </Button>
          </div>
        </form>
        <p className="text-center text-text-secondary text-xs">
          &copy;2025 Inside Soluções e Gestão de T.I. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Login;
