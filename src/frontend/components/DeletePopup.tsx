import { X, AlertTriangle } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";

interface DeletePopupProps {
  isOpen: boolean;
  title: string;
  name?: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const DeletePopup: React.FC<DeletePopupProps> = ({
  isOpen,
  title,
  name,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const itemTitle = title.toLowerCase();
  const displayName = name || itemTitle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70">
      <div
        className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pt-12 text-center">
          {/* Warning Icon */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-500" />
          </div>

          {/* Title */}
          <h2
            id="delete-modal-title"
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Delete {title}
          </h2>

          {/* Description */}
          <p
            id="delete-modal-description"
            className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed"
          >
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              "{displayName}"
            </span>
            ?
            <br />
            <span className="text-sm block mt-2">
              This action cannot be undone.
            </span>
          </p>

          {/* Buttons */}
          <div className="mt-8 flex gap-3">
            <Button
              onClick={onClose}
              disabled={isLoading}
              variant="outline"
              className="flex-1 h-11 font-medium border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>

            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 h-11 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 font-medium text-white shadow-sm"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Deleting...
                </span>
              ) : (
                "Delete Permanently"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletePopup;
