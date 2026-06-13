import { useState, useEffect } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import { FormGroup, Label, Input, Select } from '../../components/ui/Input';
import { Card, CardBody } from '../../components/ui/Card';
import { Loading, Empty } from '../../components/ui/LoadingEmpty';
import toast from 'react-hot-toast';

export default function AdminRawMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'vegetables', unit: 'kg', currentStock: 0, minimumStock: 0, costPerUnit: 0 });

  const fetchMaterials = () => {
    setLoading(true);
    api.get('/raw-materials').then((res) => setMaterials(res.data.rawMaterials || [])).finally(() => setLoading(false));
  };

  useEffect(fetchMaterials, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/raw-materials', form);
      toast.success('Raw material added');
      setShowForm(false);
      setForm({ name: '', category: 'vegetables', unit: 'kg', currentStock: 0, minimumStock: 0, costPerUnit: 0 });
      fetchMaterials();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const deleteMaterial = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await api.delete(`/raw-materials/${id}`);
      toast.success('Deleted');
      fetchMaterials();
    } catch (err) { toast.error('Failed'); }
  };

  const categories = ['vegetables', 'fruits', 'dairy', 'spices', 'grains', 'oils', 'dry_fruits', 'packaging', 'other'];
  const units = ['kg', 'g', 'litre', 'ml', 'pieces', 'packets', 'dozen', 'bunch'];

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)' }}>📦 Raw Materials</h1>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Material'}</Button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
                <FormGroup><Label required>Name</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} required /></FormGroup>
                <FormGroup><Label>Category</Label><Select value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {categories.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </Select></FormGroup>
                <FormGroup><Label>Unit</Label><Select value={form.unit} onChange={(e) => set('unit', e.target.value)}>
                  {units.map((u) => <option key={u} value={u}>{u}</option>)}
                </Select></FormGroup>
                <FormGroup><Label>Current Stock</Label><Input type="number" min="0" step="0.1" value={form.currentStock} onChange={(e) => set('currentStock', e.target.value)} /></FormGroup>
                <FormGroup><Label>Min Stock</Label><Input type="number" min="0" step="0.1" value={form.minimumStock} onChange={(e) => set('minimumStock', e.target.value)} /></FormGroup>
                <FormGroup><Label>Cost/Unit (₹)</Label><Input type="number" min="0" step="0.01" value={form.costPerUnit} onChange={(e) => set('costPerUnit', e.target.value)} /></FormGroup>
              </div>
              <Button variant="primary" type="submit" style={{ marginTop: 'var(--space-4)' }}>Add Material</Button>
            </form>
          </CardBody>
        </Card>
      )}

      {loading ? <Loading /> : materials.length === 0 ? <Empty icon="📦" message="No raw materials" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-cream)', borderBottom: '2px solid var(--color-border)' }}>
                {['Name', 'Category', 'Stock', 'Min', 'Unit', 'Cost/Unit', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => {
                const isLow = m.currentStock <= m.minimumStock;
                return (
                  <tr key={m._id} style={{ borderBottom: '1px solid var(--color-border-light)', background: isLow ? '#FFF3E0' : 'transparent' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>{m.name}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textTransform: 'capitalize', fontSize: 'var(--text-sm)' }}>{m.category?.replace('_', ' ')}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>{m.currentStock}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{m.minimumStock}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{m.unit}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>₹{m.costPerUnit}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ color: isLow ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                        {isLow ? '⚠️ Low' : '✅ OK'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <Button variant="ghost" size="sm" onClick={() => deleteMaterial(m._id)}>🗑</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
