'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from 'react-i18next'

interface WorkspaceCardActionsProps {
  workspaceId: string
  workspaceName: string
  canManage: boolean
}

export default function WorkspaceCardActions({
  workspaceId,
  workspaceName,
  canManage,
}: WorkspaceCardActionsProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const supabase = createClient()

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [newName, setNewName] = useState(workspaceName)
  const [loading, setLoading] = useState(false)

  // Handle Rename
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setLoading(true)
    const { error } = await supabase
      .from('workspaces')
      .update({ name: newName.trim() })
      .eq('id', workspaceId)

    setLoading(false)
    if (error) {
      alert(`Error updating workspace: ${error.message}`)
    } else {
      setIsEditOpen(false)
      router.refresh()
    }
  }

  // Handle Cascade Delete (Workspaces -> Locations & Reviews via DB Foreign Keys or manual cleanup)
  const handleDelete = async () => {
    setLoading(true)

    // Note: If your foreign keys in Supabase have `ON DELETE CASCADE` set up on locations and reviews,
    // deleting the workspace record automatically cleans up everything.
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId)

    setLoading(false)
    if (error) {
      alert(`Error deleting workspace: ${error.message}`)
    } else {
      setIsDeleteOpen(false)
      router.refresh()
    }
  }

  if (!canManage) return null // Hide edit/delete options if user lacks permission

  return (
    <div className="flex items-center gap-2 pt-2">
      <Button
        variant="outline"
        size="sm"
        className="text-xs h-7 px-2.5"
        onClick={() => setIsEditOpen(true)}
      >
        <Pencil className="w-3 h-3 mr-1.5" /> {t('common.edit')}
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="text-xs h-7 px-2.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
        onClick={() => setIsDeleteOpen(true)}
      >
        <Trash2 className="w-3 h-3 mr-1.5" /> {t('common.delete')}
      </Button>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>{t('workspace.editTitle')}</DialogTitle>
              <DialogDescription>
                {t('workspace.updateDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('workspace.name')}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('workspace.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t('workspace.deleteConfirm')}
            </DialogTitle>
            <DialogDescription>
              {t('workspace.deleteWarning')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.delete')} {t('common.workspace')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
