import Homepage from "@/components/quiz-home/Homepage";
import { HomepageJsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/platform/site";
export const metadata = pageMetadata(
  "Friendship Quiz — How Well Do Your Friends Know You?",
  "Create a free ten-question quiz about you. Share your link with friends, let them play, and compare scores on your Friendship Quiz leaderboard.",
  "/quiz",
);
export default function QuizLandingPage() {
  return (
    <>
      <HomepageJsonLd />
      <Homepage />
    </>
  );
}
