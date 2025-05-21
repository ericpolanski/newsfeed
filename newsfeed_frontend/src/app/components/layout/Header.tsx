'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AuthModal from '../auth/AuthModal';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  return (
    <header style={{ 
      backgroundColor: 'var(--card-background)', 
      boxShadow: '0 1px 3px var(--card-shadow)',
      color: 'var(--foreground)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <h1 className="text-xl font-bold" style={{ color: 'var(--primary)' }}>Newsfeed</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Dark mode toggle button */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center p-2 rounded-full"
              style={{ 
                backgroundColor: 'var(--secondary)',
                color: 'var(--secondary-text)'
              }}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <span role="img" aria-label="Light mode">☀️</span>
              ) : (
                <span role="img" aria-label="Dark mode">🌙</span>
              )}
            </button>
            
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2"
                  style={{ color: 'var(--foreground)' }}
                >
                  <span className="hidden sm:block">{user?.username}</span>
                  <div className="h-8 w-8 rounded-full flex items-center justify-center" 
                       style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                </button>
                
                {showUserMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-10"
                    style={{ 
                      backgroundColor: 'var(--card-background)',
                      border: '1px solid var(--card-border)'
                    }}
                    role="menu"
                  >
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      style={{ 
                        color: 'var(--foreground)',
                        ':hover': { backgroundColor: 'var(--secondary)' }
                      }}
                      role="menuitem"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm"
                style={{ 
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  ':hover': { backgroundColor: 'var(--primary-hover)' }
                }}
              >
                Log in / Sign up
              </button>
            )}
          </div>
        </div>
      </div>
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
};

export default Header;