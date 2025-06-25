import { Toaster } from "@/components/ui/sonner";

export default function ShadcnDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
