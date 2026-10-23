import { PlatformHeader } from "@/components/platform/Platform";
// Preserve the existing dynamic challenge metadata contract without double branding.
export const metadata = { title: { default: "Friendship Quiz | PlayNudge", template: "%s" } };
export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PlatformHeader compact preserveSession />
      {children}
    </>
  );
}
