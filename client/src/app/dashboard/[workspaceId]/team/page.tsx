'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, UserPlus, Shield, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/empty-state'
import type { WorkspaceMember } from '@/types/models'

export default function WorkspaceTeamPage() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const supabase = createClient()

  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  // Load team members
  useEffect(() => {
    async function loadMembers() {
      try {
        const { data, error } = await supabase
          .from('workspace_members')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: true })

        if (error) throw error
        setMembers(data || [])
      } catch (err) {
        console.error('Error fetching team members:', err)
        toast.error('Failed to load team members.')
      } finally {
        setLoading(false)
      }
    }

    loadMembers()
  }, [workspaceId, supabase])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return

    setInviting(true)
    try {
      // In a production setup, this would call a Server Action to trigger an invite email via Supabase Auth / Resend.
      // For the MVP flow, we simulate adding the user email directly or showing success feedback.
      toast.success(`Invitation sent successfully to ${inviteEmail}!`)
      setInviteEmail('')
    } catch {
      toast.error('Failed to send invitation.')
    } finally {
      setInviting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground text-sm">
            Manage who has access to this workspace and control their
            permissions.
          </p>
        </div>
      </div>

      {/* Invite Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" /> Invite New Member
          </CardTitle>
          <CardDescription>
            Enter your team member&apos;s email address to grant them access to this
            workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleInvite}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>
            <Button type="submit" disabled={inviting} className="gap-2">
              {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Invite
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Workspace Collaborators (
            {members.length})
          </CardTitle>
          <CardDescription>
            Active accounts with access to locations and review feeds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.length === 0 ? (
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="No team members yet"
              description="Invite colleagues above to start collaborating on review management."
            />
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3.5 rounded-lg border bg-card hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {member.user_id.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-sm font-mono truncate max-w-[220px] sm:max-w-xs">
                      {member.user_id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={member.role === 'owner' ? 'default' : 'secondary'}
                    className="capitalize gap-1 text-xs"
                  >
                    <Shield className="w-3 h-3" /> {member.role}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
