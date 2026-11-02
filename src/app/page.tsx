
import { VideoFeed } from "@/components/feed/VideoFeed";
import { StoryBar } from "@/components/stories/StoryBar";

export default function HomePage() {
  return (
    <div className="page-wrap home-page">
      <StoryBar />
      <VideoFeed />
    </div>
  );
}
