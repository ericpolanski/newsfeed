'use client';

import React, { useState, useEffect } from 'react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info' | 'success';
  timeout?: number;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  type = 'error',
  timeout = 5000, // Auto-dismiss after 5 seconds by default
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // If timeout is provided, auto-dismiss the message
    if (timeout > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) onDismiss();
      }, timeout);

      // Clear timeout on unmount
      return () => clearTimeout(timer);
    }
  }, [timeout, onDismiss]);

  if (!isVisible) {
    return null;
  }

  // Color scheme based on message type
  const colorScheme = {
    error: {
      bg: 'bg-red-100',
      border: 'border-red-400',
      text: 'text-red-700',
    },
    warning: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-400',
      text: 'text-yellow-700',
    },
    info: {
      bg: 'bg-blue-100',
      border: 'border-blue-400',
      text: 'text-blue-700',
    },
    success: {
      bg: 'bg-green-100',
      border: 'border-green-400',
      text: 'text-green-700',
    },
  }[type];

  return (
    <div
      className={`${colorScheme.bg} border ${colorScheme.border} ${colorScheme.text} px-4 py-3 rounded relative mb-4`}
      role="alert"
    >
      <span className="block sm:inline">{message}</span>
      {onDismiss && (
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss();
          }}
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
          aria-label="Close"
        >
          <svg
            className="fill-current h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M14.348 5.652a.5.5 0 010 .707L10.707 10l3.641 3.641a.5.5 0 11-.707.707L10 10.707l-3.641 3.641a.5.5 0 01-.707-.707L9.293 10 5.652 6.359a.5.5 0 01.707-.707L10 9.293l3.641-3.641a.5.5 0 01.707 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
