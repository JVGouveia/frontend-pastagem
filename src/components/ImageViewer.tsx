import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  Modal,
  Fade,
  Backdrop,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Image as ImageIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface ImageMetadata {
  coordinates: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  resolution: string;
  format: string;
}

interface Image {
  id: string;
  name: string;
  description: string;
  captureDate: string;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  fileData: string;
  metadata: ImageMetadata;
  imageUrl?: string;
  hasImageData?: boolean;
  propriedadeId: number;
}

interface Propriedade {
  id: number;
  nome: string;
  endereco: string;
  areaTotal: number;
  cidade: string;
  estado: string;
}

interface ImageViewerProps {
  propriedades?: Propriedade[];
}

const ImageViewer: React.FC<ImageViewerProps> = ({ propriedades = [] }) => {
  console.log('Propriedades recebidas pelo ImageViewer:', propriedades);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [graphqlUrl, setGraphqlUrl] = useState('/graphql');
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [queryType, setQueryType] = useState('all');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const { user } = useAuth();
  
  const [queryParams, setQueryParams] = useState({
    limit: 10,
    offset: 0,
    sortBy: '-createdAt',
    propriedadeId: propriedades[0]?.id || 0,
    id: ''
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mapToDelete, setMapToDelete] = useState<Image | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [mapToEdit, setMapToEdit] = useState<Image | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    captureDate: '',
    fileType: '',
    metadata: {
      coordinates: { north: 0, south: 0, east: 0, west: 0 },
      resolution: '',
      format: ''
    }
  });

  const sortOptions = [
    { value: '-createdAt', label: 'Mais Recente' },
    { value: 'createdAt', label: 'Mais Antigo' },
    { value: '-captureDate', label: 'Data de Captura (Desc)' },
    { value: 'captureDate', label: 'Data de Captura (Asc)' },
    { value: 'name', label: 'Nome (A-Z)' },
    { value: '-name', label: 'Nome (Z-A)' },
    { value: '-updatedAt', label: 'Última Atualização (Desc)' },
    { value: 'updatedAt', label: 'Última Atualização (Asc)' }
  ];

  const limitOptions = [5, 10, 20, 50, 100];

  const queries = {
    getAllMaps: `
      query GetNDVIMapsByPropriedades($propriedadeIds: [Int!], $limit: Int, $offset: Int, $sortBy: String) {
        ndviMapsByPropriedades(propriedadeIds: $propriedadeIds, limit: $limit, offset: $offset, sortBy: $sortBy) {
          totalCount
          items {
            id
            name
            description
            captureDate
            fileType
            propriedadeId
            createdAt
            updatedAt
            fileData
            metadata {
              coordinates {
                north
                south
                east
                west
              }
              resolution
              format
            }
          }
        }
      }
    `,
    getMapsCountByPropriedades: `
      query GetNDVIMapsCountByPropriedades($propriedadeIds: [Int!]) {
        ndviMapsCountByPropriedades(propriedadeIds: $propriedadeIds)
      }
    `,
    getMapsByUser: `
      query GetNDVIMapsByUser($propriedadeId: Int!, $limit: Int, $offset: Int, $sortBy: String) {
        ndviMapsByUser(propriedadeId: $propriedadeId, limit: $limit, offset: $offset, sortBy: $sortBy) {
          id
          name
          description
          captureDate
          fileType
          propriedadeId
          createdAt
          updatedAt
          fileData
          metadata {
            coordinates {
              north
              south
              east
              west
            }
            resolution
            format
          }
        }
      }
    `,
    getMapsByPropriedade: `
      query GetNDVIMaps($propriedadeId: Int!, $limit: Int, $offset: Int, $sortBy: String) {
        ndviMaps(propriedadeId: $propriedadeId, limit: $limit, offset: $offset, sortBy: $sortBy) {
          id
          name
          description
          captureDate
          fileType
          propriedadeId
          createdAt
          updatedAt
          fileData
          metadata {
            coordinates {
              north
              south
              east
              west
            }
            resolution
            format
          }
        }
      }
    `,
    getMapsCountByPropriedade: `
      query GetNDVIMapsCount($propriedadeId: Int!) {
        ndviMaps(propriedadeId: $propriedadeId) { id }
      }
    `,
  };

  const makeGraphQLRequest = async (query: string, variables = {}) => {
    const requestBody = {
      query: query.trim(),
      variables: {
        ...variables,
        propriedadeId: queryParams.propriedadeId
      }
    };

    // Garantir que a URL do GraphQL seja relativa
    const graphqlEndpoint = graphqlUrl.startsWith('http') ? '/graphql' : graphqlUrl;

    setDebugInfo({
      url: graphqlEndpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: requestBody,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}\nDetalhes: ${errorText}`);
      }

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        throw new Error(`Erro ao fazer parse da resposta JSON: ${errorMessage}\nResposta: ${responseText}`);
      }
      
      if (result.errors) {
        throw new Error(`Erro GraphQL: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      return result.data;
    } catch (error) {
      console.error('Erro na requisição GraphQL:', error);
      throw error;
    }
  };

  const testConnection = async () => {
    if (!graphqlUrl.trim()) {
      setError('Por favor, insira a URL do endpoint GraphQL');
      return;
    }

    if (!queryParams.propriedadeId) {
      setError('Por favor, informe o ID da propriedade');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await makeGraphQLRequest(queries.getAllMaps, {
        limit: 1,
        offset: 0,
        sortBy: '-createdAt'
      });
      setError('');
      alert('Conexão GraphQL funcionando! Agora tente buscar os mapas.');
    } catch (err: any) {
      setError(`Erro ao testar conexão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const base64ToDataUrl = (base64Data: string, fileType: string) => {
    try {
      return `data:${fileType};base64,${base64Data}`;
    } catch (err) {
      console.error('Erro ao converter base64:', err);
      return null;
    }
  };

  const fetchTotalCount = async () => {
    try {
      if (queryType === 'all' && propriedades.length > 0) {
        // Buscar mapas de todas as propriedades
        const allMapsPromises = propriedades.map(propriedade => 
          makeGraphQLRequest(queries.getAllMaps, {
            limit: 0,
            offset: 0,
            sortBy: '-createdAt',
            propriedadeId: propriedade.id
          })
        );

        const allMapsResults = await Promise.all(allMapsPromises);
        const totalMaps = allMapsResults.reduce((acc, result) => 
          acc + (result.ndviMapsByPropriedades?.totalCount || 0), 0
        );
        
        setTotalCount(totalMaps);
      } else {
        const data = await makeGraphQLRequest(queries.getAllMaps, {
          limit: 0,
          offset: 0,
          sortBy: '-createdAt',
          propriedadeId: queryParams.propriedadeId
        });
        setTotalCount(data.ndviMapsByPropriedades?.totalCount || 0);
      }
    } catch (err) {
      console.error('Erro ao buscar contagem total:', err);
      setTotalCount(0);
    }
  };

  const fetchImages = async () => {
    if (!graphqlUrl.trim()) {
      setError('Por favor, insira a URL do endpoint GraphQL');
      return;
    }

    if (!queryParams.propriedadeId && queryType !== 'all') {
      setError('ID da propriedade não informado');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let data;
      let imageArray = [];

      switch (queryType) {
        case 'all':
          if (propriedades.length > 0) {
            const propriedadeIds = propriedades.map(p => p.id);
            data = await makeGraphQLRequest(queries.getAllMaps, {
              propriedadeIds,
              limit: queryParams.limit,
              offset: queryParams.offset,
              sortBy: queryParams.sortBy
            });
            imageArray = data.ndviMapsByPropriedades.items || [];
            setTotalCount(data.ndviMapsByPropriedades.totalCount || 0);
          } else {
            setError('Nenhuma propriedade encontrada');
            return;
          }
          break;
        case 'byPropriedade':
          if (!queryParams.propriedadeId) {
            setError('Selecione uma propriedade');
            return;
          }
          // Buscar o total de mapas para a propriedade
          const countData = await makeGraphQLRequest(queries.getMapsCountByPropriedade, {
            propriedadeId: queryParams.propriedadeId
          });
          setTotalCount(countData.ndviMaps?.length || 0);
          // Buscar os mapas da propriedade
          data = await makeGraphQLRequest(queries.getMapsByPropriedade, {
            propriedadeId: queryParams.propriedadeId,
            limit: queryParams.limit,
            offset: queryParams.offset,
            sortBy: queryParams.sortBy
          });
          imageArray = data.ndviMaps || [];
          break;
        default:
          throw new Error('Tipo de consulta não suportado');
      }
      
      const processedImages = imageArray
        .map((item: Image) => ({
          ...item,
          imageUrl: item.fileData 
            ? base64ToDataUrl(item.fileData, item.fileType)
            : null,
          hasImageData: !!item.fileData
        }))
        // Remover duplicatas pelo id
        .filter((item: Image, index: number, self: Image[]) =>
          index === self.findIndex((img: Image) => img.id === item.id)
        );
      
      setImages(processedImages);
      
      if (processedImages.length === 0) {
        setError('Nenhuma imagem encontrada com os critérios especificados');
      }
    } catch (err: any) {
      setError(`Erro ao buscar imagens: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (images.length > 0) {
      fetchImages();
    }
  }, [queryParams.limit, queryParams.offset, queryParams.sortBy]);

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename || 'imagem.tiff';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentPage = Math.floor(queryParams.offset / queryParams.limit) + 1;
  const totalPages = Math.ceil(totalCount / queryParams.limit);
  const hasNextPage = queryParams.offset + queryParams.limit < totalCount;
  const hasPrevPage = queryParams.offset > 0;

  const handleDeleteClick = (image: Image) => {
    setMapToDelete(image);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!mapToDelete) return;
    setDeleteDialogOpen(false);
    await deleteMap(mapToDelete.id);
    setMapToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setMapToDelete(null);
  };

  const deleteMap = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const mutation = `
        mutation DeleteNDVIMap($id: ID!) {
          deleteNDVIMap(id: $id)
        }
      `;
      const requestBody = {
        query: mutation,
        variables: { id }
      };
      const graphqlEndpoint = graphqlUrl.startsWith('http') ? '/graphql' : graphqlUrl;
      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });
      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors.map((e: any) => e.message).join(', '));
      }
      if (result.data.deleteNDVIMap) {
        setImages(prev => prev.filter(img => img.id !== id));
        setTotalCount(prev => prev - 1);
      } else {
        throw new Error('Erro ao excluir o mapa.');
      }
    } catch (err: any) {
      setError(`Erro ao excluir mapa: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (image: Image) => {
    setMapToEdit(image);
    setEditForm({
      name: image.name,
      description: image.description,
      captureDate: image.captureDate.slice(0, 16),
      fileType: image.fileType,
      metadata: {
        coordinates: { ...image.metadata.coordinates },
        resolution: image.metadata.resolution,
        format: image.metadata.format
      }
    });
    setEditDialogOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('coordinates.')) {
      const coord = name.split('.')[1];
      setEditForm(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          coordinates: {
            ...prev.metadata.coordinates,
            [coord]: Number(value)
          }
        }
      }));
    } else if (name.startsWith('metadata.')) {
      const meta = name.split('.')[1];
      setEditForm(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [meta]: value
        }
      }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setMapToEdit(null);
  };

  const handleEditSave = async () => {
    if (!mapToEdit) return;
    setLoading(true);
    setError('');
    try {
      const mutation = `
        mutation UpdateNDVIMap($id: ID!, $input: NDVIMapUpdateInput!, $propriedadeId: Int!) {
          updateNDVIMap(id: $id, input: $input, propriedadeId: $propriedadeId) {
            id
            name
            description
            captureDate
            fileType
            propriedadeId
            createdAt
            updatedAt
            fileData
            metadata {
              coordinates { north south east west }
              resolution
              format
            }
          }
        }
      `;
      const variables = {
        id: mapToEdit.id,
        input: {
          name: editForm.name,
          description: editForm.description,
          captureDate: editForm.captureDate,
          fileType: editForm.fileType,
          metadata: {
            coordinates: { ...editForm.metadata.coordinates },
            resolution: editForm.metadata.resolution,
            format: editForm.metadata.format
          }
        },
        propriedadeId: mapToEdit.propriedadeId
      };
      const graphqlEndpoint = graphqlUrl.startsWith('http') ? '/graphql' : graphqlUrl;
      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify({ query: mutation, variables })
      });
      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors.map((e: any) => e.message).join(', '));
      }
      const updated = result.data.updateNDVIMap;
      setImages(prev => prev.map(img => img.id === updated.id ? {
        ...img,
        ...updated,
        imageUrl: img.imageUrl // mantém a url local
      } : img));
      setEditDialogOpen(false);
      setMapToEdit(null);
    } catch (err: any) {
      setError(`Erro ao editar mapa: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 4 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 1 }}>
            Visualizador de Imagens GraphQL
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {queryType === 'all' 
              ? `Buscando mapas NDVI de ${propriedades.length} propriedades`
              : queryType === 'byPropriedade'
                ? `Buscando mapas NDVI da propriedade selecionada`
                : `Buscando mapas NDVI da propriedade selecionada`}
          </Typography>
        </Box>

        {/* Configurações */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Consulta</InputLabel>
                <Select
                  value={queryType}
                  onChange={(e) => {
                    setQueryType(e.target.value);
                    setQueryParams(prev => ({ ...prev, offset: 0 }));
                  }}
                  label="Tipo de Consulta"
                >
                  <MenuItem value="all">Todas as Propriedades</MenuItem>
                  <MenuItem value="byPropriedade">Por Propriedade</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Exibir select de propriedade apenas para 'byPropriedade' */}
            {queryType === 'byPropriedade' && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Propriedade</InputLabel>
                  <Select
                    value={queryParams.propriedadeId}
                    onChange={(e) => {
                      setQueryParams(prev => ({ 
                        ...prev, 
                        propriedadeId: Number(e.target.value),
                        offset: 0 
                      }));
                    }}
                    label="Propriedade"
                  >
                    {propriedades.map(propriedade => (
                      <MenuItem key={propriedade.id} value={propriedade.id}>
                        {propriedade.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  value={queryParams.sortBy}
                  onChange={(e) => {
                    setQueryParams(prev => ({ ...prev, sortBy: e.target.value, offset: 0 }));
                  }}
                  label="Ordenar por"
                >
                  {sortOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Itens por página</InputLabel>
                <Select
                  value={queryParams.limit}
                  onChange={(e) => {
                    setQueryParams(prev => ({ ...prev, limit: Number(e.target.value), offset: 0 }));
                  }}
                  label="Itens por página"
                >
                  {limitOptions.map(limit => (
                    <MenuItem key={limit} value={limit}>
                      {limit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={fetchImages}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                >
                  {loading ? 'Carregando...' : 'Buscar Mapas'}
                </Button>
              </Box>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Paginação */}
        {images.length > 0 && (
          <Paper sx={{ p: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Mostrando {images.length} de {totalCount} resultado(s)
                {queryParams.offset > 0 && (
                  <span> (itens {queryParams.offset + 1} - {Math.min(queryParams.offset + images.length, totalCount)})</span>
                )}
              </Typography>
              
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => {
                  setQueryParams(prev => ({
                    ...prev,
                    offset: (page - 1) * prev.limit
                  }));
                }}
                showFirstButton
                showLastButton
              />
            </Box>
          </Paper>
        )}

        {/* Grid de Imagens */}
        {images.length > 0 && (
          <Grid container spacing={3}>
            {images.map((item) => (
              <Grid item xs={12} md={6} lg={4} key={item.id}>
                <Card>
                  <CardMedia
                    component="div"
                    sx={{
                      height: 200,
                      bgcolor: 'background.paper',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedImage(item)}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                        <ImageIcon sx={{ fontSize: 48, mb: 1 }} />
                        <Typography variant="body2">
                          {item.hasImageData ? 'Erro ao carregar imagem' : 'Sem dados de imagem'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.fileType || 'Tipo não especificado'}
                        </Typography>
                      </Box>
                    )}
                    <Chip
                      label={item.fileType?.split('/')[1]?.toUpperCase() || 'DATA'}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        color: 'text.primary'
                      }}
                    />
                  </CardMedia>
                  
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom noWrap>
                      {item.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} noWrap>
                      {item.description}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Captura: {formatDate(item.captureDate)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Propriedade: {propriedades.find(p => p.id === item.propriedadeId)?.nome || 'Não especificada'}
                        </Typography>
                      </Box>

                      {item.metadata?.coordinates && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {item.metadata.coordinates.north?.toFixed(4)}°, {item.metadata.coordinates.east?.toFixed(4)}°
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>

                  {item.imageUrl && (
                    <CardActions>
                      <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', gap: 1, pr: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditClick(item)}
                          aria-label="Editar"
                          sx={{ flex: '0 0 45%' }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteClick(item)}
                          aria-label="Excluir"
                          sx={{ flex: '0 0 45%' }}
                        >
                          Excluir
                        </Button>
                        <IconButton
                          color="success"
                          onClick={() => downloadImage(item.imageUrl!, `${item.name}.${item.fileType?.split('/')[1] || 'tiff'}`)}
                          aria-label="Download"
                          sx={{ flex: '0 0 10%'}}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Box>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Estado vazio */}
        {!loading && images.length === 0 && !error && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ImageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Configure o endpoint GraphQL e escolha uma consulta para visualizar os mapas NDVI do usuário {user?.nome || 'Usuário não autenticado'}
            </Typography>
          </Box>
        )}

        {/* Modal de Imagem Ampliada */}
        <Modal
          open={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          closeAfterTransition
          slots={{ backdrop: Backdrop }}
          slotProps={{
            backdrop: {
              timeout: 500,
            },
          }}
        >
          <Fade in={!!selectedImage}>
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '1200px',
              bgcolor: 'background.paper',
              boxShadow: 24,
              borderRadius: 2,
              p: 4,
            }}>
              {selectedImage && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h2">
                      {selectedImage.name}
                    </Typography>
                    <IconButton onClick={() => setSelectedImage(null)}>
                      <ErrorIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <img
                      src={selectedImage.imageUrl}
                      alt={selectedImage.name}
                      style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                    />
                  </Box>
                </>
              )}
            </Box>
          </Fade>
        </Modal>

        {/* Modal de confirmação de exclusão */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
        >
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem certeza que deseja excluir o mapa "{mapToDelete?.name}"?
              Esta ação não poderá ser desfeita.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
              Cancelar
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
              Excluir
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de edição de mapa */}
        <Dialog open={editDialogOpen} onClose={handleEditCancel} maxWidth="sm" fullWidth>
          <DialogTitle>Editar Mapa NDVI</DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Nome"
                name="name"
                value={editForm.name}
                onChange={handleEditFormChange}
                fullWidth
              />
              <TextField
                label="Descrição"
                name="description"
                value={editForm.description}
                onChange={handleEditFormChange}
                fullWidth
              />
              <TextField
                label="Data de Captura"
                name="captureDate"
                type="datetime-local"
                value={editForm.captureDate}
                onChange={handleEditFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <Typography variant="subtitle2" sx={{ mt: 2 }}>Metadados</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Latitude Norte"
                    name="coordinates.north"
                    type="number"
                    value={editForm.metadata.coordinates.north}
                    onChange={handleEditFormChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Latitude Sul"
                    name="coordinates.south"
                    type="number"
                    value={editForm.metadata.coordinates.south}
                    onChange={handleEditFormChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Longitude Leste"
                    name="coordinates.east"
                    type="number"
                    value={editForm.metadata.coordinates.east}
                    onChange={handleEditFormChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Longitude Oeste"
                    name="coordinates.west"
                    type="number"
                    value={editForm.metadata.coordinates.west}
                    onChange={handleEditFormChange}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditCancel} color="primary">
              Cancelar
            </Button>
            <Button onClick={handleEditSave} color="success" variant="contained">
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ImageViewer; 