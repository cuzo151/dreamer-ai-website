import React, { useState, useEffect } from 'react';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode }) => {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
    terms: false
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: {[key: string]: string} = {};

    if (mode === 'signup') {
      if (!formData.fullname.trim()) {
        newErrors.fullname = 'Full name is required';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.terms) {
        newErrors.terms = 'You must accept the terms and conditions';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      // TODO: Implement actual authentication API call
      console.log('Form submitted:', formData);
      
      // Simulate successful submission
      alert(mode === 'signup' 
        ? 'Account created successfully! Welcome to DreamerAI!' 
        : 'Welcome back to DreamerAI!'
      );
      
      // Reset form and close modal
      setFormData({
        fullname: '',
        email: '',
        company: '',
        password: '',
        confirmPassword: '',
        terms: false
      });
      onClose();
    } catch (error) {
      console.error('Authentication error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-content">
        <button className="auth-close" onClick={onClose}>&times;</button>
        <h2>{mode === 'login' ? 'Welcome Back' : 'Join DreamerAI'}</h2>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="fullname">Full Name *</label>
              <input
                type="text"
                id="fullname"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                className={errors.fullname ? 'error' : ''}
              />
              {errors.fullname && <span className="error-message">{errors.fullname}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="company">Company (Optional)</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                />
                <label htmlFor="terms">
                  I agree to the Terms of Service and Privacy Policy
                </label>
              </div>
              {errors.terms && <span className="error-message">{errors.terms}</span>}
            </>
          )}

          <button type="submit" className="btn btn-primary">
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </button>

          {mode === 'signup' && (
            <p className="signup-benefit">
              Get 5 free uses per AI tool after signup!
            </p>
          )}

          <p className="auth-switch">
            {mode === 'login' ? (
              <>
                Don't have an account? <button type="button" onClick={() => {}}>Sign up</button>
              </>
            ) : (
              <>
                Already have an account? <button type="button" onClick={() => {}}>Log in</button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;