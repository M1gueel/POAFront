import React, { useState } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  TablePagination,
} from "@mui/material";
import { excelAPI } from "../api/excelAPI";
import "../styles/LogsCargaExcel.css"; // Import your custom styles
const LogsCargaExcel: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    usuario: "",
    codigo_poa: "",
  });

  const [usuarios, setUsuarios] = useState<string[]>([]);
  const [codigosPoa, setCodigosPoa] = useState<string[]>([]);

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleBuscar = async () => {
    const params: any = {};
    if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio;
    if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin;
    const data = await excelAPI.getLogsCargaExcel(params);
    setLogs(data);
    setUsuarios([...new Set(data.map((l) => l.usuario))]);
    setCodigosPoa([...new Set(data.map((l) => l.codigo_poa))]);
    setPage(0); // Reset page on new search
  };

  // Filtro frontend
  const logsFiltrados = logs.filter(
    (log) =>
      (!filters.usuario || log.usuario === filters.usuario) &&
      (!filters.codigo_poa || log.codigo_poa === filters.codigo_poa)
  );

  // Paginación
  const paginatedLogs = logsFiltrados.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h3"
        align="center"
        gutterBottom
        sx={{ color: "#1d3557", fontWeight: 600, mb: 5 }}
      >
        Control de cambios - Subir POA
      </Typography>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 3,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TextField
          label="Fecha inicio"
          type="date"
          name="fecha_inicio"
          value={filters.fecha_inicio}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ minWidth: 180 }}
          placeholder="dd/mm/aaaa"
          inputProps={{
            max: new Date().toISOString().split("T")[0]
          }}
        />
        <TextField
          label="Fecha fin"
          type="date"
          name="fecha_fin"
          value={filters.fecha_fin}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={{ minWidth: 180 }}
          placeholder="dd/mm/aaaa"
          inputProps={{
            max: new Date().toISOString().split("T")[0]
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Usuario</InputLabel>
          <Select
            name="usuario"
            value={filters.usuario}
            label="Usuario"
            onChange={handleSelectChange}
          >
            <MenuItem value="">Todos</MenuItem>
            {usuarios.map((u) => (
              <MenuItem key={u} value={u}>
                {u}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Código POA</InputLabel>
          <Select
            name="codigo_poa"
            value={filters.codigo_poa}
            label="Código POA"
            onChange={handleSelectChange}
          >
            <MenuItem value="">Todos</MenuItem>
            {codigosPoa.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          sx={{
            background: "#1d3557",
            color: "#fff",
            minWidth: 120,
            height: 40,
            '&:hover': {
      background: "#28497b", // Cambia este color al que prefieras para el hover
    },
          }}
          onClick={handleBuscar}
        >
          BUSCAR
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead
            sx={{
              background: "#1d3557",
            }}
          >
            <TableRow>
    <TableCell
      align="center"
      sx={{ color: "#fff", fontWeight: 700, fontSize: 16 }}
    >
      Fecha
    </TableCell>
    <TableCell
      align="center"
      sx={{ color: "#fff", fontWeight: 700, fontSize: 16 }}
    >
      Usuario
    </TableCell>
    <TableCell
      align="center"
      sx={{ color: "#fff", fontWeight: 700, fontSize: 16 }}
    >
      Correo
    </TableCell>
    <TableCell
      align="center"
      sx={{ color: "#fff", fontWeight: 700, fontSize: 16 }}
    >
      Proyecto
    </TableCell>
    <TableCell
      align="center"
      sx={{ color: "#fff", fontWeight: 700, fontSize: 16, minWidth: 200 }}
    >
      Código POA
    </TableCell>
    <TableCell
      align="center"
      sx={{ color: "#fff", fontWeight: 700, fontSize: 16 }}
    >
      Archivo
    </TableCell>
    <TableCell
      align="center"
      sx={{ color: "#fff", fontWeight: 700, fontSize: 16 }}
    >
      Hoja
    </TableCell>
    <TableCell
      align="center"
      sx={{ color: "#fff", fontWeight: 700, fontSize: 16 }}
    >
      Mensaje
    </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No hay datos para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log, idx) => (
                <TableRow key={idx}>
                  <TableCell>{log.fecha_carga}</TableCell>
                  <TableCell>{log.usuario}</TableCell>
                  <TableCell>{log.correo_usuario}</TableCell>
                  <TableCell>{log.proyecto}</TableCell>
                  <TableCell>{log.codigo_poa}</TableCell>
                  <TableCell>{log.nombre_archivo}</TableCell>
                  <TableCell>{log.hoja}</TableCell>
                  <TableCell>{log.mensaje}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={logsFiltrados.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página"
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
    </Box>
  );
};

export default LogsCargaExcel;
