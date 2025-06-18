import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Paper, Alert, CircularProgress, IconButton } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import api from '../config/axios';
import { useAuth } from '../contexts/AuthContext';
import type { Cargo } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { Brightness4 as DarkIcon, Brightness7 as LightIcon } from '@mui/icons-material';

const theme = createTheme({
  palette: {
    primary: {
      main: 'hsl(217, 72%, 46%)',
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

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { mode, toggleTheme } = useThemeMode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });

      if (response.data) {
        const { idToken, refreshToken, cargo, nome, email, cognitoId, id } = response.data;
        login(idToken, refreshToken, { id, nome, email, cargo: cargo as Cargo, sub: cognitoId });
        navigate('/');
      }
    } catch (err: any) {
      console.error('Erro detalhado:', err);
      if (err.message) {
        setError(err.message);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Erro ao fazer login. Verifique suas credenciais e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 12,
        px: 4,
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <IconButton onClick={toggleTheme} color="inherit" aria-label="Alternar tema">
          {mode === 'dark' ? <LightIcon /> : <DarkIcon />}
        </IconButton>
      </Box>
      <Paper
        elevation={1}
        sx={{
          maxWidth: 400,
          width: '100%',
          p: 4,
          borderRadius: '8px',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            textAlign: 'center',
            fontWeight: 'bold',
            color: 'text.primary',
            mb: 3,
          }}
        >
          Login
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Usuário"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Senha"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 3 }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              py: 1.5,
              fontSize: '1rem',
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Entrar'
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
} 