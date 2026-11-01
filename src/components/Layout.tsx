import type { ReactNode } from 'react';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#journey-content">
        Skip to application
      </a>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="NobleOak home">
          <span className={styles.brandMark} aria-hidden="true">
            N
          </span>
          <span>NobleOak</span>
        </a>
        <span className={styles.headerCaption}>Life insurance quote</span>
      </header>
      <main className={styles.content} id="journey-content">
        {children}
      </main>
      <footer className={styles.footer}>
        <span>Helping you protect what matters.</span>
        <span>Secure online application</span>
      </footer>
    </div>
  );
}
