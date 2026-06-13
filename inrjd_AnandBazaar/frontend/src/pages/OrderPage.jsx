import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { FormGroup, Label, Input, Textarea, Select } from '../components/ui/Input';
import { Loading } from '../components/ui/LoadingEmpty';
import toast from 'react-hot-toast';
import styles from './OrderPage.module.css';

const steps = ['Select Items', 'Event Details', 'Contact & Extras', 'Review & Submit'];
const emojiMap = { rice: '🍚', dal: '🍲', bread: '🫓', vegetable: '🥘', sweet: '🍮', snack: '🍘', beverage: '🥤', condiment: '🫙', other: '🍽️' };

export default function OrderPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [selected, setSelected] = useState({});
  const [form, setForm] = useState({
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    eventDate: '',
    venue: '',
    numberOfAdults: 1,
    numberOfKids: 0,
    specialInstructions: '',
    waterBottle: false,
    bottleSize: '500ml',
    bottleQty: 0,
    tissueRequired: false,
    tissueQty: 0,
  });

  useEffect(() => {
    api.get('/items?available=true').then((res) => {
      setItems(res.data.items || []);
    }).catch(() => toast.error('Failed to load menu')).finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(items.map((i) => i.category))];
  const filtered = selectedCategory === 'all' ? items.filter((i) => !i.isExtra) : items.filter((i) => i.category === selectedCategory && !i.isExtra);

  const toggleItem = (id) => {
    setSelected((prev) => {
      const copy = { ...prev };
      if (copy[id]) delete copy[id];
      else copy[id] = 1;
      return copy;
    });
  };

  const setQty = (id, qty) => {
    if (qty <= 0) {
      setSelected((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
    } else {
      setSelected((prev) => ({ ...prev, [id]: qty }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const selectedItems = Object.keys(selected).map((id) => {
    const item = items.find((i) => i._id === id);
    return { ...item, quantity: selected[id] };
  }).filter(Boolean);

  const canProceed = () => {
    if (step === 0) return selectedItems.length > 0;
    if (step === 1) return form.eventDate && form.venue && form.numberOfAdults >= 1;
    if (step === 2) return form.customerEmail && form.customerPhone;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const orderItems = selectedItems.map((i) => ({ foodItem: i._id, quantity: i.quantity, notes: '' }));
      const extras = [];
      if (form.waterBottle && form.bottleQty > 0) {
        extras.push({ type: 'water_bottle', label: `Water Bottle (${form.bottleSize})`, size: form.bottleSize, quantity: parseInt(form.bottleQty) });
      }
      if (form.tissueRequired && form.tissueQty > 0) {
        extras.push({ type: 'tissue', label: 'Tissue Pack', quantity: parseInt(form.tissueQty) });
      }

      const res = await api.post('/orders', {
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        eventDate: form.eventDate,
        venue: form.venue,
        numberOfAdults: parseInt(form.numberOfAdults),
        numberOfKids: parseInt(form.numberOfKids),
        specialInstructions: form.specialInstructions,
        items: orderItems,
        extras,
      });

      setSuccess(res.data.order);
      toast.success('Order placed successfully! 🙏');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.success}>
          <div className={styles.successIcon}>🙏</div>
          <h2 className={styles.successTitle}>Order Placed Successfully!</h2>
          <p className={styles.successMsg}>
            Your order <strong>#{success.orderNumber}</strong> has been placed. Our team will review it and contact you
            at <strong>{success.customerEmail}</strong> / <strong>{success.customerPhone}</strong> with confirmation and pricing details.
          </p>
          <p style={{ fontStyle: 'italic', color: 'var(--color-saffron-dark)', marginBottom: 'var(--space-6)' }}>
            Jai Jagannath! All items will be offered to Lord Jagannath.
          </p>
          <Link to="/">
            <Button variant="primary">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>🍛 Order Prasadam</h1>
      <p className={styles.pageSubtitle}>Select items for your event catering</p>

      {/* Stepper */}
      <div className={styles.stepper}>
        {steps.map((s, i) => (
          <div key={s} className={`${styles.step} ${i === step ? styles.stepActive : ''} ${i < step ? styles.stepDone : ''}`}>
            <span className={styles.stepNum}>{i < step ? '✓' : i + 1}</span>
            {s}
          </div>
        ))}
      </div>

      {/* Step 0: Select Items */}
      {step === 0 && (
        <>
          <div className={styles.categoryTabs}>
            {categories.map((cat) => (
              <button key={cat} className={`${styles.catTab} ${selectedCategory === cat ? styles.catTabActive : ''}`}
                onClick={() => setSelectedCategory(cat)}>
                {cat === 'all' ? '🍽️ All' : `${emojiMap[cat] || '🍽️'} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
              </button>
            ))}
          </div>
          <div className={styles.itemGrid}>
            {filtered.map((item) => (
              <div key={item._id} className={`${styles.itemCard} ${selected[item._id] ? styles.itemSelected : ''}`}
                onClick={() => !selected[item._id] && toggleItem(item._id)}>
                <div className={styles.itemImage}>
                  {item.image ? <img src={item.image} alt={item.name} /> : (emojiMap[item.category] || '🍽️')}
                </div>
                <div className={styles.itemBody}>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemCategory}>{item.category}</div>
                  {item.pricePerPlate > 0 && <div className={styles.itemPrice}>₹{item.pricePerPlate}/plate</div>}
                  {selected[item._id] && (
                    <div className={styles.qtyControl} onClick={(e) => e.stopPropagation()}>
                      <button className={styles.qtyBtn} onClick={() => setQty(item._id, (selected[item._id] || 1) - 1)}>−</button>
                      <input className={styles.qtyInput} type="number" min="0" value={selected[item._id] || 0}
                        onChange={(e) => setQty(item._id, parseInt(e.target.value) || 0)} />
                      <button className={styles.qtyBtn} onClick={() => setQty(item._id, (selected[item._id] || 0) + 1)}>+</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {selectedItems.length > 0 && (
            <div className={styles.notice}>
              ✅ {selectedItems.length} item(s) selected: {selectedItems.map((i) => i.name).join(', ')}
            </div>
          )}
        </>
      )}

      {/* Step 1: Event Details */}
      {step === 1 && (
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>📅 Event Details</h3>
          <div className={styles.formGrid}>
            <FormGroup>
              <Label htmlFor="eventDate" required>Event Date</Label>
              <Input id="eventDate" name="eventDate" type="date" value={form.eventDate}
                onChange={handleChange} min={new Date().toISOString().split('T')[0]} required />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="venue" required>Venue / Location</Label>
              <Input id="venue" name="venue" value={form.venue} onChange={handleChange}
                placeholder="Enter event venue" required />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="numberOfAdults" required>Number of Adults</Label>
              <Input id="numberOfAdults" name="numberOfAdults" type="number" min="1"
                value={form.numberOfAdults} onChange={handleChange} required />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="numberOfKids">Number of Kids</Label>
              <Input id="numberOfKids" name="numberOfKids" type="number" min="0"
                value={form.numberOfKids} onChange={handleChange} />
            </FormGroup>
          </div>
          <FormGroup>
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <Textarea id="specialInstructions" name="specialInstructions" value={form.specialInstructions}
              onChange={handleChange} placeholder="Any special requests, dietary notes, or instructions..." />
          </FormGroup>
        </div>
      )}

      {/* Step 2: Contact & Extras */}
      {step === 2 && (
        <>
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>📞 Contact Details</h3>
            <div className={styles.formGrid}>
              <FormGroup>
                <Label htmlFor="customerName">Your Name</Label>
                <Input id="customerName" name="customerName" value={form.customerName}
                  onChange={handleChange} placeholder="Enter your name" />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="customerEmail" required>Email Address</Label>
                <Input id="customerEmail" name="customerEmail" type="email" value={form.customerEmail}
                  onChange={handleChange} placeholder="your@email.com" required />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="customerPhone" required>Phone Number</Label>
                <Input id="customerPhone" name="customerPhone" type="tel" value={form.customerPhone}
                  onChange={handleChange} placeholder="+91 9999999999" required />
              </FormGroup>
            </div>
            <div className={styles.notice}>
              📧 We will use your email and phone number to contact you and keep you updated about your order.
            </div>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>🧴 Extras</h3>
            <FormGroup>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                <input type="checkbox" name="waterBottle" checked={form.waterBottle} onChange={handleChange} />
                <span>Water Bottles Required</span>
              </label>
            </FormGroup>
            {form.waterBottle && (
              <div className={styles.formGrid}>
                <FormGroup>
                  <Label htmlFor="bottleSize">Bottle Size</Label>
                  <Select id="bottleSize" name="bottleSize" value={form.bottleSize} onChange={handleChange}>
                    <option value="500ml">500ml</option>
                    <option value="1L">1 Liter</option>
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="bottleQty">Quantity</Label>
                  <Input id="bottleQty" name="bottleQty" type="number" min="0" value={form.bottleQty} onChange={handleChange} />
                </FormGroup>
              </div>
            )}
            <FormGroup>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                <input type="checkbox" name="tissueRequired" checked={form.tissueRequired} onChange={handleChange} />
                <span>Tissue Packs Required</span>
              </label>
            </FormGroup>
            {form.tissueRequired && (
              <FormGroup>
                <Label htmlFor="tissueQty">Quantity</Label>
                <Input id="tissueQty" name="tissueQty" type="number" min="0" value={form.tissueQty} onChange={handleChange} />
              </FormGroup>
            )}
          </div>
        </>
      )}

      {/* Step 3: Review */}
      {step === 3 && (() => {
        const adults = parseInt(form.numberOfAdults) || 0;
        const kids = parseInt(form.numberOfKids) || 0;
        const totalServings = adults + Math.ceil(kids * 0.5);

        const itemLines = selectedItems.map((item) => {
          const unitPrice = item.pricePerPlate || 0;
          const lineTotal = unitPrice * item.quantity * totalServings;
          return { ...item, unitPrice, lineTotal };
        });
        const itemsSubtotal = itemLines.reduce((sum, l) => sum + l.lineTotal, 0);

        const waterBottlePrice = form.bottleSize === '1L' ? 30 : 20;
        const bottleCost = form.waterBottle && form.bottleQty > 0 ? waterBottlePrice * parseInt(form.bottleQty) : 0;
        const tissueCost = form.tissueRequired && form.tissueQty > 0 ? 5 * parseInt(form.tissueQty) : 0;
        const extrasSubtotal = bottleCost + tissueCost;
        const grandTotal = itemsSubtotal + extrasSubtotal;

        return (
          <div className={styles.reviewSection}>
            <h3 className={styles.formSectionTitle}>📋 Order Review</h3>

            {/* Serving summary */}
            <div style={{ background: 'var(--color-cream)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <span>👥 <strong>{adults}</strong> Adults + <strong>{kids}</strong> Kids</span>
                <span style={{ fontWeight: 600, color: 'var(--color-saffron-dark)' }}>
                  = <strong>{totalServings}</strong> effective servings <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>(kids count as ½)</span>
                </span>
              </div>
            </div>

            {/* Food items with pricing */}
            <h4 style={{ marginBottom: 'var(--space-3)', fontWeight: 600 }}>Selected Items</h4>
            <div style={{ border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-2)' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-cream)', fontWeight: 600, fontSize: 'var(--text-sm)', borderBottom: '1px solid var(--color-border)' }}>
                <span>Item</span>
                <span style={{ textAlign: 'right' }}>Rate/Plate</span>
                <span style={{ textAlign: 'right' }}>Qty (plates)</span>
                <span style={{ textAlign: 'right' }}>Servings</span>
                <span style={{ textAlign: 'right' }}>Amount</span>
              </div>
              {/* Rows */}
              {itemLines.map((item) => (
                <div key={item._id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border-light)', fontSize: 'var(--text-sm)' }}>
                  <span>{item.name}</span>
                  <span style={{ textAlign: 'right' }}>₹{item.unitPrice}</span>
                  <span style={{ textAlign: 'right' }}>{item.quantity}</span>
                  <span style={{ textAlign: 'right' }}>× {totalServings}</span>
                  <span style={{ textAlign: 'right', fontWeight: 600 }}>₹{item.lineTotal.toLocaleString()}</span>
                </div>
              ))}
              {/* Items subtotal */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-cream)', fontWeight: 700 }}>
                <span>Food Items Subtotal</span>
                <span></span><span></span><span></span>
                <span style={{ textAlign: 'right' }}>₹{itemsSubtotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Extras with pricing */}
            {(bottleCost > 0 || tissueCost > 0) && (
              <>
                <h4 style={{ marginTop: 'var(--space-5)', marginBottom: 'var(--space-3)', fontWeight: 600 }}>Extras</h4>
                <div style={{ border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-2)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-cream)', fontWeight: 600, fontSize: 'var(--text-sm)', borderBottom: '1px solid var(--color-border)' }}>
                    <span>Item</span>
                    <span style={{ textAlign: 'right' }}>Rate</span>
                    <span style={{ textAlign: 'right' }}>Qty</span>
                    <span style={{ textAlign: 'right' }}>Amount</span>
                  </div>
                  {bottleCost > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border-light)', fontSize: 'var(--text-sm)' }}>
                      <span>Water Bottle ({form.bottleSize})</span>
                      <span style={{ textAlign: 'right' }}>₹{waterBottlePrice}</span>
                      <span style={{ textAlign: 'right' }}>{form.bottleQty}</span>
                      <span style={{ textAlign: 'right', fontWeight: 600 }}>₹{bottleCost.toLocaleString()}</span>
                    </div>
                  )}
                  {tissueCost > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border-light)', fontSize: 'var(--text-sm)' }}>
                      <span>Tissue Packs</span>
                      <span style={{ textAlign: 'right' }}>₹5</span>
                      <span style={{ textAlign: 'right' }}>{form.tissueQty}</span>
                      <span style={{ textAlign: 'right', fontWeight: 600 }}>₹{tissueCost.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-cream)', fontWeight: 700 }}>
                    <span>Extras Subtotal</span>
                    <span></span><span></span>
                    <span style={{ textAlign: 'right' }}>₹{extrasSubtotal.toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}

            {/* Grand Total */}
            <div style={{
              marginTop: 'var(--space-5)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--color-saffron), var(--color-saffron-dark))',
              color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Estimated Total</span>
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>₹{grandTotal.toLocaleString()}</span>
            </div>

            {/* Event & Contact details */}
            <h4 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)', fontWeight: 600 }}>Event Details</h4>
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Event Date</span>
              <span className={styles.reviewValue}>{new Date(form.eventDate).toLocaleDateString()}</span>
            </div>
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Venue</span>
              <span className={styles.reviewValue}>{form.venue}</span>
            </div>
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Adults</span>
              <span className={styles.reviewValue}>{form.numberOfAdults}</span>
            </div>
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Kids</span>
              <span className={styles.reviewValue}>{form.numberOfKids}</span>
            </div>

            <h4 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)', fontWeight: 600 }}>Contact</h4>
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Email</span>
              <span className={styles.reviewValue}>{form.customerEmail}</span>
            </div>
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Phone</span>
              <span className={styles.reviewValue}>{form.customerPhone}</span>
            </div>

            {form.specialInstructions && (
              <>
                <h4 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)', fontWeight: 600 }}>Special Instructions</h4>
                <p style={{ color: 'var(--color-text-secondary)' }}>{form.specialInstructions}</p>
              </>
            )}

            <div className={styles.notice} style={{ marginTop: 'var(--space-6)' }}>
              🙏 All items are first offered to Lord Jagannath and then lovingly served as prasadam.
            </div>
          </div>
        );
      })()}

      {/* Navigation */}
      <div className={styles.navBtns}>
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep(step - 1)}>← Back</Button>
        ) : <div />}
        {step < 3 ? (
          <Button variant="primary" disabled={!canProceed()} onClick={() => setStep(step + 1)}>
            Next →
          </Button>
        ) : (
          <Button variant="primary" size="lg" loading={submitting} onClick={handleSubmit}>
            🙏 Place Order
          </Button>
        )}
      </div>
    </div>
  );
}
