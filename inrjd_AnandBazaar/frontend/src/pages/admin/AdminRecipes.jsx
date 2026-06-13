import { useState, useEffect } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import { FormGroup, Label, Input, Select } from '../../components/ui/Input';
import { Card, CardBody } from '../../components/ui/Card';
import { Loading, Empty } from '../../components/ui/LoadingEmpty';
import toast from 'react-hot-toast';

export default function AdminRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ foodItem: '', rawMaterial: '', quantityPerAdult: 0, quantityPerKid: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/admin/recipes'),
      api.get('/items'),
      api.get('/raw-materials'),
    ]).then(([rRes, fRes, mRes]) => {
      setRecipes(rRes.data.recipes || []);
      setFoodItems(fRes.data.foodItems || []);
      setRawMaterials(mRes.data.rawMaterials || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/recipes', form);
      toast.success('Recipe mapping added');
      setShowForm(false);
      const res = await api.get('/admin/recipes');
      setRecipes(res.data.recipes || []);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const deleteRecipe = async (id) => {
    if (!window.confirm('Delete this recipe mapping?')) return;
    try {
      await api.delete(`/admin/recipes/${id}`);
      toast.success('Deleted');
      setRecipes((prev) => prev.filter((r) => r._id !== id));
    } catch (err) { toast.error('Failed'); }
  };

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  if (loading) return <Loading />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)' }}>🍳 Recipe Mappings</h1>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Mapping'}</Button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                <FormGroup><Label required>Food Item</Label>
                  <Select value={form.foodItem} onChange={(e) => set('foodItem', e.target.value)} required>
                    <option value="">Select...</option>
                    {foodItems.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
                  </Select>
                </FormGroup>
                <FormGroup><Label required>Raw Material</Label>
                  <Select value={form.rawMaterial} onChange={(e) => set('rawMaterial', e.target.value)} required>
                    <option value="">Select...</option>
                    {rawMaterials.map((m) => <option key={m._id} value={m._id}>{m.name} ({m.unit})</option>)}
                  </Select>
                </FormGroup>
                <FormGroup><Label required>Qty/Adult</Label><Input type="number" min="0" step="0.001" value={form.quantityPerAdult} onChange={(e) => set('quantityPerAdult', e.target.value)} required /></FormGroup>
                <FormGroup><Label required>Qty/Kid</Label><Input type="number" min="0" step="0.001" value={form.quantityPerKid} onChange={(e) => set('quantityPerKid', e.target.value)} required /></FormGroup>
              </div>
              <Button variant="primary" type="submit" style={{ marginTop: 'var(--space-4)' }}>Add Mapping</Button>
            </form>
          </CardBody>
        </Card>
      )}

      {recipes.length === 0 ? <Empty icon="🍳" message="No recipe mappings yet" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--color-cream)', borderBottom: '2px solid var(--color-border)' }}>
                {['Food Item', 'Raw Material', 'Qty/Adult', 'Qty/Kid', ''].map((h) => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr key={r._id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>{r.foodItem?.name || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{r.rawMaterial?.name || '—'} ({r.rawMaterial?.unit})</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{r.quantityPerAdult}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{r.quantityPerKid}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Button variant="ghost" size="sm" onClick={() => deleteRecipe(r._id)}>🗑</Button>
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
