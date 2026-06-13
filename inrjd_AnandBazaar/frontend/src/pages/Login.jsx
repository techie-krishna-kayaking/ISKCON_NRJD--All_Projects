import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { FormGroup, Label, Input } from '../components/ui/Input';
import styles from './Login.module.css';
import toast from 'react-hot-toast';

export default function Login() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back! Jai Jagannath! 🙏');
      } else {
        await register(form);
        toast.success('Account created! Jai Jagannath! 🙏');
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.icon}>🙏</div>
          <h1 className={styles.title}>AnandBazaar</h1>
          <p className={styles.subtitle}>Jagannath Prasadam Service</p>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
            onClick={() => setTab('login')}>Login</button>
          <button className={`${styles.tab} ${tab === 'register' ? styles.tabActive : ''}`}
            onClick={() => setTab('register')}>Register</button>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <FormGroup>
              <Label htmlFor="name" required>Full Name</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange}
                placeholder="Enter your name" required />
            </FormGroup>
          )}

          <FormGroup>
            <Label htmlFor="email" required>Email</Label>
            <Input id="email" name="email" type="email" value={form.email}
              onChange={handleChange} placeholder="your@email.com" required />
          </FormGroup>

          {tab === 'register' && (
            <FormGroup>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" value={form.phone}
                onChange={handleChange} placeholder="+91 9999999999" />
            </FormGroup>
          )}

          <FormGroup>
            <Label htmlFor="password" required>Password</Label>
            <Input id="password" name="password" type="password" value={form.password}
              onChange={handleChange} placeholder="Enter password" required
              hint={tab === 'register' ? 'Minimum 6 characters' : undefined} />
          </FormGroup>

          <Button variant="primary" size="lg" style={{ width: '100%' }}
            loading={loading} type="submit">
            {tab === 'login' ? 'Login' : 'Create Account'}
          </Button>
        </form>

        <div className={styles.divider}>or</div>

        <button className={styles.googleBtn} type="button">
          🔵 Continue with Google
        </button>

        <div className={styles.footer}>
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
