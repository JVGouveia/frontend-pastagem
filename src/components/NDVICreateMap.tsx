import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import api from '../config/axios';
import apiGraphql from '../config/axiosGraphql';
import { useThemeMode } from '../contexts/ThemeContext';
import { Brightness4 as DarkIcon, Brightness7 as LightIcon } from '@mui/icons-material';

interface Metadata {
  coordinates: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  resolution: number;
  format: string;
}

export default function NDVICreateMap() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    captureDate: '',
    fileType: '',
    metadata: {
      coordinates: {
        north: 0,
        south: 0,
        east: 0,
        west: 0,
      },
      resolution: 0,
      format: '',
    } as Metadata,
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { mode, toggleTheme } = useThemeMode();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('coordinates.')) {
      const coord = name.split('.')[1];
      setForm((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          coordinates: {
            ...prev.metadata.coordinates,
            [coord]: Number(value),
          },
        },
      }));
    } else if (name.startsWith('metadata.')) {
      const meta = name.split('.')[1];
      setForm((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [meta]: meta === 'resolution' ? Number(value) : value,
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Pega a extensão do arquivo
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      let format = '';
      let mime = selectedFile.type;

      // Mapeamento para o formato aceito pelo backend
      if (ext === 'tif' || ext === 'tiff') {
        format = 'GeoTIFF';
        mime = 'image/tiff';
      } else if (ext === 'jpg' || ext === 'jpeg') {
        format = 'JPEG';
        mime = 'image/jpeg';
      } else if (ext === 'png') {
        format = 'PNG';
        mime = 'image/png';
      }

      setForm((prev) => ({
        ...prev,
        fileType: mime,
        metadata: {
          ...prev.metadata,
          format,
        },
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!file) {
      setError('Selecione um arquivo para upload.');
      return;
    }
    setLoading(true);
    try {
      // Converter arquivo para base64
      const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          // Remove o prefixo "data:*/*;base64," se existir
          const result = reader.result as string;
          const base64 = result.split(',')[1] || result;
          resolve(base64);
        };
        reader.onerror = (error) => reject(error);
      });
      const fileData = await toBase64(file);
      // Enviar para backend (GraphQL mutation)
      const mutation = `
        mutation CreateNDVIMap($input: NDVIMapInput!, $fileData: String!, $propriedadeId: Int!) {
          createNDVIMap(input: $input, fileData: $fileData, propriedadeId: $propriedadeId) {
            id
            name
          }
        }
      `;
      const variables = {
        input: {
          name: form.name,
          description: form.description,
          captureDate: form.captureDate,
          fileType: form.fileType,
          metadata: {
            coordinates: form.metadata.coordinates,
            resolution: form.metadata.resolution,
            format: form.metadata.format,
          },
          propriedadeId: Number(id),
        },
        fileData,
        propriedadeId: Number(id),
      };
      await apiGraphql.post('', {
        query: mutation,
        variables,
      });
      navigate('/');
    } catch (err: any) {
      setError('Erro ao cadastrar mapa NDVI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2 }}>
        <IconButton onClick={toggleTheme} color="inherit" aria-label="Alternar tema">
          {mode === 'dark' ? <LightIcon /> : <DarkIcon />}
        </IconButton>
      </Box>
      <Paper sx={{ p: 4, borderRadius: 2, minWidth: 400, mt: 2 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Cadastrar Novo Mapa NDVI</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField label="Nome" name="name" value={form.name} onChange={handleChange} fullWidth sx={{ mb: 2 }} required />
          <TextField label="Descrição" name="description" value={form.description} onChange={handleChange} fullWidth sx={{ mb: 2 }} />
          <TextField label="Data de Captura" name="captureDate" type="date" value={form.captureDate} onChange={handleChange} fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} required />
          <TextField label="Resolução" name="metadata.resolution" type="number" value={form.metadata.resolution} onChange={handleChange} fullWidth sx={{ mb: 2 }} required />
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Coordenadas</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField label="Norte" name="coordinates.north" type="number" value={form.metadata.coordinates.north} onChange={handleChange} required />
            <TextField label="Sul" name="coordinates.south" type="number" value={form.metadata.coordinates.south} onChange={handleChange} required />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField label="Leste" name="coordinates.east" type="number" value={form.metadata.coordinates.east} onChange={handleChange} required />
            <TextField label="Oeste" name="coordinates.west" type="number" value={form.metadata.coordinates.west} onChange={handleChange} required />
          </Box>
          <Button variant="contained" component="label" fullWidth sx={{ mb: 2 }}>
            Selecionar Arquivo NDVI
            <input type="file" accept="image/*,.tif,.tiff,.png,.jpg,.jpeg" hidden onChange={handleFileChange} />
          </Button>
          {file && <Typography variant="body2" sx={{ mb: 2 }}>Arquivo selecionado: {file.name}</Typography>}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate(-1)} disabled={loading}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Salvar'}</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
} 