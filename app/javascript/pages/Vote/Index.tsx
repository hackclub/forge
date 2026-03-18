import { Head, router } from '@inertiajs/react'

interface VoteProject {
  id: number
  name: string
  description: string | null
  tags: string[]
  user_display_name: string
  user_avatar: string
  demo_link: string | null
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
    <div className="border border-yellow-800/20 bg-yellow-950/10 relative group flex flex-col">
      {/* Corner brackets */}
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-yellow-700/30" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-yellow-700/30" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-yellow-700/30" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-yellow-700/30" />

      <div className="p-6 flex-1">
        {/* Side label */}
        <p className="text-yellow-700/30 text-[10px] uppercase tracking-[0.4em] font-bold mb-4">
          {side === 'left' ? 'Project A' : 'Project B'}
        </p>

        {/* User */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={project.user_avatar}
            alt={project.user_display_name}
            className="w-8 h-8 border border-yellow-800/30"
          />
          <span className="text-yellow-100/30 text-xs">{project.user_display_name}</span>
        </div>

        {/* Project name */}
        <h2 className="text-xl font-black text-yellow-100/90 tracking-tight mb-3">{project.name}</h2>

        {/* Description */}
        {project.description && (
          <p className="text-yellow-100/25 text-sm leading-relaxed mb-4">{project.description}</p>
        )}

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {project.tags.map((tag) => (
              <span key={tag} className="text-[10px] uppercase tracking-wider text-yellow-600/50 border border-yellow-800/20 px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Links */}
        {(isSafeUrl(project.demo_link) || isSafeUrl(project.repo_link)) && (
          <div className="flex gap-4 text-xs">
            {isSafeUrl(project.demo_link) && (
              <a
                href={project.demo_link!}
                target="_blank"
                rel="noopener"
                className="text-yellow-500/50 hover:text-yellow-400 uppercase tracking-wider transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Demo
              </a>
            )}
            {isSafeUrl(project.repo_link) && (
              <a
                href={project.repo_link!}
                target="_blank"
                rel="noopener"
                className="text-yellow-500/50 hover:text-yellow-400 uppercase tracking-wider transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Repo
              </a>
            )}
          </div>
        )}
      </div>

      {/* Vote button */}
      <div className="p-4 border-t border-yellow-800/15">
        <button
          onClick={onVote}
          className="w-full relative bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-[#1a1200] font-black py-3 text-sm uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(180,130,20,0.1)] hover:shadow-[0_0_30px_rgba(180,130,20,0.25)] border border-yellow-500/30"
        >
          <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-yellow-400/50" />
          <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-yellow-400/50" />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-yellow-400/50" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-yellow-400/50" />
          <span className="relative z-10">Vote for This</span>
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
      <Head title="Vote — Quarry" />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <p className="text-yellow-700/60 text-[10px] uppercase tracking-[0.4em] font-bold mb-2">The Pit</p>
          <h1 className="text-3xl font-black text-yellow-100/90 tracking-tight mb-2">Vote</h1>
        </div>

        {matchup ? (
          <>
            <div className="grid sm:grid-cols-2 gap-6">
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

            {/* VS divider for mobile */}
            <div className="sm:hidden flex items-center justify-center -mt-3 -mb-3 relative z-10">
              <div className="w-10 h-10 border border-yellow-800/40 bg-[#0e0c09] flex items-center justify-center rotate-45">
                <span className="text-yellow-600/60 text-xs font-black -rotate-45">VS</span>
              </div>
            </div>

            {/* Skip */}
            <div className="text-center mt-8">
              <button
                onClick={() => router.get('/vote')}
                className="text-yellow-100/15 hover:text-yellow-100/30 text-xs uppercase tracking-wider font-bold transition-colors"
              >
                Skip this matchup
              </button>
            </div>
          </>
        ) : (
          <div className="border border-yellow-800/20 bg-yellow-950/10 p-12 text-center">
            <p className="text-yellow-100/30 text-lg font-bold mb-2">No matchups available</p>
            <p className="text-yellow-100/15 text-sm">There aren't enough projects to vote on yet. Check back later.</p>
          </div>
        )}
      </div>
    </>
  )
}
