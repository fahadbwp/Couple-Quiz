import { pageMetadata } from "@/lib/platform/site";
export const metadata = pageMetadata(
  "Create Your Friendship Quiz",
  "Answer ten questions about yourself, then share your Friendship Quiz with friends. Keep your creator PIN private to manage your quiz.",
  "/quiz/create",
);
export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
