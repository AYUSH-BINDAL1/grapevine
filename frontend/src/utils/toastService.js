import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Default options
const defaultOptions = {
  position: "bottom-left",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// Toast variants with custom styling
export const toastSuccess = (message, options = {}) => {
  return toast.success(message, {
    ...defaultOptions,
    ...options,
    className: 'toast-success-container',
    progressClassName: 'toast-success-progress',
  });
};

export const toastError = (message, options = {}) => {
  return toast.error(message, {
    ...defaultOptions,
    autoClose: 4000, // Errors stay longer
    ...options,
    className: 'toast-error-container',
    progressClassName: 'toast-error-progress',
  });
};

export const toastInfo = (message, options = {}) => {
  return toast.info(message, {
    ...defaultOptions,
    ...options,
    className: 'toast-info-container',
    progressClassName: 'toast-info-progress',
  });
};

export const toastWarning = (message, options = {}) => {
  return toast.warning(message, {
    ...defaultOptions,
    ...options,
    className: 'toast-warning-container',
    progressClassName: 'toast-warning-progress',
  });
};

// For custom toast content with icon
export const toastCustom = (content, options = {}) => {
  return toast(content, {
    ...defaultOptions,
    ...options,
  });
};

// For actions that need confirmation
export const toastPromise = (promise, messages = {}, options = {}) => {
  return toast.promise(
    promise,
    {
      pending: messages.pending || 'Processing...',
      success: messages.success || 'Completed successfully!',
      error: messages.error || 'An error occurred',
    },
    {
      ...defaultOptions,
      ...options,
    }
  );
};

export const toastLoading = (message, options = {}) => {
    return toast.loading(message, {
      ...defaultOptions,
      ...options,
    });
  };

// For dismissing all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};