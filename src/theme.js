import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#52b788',        // vibrant green
      light: '#81c784',       // lighter green for hover
      dark: '#2d6a4f',        // dark green for contrast
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#b7e4c7',        // pale green accent
      light: '#d8f3dc',       // very light green
      dark: '#52b788'
    },
    success: {
      main: '#52b788',
      light: '#81c784'
    },
    background: {
      default: '#f1faee',     // soft ivory
      paper: '#ffffff'        // clean white
    },
    text: {
      primary: '#1b4332',     // dark green text
      secondary: '#2d6a4f',   // muted green
      disabled: '#95b8a1'
    },
    divider: 'rgba(45,106,79,0.08)',
    error: {
      main: '#d62828'
    },
    warning: {
      main: '#f77f00'
    },
    info: {
      main: '#52b788'
    }
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontSize: '2.8rem',
      fontWeight: 700,
      lineHeight: 1.2,
      color: '#1b4332'
    },
    h2: {
      fontSize: '2.2rem',
      fontWeight: 700,
      lineHeight: 1.3,
      color: '#1b4332'
    },
    h3: {
      fontSize: '1.8rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#1b4332'
    },
    h4: {
      fontSize: '1.4rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#1b4332'
    },
    h5: {
      fontSize: '1.1rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#1b4332'
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#1b4332'
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
      color: '#1b4332'
    },
    body2: {
      fontSize: '0.9rem',
      lineHeight: 1.5,
      color: '#2d6a4f'
    },
    button: {
      fontSize: '0.95rem',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.3px'
    },
    caption: {
      fontSize: '0.85rem',
      color: '#52b788'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          padding: '10px 24px',
          transition: 'all 280ms cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 6px 18px rgba(82,183,136,0.12)'
        },
        contained: {
          background: 'linear-gradient(135deg, #52b788 0%, #40916c 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #40916c 0%, #2d6a4f 100%)',
            transform: 'translateY(-3px)',
            boxShadow: '0 12px 28px rgba(82,183,136,0.2)'
          },
          '&:active': {
            transform: 'translateY(-1px)',
            boxShadow: '0 8px 20px rgba(82,183,136,0.15)'
          }
        },
        outlined: {
          borderColor: '#52b788',
          color: '#52b788',
          '&:hover': {
            backgroundColor: 'rgba(82,183,136,0.04)',
            borderColor: '#40916c'
          }
        },
        text: {
          color: '#52b788',
          '&:hover': {
            backgroundColor: 'rgba(82,183,136,0.06)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '14px',
          boxShadow: '0 8px 24px rgba(45,106,79,0.06)',
          border: '1px solid rgba(82,183,136,0.08)',
          transition: 'all 280ms ease',
          '&:hover': {
            boxShadow: '0 12px 32px rgba(45,106,79,0.1)',
            transform: 'translateY(-4px)'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            transition: 'all 200ms ease',
            '& fieldset': {
              borderColor: 'rgba(82,183,136,0.2)'
            },
            '&:hover fieldset': {
              borderColor: 'rgba(82,183,136,0.4)'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#52b788',
              boxShadow: '0 0 0 4px rgba(82,183,136,0.12)'
            }
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(82,183,136,0.2)'
            },
            '&:hover fieldset': {
              borderColor: 'rgba(82,183,136,0.4)'
            }
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #ffffff 0%, #f1faee 100%)',
          boxShadow: '0 4px 16px rgba(45,106,79,0.06)',
          borderBottom: '1px solid rgba(82,183,136,0.1)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: '12px'
        },
        elevation0: {
          boxShadow: 'none'
        },
        elevation1: {
          boxShadow: '0 4px 12px rgba(45,106,79,0.04)'
        },
        elevation2: {
          boxShadow: '0 8px 20px rgba(45,106,79,0.06)'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '14px',
          boxShadow: '0 20px 60px rgba(45,106,79,0.12)'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          backgroundColor: 'rgba(82,183,136,0.1)',
          color: '#2d6a4f',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: 'rgba(82,183,136,0.2)'
          }
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(82,183,136,0.08)'
        }
      }
    },
    MuiList: {
      styleOverrides: {
        root: {
          padding: 0
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '4px 0',
          '&:hover': {
            backgroundColor: 'rgba(82,183,136,0.04)'
          }
        }
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          border: '1px solid rgba(82,183,136,0.2)',
          color: '#52b788',
          '&.Mui-selected': {
            backgroundColor: 'rgba(82,183,136,0.12)',
            '&:hover': {
              backgroundColor: 'rgba(82,183,136,0.16)'
            }
          }
        }
      }
    }
  },
  shape: {
    borderRadius: 12
  },
  spacing: 8
});

export default theme;
