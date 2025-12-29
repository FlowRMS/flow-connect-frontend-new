import { toast as sonnerToast } from "sonner";

/**
 * Toast notification utility
 * Provides consistent toast notifications across the application
 */
export const toast = {
  success: (message, description) => {
    sonnerToast.success(message, {
      description,
    });
  },
  
  error: (message, description) => {
    sonnerToast.error(message, {
      description,
    });
  },
  
  warning: (message, description) => {
    sonnerToast.warning(message, {
      description,
    });
  },
  
  info: (message, description) => {
    sonnerToast.info(message, {
      description,
    });
  },
  
  // Generic toast
  message: (message, description) => {
    sonnerToast(message, {
      description,
    });
  },
};
