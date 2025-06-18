import { useEffect, useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Grid, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, TextField, Select, MenuItem, Modal, Fade, Backdrop, CircularProgress, Alert, IconButton } from '@mui/material';
import { People as UsersIcon, PersonAdd as UserPlusIcon, Settings as SettingsIcon, Logout as LogOutIcon, Visibility as EyeIcon, Edit as EditIcon, Delete as Trash2Icon, Save as SaveIcon, Close as XIcon, BarChart as BarChart3Icon, TrendingUp as TrendingUpIcon, Lock as LockIcon, Brightness4 as DarkIcon, Brightness7 as LightIcon } from '@mui/icons-material';
import { usuarioService } from '../services/api';
import type { Usuario, NovoUsuario } from '../services/api';
import type { SelectChangeEvent } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import type { Theme } from '@mui/material/styles';

// Funções de formatação
const formatarCPF = (cpf: string) => {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length <= 3) return cpfLimpo;
  if (cpfLimpo.length <= 6) return `${cpfLimpo.slice(0, 3)}.${cpfLimpo.slice(3)}`;
  if (cpfLimpo.length <= 9) return `${cpfLimpo.slice(0, 3)}.${cpfLimpo.slice(3, 6)}.${cpfLimpo.slice(6)}`;
  return `${cpfLimpo.slice(0, 3)}.${cpfLimpo.slice(3, 6)}.${cpfLimpo.slice(6, 9)}-${cpfLimpo.slice(9, 11)}`;
};

const formatarTelefone = (telefone: string) => {
  const telefoneLimpo = telefone.replace(/\D/g, '');
  if (telefoneLimpo.length <= 2) return telefoneLimpo;
  if (telefoneLimpo.length <= 6) return `(${telefoneLimpo.slice(0, 2)}) ${telefoneLimpo.slice(2)}`;
  if (telefoneLimpo.length <= 10) return `(${telefoneLimpo.slice(0, 2)}) ${telefoneLimpo.slice(2, 6)}-${telefoneLimpo.slice(6)}`;
  return `(${telefoneLimpo.slice(0, 2)}) ${telefoneLimpo.slice(2, 7)}-${telefoneLimpo.slice(7, 11)}`;
};

const validarSenha = (senha: string) => {
  if (senha.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
  if (!/[A-Z]/.test(senha)) return 'A senha deve conter pelo menos uma letra maiúscula';
  if (!/[a-z]/.test(senha)) return 'A senha deve conter pelo menos uma letra minúscula';
  if (!/[0-9]/.test(senha)) return 'A senha deve conter pelo menos um número';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) return 'A senha deve conter pelo menos um caractere especial';
  return '';
};

export default function AdminDashboard() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState<NovoUsuario>({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    cargo: 'PRODUTOR',
    senha: ''
  });
  const [activeView, setActiveView] = useState('dashboard');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [senhaError, setSenhaError] = useState('');
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuarioService.listarTodos();
      setUsuarios(data);
    } catch (err) {
      setError('Erro ao carregar usuários');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubmit = async () => {
    if (!novoUsuario.nome.trim() || 
        !novoUsuario.email.trim() || 
        !novoUsuario.cpf.trim() || 
        !novoUsuario.telefone.trim() || 
        !novoUsuario.senha.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validação de CPF (apenas números)
    const cpfLimpo = novoUsuario.cpf.replace(/\D/g, '');
    if (!/^\d{11}$/.test(cpfLimpo)) {
      alert('CPF inválido. Digite apenas números.');
      return;
    }

    // Validação de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoUsuario.email)) {
      alert('Email inválido');
      return;
    }

    // Validação de telefone (apenas números)
    const telefoneLimpo = novoUsuario.telefone.replace(/\D/g, '');
    if (!/^\d{10,11}$/.test(telefoneLimpo)) {
      alert('Telefone inválido. Digite apenas números.');
      return;
    }
    
    try {
      setLoadingAction('create');
      // Enviar dados limpos para a API
      const usuarioParaCriar = {
        ...novoUsuario,
        cpf: cpfLimpo,
        telefone: telefoneLimpo
      };
      const usuarioCriado = await usuarioService.criar(usuarioParaCriar);
      setUsuarios([...usuarios, usuarioCriado]);
      setShowModal(false);
      setNovoUsuario({
        nome: '',
        email: '',
        cpf: '',
        telefone: '',
        cargo: 'PRODUTOR',
        senha: ''
      });
    } catch (err) {
      setError('Erro ao criar usuário');
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEditUser = (user: Usuario) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (editingUser) {
      try {
        setLoadingAction(`edit-${editingUser.id}`);
        const usuarioAtualizado = await usuarioService.atualizar(editingUser.id, editingUser);
        setUsuarios(usuarios.map(u =>
          u.id === editingUser.id ? usuarioAtualizado : u
        ));
        setEditingUser(null);
      } catch (err) {
        setError('Erro ao atualizar usuário');
        console.error(err);
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar este usuário?')) {
      try {
        setLoadingAction(`delete-${id}`);
        await usuarioService.deletar(id);
        setUsuarios(usuarios.filter(u => u.id !== id));
      } catch (err) {
        setError('Erro ao deletar usuário');
        console.error(err);
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const totalUsers = usuarios.length;
  const adminCount = usuarios.filter(u => u.cargo === 'ADMIN').length;
  const producerCount = usuarios.filter(u => u.cargo === 'PRODUTOR').length;

  const Sidebar = () => (
    <Box sx={{
      width: 256,
      p: 2,
      bgcolor: 'background.paper',
      color: 'text.primary',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <UsersIcon sx={{ width: 24, height: 24 }} />
          <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>Dashboard Usuários</Typography>
        </Box>
        {user && (
          <Box sx={{ fontSize: 12, color: 'text.secondary' }}>
            <Typography variant="body2">Logado como:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{user.nome}</Typography>
            <Typography variant="body2" sx={{ color: 'info.main' }}>{user.cargo}</Typography>
          </Box>
        )}
      </Box>

      <Box component="nav" sx={{ flexGrow: 1, '& > button': { width: '100%', display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: '8px', transition: 'background-color 0.3s' } }}>
        <Button
          onClick={() => setActiveView('dashboard')}
          sx={{
            justifyContent: 'flex-start',
            bgcolor: activeView === 'dashboard' ? 'primary.main' : 'transparent',
            color: activeView === 'dashboard' ? 'primary.contrastText' : 'text.secondary',
            '&:hover': { bgcolor: activeView === 'dashboard' ? 'primary.dark' : 'action.hover' },
          }}
        >
          <BarChart3Icon sx={{ width: 20, height: 20 }} />
          Dashboard
        </Button>

        <Button
          onClick={() => setActiveView('manage')}
          sx={{
            justifyContent: 'flex-start',
            bgcolor: activeView === 'manage' ? 'primary.main' : 'transparent',
            color: activeView === 'manage' ? 'primary.contrastText' : 'text.secondary',
            '&:hover': { bgcolor: activeView === 'manage' ? 'primary.dark' : 'action.hover' },
          }}
        >
          <SettingsIcon sx={{ width: 20, height: 20 }} />
          Gerenciar Usuários
        </Button>

        <Button
          onClick={() => setShowModal(true)}
          sx={{
            justifyContent: 'flex-start',
            bgcolor: showModal ? 'primary.main' : 'transparent',
            color: showModal ? 'primary.contrastText' : 'text.secondary',
            '&:hover': { bgcolor: showModal ? 'primary.dark' : 'action.hover' }
          }}
        >
          <UserPlusIcon sx={{ width: 20, height: 20 }} />
          Criar Usuário
        </Button>
      </Box>

      <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              onClick={() => setShowChangePasswordModal(true)}
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.5,
                borderRadius: '8px',
                justifyContent: 'flex-start',
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <LockIcon sx={{ width: 20, height: 20 }} />
              Alterar Senha
            </Button>

            <Button
              onClick={handleLogout}
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.5,
                borderRadius: '8px',
                justifyContent: 'flex-start',
                color: 'error.main',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <LogOutIcon sx={{ width: 20, height: 20 }} />
              Sair
            </Button>
          </Box>
        </Box>
  );

  const DashboardView = () => (
    <Box sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh' }}>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: '8px', borderLeft: '4px solid', borderColor: 'info.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Total de Usuários</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{totalUsers}</Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: 'info.light', borderRadius: '50%' }}>
                <UsersIcon sx={{ width: 32, height: 32, color: 'info.dark' }} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: '8px', borderLeft: '4px solid', borderColor: 'success.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Administradores</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{adminCount}</Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: 'success.light', borderRadius: '50%' }}>
                <Box sx={{ width: 32, height: 32, bgcolor: 'success.main', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>A</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: '8px', borderLeft: '4px solid', borderColor: 'secondary.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Produtores</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{producerCount}</Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: 'secondary.light', borderRadius: '50%' }}>
                <Box sx={{ width: 32, height: 32, bgcolor: 'secondary.main', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>P</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={1} sx={{ p: 3, borderRadius: '8px' }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 'semibold', mb: 2 }}>Distribuição por Cargo</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: '8px', textAlign: 'center', bgcolor: 'success.light', border: '1px solid', borderColor: 'success.main' }}>
              <Typography variant="subtitle1" sx={{ color: 'success.dark', fontWeight: 'semibold', mb: 0.5 }}>ADMIN</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.dark', mb: 0.5 }}>{adminCount}</Typography>
              <Typography variant="body2" sx={{ color: 'success.main' }}>
                {totalUsers > 0 ? ((adminCount / totalUsers) * 100).toFixed(1) : 0}%
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: '8px', textAlign: 'center', bgcolor: 'secondary.light', border: '1px solid', borderColor: 'secondary.main' }}>
              <Typography variant="subtitle1" sx={{ color: 'secondary.dark', fontWeight: 'semibold', mb: 0.5 }}>PRODUTOR</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'secondary.dark', mb: 0.5 }}>{producerCount}</Typography>
              <Typography variant="body2" sx={{ color: 'secondary.main' }}>
                {totalUsers > 0 ? ((producerCount / totalUsers) * 100).toFixed(1) : 0}%
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  const ManageView = () => (
    <Box sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>Gerenciar Usuários</Typography>

      <Paper elevation={1} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'medium', color: 'text.secondary', textTransform: 'uppercase' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 'medium', color: 'text.secondary', textTransform: 'uppercase' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'medium', color: 'text.secondary', textTransform: 'uppercase' }}>Cargo</TableCell>
                <TableCell sx={{ fontWeight: 'medium', color: 'text.secondary', textTransform: 'uppercase' }}>Data Criação</TableCell>
                <TableCell sx={{ fontWeight: 'medium', color: 'text.secondary', textTransform: 'uppercase' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center' }}>
                    <CircularProgress size={24} sx={{ color: 'info.main', mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">Carregando usuários...</Typography>
                  </TableCell>
                </TableRow>
              ) : usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((usuario) => (
                  <TableRow key={usuario.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>{usuario.nome}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{usuario.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        component="span"
                        sx={{
                          px: 1,
                          py: 0.5,
                          display: 'inline-flex',
                          fontSize: 12,
                          fontWeight: 'semibold',
                          borderRadius: '9999px',
                          bgcolor: usuario.cargo === 'ADMIN' ? 'success.light' : 'secondary.light',
                          color: usuario.cargo === 'ADMIN' ? 'success.dark' : 'secondary.dark',
                        }}
                      >
                        {usuario.cargo}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          onClick={() => handleEditUser(usuario)}
                          disabled={loadingAction === `delete-${usuario.id}`}
                          color="info"
                        >
                          <EditIcon sx={{ width: 16, height: 16 }} />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteUser(usuario.id)}
                          disabled={loadingAction === `delete-${usuario.id}`}
                          color="error"
                        >
                          {loadingAction === `delete-${usuario.id}` ? (
                            <CircularProgress size={16} color="error" />
                          ) : (
                            <Trash2Icon sx={{ width: 16, height: 16 }} />
                          )}
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );

  const CreateUserModal = memo(() => {
    const [formData, setFormData] = useState<NovoUsuario>({
      nome: '',
      email: '',
      cpf: '',
      telefone: '',
      cargo: 'PRODUTOR',
      senha: ''
    });

    const [senhaError, setSenhaError] = useState('');

    const handleClose = useCallback(() => {
      setShowModal(false);
      setFormData({
        nome: '',
        email: '',
        cpf: '',
        telefone: '',
        cargo: 'PRODUTOR',
        senha: ''
      });
      setSenhaError('');
    }, []);

    const handleInputChange = useCallback((field: keyof NovoUsuario, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (field === 'senha') {
        setSenhaError(validarSenha(value));
      }
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      
      const senhaValidationError = validarSenha(formData.senha);
      if (senhaValidationError) {
        setSenhaError(senhaValidationError);
        return;
      }

      try {
        setLoadingAction('create');
        const usuarioParaCriar = {
          ...formData,
          cpf: formData.cpf.replace(/\D/g, ''),
          telefone: formData.telefone.replace(/\D/g, ''),
        };

        const usuarioCriado = await usuarioService.criar(usuarioParaCriar);
        setUsuarios(prev => [...prev, usuarioCriado]);
        handleClose();
      } catch (err: any) {
        console.error('Erro ao criar usuário:', err);
        if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('Erro ao criar usuário. Verifique se todos os campos estão preenchidos corretamente.');
        }
      } finally {
        setLoadingAction(null);
      }
    }, [formData, handleClose]);

    return (
      <Modal
        aria-labelledby="transition-modal-title-usuario"
        aria-describedby="transition-modal-description-usuario"
        open={showModal}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={showModal}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
            borderRadius: '8px',
          }}>
            <Typography id="transition-modal-title-usuario" variant="h6" component="h2" sx={{ mb: 2 }}>
              Criar Novo Usuário
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                label="Nome"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                required
                disabled={loadingAction === 'create'}
              />
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                type="email"
                sx={{ mb: 2 }}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={loadingAction === 'create'}
              />
              <TextField
                label="CPF"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={formData.cpf}
                onChange={(e) => {
                  const cpfFormatado = formatarCPF(e.target.value);
                  handleInputChange('cpf', cpfFormatado);
                }}
                required
                disabled={loadingAction === 'create'}
                inputProps={{ maxLength: 14 }}
              />
              <TextField
                label="Telefone"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={formData.telefone}
                onChange={(e) => {
                  const telefoneFormatado = formatarTelefone(e.target.value);
                  handleInputChange('telefone', telefoneFormatado);
                }}
                required
                disabled={loadingAction === 'create'}
                inputProps={{ maxLength: 15 }}
              />
              <TextField
                label="Senha"
                variant="outlined"
                fullWidth
                type="password"
                sx={{ mb: 1 }}
                value={formData.senha}
                onChange={(e) => handleInputChange('senha', e.target.value)}
                required
                disabled={loadingAction === 'create'}
                error={!!senhaError}
                helperText={senhaError || 'Mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial'}
              />
              <Select
                label="Cargo"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={formData.cargo}
                onChange={(e: SelectChangeEvent<"ADMIN" | "PRODUTOR">) => handleInputChange('cargo', e.target.value as 'ADMIN' | 'PRODUTOR')}
                required
                disabled={loadingAction === 'create'}
              >
                <MenuItem value="PRODUTOR">PRODUTOR</MenuItem>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
              </Select>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  onClick={handleClose}
                  variant="outlined"
                  disabled={loadingAction === 'create'}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loadingAction === 'create' || !!senhaError}
                >
                  {loadingAction === 'create' ? <CircularProgress size={24} /> : 'Salvar'}
                </Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>
    );
  });

  CreateUserModal.displayName = 'CreateUserModal';

  const EditUserModal = memo(() => {
    const [formData, setFormData] = useState<Usuario | null>(null);

    useEffect(() => {
      if (editingUser) {
        setFormData(editingUser);
      }
    }, [editingUser]);

    const handleClose = useCallback(() => {
      setShowEditModal(false);
      setEditingUser(null);
      setFormData(null);
    }, []);

    const handleInputChange = useCallback((field: keyof Usuario, value: string) => {
      setFormData(prev => prev ? { ...prev, [field]: value } : null);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData) return;

      try {
        setLoadingAction(`edit-${formData.id}`);
        const usuarioAtualizado = await usuarioService.atualizar(formData.id, formData);
        setUsuarios(prev => prev.map(u => u.id === formData.id ? usuarioAtualizado : u));
        handleClose();
      } catch (err: any) {
        console.error('Erro ao atualizar usuário:', err);
        if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('Erro ao atualizar usuário. Verifique se todos os campos estão preenchidos corretamente.');
        }
      } finally {
        setLoadingAction(null);
      }
    }, [formData, handleClose]);

    if (!formData) return null;

    return (
      <Modal
        aria-labelledby="transition-modal-title-edit-usuario"
        aria-describedby="transition-modal-description-edit-usuario"
        open={showEditModal}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={showEditModal}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
            borderRadius: '8px',
          }}>
            <Typography id="transition-modal-title-edit-usuario" variant="h6" component="h2" sx={{ mb: 2 }}>
              Editar Usuário
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                label="Nome"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                required
                disabled={loadingAction === `edit-${formData.id}`}
              />
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                type="email"
                sx={{ mb: 2 }}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={loadingAction === `edit-${formData.id}`}
              />
              <TextField
                label="CPF"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={formData.cpf}
                onChange={(e) => {
                  const cpfFormatado = formatarCPF(e.target.value);
                  handleInputChange('cpf', cpfFormatado);
                }}
                required
                disabled={loadingAction === `edit-${formData.id}`}
                inputProps={{ maxLength: 14 }}
              />
              <TextField
                label="Telefone"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={formData.telefone}
                onChange={(e) => {
                  const telefoneFormatado = formatarTelefone(e.target.value);
                  handleInputChange('telefone', telefoneFormatado);
                }}
                required
                disabled={loadingAction === `edit-${formData.id}`}
                inputProps={{ maxLength: 15 }}
              />
              <Select
                label="Cargo"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={formData.cargo}
                onChange={(e: SelectChangeEvent<"ADMIN" | "PRODUTOR">) => handleInputChange('cargo', e.target.value as 'ADMIN' | 'PRODUTOR')}
                required
                disabled={loadingAction === `edit-${formData.id}`}
              >
                <MenuItem value="PRODUTOR">PRODUTOR</MenuItem>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
              </Select>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  onClick={handleClose}
                  variant="outlined"
                  disabled={loadingAction === `edit-${formData.id}`}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loadingAction === `edit-${formData.id}`}
                >
                  {loadingAction === `edit-${formData.id}` ? <CircularProgress size={24} /> : 'Salvar'}
                </Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>
    );
  });

  EditUserModal.displayName = 'EditUserModal';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (changePasswordData.novaSenha !== changePasswordData.confirmarSenha) {
      setSenhaError('As senhas não coincidem');
      return;
    }

    const senhaValidationError = validarSenha(changePasswordData.novaSenha);
    if (senhaValidationError) {
      setSenhaError(senhaValidationError);
      return;
    }

    try {
      setLoadingAction('change-password');
      await usuarioService.alterarSenha(changePasswordData.senhaAtual, changePasswordData.novaSenha);
      setShowChangePasswordModal(false);
      setChangePasswordData({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
      });
      setSenhaError('');
      alert('Senha alterada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Erro ao alterar senha. Verifique se a senha atual está correta.');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 4, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 2 }}>
          <IconButton onClick={toggleTheme} color="primary" aria-label="Alternar tema" sx={{ mr: 2 }}>
            {mode === 'dark' ? <LightIcon sx={{ color: 'text.primary' }} /> : <DarkIcon sx={{ color: 'text.primary' }} />}
          </IconButton>
        </Box>
        {error && (
          <Alert
            severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setError('');
                }}
              >
                <XIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        {loading && (
          <Backdrop
            sx={{ color: '#fff', zIndex: (theme: Theme) => theme.zIndex.drawer + 1 }}
            open={loading}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        )}

        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'manage' && <ManageView />}
      </Box>

      <CreateUserModal />
      <EditUserModal />

      {/* Modal de Alteração de Senha */}
      <Modal
        aria-labelledby="transition-modal-title-change-password"
        aria-describedby="transition-modal-description-change-password"
        open={showChangePasswordModal}
        onClose={() => {
          setShowChangePasswordModal(false);
          setChangePasswordData({
            senhaAtual: '',
            novaSenha: '',
            confirmarSenha: ''
          });
          setSenhaError('');
        }}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={showChangePasswordModal}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
            borderRadius: '8px',
          }}>
            <Typography id="transition-modal-title-change-password" variant="h6" component="h2" sx={{ mb: 2 }}>
              Alterar Senha
            </Typography>
            <form onSubmit={handleChangePassword}>
              <TextField
                label="Senha Atual"
                variant="outlined"
                fullWidth
                type="password"
                sx={{ mb: 2 }}
                value={changePasswordData.senhaAtual}
                onChange={(e) => setChangePasswordData({ ...changePasswordData, senhaAtual: e.target.value })}
                required
                disabled={loadingAction === 'change-password'}
              />
              <TextField
                label="Nova Senha"
                variant="outlined"
                fullWidth
                type="password"
                sx={{ mb: 2 }}
                value={changePasswordData.novaSenha}
                onChange={(e) => {
                  setChangePasswordData({ ...changePasswordData, novaSenha: e.target.value });
                  setSenhaError(validarSenha(e.target.value));
                }}
                required
                disabled={loadingAction === 'change-password'}
                error={!!senhaError}
                helperText={senhaError || 'Mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial'}
              />
              <TextField
                label="Confirmar Nova Senha"
                variant="outlined"
                fullWidth
                type="password"
                sx={{ mb: 2 }}
                value={changePasswordData.confirmarSenha}
                onChange={(e) => setChangePasswordData({ ...changePasswordData, confirmarSenha: e.target.value })}
                required
                disabled={loadingAction === 'change-password'}
                error={changePasswordData.novaSenha !== changePasswordData.confirmarSenha}
                helperText={changePasswordData.novaSenha !== changePasswordData.confirmarSenha ? 'As senhas não coincidem' : ''}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setChangePasswordData({
                      senhaAtual: '',
                      novaSenha: '',
                      confirmarSenha: ''
                    });
                    setSenhaError('');
                  }}
                  variant="outlined"
                  disabled={loadingAction === 'change-password'}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loadingAction === 'change-password' || !!senhaError || changePasswordData.novaSenha !== changePasswordData.confirmarSenha}
                >
                  {loadingAction === 'change-password' ? <CircularProgress size={24} /> : 'Salvar'}
                </Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
}