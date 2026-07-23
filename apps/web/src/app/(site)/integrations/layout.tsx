import type { IntegrationsLayoutProps } from "@/types/integrations";

export default function IntegrationsLayout({
  children,
  modal,
}: IntegrationsLayoutProps) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
