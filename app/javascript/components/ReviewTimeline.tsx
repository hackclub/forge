import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export interface ReviewEvent {
  id: number
  action: string
  stage: string | null
  feedback: string | null
  reviewer_display_name: string | null
  reviewer_avatar: string | null
  target_type: string | null
  target_label: string | null
  created_at: string
}

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  'project.pitch_approved': { label: 'Pitch Approved', color: 'text-emerald-400', icon: 'check_circle' },
  'project.approved': { label: 'Project Approved', color: 'text-emerald-400', icon: 'verified' },
  'project.returned': { label: 'Returned for Changes', color: 'text-orange-400', icon: 'undo' },
  'project.rejected': { label: 'Rejected', color: 'text-red-400', icon: 'cancel' },
  'project.reverted_to_draft': { label: 'Reverted to Draft', color: 'text-stone-400', icon: 'edit_note' },
  'project.build_approved': { label: 'Build Approved', color: 'text-emerald-400', icon: 'verified' },
  'project.build_returned': { label: 'Build Returned', color: 'text-orange-400', icon: 'undo' },
  'project.build_rejected': { label: 'Build Rejected', color: 'text-red-400', icon: 'cancel' },
  'devlog.approved': { label: 'Devlog Approved', color: 'text-emerald-400', icon: 'check_circle' },
  'devlog.returned': { label: 'Devlog Returned', color: 'text-orange-400', icon: 'undo' },
}

export default function ReviewTimeline({ events }: { events: ReviewEvent[] }) {
  if (!events.length) return null

  return (
    <section className="mb-12">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 font-headline mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">history</span>
        Review Timeline
      </h2>
      <ol className="space-y-3">
        {events.map((event) => {
          const cfg = ACTION_CONFIG[event.action] || { label: event.action, color: 'text-stone-400', icon: 'info' }
          return (
            <li key={event.id} className="ghost-border bg-[#1c1b1b] p-5">
              <div className="flex items-start gap-3">
                <span className={`material-symbols-outlined text-lg ${cfg.color} shrink-0 mt-0.5`}>{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-bold uppercase tracking-[0.15em] ${cfg.color}`}>{cfg.label}</span>
                    {event.target_type === 'Devlog' && event.target_label && (
                      <span className="text-stone-500 text-xs">· {event.target_label}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.15em] text-stone-600 mb-3">
                    {event.reviewer_avatar && (
                      <img src={event.reviewer_avatar} alt={event.reviewer_display_name || ''} className="w-4 h-4 border border-white/10" />
                    )}
                    <span>{event.reviewer_display_name || 'System'}</span>
                    <span>·</span>
                    <span>{event.created_at}</span>
                  </div>
                  {event.feedback && (
                    <div className="prose prose-invert prose-sm max-w-none text-stone-300 prose-a:text-[#ffb595] break-words [overflow-wrap:anywhere]">
                      <Markdown remarkPlugins={[remarkGfm]}>{event.feedback}</Markdown>
                    </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
