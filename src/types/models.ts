/** Public database row types based on the pulled Supabase schema snapshot. */
export type ReviewStatus = 'pending' | 'replied' | 'flagged'
export type WorkspaceRole = 'owner' | 'admin' | 'member'
export type TenantRole = 'owner' | 'manager' | 'staff'
export type Sentiment = 'positive' | 'neutral' | 'negative'

export interface Workspace {
  id: string
  name: string
  slug: string
  created_at: string
  business_type: string | null
  ai_replies_used_this_month: number | null
  ai_reply_limit: number | null
}

export interface Location {
  id: string
  workspace_id: string
  name: string
  google_place_id: string | null
  created_at: string
  address: string | null
  latitude: number | null
  longitude: number | null
  business_type: string | null
  last_synced_at: string | null
}

export interface Review {
  id: string
  workspace_id: string
  location_id: string
  rating: number
  author_name: string | null
  comment: string | null
  sentiment: Sentiment | null
  created_at: string
  ai_response: string | null
  status: ReviewStatus | null
  author_image: string | null
  author_url: string | null
  profile_photo_url: string | null
  review_date: string | null
  review_text: string | null
  source: string | null
  relative_time_description: string | null
  original_language: string | null
  author_id: string | null
  google_review_id: string | null
  ai_reply_draft: string | null
  reply_status: string | null
  locations?: Pick<Location, 'name'> | null
}

export interface AIReplyReview {
  id: string
  rating: number
  review_text: string
  author_name: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  created_at: string
}

export interface Tenant {
  id: string
  name: string
  stripe_customer_id: string | null
  subscription_status: string | null
  created_at: string | null
}

export interface TenantUser {
  id: string
  tenant_id: string
  user_id: string
  role: TenantRole | null
  created_at: string | null
}

export interface OperationalDigest {
  id: string
  tenant_id: string | null
  summary_bullet_points: unknown
  week_start_date: string
  created_at: string | null
}

export interface UserIntegration {
  id: string
  user_id: string
  provider: string
  access_token: string | null
  refresh_token: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface WorkspaceSummary extends Pick<Workspace, 'id' | 'name'> {
  role: WorkspaceRole
}

export interface WorkspaceMemberWithWorkspace {
  workspaces: Pick<Workspace, 'id' | 'name'> | null
}

export type HeaderLocation = Pick<Location, 'id' | 'name' | 'business_type'>

export interface GooglePlacesReview {
  rating: number
  time: number
  author_name?: string
  author_url?: string
  profile_photo_url?: string
  text?: string
  relative_time_description?: string
}

export interface GooglePlacesResponse {
  status: string
  error_message?: string
  result?: { reviews?: GooglePlacesReview[] }
}

export interface CreateWorkspaceResult {
  id: string
}

export type TeamMember = WorkspaceMember

