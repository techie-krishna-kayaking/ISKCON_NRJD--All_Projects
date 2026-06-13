import styles from './Card.module.css';

export function Card({ children, className = '', ...props }) {
  return <div className={`${styles.card} ${className}`} {...props}>{children}</div>;
}

export function CardHeader({ children, className = '' }) {
  return <div className={`${styles.cardHeader} ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`${styles.cardBody} ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`${styles.cardFooter} ${className}`}>{children}</div>;
}
