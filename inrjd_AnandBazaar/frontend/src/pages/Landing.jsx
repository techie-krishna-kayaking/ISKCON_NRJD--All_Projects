import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import styles from './Landing.module.css';

const features = [
  { icon: '🙏', title: 'Offered to Lord Jagannath', desc: 'Every item is lovingly prepared by devotees and first offered to Lord Jagannath before being served as prasadam.' },
  { icon: '🍛', title: 'Authentic Prasadam Menu', desc: 'Traditional recipes from the temple kitchen — rice, dal, puri, vegetables, sweets, and more.' },
  { icon: '🎉', title: 'Catering for All Events', desc: 'From intimate gatherings to grand festivals, we cater for all occasions with devotion.' },
  { icon: '📱', title: 'Easy Online Ordering', desc: 'Simple ordering process with real-time updates via email, SMS, and WhatsApp.' },
  { icon: '👨‍🍳', title: 'Prepared by Devotees', desc: 'All food is cooked by dedicated devotees in a clean, sattvic kitchen environment.' },
  { icon: '🌿', title: 'Pure Vegetarian', desc: '100% pure vegetarian, sattvic food prepared with the finest ingredients.' },
];

const process = [
  { num: 1, title: 'Browse Menu', desc: 'Explore our divine prasadam menu' },
  { num: 2, title: 'Place Order', desc: 'Select items, enter event details' },
  { num: 3, title: 'Confirmation', desc: 'Admin reviews and confirms your order' },
  { num: 4, title: 'Enjoy Prasadam', desc: 'Fresh prasadam delivered for your event' },
];

const testimonials = [
  { text: 'The prasadam was absolutely divine. Our guests could not stop praising the food. Truly blessed!', author: 'Radha Devi, Wedding Reception' },
  { text: 'AnandBazaar made our temple anniversary celebration unforgettable. The dal and puri were heavenly.', author: 'Gopinath Das, Temple Event' },
  { text: 'Professional service with a devotional touch. They handled our event of 500 guests flawlessly.', author: 'Meera Sharma, Corporate Event' },
];

export default function Landing() {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    api.get('/items?available=true').then((res) => {
      setMenuItems(res.data.items?.slice(0, 8) || []);
    }).catch(() => {});
  }, []);

  const emojiMap = { rice: '🍚', dal: '🍲', bread: '🫓', vegetable: '🥘', sweet: '🍮', snack: '🍘', beverage: '🥤', condiment: '🫙', other: '🍽️' };

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <div className={styles.heroOm}>🙏</div>
          <h1 className={styles.heroTitle}>
            Jagannath Prasadam<br />Catering Service
          </h1>
          <p className={styles.heroSubtitle}>
            Divinely prepared food, offered to Lord Jagannath with love and devotion.
            Order authentic prasadam for your events, festivals, and celebrations.
          </p>
          <div className={styles.heroCta}>
            <Link to="/order" className={`${styles.ctaBtn} ${styles.ctaPrimary}`}>
              🍛 Order Prasadam
            </Link>
            <Link to="/menu" className={`${styles.ctaBtn} ${styles.ctaSecondary}`}>
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <div className={styles.trustBanner}>
        <p className={styles.trustText}>
          "All items are first offered to Lord Jagannath and then lovingly served as prasadam.
          All items are prepared by devotees."
        </p>
      </div>

      {/* Features */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Why Choose AnandBazaar</h2>
        <p className={styles.sectionSubtitle}>Serving Krishna's mercy through food for over a decade</p>
        <div className={`${styles.featuresGrid} stagger`}>
          {features.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Menu Preview */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <h2 className={styles.sectionTitle}>Our Prasadam Menu</h2>
        <p className={styles.sectionSubtitle}>A glimpse of our divine offerings</p>
        <div className={styles.menuGrid}>
          {menuItems.map((item) => (
            <div key={item._id} className={styles.menuCard}>
              <div className={styles.menuImage}>
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  emojiMap[item.category] || '🍽️'
                )}
              </div>
              <div className={styles.menuInfo}>
                <div className={styles.menuName}>{item.name}</div>
                <div className={styles.menuDesc}>{item.description}</div>
                {item.pricePerPlate > 0 && (
                  <div className={styles.menuPrice}>₹{item.pricePerPlate}/plate</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
          <Link to="/menu" className={`${styles.ctaBtn} ${styles.ctaPrimary}`} style={{ fontSize: 'var(--text-base)' }}>
            View Full Menu →
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <p className={styles.sectionSubtitle}>Simple, seamless ordering process</p>
        <div className={styles.processGrid}>
          {process.map((step) => (
            <div key={step.num} className={styles.processStep}>
              <div className={styles.processNum}>{step.num}</div>
              <h3 className={styles.processTitle}>{step.title}</h3>
              <p className={styles.processDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <h2 className={styles.sectionTitle}>What Devotees Say</h2>
        <p className={styles.sectionSubtitle}>Blessed by the prasadam experience</p>
        <div className={styles.testimonialGrid}>
          {testimonials.map((t) => (
            <div key={t.author} className={styles.testimonialCard}>
              <span className={styles.testimonialQuote}>"</span>
              <p className={styles.testimonialText}>{t.text}</p>
              <div className={styles.testimonialAuthor}>— {t.author}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.section} style={{ textAlign: 'center' }}>
        <h2 className={styles.sectionTitle}>Ready to Order Prasadam?</h2>
        <p className={styles.sectionSubtitle}>Let us serve Lord Jagannath's blessings at your next event</p>
        <Link to="/order" className={`${styles.ctaBtn} ${styles.ctaPrimary}`}>
          🙏 Place Your Order Now
        </Link>
      </section>
    </div>
  );
}
