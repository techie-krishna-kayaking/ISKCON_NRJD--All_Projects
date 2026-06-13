import styles from './Badge.module.css';

export default function Badge({ status, label, className = '' }) {
  const text = label || status?.replace(/_/g, ' ');
  return (
    <span className={`${styles.badge} ${styles[status] || ''} ${className}`}>
      {text}
    </span>
  );
}
