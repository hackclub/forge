import type { ProjectStatus, ProjectTier, SubmissionRequirement } from '@/types'

/** Field the review form flashes red when a submit is blocked. */
export type InvalidReviewField = 'conclusion' | 'technical' | 'feedback' | 'override' | 'checklist' | 'duplicate'

export interface ReviewChecklistItem {
  key: string
  label: string
  note: string | null
  doc: string | null
}

export interface RequirementsCheck {
  checked_at: string
  checked_by: string | null
  items: string[]
}

export interface AiCheckRequirement {
  name: string
  verdict: 'pass' | 'fail' | 'uncertain'
  reasoning: string
  source: string
}

export interface AiCheckResult {
  status?: 'queued' | 'running' | 'done' | 'error'
  summary?: string
  // 'error' is returned when the checker itself raises; see the rescue in
  // Admin::AirtableQueueController#check_justification.
  overall?: 'pass' | 'fail' | 'uncertain' | 'error'
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
  created_at_iso: string
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

export interface JournalDigestItem {
  id: number
  title: string
  entry_date: string | null
  hours: number
  chars: number
  has_image: boolean
  lapse_url: string | null
  written_on: string
  backfilled: boolean
  outlier: boolean
}

export interface JournalDigestWeek {
  week_of: string
  label: string
  entries: number
  hours: number
  with_images: number
  lapse_urls: string[]
  items: JournalDigestItem[]
}

export interface JournalDigestSignal {
  code: string
  level: 'warn' | 'info'
  headline: string
  why: string
  entry_ids: number[]
}

export interface JournalDigest {
  entry_count: number
  total_hours: number
  first_entry_on?: string | null
  last_entry_on?: string | null
  span_days: number
  with_images: number
  with_lapse: number
  weeks: JournalDigestWeek[]
  signals: JournalDigestSignal[]
}

export interface DuplicateScanUnifiedRow {
  record_id: string
  record_url: string
  program: string
  status: string | null
  hours: string | number | null
  submitter: string | null
  email: string | null
  code_url: string | null
  created_at: string | null
  duplicate_justification: string | null
}

export interface DuplicateScanForgeRow {
  id: number
  name: string
  status: string
  build_review: boolean
  owner: string | null
  same_owner: boolean
  approved_at: string | null
  path: string
}

export interface DuplicateScan {
  slug: string | null
  forge: DuplicateScanForgeRow[]
  unified: DuplicateScanUnifiedRow[]
  macondo: { id: string; title: string | null; shipped: boolean }[]
  unified_available: boolean
  unified_error: boolean
  verdict: 'clear' | 'review' | 'blocked'
  reason?: string
  scanned_at: string
}

export interface JustificationGuide {
  anatomy: { part: string; detail: string }[]
  examples: { key: string; text: string; fine: string; why: string; fixed: string }[]
  journal_only: boolean
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
  uses_ai: boolean
  ai_usage: string | null
  git_journal_url: string | null
  build_proof_url: string | null
  submission_requirements: SubmissionRequirement[]
  review_checklist: ReviewChecklistItem[]
  requirements_check: RequirementsCheck | null
  tags: string[]
  status: ProjectStatus
  tier: ProjectTier
  review_tier: ProjectTier
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
  journal_digest: JournalDigest
  duplicate_scan: DuplicateScan
  justification_guide: JustificationGuide
  self_review: boolean
}

export interface ReviewSession {
  id: number
  active_seconds: number
  started_at: string
  heartbeat_path: string
  release_path: string
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
