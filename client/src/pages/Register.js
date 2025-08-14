import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Create a new user account via the API and navigate to login on success
  const handleRegister = async () => {
    const res = await fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage('Registered!');
      navigate('/login');
    } else {
      setMessage(data.message);
    }
  };

  return (
    <div className="container">
      <h2>Register</h2>
      {/* Basic form inputs (no client-side validation for brevity) */}
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
