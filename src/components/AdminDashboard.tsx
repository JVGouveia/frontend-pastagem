import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import { useAuth } from '../contexts/AuthContext';
import { Cargo } from '../contexts/AuthContext';
import { Users, UserPlus, Settings, LogOut, Eye, Edit, Trash2, Save, X } from 'lucide-react';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cargo: Cargo;
  createdAt: string;
}

export function AdminDashboard() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    cargo: Cargo.PRODUTOR,
    senha: ''
  });
  const [activeView, setActiveView] = useState('dashboard');
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  const navigate = useNavigate();
  const { logout, user } = useAuth();

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const response = await api.get('/usuario');
      const usuariosComCreatedAt = response.data.map((u: Usuario) => ({
        ...u,
        createdAt: u.createdAt || new Date().toISOString().split('T')[0]
      }));
      setUsuarios(usuariosComCreatedAt);
      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar usuários');
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
      await api.post('/usuario', novoUsuario);
      setShowModal(false);
      carregarUsuarios();
      setNovoUsuario({
        nome: '',
        email: '',
        cpf: '',
        telefone: '',
        cargo: Cargo.PRODUTOR,
        senha: ''
      });
    } catch (err) {
      setError('Erro ao criar usuário');
      console.error(err);
    }
  };

  const handleEditUser = (user: Usuario) => {
    setEditingUser({ ...user });
  };

  const handleSaveEdit = async () => {
    if (editingUser) {
      try {
        await api.put(`/usuario/${editingUser.id}`, editingUser);
        setUsuarios(usuarios.map(u =>
          u.id === editingUser.id ? editingUser : u
        ));
        setEditingUser(null);
      } catch (err) {
        setError('Erro ao salvar edição do usuário');
        console.error(err);
      }
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar este usuário?')) {
      try {
        await api.delete(`/usuario/${id}`);
        setUsuarios(usuarios.filter(u => u.id !== id));
      } catch (err) {
        setError('Erro ao deletar usuário');
        console.error(err);
      }
    }
  };

  const totalUsers = usuarios.length;
  const adminCount = usuarios.filter(u => u.cargo === Cargo.ADMIN).length;
  const producerCount = usuarios.filter(u => u.cargo === Cargo.PRODUTOR).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  const Sidebar = () => (
    <div className="bg-slate-800 text-white w-64 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Dashboard Usuários
        </h1>
      </div>

      <nav className="space-y-2 flex-grow">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`w-full flex items-center gap-2 p-3 rounded-lg transition-colors ${
            activeView === 'dashboard' ? 'bg-blue-600' : 'hover:bg-slate-700'
          }`}
        >
          <Users className="w-5 h-5" />
          Dashboard
        </button>

        <button
          onClick={() => setActiveView('manage')}
          className={`w-full flex items-center gap-2 p-3 rounded-lg transition-colors ${
            activeView === 'manage' ? 'bg-blue-600' : 'hover:bg-slate-700'
          }`}
        >
          <Settings className="w-5 h-5" />
          Gerenciar Usuários
        </button>

        <button
          onClick={() => {
            setShowModal(true);
            setNovoUsuario({ nome: '', email: '', cpf: '', telefone: '', cargo: Cargo.PRODUTOR, senha: '' });
          }}
          className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Criar Usuário
        </button>
      </nav>

      <div className="mt-auto">
        <button onClick={handleLogout} className="flex items-center gap-2 p-3 rounded-lg hover:bg-slate-700 transition-colors text-red-400">
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Dashboard de Usuários</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500 transform transition-transform duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total de Usuários</p>
              <p className="text-4xl font-extrabold text-gray-800 mt-2">{totalUsers}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500 transform transition-transform duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Administradores</p>
              <p className="text-4xl font-extrabold text-gray-800 mt-2">{adminCount}</p>
            </div>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 font-bold text-2xl">
              A
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500 transform transition-transform duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Produtores</p>
              <p className="text-4xl font-extrabold text-gray-800 mt-2">{producerCount}</p>
            </div>
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 font-bold text-2xl">
              P
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Distribuição por Cargo</h3>
        <div className="flex flex-wrap md:flex-nowrap gap-6 justify-center">
          <div className="flex-1 min-w-[280px] max-w-md bg-green-50 p-6 rounded-lg text-center shadow-sm border border-green-200">
            <p className="text-green-600 text-lg mb-2">ADMIN</p>
            <p className="text-3xl font-bold text-green-800">{adminCount}</p>
            <p className="text-sm text-gray-600 mt-2">{totalUsers > 0 ? ((adminCount/totalUsers)*100).toFixed(1) : 0}%</p>
          </div>
          <div className="flex-1 min-w-[280px] max-w-md bg-purple-50 p-6 rounded-lg text-center shadow-sm border border-purple-200">
            <p className="text-purple-600 text-lg mb-2">PRODUTOR</p>
            <p className="text-3xl font-bold text-purple-800">{producerCount}</p>
            <p className="text-sm text-gray-600 mt-2">{totalUsers > 0 ? ((producerCount/totalUsers)*100).toFixed(1) : 0}%</p>
          </div>
        </div>
      </div>
    </div>
  );

  const ManageView = () => (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Gerenciar Usuários</h2>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Criação</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {editingUser && editingUser.id === usuario.id ? (
                    <input
                      type="text"
                      value={editingUser.nome}
                      onChange={(e) => setEditingUser({...editingUser, nome: e.target.value})}
                      className="border rounded px-2 py-1"
                    />
                  ) : (
                    usuario.nome
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingUser && editingUser.id === usuario.id ? (
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      className="border rounded px-2 py-1"
                    />
                  ) : (
                    usuario.email
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingUser && editingUser.id === usuario.id ? (
                    <input
                      type="text"
                      value={editingUser.cpf}
                      onChange={(e) => setEditingUser({...editingUser, cpf: e.target.value})}
                      className="border rounded px-2 py-1"
                    />
                  ) : (
                    usuario.cpf
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingUser && editingUser.id === usuario.id ? (
                    <input
                      type="text"
                      value={editingUser.telefone}
                      onChange={(e) => setEditingUser({...editingUser, telefone: e.target.value})}
                      className="border rounded px-2 py-1"
                    />
                  ) : (
                    usuario.telefone
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingUser && editingUser.id === usuario.id ? (
                    <select
                      value={editingUser.cargo}
                      onChange={(e) => setEditingUser({...editingUser, cargo: e.target.value as Cargo})}
                      className="border rounded px-2 py-1"
                    >
                      <option value={Cargo.ADMIN}>ADMIN</option>
                      <option value={Cargo.PRODUTOR}>PRODUTOR</option>
                    </select>
                  ) : (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      usuario.cargo === Cargo.ADMIN ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {usuario.cargo}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingUser && editingUser.id === usuario.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditUser(usuario)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(usuario.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const CreateUserModal = () => (
    showModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h3 className="text-2xl font-bold mb-5 text-gray-800">Criar Novo Usuário</h3>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={novoUsuario.nome}
                  onChange={(e) => setNovoUsuario({...novoUsuario, nome: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite o nome"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={novoUsuario.email}
                  onChange={(e) => setNovoUsuario({...novoUsuario, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite o email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input
                  type="text"
                  value={novoUsuario.cpf}
                  onChange={(e) => setNovoUsuario({...novoUsuario, cpf: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite o CPF"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={novoUsuario.telefone}
                  onChange={(e) => setNovoUsuario({...novoUsuario, telefone: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite o telefone"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <select
                  value={novoUsuario.cargo}
                  onChange={(e) => setNovoUsuario({...novoUsuario, cargo: e.target.value as Cargo})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={Cargo.PRODUTOR}>PRODUTOR</option>
                  <option value={Cargo.ADMIN}>ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  type="password"
                  value={novoUsuario.senha}
                  onChange={(e) => setNovoUsuario({...novoUsuario, senha: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite a senha"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Criar Usuário
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setNovoUsuario({ nome: '', email: '', cpf: '', telefone: '', cargo: Cargo.PRODUTOR, senha: '' });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'manage' && <ManageView />}
      </div>

      <CreateUserModal />
    </div>
  );
}