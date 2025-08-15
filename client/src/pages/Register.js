import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../utils/constants';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Create a new user account via the API and navigate to login on success
  const handleRegister = async () => {
    const res = await fetch(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage('Registered!');
      navigate('/login');
    } else {
      setMessage(data.message || 'Registration failed');
    }
  };

  return (
    <div className="container">
      <h2>Register</h2>
      <input className='input' placeholder="Username" onChange={e => setUsername(e.target.value)} />
      <br />
      <input className='input' placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <br />
      <input className='input' placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
      <br />
      <button className='primary-action-btn' onClick={handleRegister}>Create New User</button>
      <br />
      <br />
      <p>{message}</p>
    </div>
  );
}

export default Register;
