import type { ProjectStatus, ProjectTier, SubmissionRequirement } from '@/types'

export interface AiCheckRequirement {
  name: string
  verdict: 'pass' | 'fail' | 'uncertain'
  reasoning: string
  source: string
}

export interface AiCheckResult {
  status?: 'queued' | 'running' | 'done' | 'error'
  summary?: string
  overall?: 'pass' | 'fail' | 'uncertain'
  requirements?: AiCheckRequirement[]
  checked_at?: string
  model?: string
  provider?: string
  message?: string
}

export interface ReviewMember {
  user_id: number
  display_name: string
  avatar: string
  slack_id: string | null
  is_owner: boolean
  devlog_hours: number
  approved_hours: number | null
  projected_coins: number | null
  streak_multiplier: number | null
  guild_multiplier: number | null
}

export interface ReviewDevlog {
  id: number
  title: string
  content: string
  time_spent: string | null
  time_hours: number | null
  lapse_url: string | null
  created_at: string
  user_id: number
  user_display_name: string
  user_avatar: string
  meets_requirements: boolean
  validation: { content_length: number; has_image: boolean }
}

export interface SiblingReview {
  id: number
  kind: 'design' | 'build'
  name: string
  status: ProjectStatus
  pending: boolean
  reviewed_at: string | null
  reviewer_name: string | null
}

export interface ReviewShip {
  id: number
  status: string
  demo_link: string | null
  repo_link: string | null
  created_at: string
}

export interface ReviewNote {
  id: number
  content: string
  author_id: number
  author_name: string
  author_avatar: string
  edited: boolean
  created_at: string
}

export interface ReviewProject {
  id: number
  name: string
  subtitle: string | null
  description: string | null
  red_flags: string[]
  green_flags: string[]
  repo_link: string | null
  commits_url: string | null
  devlog_mode: 'website' | 'git' | null
  git_journal_url: string | null
  build_proof_url: string | null
  submission_requirements: SubmissionRequirement[]
  tags: string[]
  status: ProjectStatus
  tier: ProjectTier
  budget: string | null
  build_review: boolean
  linked_project: { id: number; name: string } | null
  coin_rate: number
  total_hours: number
  devlog_hours: number
  override_hours: number | null
  override_hours_justification: string | null
  cover_image_url: string | null
  pitch_text: string | null
  readme_cache: string | null
  readme_fetched_at: string | null
  ai_check_result: AiCheckResult | null
  ai_check_ran_at: string | null
  reviewed_at: string | null
  reviewer_display_name: string | null
  review_feedback: string | null
  from_slack: boolean
  slack_url: string | null
  created_at: string
  created_at_iso: string
  user_id: number
  user_display_name: string
  user_email: string
  user_slack_id: string | null
  user_avatar: string
  coins_earned_preview: number
  is_group_project: boolean
  members: ReviewMember[]
  devlogs: ReviewDevlog[]
  sibling: SiblingReview | null
  ships: ReviewShip[]
  flagged_for_review: boolean
  flag_reason: string | null
  flagged_by_name: string | null
}

export interface ReviewSession {
  id: number
  active_seconds: number
  started_at: string
  heartbeat_path: string
}

export interface SessionStats {
  sessions: {
    id: number
    reviewer_name: string
    active_seconds: number
    started_at: string
    ended_at: string | null
    decision: string | null
  }[]
  total_active_seconds: number
}

export interface Reviewer {
  id: number
  display_name: string
  email: string
  is_superadmin: boolean
  slack_id: string | null
}

export interface ConcurrentReviewer {
  reviewer_name: string
  reviewer_avatar: string
  started_at: string
  last_heartbeat_at: string | null
}
