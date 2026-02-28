import type { PropsWithChildren } from "react";
import styles from "./ControlContainer.module.css";

interface PropTypes {
  title: string;
}

const ControlContainer = ({
  title,
  children,
}: PropsWithChildren<PropTypes>) => {
  return (
    <div className={styles.container}>
      <strong className={styles.controlTitle}>{title}</strong>
      <div className={styles.control}>{children}</div>
    </div>
  );
};

export default ControlContainer;
