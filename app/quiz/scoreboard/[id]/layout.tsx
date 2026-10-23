import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Friendship Challenge Scoreboard | PlayNudge",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ScoreboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
