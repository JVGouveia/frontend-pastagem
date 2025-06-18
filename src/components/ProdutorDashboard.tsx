import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid, 
  Table, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  TextField, 
  Modal, 
  Fade, 
  Backdrop, 
  CircularProgress, 
  Alert, 
  IconButton, 
  Collapse,
  TableSortLabel 
} from '@mui/material';
import { 
  Logout as LogOutIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as Trash2Icon, 
  Save as SaveIcon, 
  Close as XIcon, 
  KeyboardArrowDown as ExpandMoreIcon, 
  KeyboardArrowUp as ExpandLessIcon,
  Lock as LockIcon,
  Dashboard as DashboardIcon,
  Image as ImageIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon
} from '@mui/icons-material';
import api from '../config/axios';
import { useAuth } from '../contexts/AuthContext';
import React from 'react';
import ImageViewer from './ImageViewer';
import { useThemeMode } from '../contexts/ThemeContext';

interface Propriedade {
  id: number;
  nome: string;
  endereco: string;
  areaTotal: number;
  cidade: string;
  estado: string;
}

interface Pastagem {
  id: number;
  nome: string;
  areaHectares: number;
  tipoPasto: string;
  capacidadeSuporte: number;
  propriedade: Propriedade | number;
}

interface PropriedadeComPastagens extends Propriedade {
  pastagens: Pastagem[];
}

type Order = 'asc' | 'desc';

interface HeadCell {
  id: keyof Propriedade | 'totalPastagens';
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'nome', numeric: false, label: 'Propriedade' },
  { id: 'endereco', numeric: false, label: 'Endereço' },
  { id: 'areaTotal', numeric: true, label: 'Área Total' },
  { id: 'totalPastagens', numeric: true, label: 'Total de Pastagens' },
];

// Definição dos campos de ordenação para pastagens
const pastagemHeadCells = [
  { id: 'nome', label: 'Nome da Pastagem', numeric: false },
  { id: 'areaHectares', label: 'Área (ha)', numeric: true },
  { id: 'tipoPasto', label: 'Tipo de Pasto', numeric: false },
  { id: 'capacidadeSuporte', label: 'Capacidade de Suporte', numeric: true },
];

export function ProdutorDashboard() {
  const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
  const [pastagens, setPastagens] = useState<Pastagem[]>([]);
  const [propriedadesComPastagens, setPropriedadesComPastagens] = useState<PropriedadeComPastagens[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [novaPropriedade, setNovaPropriedade] = useState({
    nome: '',
    endereco: '',
    areaTotal: 0,
    cidade: '',
    estado: ''
  });
  const [showNewPastagemModal, setShowNewPastagemModal] = useState(false);
  const [novaPastagem, setNovaPastagem] = useState({
    nome: '',
    areaHectares: 0,
    tipoPasto: '',
    capacidadeSuporte: 0,
  });
  const [selectedPropriedadeIdForPastagem, setSelectedPropriedadeIdForPastagem] = useState<number | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [expandedPropriedades, setExpandedPropriedades] = useState<number[]>([]);
  const [editandoPropriedade, setEditandoPropriedade] = useState<Propriedade | null>(null);
  const [editandoPastagem, setEditandoPastagem] = useState<Pastagem | null>(null);
  const [showEditPropriedadeModal, setShowEditPropriedadeModal] = useState(false);
  const [showEditPastagemModal, setShowEditPastagemModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [senhaError, setSenhaError] = useState('');
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Propriedade | 'totalPastagens'>('nome');
  const [pastagemOrder, setPastagemOrder] = useState<Record<number, Order>>({});
  const [pastagemOrderBy, setPastagemOrderBy] = useState<Record<number, string>>({});
  const [currentView, setCurrentView] = useState<'dashboard' | 'ndvi'>('dashboard');
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      console.log('Usuário atual:', user);

      if (!user) {
        console.error('Usuário é null ou undefined');
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }

      if (!user.id) {
        console.error('Usuário não possui ID');
        setError('ID do usuário não encontrado');
        setLoading(false);
        return;
      }

      const propriedadesResponse = await api.get(`/api/propriedade/usuario/${user.id}`);
      const propriedades = propriedadesResponse.data.content;

      // Buscar pastagens para cada propriedade
      const propriedadesComPastagensPromises = propriedades.map(async (propriedade: Propriedade) => {
        try {
          const pastagensResponse = await api.get(`/api/pastagem/propriedade/${propriedade.id}`);
          
          // Verifica se a resposta tem o formato esperado
          const pastagens = Array.isArray(pastagensResponse.data) 
            ? pastagensResponse.data 
            : pastagensResponse.data.content || [];
                      
          return {
            ...propriedade,
            pastagens: pastagens
          };
        } catch (error) {
          console.error(`Erro ao buscar pastagens da propriedade ${propriedade.nome} (ID: ${propriedade.id}):`, error);
          return {
            ...propriedade,
            pastagens: []
          };
        }
      });

      const propriedadesComPastagens = await Promise.all(propriedadesComPastagensPromises);
      
      setPropriedades(propriedades);
      setPastagens(propriedadesComPastagens.flatMap(p => p.pastagens));
      setPropriedadesComPastagens(propriedadesComPastagens);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados');
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
      if (!user) {
        console.error('Usuário é null ou undefined ao criar propriedade');
        setError('Usuário não autenticado');
        return;
      }

      if (!user.id) {
        console.error('Usuário não possui ID ao criar propriedade');
        setError('ID do usuário não encontrado');
        return;
      }

      await api.post(`/api/propriedade/usuario/${user.id}`, novaPropriedade);
      setShowModal(false);
      carregarDados();
      setNovaPropriedade({
        nome: '',
        endereco: '',
        areaTotal: 0,
        cidade: '',
        estado: ''
      });
    } catch (err) {
      console.error('Erro ao criar propriedade:', err);
      setError('Erro ao criar propriedade');
    }
  };

  const togglePropriedade = (propriedadeId: number) => {
    setExpandedPropriedades(prev => 
      prev.includes(propriedadeId) 
        ? prev.filter(id => id !== propriedadeId)
        : [...prev, propriedadeId]
    );
  };

  const totalPropriedades = propriedades.length;
  const totalPastagens = pastagens.length;
  const areaTotal = propriedades.reduce((acc, prop) => acc + prop.areaTotal, 0);

  const handleSubmitNewPastagem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedPropriedadeIdForPastagem || !user) {
        setError('ID da propriedade ou usuário não encontrado.');
        return;
      }

      setLoadingAction('create-pastagem');
      const pastagemComPropriedade = {
        ...novaPastagem,
        propriedade: {
          id: selectedPropriedadeIdForPastagem
        }
      };

      await api.post(`/api/pastagem`, pastagemComPropriedade);
      setShowNewPastagemModal(false);
      carregarDados(); // Recarregar todos os dados para refletir a nova pastagem
      setNovaPastagem({
        nome: '',
        areaHectares: 0,
        tipoPasto: '',
        capacidadeSuporte: 0,
      });
      setSelectedPropriedadeIdForPastagem(null);
    } catch (err) {
      console.error('Erro ao criar pastagem:', err);
      setError('Erro ao criar pastagem');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeletePropriedade = async (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar esta propriedade?') && user) {
      try {
        setLoadingAction(`delete-${id}`);
        await api.delete(`/api/propriedade/${id}/usuario/${user.id}`);
        // Atualizar todos os estados relacionados
        setPropriedades(prev => prev.filter(p => p.id !== id));
        setPropriedadesComPastagens(prev => prev.filter(p => p.id !== id));
        setPastagens(prev => prev.filter(p => 
          typeof p.propriedade === 'object' ? p.propriedade.id !== id : p.propriedade !== id
        ));
      } catch (err) {
        setError('Erro ao deletar propriedade');
        console.error(err);
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const handleEditPropriedade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoPropriedade || !user) return;

    try {
      setLoadingAction(`edit-${editandoPropriedade.id}`);
      await api.put(`/api/propriedade/${editandoPropriedade.id}/usuario/${user.id}`, editandoPropriedade);
      setShowEditPropriedadeModal(false);
      carregarDados();
      setEditandoPropriedade(null);
    } catch (err) {
      console.error('Erro ao editar propriedade:', err);
      setError('Erro ao editar propriedade');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEditPastagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoPastagem || !user) return;

    try {
      setLoadingAction(`edit-pastagem-${editandoPastagem.id}`);
      
      // Encontrar a propriedade correspondente
      const propriedadeAtual = propriedadesComPastagens.find(p => 
        p.pastagens.some(pastagem => pastagem.id === editandoPastagem.id)
      );

      if (!propriedadeAtual) {
        setError('Propriedade não encontrada para esta pastagem');
        return;
      }

      const pastagemAtualizada = {
        id: editandoPastagem.id,
        nome: editandoPastagem.nome,
        areaHectares: editandoPastagem.areaHectares,
        tipoPasto: editandoPastagem.tipoPasto,
        capacidadeSuporte: editandoPastagem.capacidadeSuporte,
        propriedade: {
          id: propriedadeAtual.id
        }
      };

      await api.put(`/api/pastagem/${editandoPastagem.id}`, pastagemAtualizada);
      setShowEditPastagemModal(false);
      carregarDados();
      setEditandoPastagem(null);
    } catch (err) {
      console.error('Erro ao editar pastagem:', err);
      setError('Erro ao editar pastagem');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeletePastagem = async (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar esta pastagem?')) {
      try {
        setLoadingAction(`delete-pastagem-${id}`);
        await api.delete(`/api/pastagem/${id}`);
        carregarDados();
      } catch (err) {
        setError('Erro ao deletar pastagem');
        console.error(err);
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const validarSenha = (senha: string) => {
    if (senha.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
    if (!/[A-Z]/.test(senha)) return 'A senha deve conter pelo menos uma letra maiúscula';
    if (!/[a-z]/.test(senha)) return 'A senha deve conter pelo menos uma letra minúscula';
    if (!/[0-9]/.test(senha)) return 'A senha deve conter pelo menos um número';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) return 'A senha deve conter pelo menos um caractere especial';
    return '';
  };

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
      await api.post('/api/usuario/alterar-senha', {
        senhaAtual: changePasswordData.senhaAtual,
        novaSenha: changePasswordData.novaSenha
      });
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

  const handleRequestSort = (property: keyof Propriedade | 'totalPastagens') => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedPropriedades = React.useMemo(() => {
    return [...propriedadesComPastagens].sort((a, b) => {
      if (orderBy === 'areaTotal') {
        return order === 'asc' ? a.areaTotal - b.areaTotal : b.areaTotal - a.areaTotal;
      }
      if (orderBy === 'totalPastagens') {
        return order === 'asc' 
          ? a.pastagens.length - b.pastagens.length 
          : b.pastagens.length - a.pastagens.length;
      }
      const aValue = String(a[orderBy as keyof PropriedadeComPastagens]).toLowerCase();
      const bValue = String(b[orderBy as keyof PropriedadeComPastagens]).toLowerCase();
      return order === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }, [propriedadesComPastagens, order, orderBy]);

  // Função para lidar com a ordenação das pastagens
  const handlePastagemRequestSort = (propriedadeId: number, property: string) => {
    setPastagemOrder(prev => ({
      ...prev,
      [propriedadeId]: pastagemOrderBy[propriedadeId] === property && pastagemOrder[propriedadeId] === 'asc' ? 'desc' : 'asc',
    }));
    setPastagemOrderBy(prev => ({
      ...prev,
      [propriedadeId]: property,
    }));
  };

  // Função para ordenar as pastagens de uma propriedade
  const getSortedPastagens = (propriedade: PropriedadeComPastagens) => {
    const order = pastagemOrder[propriedade.id] || 'asc';
    const orderBy = pastagemOrderBy[propriedade.id] || 'nome';
    return [...propriedade.pastagens].sort((a, b) => {
      if (orderBy === 'areaHectares' || orderBy === 'capacidadeSuporte') {
        return order === 'asc' ? a[orderBy] - b[orderBy] : b[orderBy] - a[orderBy];
      }
      const aValue = String(a[orderBy as keyof Pastagem]).toLowerCase();
      const bValue = String(b[orderBy as keyof Pastagem]).toLowerCase();
      return order === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
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
            <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>Dashboard do Produtor</Typography>
          </Box>
          {user && (
            <Box sx={{ fontSize: 12, color: 'text.secondary' }}>
              <Typography variant="body2">Logado como:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{user.nome}</Typography>
              <Typography variant="body2" sx={{ color: 'info.main' }}>{user.cargo}</Typography>
            </Box>
          )}
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            onClick={() => setCurrentView('dashboard')}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              borderRadius: '8px',
              justifyContent: 'flex-start',
              color: currentView === 'dashboard' ? 'white' : 'text.secondary',
              bgcolor: currentView === 'dashboard' ? 'hsl(217, 28%, 20%)' : 'transparent',
              '&:hover': { bgcolor: 'hsl(217, 28%, 20%)' }
            }}
          >
            <DashboardIcon sx={{ width: 20, height: 20 }} />
            Dashboard
          </Button>

          <Button
            onClick={() => setCurrentView('ndvi')}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              borderRadius: '8px',
              justifyContent: 'flex-start',
              color: currentView === 'ndvi' ? 'white' : 'text.secondary',
              bgcolor: currentView === 'ndvi' ? 'hsl(217, 28%, 20%)' : 'transparent',
              '&:hover': { bgcolor: 'hsl(217, 28%, 20%)' }
            }}
          >
            <ImageIcon sx={{ width: 20, height: 20 }} />
            Visualizar NDVI
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

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 4, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 2 }}>
          <IconButton onClick={toggleTheme} color="primary" aria-label="Alternar tema" sx={{ mr: 2 }}>
            {mode === 'dark' ? <LightIcon sx={{ color: 'text.primary' }} /> : <DarkIcon sx={{ color: 'text.primary' }} />}
          </IconButton>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {currentView === 'dashboard' ? (
              <>
                {/* Dashboard Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={4}>
                    <Paper elevation={1} sx={{ p: 3, borderRadius: '8px', borderLeft: '4px solid', borderColor: 'info.main' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Total de Propriedades</Typography>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{totalPropriedades}</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper elevation={1} sx={{ p: 3, borderRadius: '8px', borderLeft: '4px solid', borderColor: 'success.main' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Total de Pastagens</Typography>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{totalPastagens}</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper elevation={1} sx={{ p: 3, borderRadius: '8px', borderLeft: '4px solid', borderColor: 'secondary.main' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Área Total</Typography>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{areaTotal} ha</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Pastagens Table */}
                <Paper elevation={1} sx={{ mt: 4, borderRadius: '8px', overflow: 'hidden' }}>
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="h2">Propriedades</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setShowModal(true)}
                    >
                      Nova Propriedade
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell width="50px"></TableCell>
                          {headCells.map((headCell) => (
                            <TableCell
                              key={headCell.id}
                              align={headCell.numeric ? 'right' : 'left'}
                              sortDirection={orderBy === headCell.id ? order : false}
                            >
                              <TableSortLabel
                                active={orderBy === headCell.id}
                                direction={orderBy === headCell.id ? order : 'asc'}
                                onClick={() => handleRequestSort(headCell.id)}
                              >
                                {headCell.label}
                              </TableSortLabel>
                            </TableCell>
                          ))}
                          <TableCell>Ações</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedPropriedades.map((propriedade) => (
                          <React.Fragment key={propriedade.id}>
                            <TableRow 
                              hover 
                              onClick={() => {
                                console.log('ID da propriedade expandida:', propriedade.id);
                                togglePropriedade(propriedade.id);
                              }}
                              sx={{ cursor: 'pointer' }}
                            >
                              <TableCell>
                                <IconButton size="small">
                                  {expandedPropriedades.includes(propriedade.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{propriedade.nome}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">{propriedade.endereco}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="text.secondary">{propriedade.areaTotal} ha</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="text.secondary">{propriedade.pastagens.length}</Typography>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditandoPropriedade(propriedade);
                                      setShowEditPropriedadeModal(true);
                                    }}
                                    color="info"
                                  >
                                    <EditIcon sx={{ width: 16, height: 16 }} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePropriedade(propriedade.id);
                                    }}
                                    color="error"
                                  >
                                    <Trash2Icon sx={{ width: 16, height: 16 }} />
                                  </IconButton>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/propriedade/${propriedade.id}/novo-mapa`);
                                    }}
                                  >
                                    Adicionar Mapa NDVI
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                <Collapse in={expandedPropriedades.includes(propriedade.id)} timeout="auto" unmountOnExit>
                                  <Box sx={{ margin: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                      <Typography variant="h6" component="h3">Pastagens da Propriedade</Typography>
                                      <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                          setSelectedPropriedadeIdForPastagem(propriedade.id);
                                          setShowNewPastagemModal(true);
                                        }}
                                      >
                                        Adicionar Pastagem
                                      </Button>
                                    </Box>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          {pastagemHeadCells.map((headCell) => (
                                            <TableCell
                                              key={headCell.id}
                                              align={headCell.numeric ? 'right' : 'left'}
                                              sortDirection={pastagemOrderBy[propriedade.id] === headCell.id ? pastagemOrder[propriedade.id] || 'asc' : false}
                                            >
                                              <TableSortLabel
                                                active={pastagemOrderBy[propriedade.id] === headCell.id}
                                                direction={pastagemOrderBy[propriedade.id] === headCell.id ? pastagemOrder[propriedade.id] || 'asc' : 'asc'}
                                                onClick={() => handlePastagemRequestSort(propriedade.id, headCell.id)}
                                              >
                                                {headCell.label}
                                              </TableSortLabel>
                                            </TableCell>
                                          ))}
                                          <TableCell>Ações</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {getSortedPastagens(propriedade).map((pastagem) => (
                                          <TableRow key={pastagem.id}>
                                            <TableCell align="left">{pastagem.nome}</TableCell>
                                            <TableCell align="right">{pastagem.areaHectares} ha</TableCell>
                                            <TableCell align="left">{pastagem.tipoPasto}</TableCell>
                                            <TableCell align="right">{pastagem.capacidadeSuporte}</TableCell>
                                            <TableCell>
                                              <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton
                                                  size="small"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const propriedadeAtual = propriedadesComPastagens.find(p => 
                                                      p.pastagens.some(pastagem => pastagem.id === pastagem.id)
                                                    );
                                                    if (propriedadeAtual) {
                                                      setEditandoPastagem({
                                                        ...pastagem,
                                                        propriedade: propriedadeAtual.id
                                                      });
                                                      setShowEditPastagemModal(true);
                                                    } else {
                                                      setError('Propriedade não encontrada para esta pastagem');
                                                    }
                                                  }}
                                                  color="info"
                                                >
                                                  <EditIcon sx={{ width: 16, height: 16 }} />
                                                </IconButton>
                                                <IconButton
                                                  size="small"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeletePastagem(pastagem.id);
                                                  }}
                                                  color="error"
                                                >
                                                  <Trash2Icon sx={{ width: 16, height: 16 }} />
                                                </IconButton>
                                              </Box>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                        {propriedade.pastagens.length === 0 && (
                                          <TableRow>
                                            <TableCell colSpan={5} align="center">
                                              <Typography variant="body2" color="text.secondary">
                                                Nenhuma pastagem cadastrada
                                              </Typography>
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </>
            ) : (
              <ImageViewer propriedades={propriedades} />
            )}
          </>
        )}
      </Box>

      {/* Modal para Adicionar Nova Pastagem */}
      <Modal
        aria-labelledby="transition-modal-title-pastagem"
        aria-describedby="transition-modal-description-pastagem"
        open={showNewPastagemModal}
        onClose={() => setShowNewPastagemModal(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={showNewPastagemModal}>
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
            <Typography id="transition-modal-title-pastagem" variant="h6" component="h2" sx={{ mb: 2 }}>
              Adicionar Nova Pastagem
            </Typography>
            <form onSubmit={handleSubmitNewPastagem}>
              <TextField
                label="Nome da Pastagem"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={novaPastagem.nome}
                onChange={(e) => setNovaPastagem({ ...novaPastagem, nome: e.target.value })}
                required
                disabled={loadingAction === 'create-pastagem'}
              />
              <TextField
                label="Área (hectares)"
                variant="outlined"
                fullWidth
                type="number"
                sx={{ mb: 2 }}
                value={novaPastagem.areaHectares}
                onChange={(e) => setNovaPastagem({ ...novaPastagem, areaHectares: Number(e.target.value) })}
                required
                disabled={loadingAction === 'create-pastagem'}
              />
              <TextField
                label="Tipo de Pasto"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={novaPastagem.tipoPasto}
                onChange={(e) => setNovaPastagem({ ...novaPastagem, tipoPasto: e.target.value })}
                required
                disabled={loadingAction === 'create-pastagem'}
              />
              <TextField
                label="Capacidade de Suporte"
                variant="outlined"
                fullWidth
                type="number"
                sx={{ mb: 2 }}
                value={novaPastagem.capacidadeSuporte}
                onChange={(e) => setNovaPastagem({ ...novaPastagem, capacidadeSuporte: Number(e.target.value) })}
                required
                disabled={loadingAction === 'create-pastagem'}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  onClick={() => setShowNewPastagemModal(false)}
                  variant="outlined"
                  disabled={loadingAction === 'create-pastagem'}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loadingAction === 'create-pastagem'}
                >
                  {loadingAction === 'create-pastagem' ? <CircularProgress size={24} /> : 'Salvar'}
                </Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>

      {/* Modal para Adicionar Nova Propriedade */}
      <Modal
        aria-labelledby="transition-modal-title-propriedade"
        aria-describedby="transition-modal-description-propriedade"
        open={showModal}
        onClose={() => setShowModal(false)}
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
            <Typography id="transition-modal-title-propriedade" variant="h6" component="h2" sx={{ mb: 2 }}>
              Adicionar Nova Propriedade
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                label="Nome da Propriedade"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={novaPropriedade.nome}
                onChange={(e) => setNovaPropriedade({ ...novaPropriedade, nome: e.target.value })}
                required
              />
              <TextField
                label="Endereço"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={novaPropriedade.endereco}
                onChange={(e) => setNovaPropriedade({ ...novaPropriedade, endereco: e.target.value })}
                required
              />
              <TextField
                label="Área Total (hectares)"
                variant="outlined"
                fullWidth
                type="number"
                sx={{ mb: 2 }}
                value={novaPropriedade.areaTotal}
                onChange={(e) => setNovaPropriedade({ ...novaPropriedade, areaTotal: Number(e.target.value) })}
                required
              />
              <TextField
                label="Cidade"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={novaPropriedade.cidade}
                onChange={(e) => setNovaPropriedade({ ...novaPropriedade, cidade: e.target.value })}
                required
              />
              <TextField
                label="Estado"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={novaPropriedade.estado}
                onChange={(e) => setNovaPropriedade({ ...novaPropriedade, estado: e.target.value })}
                required
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outlined"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                >
                  Salvar
                </Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>

      {/* Modal para Editar Propriedade */}
      <Modal
        aria-labelledby="transition-modal-title-edit-propriedade"
        aria-describedby="transition-modal-description-edit-propriedade"
        open={showEditPropriedadeModal}
        onClose={() => setShowEditPropriedadeModal(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={showEditPropriedadeModal}>
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
            <Typography id="transition-modal-title-edit-propriedade" variant="h6" component="h2" sx={{ mb: 2 }}>
              Editar Propriedade
            </Typography>
            <form onSubmit={handleEditPropriedade}>
              <TextField
                label="Nome da Propriedade"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={editandoPropriedade?.nome || ''}
                onChange={(e) => setEditandoPropriedade(prev => prev ? { ...prev, nome: e.target.value } : null)}
                required
              />
              <TextField
                label="Endereço"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={editandoPropriedade?.endereco || ''}
                onChange={(e) => setEditandoPropriedade(prev => prev ? { ...prev, endereco: e.target.value } : null)}
                required
              />
              <TextField
                label="Área Total (hectares)"
                variant="outlined"
                fullWidth
                type="number"
                sx={{ mb: 2 }}
                value={editandoPropriedade?.areaTotal || 0}
                onChange={(e) => setEditandoPropriedade(prev => prev ? { ...prev, areaTotal: Number(e.target.value) } : null)}
                required
              />
              <TextField
                label="Cidade"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={editandoPropriedade?.cidade || ''}
                onChange={(e) => setEditandoPropriedade(prev => prev ? { ...prev, cidade: e.target.value } : null)}
                required
              />
              <TextField
                label="Estado"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={editandoPropriedade?.estado || ''}
                onChange={(e) => setEditandoPropriedade(prev => prev ? { ...prev, estado: e.target.value } : null)}
                required
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  onClick={() => setShowEditPropriedadeModal(false)}
                  variant="outlined"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loadingAction === `edit-${editandoPropriedade?.id}`}
                >
                  {loadingAction === `edit-${editandoPropriedade?.id}` ? <CircularProgress size={24} /> : 'Salvar'}
                </Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>

      {/* Modal para Editar Pastagem */}
      <Modal
        aria-labelledby="transition-modal-title-edit-pastagem"
        aria-describedby="transition-modal-description-edit-pastagem"
        open={showEditPastagemModal}
        onClose={() => setShowEditPastagemModal(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={showEditPastagemModal}>
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
            <Typography id="transition-modal-title-edit-pastagem" variant="h6" component="h2" sx={{ mb: 2 }}>
              Editar Pastagem
            </Typography>
            <form onSubmit={handleEditPastagem}>
              <TextField
                label="Nome da Pastagem"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={editandoPastagem?.nome || ''}
                onChange={(e) => setEditandoPastagem(prev => prev ? { ...prev, nome: e.target.value } : null)}
                required
              />
              <TextField
                label="Área (hectares)"
                variant="outlined"
                fullWidth
                type="number"
                sx={{ mb: 2 }}
                value={editandoPastagem?.areaHectares || 0}
                onChange={(e) => setEditandoPastagem(prev => prev ? { ...prev, areaHectares: Number(e.target.value) } : null)}
                required
              />
              <TextField
                label="Tipo de Pasto"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={editandoPastagem?.tipoPasto || ''}
                onChange={(e) => setEditandoPastagem(prev => prev ? { ...prev, tipoPasto: e.target.value } : null)}
                required
              />
              <TextField
                label="Capacidade de Suporte"
                variant="outlined"
                fullWidth
                type="number"
                sx={{ mb: 2 }}
                value={editandoPastagem?.capacidadeSuporte || 0}
                onChange={(e) => setEditandoPastagem(prev => prev ? { ...prev, capacidadeSuporte: Number(e.target.value) } : null)}
                required
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  onClick={() => setShowEditPastagemModal(false)}
                  variant="outlined"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loadingAction === `edit-pastagem-${editandoPastagem?.id}`}
                >
                  {loadingAction === `edit-pastagem-${editandoPastagem?.id}` ? <CircularProgress size={24} /> : 'Salvar'}
                </Button>
              </Box>
            </form>
          </Box>
        </Fade>
      </Modal>

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