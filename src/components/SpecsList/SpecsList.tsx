import type { PhoneDetail } from '../../models/phone';
import styles from './SpecsList.module.css';

interface SpecsListProps {
  phone: PhoneDetail;
}

/**
 * Technical specifications as a label/value list (Figma "SPECIFICATIONS").
 * Rendered as a definition list: pairs of terms and descriptions.
 */
export function SpecsList({ phone }: SpecsListProps) {
  const entries: Array<[term: string, description: string]> = [
    ['Screen', phone.specs.screen],
    ['Resolution', phone.specs.resolution],
    ['Processor', phone.specs.processor],
    ['Main camera', phone.specs.mainCamera],
    ['Selfie camera', phone.specs.selfieCamera],
    ['Battery', phone.specs.battery],
    ['OS', phone.specs.os],
    ['Screen refresh rate', phone.specs.screenRefreshRate],
  ];

  return (
    <section className={styles.section} aria-labelledby="specs-heading">
      <h2 id="specs-heading" className={styles.heading}>
        Specifications
      </h2>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt className={styles.term}>Brand</dt>
          <dd className={styles.description}>{phone.brand}</dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.term}>Name</dt>
          <dd className={styles.description}>{phone.name}</dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.term}>Description</dt>
          <dd className={styles.description}>{phone.description}</dd>
        </div>
        {entries.map(([term, description]) => (
          <div key={term} className={styles.row}>
            <dt className={styles.term}>{term}</dt>
            <dd className={styles.description}>{description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
