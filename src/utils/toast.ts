import { toast, ToastOptions } from 'react-toastify';

// Configuración por defecto para todos los toasts
const defaultToastOptions: ToastOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// Función para mostrar mensajes de error
export const showError = (message: string, options?: ToastOptions) => {
  toast.error(message, {
    ...defaultToastOptions,
    ...options,
  });
};

// Función para mostrar mensajes de éxito
export const showSuccess = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    ...defaultToastOptions,
    ...options,
  });
};

// Función para mostrar mensajes de advertencia
export const showWarning = (message: string, options?: ToastOptions) => {
  toast.warning(message, {
    ...defaultToastOptions,
    ...options,
  });
};

// Función para mostrar mensajes informativos
export const showInfo = (message: string, options?: ToastOptions) => {
  toast.info(message, {
    ...defaultToastOptions,
    ...options,
  });
};

// Función para mostrar toast personalizado
export const showCustomToast = (message: string, options?: ToastOptions) => {
  toast(message, {
    ...defaultToastOptions,
    ...options,
  });
};

// Función para limpiar todos los toasts
export const clearAllToasts = () => {
  toast.dismiss();
};

// Función para configurar opciones globales (opcional)
export const configureToast = (newDefaults: Partial<ToastOptions>) => {
  Object.assign(defaultToastOptions, newDefaults);
};