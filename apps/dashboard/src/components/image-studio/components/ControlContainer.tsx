import type { PropsWithChildren } from "react";

interface PropTypes {
  title: string;
}

const ControlContainer = ({
  title,
  children,
}: PropsWithChildren<PropTypes>) => {
  return (
    <div className="flex flex-col gap-1.5">
      <strong className="cursor-default whitespace-nowrap font-medium text-muted-foreground text-xs leading-3.5">
        {title}
      </strong>
      <div className="flex h-6 items-center">{children}</div>
    </div>
  );
};

export default ControlContainer;
