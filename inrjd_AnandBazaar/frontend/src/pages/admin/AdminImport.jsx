import { useState, useRef } from 'react';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import toast from 'react-hot-toast';

export default function AdminImport() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleImport = async () => {
    if (!file) return toast.error('Select a file first');
    setLoading(true); setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/admin/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data.summary);
      toast.success('Import completed!');
    } catch (err) { toast.error(err.response?.data?.error || 'Import failed'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>📥 Import Data from Excel</h1>

      <Card>
        <CardBody>
          <p style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
            Upload an Excel file (.xlsx, .xls) containing food items, raw materials, or recipe mappings.
            Use sheet names like <strong>FoodItems</strong>, <strong>RawMaterials</strong>, <strong>Recipes</strong>.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files[0])}
              style={{ padding: 'var(--space-2)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
            <Button variant="primary" onClick={handleImport} loading={loading} disabled={!file}>
              Import Data
            </Button>
          </div>

          {result && (
            <div style={{ marginTop: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>Import Summary</h3>
              {['foodItems', 'rawMaterials', 'recipes'].map((key) => (
                <div key={key} style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-cream)', borderRadius: 'var(--radius-md)' }}>
                  <strong style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</strong>:
                  <span style={{ color: 'var(--color-success)', marginLeft: 'var(--space-2)' }}>✅ {result[key]?.imported || 0} imported</span>,
                  <span style={{ color: 'var(--color-warning)', marginLeft: 'var(--space-2)' }}>⏭ {result[key]?.skipped || 0} skipped</span>
                  {result[key]?.errors?.length > 0 && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', marginTop: 'var(--space-1)' }}>
                      {result[key].errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
