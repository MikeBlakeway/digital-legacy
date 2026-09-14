import type { ReactNode } from "react";

import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";

export default function AuthenticatedAppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <>
      {children}
      <PwaInstallPrompt />
    </>
  );
}
