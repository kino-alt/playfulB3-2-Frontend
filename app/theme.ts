import { createTheme } from '@mui/material/styles';

// ゲームの配色に基づいたカスタムテーマを定義します
const theme = createTheme({
  palette: {
    // プライマリカラー: 青緑色（メインのアクション、タイトルなどに使用）
    primary: {
      main: '#00796B', // 深い青緑
      light: '#48a999',
      dark: '#004c40',
      contrastText: '#ffffff',
    },
    // セカンダリカラー: 強調色、アクション色（ルーム作成ボタンのオレンジ色）
    secondary: {
      main: '#FF9800', // 明るいオレンジ
      light: '#ffb74d',
      dark: '#c66900',
      contrastText: '#000000',
    },
    background: {
      default: '#FAFAFA', 
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: ['Roboto', 'sans-serif'].join(','), 
    h3: {
      fontWeight: 700,
      fontSize: '2.5rem',
      color: '#004c40',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true, // 影を無効化
      },
      styleOverrides: {
        root: {
          borderRadius: 8, // 角丸
          padding: '10px 20px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});
export default theme;
