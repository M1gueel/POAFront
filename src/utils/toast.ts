import { toast } from 'react-toastify';

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showWarning = (message: string) => {
  toast.warning(message);
};

export const showInfo = (message: string) => {
  toast.info(message);
};

export const showLoadingToast = (message: string) => {
  return toast.loading(message);
};

export const updateToast = (toastId: any, message: string, type: 'success' | 'error' | 'info' | 'warning') => {
  toast.update(toastId, {
    render: message,
    type: type,
    isLoading: false,
    autoClose: 5000
  });
};
