import { Head, router } from '@inertiajs/react'

interface VoteProject {
  id: number
  name: string
  description: string | null
  user_display_name: string
  user_avatar: string
  repo_link: string | null
}

interface Matchup {
  project_a: VoteProject
  project_b: VoteProject
}

function isSafeUrl(url: string | null): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function ProjectCard({
  project,
  onVote,
  side,
}: {
  project: VoteProject
  onVote: () => void
  side: 'left' | 'right'
}) {
  return (
    <div className="bg-[#1c1b1b] rounded-xl ghost-border flex flex-col group hover:bg-[#2a2a2a] transition-all duration-300">
      <div className="p-8 flex-1">
        <p className="text-stone-600 text-[10px] uppercase tracking-[0.3em] font-bold mb-6">
          {side === 'left' ? 'Project A' : 'Project B'}
        </p>

        <div className="flex items-center gap-3 mb-6">
          <img
            src={project.user_avatar}
            alt={project.user_display_name}
            className="w-8 h-8 rounded-full border border-white/10"
          />
          <span className="text-xs text-stone-400">{project.user_display_name}</span>
        </div>

        <h2 className="text-2xl font-headline font-bold text-white mb-3 group-hover:text-[#ffb595] transition-colors">
          {project.name}
        </h2>

        {project.description && (
          <p className="text-stone-500 text-sm leading-relaxed mb-4">{project.description}</p>
        )}


        {isSafeUrl(project.repo_link) && (
          <a
            href={project.repo_link!}
            target="_blank"
            rel="noopener"
            className="text-xs font-bold uppercase tracking-widest text-[#ffb595] flex items-center gap-1 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            View Repo
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </a>
        )}
      </div>

      <div className="p-6 border-t border-white/5">
        <button
          onClick={onVote}
          className="w-full signature-smolder text-[#4c1a00] font-headline font-bold py-3 rounded-lg uppercase tracking-wider active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">how_to_vote</span>
          Vote for This
        </button>
      </div>
    </div>
  )
}

export default function VoteIndex({ matchup }: { matchup: Matchup | null }) {
  function castVote(winnerId: number, loserId: number) {
    router.post('/vote', { winner_id: winnerId, loser_id: loserId })
  }

  return (
    <>
      <Head title="Vote - Forge" />
      <div className="p-5 md:p-12 max-w-[1400px] mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-headline font-medium tracking-tight mb-4">
            The <span className="text-[#ffb595]">Arena</span>
          </h1>
          <p className="text-stone-400 text-lg max-w-lg mx-auto">
            Vote on which project you think is better. Your votes shape the leaderboard and funding rates.
          </p>
        </div>

        {matchup ? (
          <>
            <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <ProjectCard
                project={matchup.project_a}
                side="left"
                onVote={() => castVote(matchup.project_a.id, matchup.project_b.id)}
              />
              <ProjectCard
                project={matchup.project_b}
                side="right"
                onVote={() => castVote(matchup.project_b.id, matchup.project_a.id)}
              />
            </div>

            <div className="text-center mt-10">
              <button
                onClick={() => router.get('/vote')}
                className="text-stone-600 hover:text-stone-400 text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 mx-auto"
              >
                <span className="material-symbols-outlined text-sm">skip_next</span>
                Skip this matchup
              </button>
            </div>
          </>
        ) : (
          <div className="bg-[#1c1b1b] rounded-xl ghost-border p-16 text-center max-w-2xl mx-auto">
            <span className="material-symbols-outlined text-5xl text-stone-700 mb-4">how_to_vote</span>
            <p className="text-stone-300 text-lg font-headline font-medium mb-2">No matchups available</p>
            <p className="text-stone-500 text-sm">There aren't enough projects to vote on yet. Check back later.</p>
          </div>
        )}
      </div>
    </>
  )
}
