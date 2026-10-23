import DailyGame from "./DailyGame";
import { pageMetadata } from "@/lib/platform/site";
export const metadata = pageMetadata(
  "Jelloo Daily Puzzle",
  "Play today's Jelloo puzzle and keep your daily streak. One shared puzzle each UTC day.",
  "/jelloo/daily",
  true,
);
export default function DailyPage() {
  return <DailyGame />;
}
