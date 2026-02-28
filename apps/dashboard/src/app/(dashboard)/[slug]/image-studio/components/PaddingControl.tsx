"use client";

import classNames from "classnames";
import { useAtom } from "jotai";
import { isPadding, PADDING_OPTIONS, paddingAtom } from "../store/padding";
import ControlContainer from "./ControlContainer";
import styles from "./PaddingControl.module.css";

const PaddingControl = () => {
  const [padding, setPadding] = useAtom(paddingAtom);

  return (
    <ControlContainer title="Padding">
      <div
        aria-label="Frame Padding"
        className={styles.toggleGroup}
        role="group"
      >
        {PADDING_OPTIONS.map((paddingOption) => (
          <button
            aria-pressed={padding === paddingOption}
            className={classNames(
              styles.toggleGroupItem,
              padding === paddingOption && styles.active
            )}
            key={paddingOption}
            onClick={() => {
              if (isPadding(paddingOption)) {
                setPadding(paddingOption);
              }
            }}
            type="button"
          >
            {paddingOption}
          </button>
        ))}
      </div>
    </ControlContainer>
  );
};

export default PaddingControl;
