export interface User {
  id: number
  display_name: string
  email: string
  avatar: string
  roles: string[]
  is_admin: boolean
  is_staff: boolean
  is_banned: boolean
}

export type FlashData = Record<string, string>

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
  hcb_grant_link: string | null
  review_feedback: string | null
  tier: 'normal' | 'advanced'
  from_slack: boolean
  cover_image_url: string | null
  user_display_name: string
  user_has_address: boolean
  user_address: UserAddress | null
  created_at: string
}

export type ProjectTier = 'normal' | 'advanced'

export interface ProjectForm {
  id?: number
  name: string
  subtitle: string
  repo_link: string
  tags: string[]
  tier: ProjectTier
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
  is_discarded: boolean
  discarded_at: string | null
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
  hcb_grant_link: string | null
  from_slack: boolean
  slack_url: string | null
  tier: 'normal' | 'advanced'
  budget: string | null
  cover_image_url: string | null
  override_hours: number | null
  override_hours_justification: string | null
  readme_cache: string | null
  readme_fetched_at: string | null
  total_hours: number
  devlogs: AdminDevlog[]
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
