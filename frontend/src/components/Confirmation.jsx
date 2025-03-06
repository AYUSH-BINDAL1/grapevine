import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Confirmation() {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    } else {
      alert('No user information found. Please register again.');
      navigate('/Registration');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setConfirmationCode(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInfo) {
      alert('No user information found. Please register again.');
      return;
    }

    try {
      const response = await axios.post(`http://localhost:8080/users/verify?token=${confirmationCode}`, userInfo, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Invalid confirmation code. Please try again.');
    }
  };

  return (
    <div className="registration-container">
      <form onSubmit={handleSubmit} className="registration-form">
        <h2>Enter Confirmation Code</h2>
        <div className="form-group">
          <input
            type="text"
            name="confirmationCode"
            value={confirmationCode}
            onChange={handleChange}
            placeholder="Confirmation Code"
            required
            pattern="[A-Z0-9]{6}"
            minLength="6"
            maxLength="6"
            title="Confirmation code must be 6 characters long and contain only capital letters and numbers."
          />
        </div>
        <button type="submit" className="register-button">
          Submit
        </button>
      </form>
    </div>
  );
}

export default Confirmation;