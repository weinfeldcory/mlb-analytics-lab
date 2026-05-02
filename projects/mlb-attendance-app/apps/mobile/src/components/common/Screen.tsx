import { ReactNode } from "react";
import { AppShell } from "./AppShell";

interface ScreenProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  scrollable?: boolean;
}

export function Screen({ title, subtitle, children, scrollable = true }: ScreenProps) {
  return (
    <AppShell title={title} subtitle={subtitle} scrollable={scrollable}>
      {children}
    </AppShell>
  );
}
