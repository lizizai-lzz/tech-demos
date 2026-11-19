import { useState } from "react"
import type { AppView } from "@/types"
import { AppShell } from "@/components/AppShell"
import { BoardView } from "@/views/BoardView"
import { CalendarView } from "@/views/CalendarView"
import { ConversionView } from "@/views/ConversionView"
import { EpisodeReviewView } from "@/views/EpisodeReviewView"
import { TrafficView } from "@/views/TrafficView"
import { ArchiveView } from "@/views/ArchiveView"

export default function App() {
  const [view, setView] = useState<AppView>("board")
  const [episodeId, setEpisodeId] = useState<string | null>(null)

  const openEpisode = (id: string) => {
    setEpisodeId(id)
  }

  const backFromReview = () => {
    setEpisodeId(null)
  }

  return (
    <AppShell view={view} onViewChange={setView}>
      {episodeId ? (
        <EpisodeReviewView episodeId={episodeId} onBack={backFromReview} />
      ) : (
        <>
          {view === "board" && <BoardView onOpenEpisode={openEpisode} />}
          {view === "traffic" && <TrafficView />}
          {view === "calendar" && <CalendarView onOpenEpisode={openEpisode} />}
          {view === "conversion" && <ConversionView />}
          {view === "archive" && <ArchiveView />}
        </>
      )}
    </AppShell>
  )
}