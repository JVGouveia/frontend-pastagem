import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import { useAuth } from '../contexts/AuthContext';

interface Pastagem {
  id: number;
  nome: string;
  area: number;
  // Adicione outros campos conforme necessário
}

interface Propriedade {
  id: number;
  nome: string;
  endereco: string;
  // Adicione outros campos conforme necessário
}

export function Dashboard() {
  const [pastagens, setPastagens] = useState<Pastagem[]>([]);
  const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar dados das APIs
        const [pastagensResponse, propriedadesResponse] = await Promise.all([
          api.get('/pastagem'),
          api.get('/propriedade'),
        ]);

        setPastagens(pastagensResponse.data);
        setPropriedades(propriedadesResponse.data);
        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar dados');
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Dashboard</h1>
              {user && (
                <div className="ml-4 text-sm text-gray-500">
                  {user.nome} ({user.cargo})
                </div>
              )}
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Seção de Pastagens */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Pastagens</h2>
              <div className="space-y-4">
                {pastagens.map((pastagem) => (
                  <div
                    key={pastagem.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <h3 className="font-medium">{pastagem.nome}</h3>
                    <p className="text-sm text-gray-500">Área: {pastagem.area} ha</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Seção de Propriedades */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Propriedades
              </h2>
              <div className="space-y-4">
                {propriedades.map((propriedade) => (
                  <div
                    key={propriedade.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <h3 className="font-medium">{propriedade.nome}</h3>
                    <p className="text-sm text-gray-500">{propriedade.endereco}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 