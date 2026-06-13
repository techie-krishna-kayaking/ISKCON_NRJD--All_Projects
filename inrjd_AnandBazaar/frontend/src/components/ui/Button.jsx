import styles from './Button.module.css';

export default function Button({
  children, variant = 'primary', size = '', className = '',
  loading = false, disabled = false, ...props
}) {
  const classes = [
    styles.btn,
    styles[`btn-${variant}`],
    size && styles[`btn-${size}`],
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <span className={styles.spinner} aria-hidden="true">⟳</span>}
      {children}
    </button>
  );
}
