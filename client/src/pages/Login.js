import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      // Store user info as well
      localStorage.setItem('user', JSON.stringify(data.user));
      const user = jwtDecode(data.token);
      setMessage(`Welcome ${user.username}`);
      navigate('/dashboard');
    } else {
      setMessage(data.message || 'Login failed');
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <input className='input' placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <br />
      <input className='input' placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
      <br />
      <button className='btn-secondary' onClick={handleLogin}>Login</button>
      <button className='btn-secondary' onClick={() => navigate('/register')} style={{marginLeft: "20px"}}>Register</button>
      <br />
      <p>{message}</p>
    </div>
  );
}

export default Login;
