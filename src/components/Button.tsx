import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const buttonClass = [
    styles.button,
    variant === 'secondary' ? styles.secondary : styles.primary,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
}
