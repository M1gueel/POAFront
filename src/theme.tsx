import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      light: "#28497b",
      main: "#1d3557",
      dark: "#399cae",
      contrastText: "#fff",
    },
    secondary: {
      light: "#ff7961",
      main: "#f44336",
      dark: "#ba000d",
      contrastText: "#000",
    },
  },
  components: {
    MuiTextField: {
      defaultProps: {},
      styleOverrides: {
        root: {
          //estilos para el campo de texto
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;
