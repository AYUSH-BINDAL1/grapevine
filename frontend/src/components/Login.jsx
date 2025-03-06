import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      alert('Login failed.');
    }
  };

  return (
    <div className="registration-container">
      <form onSubmit={handleSubmit} className="registration-form">
        <h2>Login</h2>
        <div className="form-group">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />
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
        </div>
        <button type="submit" className="register-button">
          Login
        </button>
        <button type="button" className="sign-in-button" onClick={() => navigate('/Registration')}>
          Register
        </button>
      </form>
    </div>
  );
}

export default Login;