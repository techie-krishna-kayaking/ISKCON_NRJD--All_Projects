import styles from './Input.module.css';

export function FormGroup({ children, className = '' }) {
  return <div className={`${styles.formGroup} ${className}`}>{children}</div>;
}

export function Label({ children, htmlFor, required }) {
  return (
    <label className={styles.label} htmlFor={htmlFor}>
      {children}{required && <span style={{ color: 'var(--color-error)' }}> *</span>}
    </label>
  );
}

export function Input({ error, hint, ...props }) {
  return (
    <>
      <input className={`${styles.input} ${error ? styles.error : ''}`} {...props} />
      {error && <div className={styles.errorText}>{error}</div>}
      {hint && !error && <div className={styles.hint}>{hint}</div>}
    </>
  );
}

export function Select({ children, error, ...props }) {
  return (
    <>
      <select className={`${styles.select} ${error ? styles.error : ''}`} {...props}>
        {children}
      </select>
      {error && <div className={styles.errorText}>{error}</div>}
    </>
  );
}

export function Textarea({ error, ...props }) {
  return (
    <>
      <textarea className={`${styles.textarea} ${error ? styles.error : ''}`} {...props} />
      {error && <div className={styles.errorText}>{error}</div>}
    </>
  );
}
