import api from '../config/axios';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cargo: 'ADMIN' | 'PRODUTOR';
  createdAt: string;
  updatedAt: string;
}

export interface NovoUsuario {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cargo: 'ADMIN' | 'PRODUTOR';
  senha: string;
}

export const usuarioService = {
  listarTodos: async (): Promise<Usuario[]> => {
    const response = await api.get('/api/usuarios/todos');
    return response.data;
  },

  buscarPorId: async (id: number): Promise<Usuario> => {
    const response = await api.get(`/api/usuarios/${id}`);
    return response.data;
  },

  criar: async (usuario: NovoUsuario): Promise<Usuario> => {
    const response = await api.post('/api/usuarios/register', {
      nome: usuario.nome,
      email: usuario.email,
      cpf: usuario.cpf,
      telefone: usuario.telefone,
      cargo: usuario.cargo,
      password: usuario.senha
    });
    return response.data;
  },

  atualizar: async (id: number, usuario: Partial<Usuario>): Promise<Usuario> => {
    const response = await api.put(`/api/usuarios/${id}`, usuario);
    return response.data;
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/api/usuarios/${id}`);
  },

  alterarSenha: async (senhaAtual: string, novaSenha: string): Promise<void> => {
    await api.post('/api/usuarios/alterar-senha', {
      senhaAtual,
      novaSenha
    });
  }
};

export default api; 