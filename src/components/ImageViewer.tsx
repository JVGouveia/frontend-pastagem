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
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: 'hsl(217, 72%, 46%)',
    },
    secondary: {
      main: '#9333ea',
      light: '#ede9fe',
      dark: '#7e22ce',
    },
    info: {
      main: '#3b82f6',
      light: '#dbeafe',
      dark: '#2563eb',
    },
    success: {
      main: '#22c55e',
      light: '#dcfce7',
      dark: '#16a34a',
    },
    error: {
      main: '#ef4444',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

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
}

const ImageViewer: React.FC = () => {
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
    uploadedBy: user?.id || '',
    startDate: '',
    endDate: '',
    id: ''
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
      query GetNDVIMaps($limit: Int, $offset: Int, $sortBy: String) {
        ndviMaps(limit: $limit, offset: $offset, sortBy: $sortBy) {
          id
          name
          description
          captureDate
          fileType
          uploadedBy
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
    getMapCount: `
      query GetNDVIMapCount($uploadedBy: String, $startDate: String, $endDate: String) {
        ndviMapCount(uploadedBy: $uploadedBy, startDate: $startDate, endDate: $endDate)
      }
    `,
    getMapsByUser: `
      query GetNDVIMapsByUser($uploadedBy: String!, $limit: Int, $offset: Int, $sortBy: String) {
        ndviMapsByUser(uploadedBy: $uploadedBy, limit: $limit, offset: $offset, sortBy: $sortBy) {
          id
          name
          description
          captureDate
          fileType
          uploadedBy
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
    getMapsByDateRange: `
      query GetNDVIMapsByDateRange($startDate: String!, $endDate: String!, $uploadedBy: String, $limit: Int, $offset: Int, $sortBy: String) {
        ndviMapsByDateRange(startDate: $startDate, endDate: $endDate, uploadedBy: $uploadedBy, limit: $limit, offset: $offset, sortBy: $sortBy) {
          id
          name
          description
          captureDate
          fileType
          uploadedBy
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
  };

  const makeGraphQLRequest = async (query: string, variables = {}) => {
    const requestBody = {
      query: query.trim(),
      variables
    };

    setDebugInfo({
      url: graphqlUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: requestBody,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
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
      let countVariables = {};
      
      if (queryType === 'byDateRange') {
        if (queryParams.startDate && queryParams.endDate) {
          countVariables = {
            uploadedBy: user?.id,
            startDate: queryParams.startDate,
            endDate: queryParams.endDate
          };
        }
      } else {
        countVariables = {
          uploadedBy: user?.id
        };
      }
      
      const data = await makeGraphQLRequest(queries.getMapCount, countVariables);
      setTotalCount(data.ndviMapCount || 0);
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

    if (!user?.id) {
      setError('Usuário não autenticado');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let data;
      let imageArray = [];

      await fetchTotalCount();

      switch (queryType) {
        case 'all':
          data = await makeGraphQLRequest(queries.getMapsByUser, {
            uploadedBy: user.id,
            limit: queryParams.limit,
            offset: queryParams.offset,
            sortBy: queryParams.sortBy
          });
          imageArray = data.ndviMapsByUser || [];
          break;

        case 'byDateRange':
          if (!queryParams.startDate || !queryParams.endDate) {
            throw new Error('Por favor, informe o intervalo de datas');
          }
          
          const dateVariables = {
            startDate: queryParams.startDate,
            endDate: queryParams.endDate,
            limit: queryParams.limit,
            offset: queryParams.offset,
            sortBy: queryParams.sortBy,
            uploadedBy: user.id
          };
          
          data = await makeGraphQLRequest(queries.getMapsByDateRange, dateVariables);
          imageArray = data.ndviMapsByDateRange || [];
          break;

        default:
          throw new Error('Tipo de consulta não suportado');
      }
      
      const processedImages = imageArray.map((item: Image) => ({
        ...item,
        imageUrl: item.fileData 
          ? base64ToDataUrl(item.fileData, item.fileType)
          : null,
        hasImageData: !!item.fileData
      }));
      
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

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 4 }}>
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 1 }}>
              Visualizador de Imagens GraphQL
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Busque mapas NDVI do usuário: {user?.nome || 'Usuário não autenticado'}
            </Typography>
          </Box>

          {/* Configurações */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL do Endpoint GraphQL"
                  value={graphqlUrl}
                  onChange={(e) => setGraphqlUrl(e.target.value)}
                  placeholder="http://localhost:3000/graphql"
                />
              </Grid>

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
                    <MenuItem value="all">Todos os Mapas do Usuário</MenuItem>
                    <MenuItem value="byDateRange">Por Intervalo de Datas</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

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

              {queryType === 'byDateRange' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Data Inicial"
                      value={queryParams.startDate}
                      onChange={(e) => {
                        setQueryParams(prev => ({ ...prev, startDate: e.target.value, offset: 0 }));
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Data Final"
                      value={queryParams.endDate}
                      onChange={(e) => {
                        setQueryParams(prev => ({ ...prev, endDate: e.target.value, offset: 0 }));
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

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
                  
                  <Button
                    variant="contained"
                    color="success"
                    onClick={testConnection}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <ErrorIcon />}
                  >
                    Testar
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => setShowDebug(!showDebug)}
                    startIcon={<VisibilityIcon />}
                  >
                    {showDebug ? 'Ocultar Debug' : 'Debug'}
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

              {showDebug && debugInfo && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Informações de Debug:
                    </Typography>
                    <pre style={{ overflow: 'auto', fontSize: '0.875rem' }}>
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </Paper>
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
                        bgcolor: 'grey.100',
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
                          color: 'white'
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
                            Por: {item.uploadedBy}
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
                        <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          startIcon={<DownloadIcon />}
                          onClick={() => downloadImage(item.imageUrl!, `${item.name}.${item.fileType?.split('/')[1] || 'tiff'}`)}
                        >
                          Download
                        </Button>
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
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ImageViewer; 