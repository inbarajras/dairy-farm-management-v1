import React from 'react';
import { X } from 'lucide-react';

/**
 * Reusable Modal Component with proper scroll handling and accessibility
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Modal body content
 * @param {React.ReactNode} footer - Modal footer content (buttons, etc.)
 * @param {string} maxWidth - Tailwind max-width class (default: 'max-w-md')
 * @param {boolean} preventClose - Prevent closing during loading states
 * @param {string} modalId - Unique ID for ARIA labels
 * @param {string} size - Predefined sizes: 'sm', 'md', 'lg', 'xl', '2xl', '4xl', '6xl'
 * @param {boolean} showCloseButton - Show/hide close button in header
 * @param {React.ReactNode} headerExtra - Extra content in header (next to title)
 * @param {string} overlayClassName - Additional classes for overlay
 * @param {string} containerClassName - Additional classes for modal container
 * @param {string} headerClassName - Additional classes for header
 * @param {string} bodyClassName - Additional classes for body
 * @param {string} footerClassName - Additional classes for footer
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth,
  preventClose = false,
  modalId = 'modal',
  size = 'md',
  showCloseButton = true,
  headerExtra,
  overlayClassName = '',
  containerClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = ''
}) => {
  // Don't render if not open
  if (!isOpen) return null;

  // Size mapping
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl'
  };

  const modalWidth = maxWidth || sizeClasses[size] || sizeClasses.md;

  // Handle overlay click (close on click outside)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !preventClose) {
      onClose();
    }
  };

  // Handle keyboard events (Escape to close)
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !preventClose) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto ${overlayClassName}`}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${modalId}-title`}
      tabIndex={-1}
    >
      <div className={`bg-white rounded-xl shadow-xl ${modalWidth} w-full my-8 mx-auto flex flex-col max-h-[calc(100vh-4rem)] border border-gray-100 ${containerClassName}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white flex-shrink-0 ${headerClassName}`}>
          <div className="flex items-center gap-4 flex-1">
            <h3
              id={`${modalId}-title`}
              className="text-lg font-medium text-gray-800"
            >
              {title}
            </h3>
            {headerExtra && <div className="flex-1">{headerExtra}</div>}
          </div>

          {showCloseButton && (
            <button
              onClick={onClose}
              disabled={preventClose}
              className="text-gray-400 hover:text-gray-500 transition-colors duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close modal"
              type="button"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body - Scrollable Content */}
        <div className={`flex-1 overflow-y-auto px-6 py-4 ${bodyClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0 rounded-b-xl ${footerClassName}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
