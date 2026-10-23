import { PlatformHeader } from "@/components/platform/Platform";
export default function JellooLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PlatformHeader compact />
      {children}
    </>
  );
}
