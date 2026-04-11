export interface User {
  id: number
  display_name: string
  email: string
  avatar: string
  roles: string[]
  is_admin: boolean
  is_staff: boolean
  is_superadmin: boolean
  is_banned: boolean
}

export type FlashData = Record<string, string>

export interface NewsPostSummary {
  id: number
  title: string
  body: string
  published_at: string
  author_name: string
}

export interface SharedProps {
  auth: { user: User | null }
  flash: FlashData
  sign_in_path: string
  sign_out_path: string
  errors: Record<string, string[]>
  [key: string]: unknown
}

export interface PagyProps {
  count: number
  page: number
  limit: number
  pages: number
  next: number | null
  prev: number | null
}

export type ProjectStatus = 'draft' | 'pending' | 'approved' | 'returned' | 'rejected' | 'build_pending' | 'build_approved'

export interface ProjectCard {
  id: number
  name: string
  subtitle: string | null
  status: ProjectStatus
  user_display_name: string
  ships_count: number
}

export interface UserAddress {
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
}

export interface ProjectDetail {
  id: number
  name: string
  subtitle: string | null
  tags: string[]
  repo_link: string | null
  status: ProjectStatus
  devlog_mode: 'website' | 'git' | null
  review_feedback: string | null
  tier: ProjectTier
  from_slack: boolean
  cover_image_url: string | null
  built_at: string | null
  build_proof_url: string | null
  user_id: number
  user_display_name: string
  user_has_address: boolean
  user_address: UserAddress | null
  created_at: string
}

export type ProjectTier = 'tier_1' | 'tier_2' | 'tier_3' | 'tier_4'

export interface ProjectForm {
  id?: number
  name: string
  subtitle: string
  repo_link: string
  tags: string[]
  tier: ProjectTier
  devlog_mode?: string | null
}

export interface AdminUserRow {
  id: number
  display_name: string
  email: string
  roles: string[]
  projects_count: number
  is_banned: boolean
  is_discarded: boolean
  created_at: string
}

export interface AdminUserDetail {
  id: number
  display_name: string
  email: string
  avatar: string
  roles: string[]
  permissions: string[]
  timezone: string
  is_banned: boolean
  ban_reason: string | null
  is_beta_approved: boolean
  shop_unlocked: boolean
  referral_code: string | null
  is_discarded: boolean
  discarded_at: string | null
  created_at: string
}

export interface HackatimeInfo {
  username: string
  trust_level: string
  suspected: boolean
  banned: boolean
  total_coding_time: number | null
  days_active: number | null
  last_heartbeat_at: string | null
}

export interface UserNote {
  id: number
  content: string
  author_name: string
  author_avatar: string
  created_at: string
}

export interface KudoEntry {
  id: number
  content: string
  author_name: string
  author_avatar: string
  created_at: string
}

export interface AdminProjectRow {
  id: number
  name: string
  status: ProjectStatus
  user_id: number
  user_display_name: string
  ships_count: number
  is_discarded: boolean
  created_at: string
}

export interface AdminDevlog {
  id: number
  title: string
  content: string
  time_spent: string | null
  created_at: string
}

export interface AdminProjectDetail {
  id: number
  name: string
  subtitle: string | null
  description: string | null
  repo_link: string | null
  tags: string[]
  status: ProjectStatus
  review_feedback: string | null
  reviewed_at: string | null
  reviewer_display_name: string | null
  pitch_text: string | null
  from_slack: boolean
  slack_url: string | null
  tier: ProjectTier
  budget: string | null
  cover_image_url: string | null
  override_hours: number | null
  override_hours_justification: string | null
  readme_cache: string | null
  readme_fetched_at: string | null
  total_hours: number
  devlogs: AdminDevlog[]
  hidden: boolean
  staff_pick: boolean
  is_discarded: boolean
  discarded_at: string | null
  user_id: number
  user_display_name: string
  user_email: string
  user_has_address: boolean
  created_at: string
}

export interface AdminShipRow {
  id: number
  project_name: string
  user_display_name: string
  status: string
  reviewer_display_name: string | null
  created_at: string
}

export interface AdminShipDetail {
  id: number
  status: string
  reviewer_display_name: string | null
  approved_seconds: number | null
  feedback: string | null
  justification: string | null
  frozen_demo_link: string | null
  frozen_repo_link: string | null
  project_name: string
  user_display_name: string
  created_at: string
}

export interface ShipForm {
  id: number
  status: string
  feedback: string
  justification: string
  approved_seconds: number | null
  project_name: string
  user_display_name: string
}

export type SupportTicketStatus = 'open' | 'claimed' | 'resolved'

export interface AdminSupportTicketRow {
  id: number
  slack_display_name: string
  slack_avatar_url: string | null
  original_text: string
  status: SupportTicketStatus
  claimed_by_name: string | null
  resolved_by_name: string | null
  slack_thread_url: string
  bts_thread_url: string | null
  created_at: string
  resolved_at: string | null
}

export interface SupportLeaderboardEntry {
  name: string
  count: number
}

export interface SupportThreadMessage {
  text: string
  user: string
  display_name: string
  avatar_url: string | null
  ts: string
  is_bot: boolean
  created_at: string
}
