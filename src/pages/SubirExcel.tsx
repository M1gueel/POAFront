import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx"; // Importar la librería xlsx

import {
  Button,
  MenuItem,
  Select,
  Typography,
  FormControl,
  InputLabel,
  TextField,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import iconoExcel from "../assets/icono-excel.png"; // Importa la imagen
import "../styles/SubirExcel.css"; // Importa el archivo CSS
import { projectAPI } from "../api/projectAPI"; // Importa el API
import { poaAPI } from "../api/poaAPI"; // Importa el API de POA
import { TipoProyecto } from "../interfaces/project";
import { POA } from "../interfaces/poa";

const SubirExcel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [opcion, setOpcion] = useState("");
  const [anio, setAnio] = useState("");
  const [tiposProyecto, setTiposProyecto] = useState<TipoProyecto[]>([]);
  const [poas, setPoas] = useState<POA[]>([]);
  const [poaSeleccionado, setPoaSeleccionado] = useState("");
  const [nombreHoja, setNombreHoja] = useState(""); // Estado para el nombre de la hoja
  const [formTouched, setFormTouched] = useState(false);
  const [errors, setErrors] = useState<{
    file?: string;
    opcion?: string;
    poaSeleccionado?: string;
    anio?: string;
  }>({});
  const [poaSeleccionado2, seterror2] = useState<string | undefined>(undefined);

  // Estados para el Snackbar
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<
    "success" | "error" | "warning" | "info"
  >("info");

  const [openDialog, setOpenDialog] = useState(false); // Estado para el diálogo de confirmación
  const [pendingRequest, setPendingRequest] = useState<FormData | null>(null); // Almacena la solicitud pendiente

  const [hojas, setHojas] = useState<string[]>([]); // Estado para los nombres de las hojas

  // Función para cerrar el Snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Función para extraer el prefijo del código POA
  const obtenerCodigoTipo = (codigoPoa: string): string | null => {
    const partes = codigoPoa.split("-");
    return partes.length > 0 ? partes[0] : null; // Retorna el prefijo (ejemplo: "PIGR")
  };
  // **Nuevo estado derivado para los POAs filtrados**
  const poasFiltrados = poas.filter((poa) => {
    // Buscar el tipo de proyecto seleccionado
    const tipoProyecto = tiposProyecto.find(
      (tipo) => tipo.id_tipo_proyecto === opcion
    );
    // Usar el codigo_tipo del tipo de proyecto seleccionado
    const codigoTipo = tipoProyecto ? tipoProyecto.codigo_tipo : null;

    // Aplicar los filtros
    const coincideTipo = codigoTipo
      ? obtenerCodigoTipo(poa.codigo_poa) === codigoTipo
      : true;
    const coincideAnio = anio ? poa.anio_ejecucion === String(anio) : true;

    return coincideTipo && coincideAnio;
  });

  // Cargar los tipos de proyecto al iniciar el componente
  useEffect(() => {
    const fetchTiposProyecto = async () => {
      try {
        const data = await projectAPI.getTiposProyecto();
        setTiposProyecto(data);
      } catch (err) {
        console.error("Error al obtener tipos de proyecto:", err);
      }
    };

    fetchTiposProyecto();
  }, []);

  // Cargar los POAs al iniciar el componente
  useEffect(() => {
    const fetchPOAs = async () => {
      try {
        const data = await poaAPI.getPOAs();
        setPoas(data);
      } catch (err) {
        console.error("Error al obtener POAs:", err);
      }
    };

    fetchPOAs();
  }, []);

  // Actualizar el nombre de la hoja automáticamente cuando se selecciona un año
  useEffect(() => {
    if (hojas.length > 0 && anio) {
      const hojaConAnio = hojas.find((sheet) => sheet.includes(anio));
      setNombreHoja(hojaConAnio || ""); // Seleccionar la hoja o dejar vacío
    }
  }, [anio, hojas]);

  // Sincronizar campos cuando se selecciona un POA
  useEffect(() => {
    if (poaSeleccionado) {
      const poa = poas.find((p) => p.id_poa === poaSeleccionado);
      if (poa) {
        // Extraer el prefijo del código POA
        const codigoTipo = obtenerCodigoTipo(poa.codigo_poa);
        if (codigoTipo) {
          // Buscar el tipo de proyecto correspondiente
          const tipoProyecto = tiposProyecto.find(
            (tipo) => tipo.codigo_tipo === codigoTipo
          );
          if (tipoProyecto) {
            setOpcion(tipoProyecto.id_tipo_proyecto); // Actualizar tipo de proyecto
          } else {
            setErrors((prev) => ({
              ...prev,
              opcion:
                "No se encontró un tipo de proyecto para el POA seleccionado.",
            }));
          }
        }
        setAnio(poa.anio_ejecucion); // Actualizar año
        setErrors((prev) => ({ ...prev, poaSeleccionado: undefined })); // Limpiar error
      } else {
        setErrors((prev) => ({
          ...prev,
          poaSeleccionado: "El POA seleccionado no existe.",
        }));
      }
    }
  }, [poaSeleccionado, poas, tiposProyecto]);

  // Sincronizar POA cuando se selecciona tipo de proyecto y año
  useEffect(() => {
    if (opcion && anio) {
      const tipoProyecto = tiposProyecto.find(
        (tipo) => tipo.id_tipo_proyecto === opcion
      );
      if (tipoProyecto) {
        const poa = poas.find(
          (p) =>
            obtenerCodigoTipo(p.codigo_poa) === tipoProyecto.codigo_tipo &&
            p.anio_ejecucion === String(anio)
        );
        seterror2(undefined);
        if (poa) {
          setPoaSeleccionado(poa.id_poa); // Actualizar POA
          setErrors((prev) => ({ ...prev, poaSeleccionado: undefined })); // Limpiar error
        } else {
          setPoaSeleccionado(""); // Limpiar POA si no coincide
          seterror2(
            "No se encontró un POA para el tipo de proyecto y año seleccionados."
          );
        }
      }
    } else {
      setPoaSeleccionado(""); // Limpiar POA si no hay tipo de proyecto o año
      seterror2(undefined);
    }
  }, [opcion, anio, poas, tiposProyecto]);

  // Validar automáticamente el formulario y generar el nombre de la hoja
  useEffect(() => {
    const newErrors: {
      file?: string;
      opcion?: string;
      poaSeleccionado?: string;
      anio?: string;
    } = {};

    if (!file) {
      newErrors.file = "Debes seleccionar un archivo.";
    }
    if (!opcion) {
      newErrors.opcion = "Debes seleccionar un tipo de proyecto.";
    }
    if (!poaSeleccionado) {
      newErrors.poaSeleccionado = "Debes seleccionar un POA.";
    }
    if (!anio) {
      newErrors.anio = "Debes seleccionar un año.";
    }
    setErrors(newErrors);
  }, [file, opcion, poaSeleccionado, anio]); // Ejecutar cada vez que cambie alguno de estos estados

  // Manejar el cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validExtensions = ["xls", "xlsx"];
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
      if (!fileExtension || !validExtensions.includes(fileExtension)) {
        setErrors((prev) => ({
          ...prev,
          file: "Debes seleccionar un archivo.",
        }));
        setMessage("Solo se aceptan archivos con extensión .xls o .xlsx.");
        setSeverity("error");
        setOpenSnackbar(true);
        setFile(null);
        setHojas([]); // Limpiar las hojas
        return;
      }
      setErrors((prev) => ({ ...prev, file: undefined }));
      setFile(selectedFile);

      // Leer el archivo Excel y obtener los nombres de las hojas
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetNames = workbook.SheetNames; // Obtener los nombres de las hojas
        setHojas(sheetNames);

        // Seleccionar automáticamente la hoja que contenga el año seleccionado
        if (anio) {
          const hojaConAnio = sheetNames.find((sheet) => sheet.includes(anio));
          setNombreHoja(hojaConAnio || ""); // Seleccionar la hoja o dejar vacío
        } else {
          setNombreHoja(""); // Limpiar si no hay año seleccionado
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      const validExtensions = ["xls", "xlsx"];
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
      if (!fileExtension || !validExtensions.includes(fileExtension)) {
        setErrors((prev) => ({
          ...prev,
          file: "Debes seleccionar un archivo.",
        }));
        setMessage("Solo se aceptan archivos con extensión .xls o .xlsx.");
        setSeverity("error");
        setOpenSnackbar(true);
        setFile(null);
        return;
      }
      setErrors((prev) => ({ ...prev, file: undefined }));
      setFile(selectedFile);

            // Leer el archivo Excel y obtener los nombres de las hojas
            const reader = new FileReader();
            reader.onload = (event) => {
              const data = new Uint8Array(event.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: "array" });
              const sheetNames = workbook.SheetNames; // Obtener los nombres de las hojas
              setHojas(sheetNames);
      
              // Seleccionar automáticamente la hoja que contenga el año seleccionado
              if (anio) {
                const hojaConAnio = sheetNames.find((sheet) => sheet.includes(anio));
                setNombreHoja(hojaConAnio || ""); // Seleccionar la hoja o dejar vacío
              } else {
                setNombreHoja(""); // Limpiar si no hay año seleccionado
              }
            };
            reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setHojas([]); // Limpiar las hojas
    setNombreHoja(""); // Limpiar el nombre de la hoja
    setErrors((prev) => ({ ...prev, file: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormTouched(true); // Marcar el formulario como tocado

    // Si hay errores, no enviar el formulario
    if (Object.keys(errors).length > 0) {
      setMessage("Por favor, corrige los errores antes de enviar.");
      setSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    const formData = new FormData();
    formData.append("file", file!);
    formData.append("id_poa", poaSeleccionado); // Agregar el POA seleccionado
    formData.append("hoja", nombreHoja); // Usar el valor del input para el nombre de la hoja

    try {
      const response = await fetch("http://localhost:8000/transformar_excel/", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        if (data.requires_confirmation) {
          // Si el backend solicita confirmación, abrir el diálogo
          setPendingRequest(formData);
          setOpenDialog(true);
        } else {
          if (data.errores && data.errores.length > 0) {
            setMessage(
              `Actividades y tareas creadas con advertencias:\n\n${data.errores.join(
                "\n"
              )}`
            );
            setSeverity("warning");
          } else {
            setMessage("Actividades y tareas creadas exitosamente.");
            setSeverity("success");

            // Vaciar los campos del formulario
          setFile(null);
          setOpcion("");
          setAnio("");
          setPoaSeleccionado("");
          setNombreHoja("");
          setHojas([]);
          setFormTouched(false);
          }
          setOpenSnackbar(true);
        }
      } else {
        // Mostrar mensaje de error del backend
        setMessage(data.detail || "Error al procesar el archivo.");
        setSeverity("error");
        setOpenSnackbar(true);
      }
    } catch (err) {
      setMessage("Error al subir el archivo.");
      setSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleConfirm = async () => {
    if (!pendingRequest) return;

    // Agregar confirmación al FormData y reenviar la solicitud
    pendingRequest.append("confirmacion", "true");

    try {
      const response = await fetch("http://localhost:8000/transformar_excel/", {
        method: "POST",
        body: pendingRequest,
      });
      const data = await response.json();

      if (response.ok) {
        if (data.errores && data.errores.length > 0) {
          setMessage(`Advertencias:\n\n${data.errores.join("\n")}`);
          setSeverity("warning");
        } else {
          setMessage("Actividades y tareas creadas exitosamente.");
          setSeverity("success");
          // Vaciar los campos del formulario
          setFile(null);
          setOpcion("");
          setAnio("");
          setPoaSeleccionado("");
          setNombreHoja("");
          setHojas([]);
          setFormTouched(false);
        }
      } else {
        setMessage(data.detail || "Error al procesar el archivo.");
        setSeverity("error");
      }

      setOpenSnackbar(true);
    } catch (err) {
      setMessage("Error al confirmar la eliminación.");
      setSeverity("error");
      setOpenSnackbar(true);
      console.error(err);
    } finally {
      setOpenDialog(false);
      setPendingRequest(null);
    }
  };

  const handleCancel = () => {
    setOpenDialog(false);
    setPendingRequest(null);
  };

  return (
    <div className="subir-excel-wrapper">
      <h1 className="titulo-subir-excel">Subir archivo Excel</h1>
      <div className="subir-excel-card">
        <form onSubmit={handleSubmit}>
          {/* Selector de tipos de proyecto */}
          <FormControl fullWidth className="input-margin">
            <InputLabel id="opcion-label" className="custom-label">
              Seleccione tipo de Proyecto
            </InputLabel>
            <Select
              labelId="opcion-label"
              value={opcion}
              onChange={(e) => setOpcion(e.target.value)}
              label="Seleccione tipo de Proyecto"
              className="custom-select"
              renderValue={(selected) => {
                if (selected === "") {
                  return "-- Todos los tipos de proyecto --"; // Texto cuando está vacío
                }
                const tipoProyecto = tiposProyecto.find(
                  (tipo) => tipo.id_tipo_proyecto === selected
                );
                return tipoProyecto
                  ? `${tipoProyecto.codigo_tipo} - ${tipoProyecto.nombre}`
                  : "";
              }}
            >
              <MenuItem value="">-- Todos los tipos de proyecto --</MenuItem>{" "}
              {/* Opción para limpiar */}
              {tiposProyecto.map((tipo) => (
                <MenuItem
                  key={tipo.id_tipo_proyecto}
                  value={tipo.id_tipo_proyecto}
                >
                  {`${tipo.codigo_tipo} - ${tipo.nombre}`}
                </MenuItem>
              ))}
            </Select>
            {formTouched && errors.opcion && (
              <Typography color="error">{errors.opcion}</Typography>
            )}
          </FormControl>
          {/* Selector de año */}
          <FormControl fullWidth className="input-margin">
            <InputLabel id="anio-label" className="custom-label">
              Selecciona un año
            </InputLabel>
            <Select
              labelId="anio-label"
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              label="Selecciona un año"
              className="custom-select"
            >
              <MenuItem value="">-- Todos los años --</MenuItem>{" "}
              {/* Opción para limpiar */}
              {Array.from({ length: 9 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                );
              })}
            </Select>
            {formTouched && errors.anio && (
              <Typography color="error">{errors.anio}</Typography>
            )}
          </FormControl>

          {/* Selector de POA */}
          <FormControl fullWidth className="input-margin">
            <InputLabel id="poa-label" className="custom-label">
              Seleccione POA
            </InputLabel>
            <Select
              labelId="poa-label"
              value={poaSeleccionado}
              onChange={(e) => setPoaSeleccionado(e.target.value)}
              label="Seleccione POA"
              className="custom-select"
            >
              <MenuItem value="" disabled>
                -- Selecciona un POA --
              </MenuItem>
              {poasFiltrados.map((poa) => (
                <MenuItem key={poa.id_poa} value={poa.id_poa}>
                  {poa.codigo_poa}
                </MenuItem>
              ))}
            </Select>
            {poaSeleccionado2 && (
              <Typography color="error">{poaSeleccionado2}</Typography>
            )}
            {formTouched && errors.poaSeleccionado && !poaSeleccionado2 && (
              <Typography color="error">{errors.poaSeleccionado}</Typography>
            )}
          </FormControl>

          {/* Área de carga de archivos */}
          {file ? (
            <div className="file-preview">
              <Button className="remove-button" onClick={handleRemoveFile}>
                ✖
              </Button>
              <img src={iconoExcel} alt="Excel" className="icono-excel" />
              <Typography>{file.name}</Typography>
            </div>
          ) : (
            <div
              className="file-dropzone"
              onClick={() => document.getElementById("fileInput")?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              Arrastra tu archivo aquí o haz clic para seleccionarlo
              <input
                type="file"
                id="fileInput"
                name="file"
                accept=".xls,.xlsx"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
          )}
          {formTouched && errors.file && (
            <Typography color="error">{errors.file}</Typography>
          )}
          {/* Selector para el nombre de la hoja */}
          {Object.keys(errors).length === 0 && file && (
            <FormControl fullWidth className="input-margin">
              <InputLabel id="hoja-label" className="custom-label">
                Seleccione el nombre de la hoja
              </InputLabel>
              <Select
                labelId="hoja-label"
                value={nombreHoja}
                onChange={(e) => setNombreHoja(e.target.value)}
                label="Seleccione el nombre de la hoja"
                className="custom-select"
              >
                {hojas.map((hoja, index) => (
                  <MenuItem key={index} value={hoja}>
                    {hoja}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Button
            type="submit"
            variant="contained"
            className="custom-button"
            fullWidth
          >
            Subir
          </Button>
        </form>
      </div>

      {/* Snackbar para mostrar mensajes */}
      {/* Contenedor relativo para el Snackbar */}
      <div style={{ position: "relative", height: "100%", width: "100%" }}>
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{
            position: "absolute", // Relativo al contenedor
            top: "30%", // Ajustar la posición vertical
            left: "50%", // Centrar horizontalmente
            transform: "translate(-50%, -50%)", // Ajustar para centrar completamente
          }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={severity}
            sx={{ width: "100%" }}
          >
            <Typography sx={{ whiteSpace: "pre-line" }}>{message}</Typography>
          </Alert>
        </Snackbar>
      </div>
      {/* Diálogo de confirmación */}
      <Dialog open={openDialog} onClose={handleCancel}>
        <DialogTitle>Confirmación requerida</DialogTitle>
        <DialogContent>
          <DialogContentText>
            El POA seleccionado ya tiene actividades asociadas. ¿Deseas
            reemplazarlas con las nuevas actividades del Excel?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} sx={{ color: "red" }}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            sx={{
              backgroundColor: "#28497b", // Cambiar el color de fondo
              color: "white", // Cambiar el color del texto a blanco
              "&:hover": {
                backgroundColor: "#182c4a", // Cambiar el color de fondo al pasar el mouse
              },  
            }}
          >
            Reemplazar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SubirExcel;
