"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

/**
 * Custom Modal Component to replace browser alert/confirm dialogs
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {function} props.onClose - Callback when modal is closed
 * @param {string} props.title - Modal title
 * @param {string|React.ReactNode} props.message - Modal message content
 * @param {string} props.type - Type of modal: 'info', 'warning', 'error', 'success', 'confirm'
 * @param {function} props.onConfirm - Callback for confirm action (for confirm type)
 * @param {string} props.confirmText - Text for confirm button
 * @param {string} props.cancelText - Text for cancel button
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel",
  children,
}) => {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const getIcon = () => {
    switch (type) {
      case "warning":
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "confirm":
        return <AlertCircle className="h-6 w-6 text-blue-500" />;
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case "warning":
        return {
          border: "border-yellow-200",
          bg: "bg-yellow-50",
          text: "text-yellow-800",
        };
      case "error":
        return {
          border: "border-red-200",
          bg: "bg-red-50",
          text: "text-red-800",
        };
      case "success":
        return {
          border: "border-green-200",
          bg: "bg-green-50",
          text: "text-green-800",
        };
      case "confirm":
        return {
          border: "border-blue-200",
          bg: "bg-blue-50",
          text: "text-blue-800",
        };
      default:
        return {
          border: "border-gray-200",
          bg: "bg-gray-50",
          text: "text-gray-800",
        };
    }
  };

  const colors = getColors();

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      {/* Modal - needs to be on top of backdrop with pointer-events */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200 z-10 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${colors.border}`}>
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {children ? (
            children
          ) : (
            <div className={`${colors.bg} ${colors.text} px-4 py-3 rounded-lg`}>
              <p className="text-sm leading-relaxed">{message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          {type === "confirm" ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm?.();
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at the document body level, above all other content
  return createPortal(modalContent, document.body);
};

/**
 * Hook to manage modal state
 */
export const useModal = () => {
  const [modalState, setModalState] = React.useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  const showModal = React.useCallback((config) => {
    setModalState({
      isOpen: true,
      ...config,
    });
  }, []);

  const hideModal = React.useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showAlert = React.useCallback((title, message, type = "info") => {
    showModal({ title, message, type });
  }, [showModal]);

  const showConfirm = React.useCallback((title, message, onConfirm) => {
    showModal({ title, message, type: "confirm", onConfirm });
  }, [showModal]);

  return {
    modalState,
    showModal,
    hideModal,
    showAlert,
    showConfirm,
  };
};
