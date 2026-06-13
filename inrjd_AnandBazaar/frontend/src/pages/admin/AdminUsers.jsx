import { useState, useEffect } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import { FormGroup, Label, Input, Select } from '../../components/ui/Input';
import { Card, CardBody } from '../../components/ui/Card';
import { Loading, Empty } from '../../components/ui/LoadingEmpty';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', roles: ['customer'] });

  const fetchUsers = () => {
    setLoading(true);
    api.get('/admin/users').then((res) => setUsers(res.data.users || [])).finally(() => setLoading(false));
  };

  useEffect(fetchUsers, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', form);
      toast.success('User created');
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', password: '', roles: ['customer'] });
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const toggleActive = async (id, current) => {
    try {
      await api.put(`/admin/users/${id}`, { isActive: !current });
      toast.success('User updated');
      fetchUsers();
    } catch (err) { toast.error('Failed'); }
  };

  const allRoles = ['customer', 'stock_team', 'procurement', 'admin'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)' }}>👥 Users</h1>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add User'}
        </Button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                <FormGroup><Label required>Name</Label><Input name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></FormGroup>
                <FormGroup><Label required>Email</Label><Input name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></FormGroup>
                <FormGroup><Label>Phone</Label><Input name="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormGroup>
                <FormGroup><Label required>Password</Label><Input name="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></FormGroup>
              </div>
              <FormGroup>
                <Label>Roles</Label>
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  {allRoles.map((role) => (
                    <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.roles.includes(role)} onChange={(e) => {
                        setForm((p) => ({
                          ...p,
                          roles: e.target.checked ? [...p.roles, role] : p.roles.filter((r) => r !== role),
                        }));
                      }} />
                      <span style={{ fontSize: 'var(--text-sm)', textTransform: 'capitalize' }}>{role.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </FormGroup>
              <Button variant="primary" type="submit">Create User</Button>
            </form>
          </CardBody>
        </Card>
      )}

      {loading ? <Loading /> : users.length === 0 ? <Empty icon="👥" message="No users" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-cream)', borderBottom: '2px solid var(--color-border)' }}>
                {['Name', 'Email', 'Phone', 'Roles', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{u.email}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{u.phone || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)' }}>
                    {u.roles?.map((r) => r.replace('_', ' ')).join(', ')}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ color: u.isActive ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600 }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(u._id, u.isActive)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
