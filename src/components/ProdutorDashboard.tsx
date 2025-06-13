import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import { useAuth } from '../contexts/AuthContext';

interface Propriedade {
  id: number;
  nome: string;
  endereco: string;
  area: number;
}

interface Pastagem {
  id: number;
  nome: string;
  area: number;
  propriedade: Propriedade;
}

export function ProdutorDashboard() {
  const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
  const [pastagens, setPastagens] = useState<Pastagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [novaPropriedade, setNovaPropriedade] = useState({
    nome: '',
    endereco: '',
    area: 0
  });
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [propriedadesResponse, pastagensResponse] = await Promise.all([
        api.get('/propriedade'),
        api.get('/pastagem')
      ]);
      setPropriedades(propriedadesResponse.data);
      setPastagens(pastagensResponse.data);
      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/propriedade', novaPropriedade);
      setShowModal(false);
      carregarDados();
      setNovaPropriedade({
        nome: '',
        endereco: '',
        area: 0
      });
    } catch (err) {
      setError('Erro ao criar propriedade');
      console.error(err);
    }
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
              <h1 className="text-xl font-semibold">Dashboard do Produtor</h1>
              {user && (
                <div className="ml-4 text-sm text-gray-500">
                  {user.nome} ({user.cargo})
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Nova Propriedade
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
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
          {/* Seção de Propriedades */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Propriedades</h2>
              <div className="space-y-4">
                {propriedades.map((propriedade) => (
                  <div
                    key={propriedade.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <h3 className="font-medium">{propriedade.nome}</h3>
                    <p className="text-sm text-gray-500">{propriedade.endereco}</p>
                    <p className="text-sm text-gray-500">Área: {propriedade.area} ha</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Seção de Pastagens */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Pastagens</h2>
              <div className="space-y-4">
                {pastagens.map((pastagem) => (
                  <div
                    key={pastagem.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <h3 className="font-medium">{pastagem.nome}</h3>
                    <p className="text-sm text-gray-500">
                      Propriedade: {pastagem.propriedade.nome}
                    </p>
                    <p className="text-sm text-gray-500">Área: {pastagem.area} ha</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nova Propriedade</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    value={novaPropriedade.nome}
                    onChange={(e) => setNovaPropriedade({ ...novaPropriedade, nome: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Endereço</label>
                  <input
                    type="text"
                    value={novaPropriedade.endereco}
                    onChange={(e) => setNovaPropriedade({ ...novaPropriedade, endereco: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Área (ha)</label>
                  <input
                    type="number"
                    value={novaPropriedade.area}
                    onChange={(e) => setNovaPropriedade({ ...novaPropriedade, area: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 