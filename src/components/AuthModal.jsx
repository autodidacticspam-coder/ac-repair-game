import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose }) {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const result = signIn(username);
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>&times;</button>

        <h2>Enter Your Name</h2>
        <p className="auth-subtitle">Your progress will be saved to the cloud!</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              autoFocus
              maxLength={20}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit">
            Start Playing
          </button>
        </form>
      </div>
    </div>
  );
}
