import ZenGame from "./ZenGame";
import { pageMetadata } from "@/lib/platform/site";
export const metadata = pageMetadata(
  "Jelloo Zen Mode",
  "Relax with Jelloo path puzzles, no move limit and a choice of world atmosphere.",
  "/jelloo/zen",
  true,
);
export default function ZenPage() {
  return <ZenGame />;
}
