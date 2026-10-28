import JellooHeader from "./JellooHeader";
export default function JellooLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JellooHeader />
      {children}
    </>
  );
}
