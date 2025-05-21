'use client';

import React, { useState } from 'react';
import LoginForm from '../auth/LoginForm';
import SignupForm from '../auth/SignupForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [showLogin, setShowLogin] = useState(true);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-md">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={onClose}
          aria-label="Close"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
        
        {showLogin ? (
          <LoginForm
            onSuccess={onClose}
            onSignupClick={() => setShowLogin(false)}
          />
        ) : (
          <SignupForm
            onSuccess={onClose}
            onLoginClick={() => setShowLogin(true)}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;