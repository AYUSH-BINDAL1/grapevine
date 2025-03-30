import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import { FaEnvelope, FaLock, FaExclamationCircle } from 'react-icons/fa';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('http://localhost:8080/users/login', formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        // store session ID and user data in localStorage
        const { sessionId, user } = response.data;
        localStorage.setItem('sessionId', sessionId);
        localStorage.setItem('userData', JSON.stringify(user));
        
        // navigate to home page
        navigate('/home');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        
        {error && (
          <div className="error-message">
            <FaExclamationCircle />
            {error}
          </div>
        )}
        
        <div className="form-group">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />
          <FaEnvelope className="input-icon" />
        </div>
        
        <div className="form-group">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
          />
          <FaLock className="input-icon" />
        </div>
        
        <button type="submit" className="login-button">
          Login
        </button>
        
        <div className="form-divider">or</div>
        
        <button 
          type="button" 
          className="register-link-button" 
          onClick={() => navigate('/Registration')}
        >
          Create New Account
        </button>
      </form>
    </div>
  );
}

export default Login;