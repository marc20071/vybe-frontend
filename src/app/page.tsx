
import { VideoFeed } from "@/components/feed/VideoFeed";
import { StoryBar } from "@/components/stories/StoryBar";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      <StoryBar />
      <VideoFeed />
    </div>
  );
}
