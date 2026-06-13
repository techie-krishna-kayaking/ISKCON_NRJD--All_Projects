import { useState, useEffect } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import { FormGroup, Label, Input, Select } from '../../components/ui/Input';
import { Card, CardBody } from '../../components/ui/Card';
import { Loading, Empty } from '../../components/ui/LoadingEmpty';
import toast from 'react-hot-toast';

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'rice', description: '', pricePerPlate: 0, unit: 'count', isAvailable: true, isExtra: false });

  const fetchItems = () => {
    setLoading(true);
    api.get('/items').then((res) => setItems(res.data.items || [])).finally(() => setLoading(false));
  };

  useEffect(fetchItems, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/items/${editId}`, form);
        toast.success('Item updated');
      } else {
        await api.post('/items', form);
        toast.success('Item created');
      }
      setShowForm(false); setEditId(null);
      setForm({ name: '', category: 'rice', description: '', pricePerPlate: 0, unit: 'count', isAvailable: true, isExtra: false });
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const startEdit = (item) => {
    setForm({ name: item.name, category: item.category, description: item.description || '', pricePerPlate: item.pricePerPlate, unit: item.unit, isAvailable: item.isAvailable, isExtra: item.isExtra });
    setEditId(item._id); setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)' }}>🍛 Food Items</h1>
        <Button variant="primary" onClick={() => { setShowForm(!showForm); setEditId(null); }}>
          {showForm ? 'Cancel' : '+ Add Item'}
        </Button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                <FormGroup><Label required>Name</Label><Input name="name" value={form.name} onChange={handleChange} required /></FormGroup>
                <FormGroup>
                  <Label required>Category</Label>
                  <Select name="category" value={form.category} onChange={handleChange}>
                    {['rice','dal','bread','vegetable','sweet','snack','beverage','condiment','other'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </FormGroup>
                <FormGroup><Label>Price/Plate</Label><Input name="pricePerPlate" type="number" min="0" value={form.pricePerPlate} onChange={handleChange} /></FormGroup>
                <FormGroup>
                  <Label>Unit</Label>
                  <Select name="unit" value={form.unit} onChange={handleChange}>
                    {['count','kg','g','liter','ml','pack','bunch','dozen'].map((u) => <option key={u} value={u}>{u}</option>)}
                  </Select>
                </FormGroup>
              </div>
              <FormGroup><Label>Description</Label><Input name="description" value={form.description} onChange={handleChange} /></FormGroup>
              <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={handleChange} /> Available
                </label>
                <label style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <input type="checkbox" name="isExtra" checked={form.isExtra} onChange={handleChange} /> Extra Item
                </label>
              </div>
              <Button variant="primary" type="submit">{editId ? 'Update' : 'Create'} Item</Button>
            </form>
          </CardBody>
        </Card>
      )}

      {loading ? <Loading /> : items.length === 0 ? <Empty /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-cream)', borderBottom: '2px solid var(--color-border)' }}>
                {['Name', 'Category', 'Price/Plate', 'Unit', 'Available', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>{item.name}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textTransform: 'capitalize' }}>{item.category}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>₹{item.pricePerPlate}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{item.unit}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{item.isAvailable ? '✅' : '❌'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>Edit</Button>
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
