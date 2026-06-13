import styles from './LoadingEmpty.module.css';

export function Loading() {
  return (
    <div className={styles.spinner} role="status" aria-label="Loading">
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
    </div>
  );
}

export function Empty({ icon = '📭', message = 'No data found' }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div className={styles.emptyText}>{message}</div>
    </div>
  );
}
