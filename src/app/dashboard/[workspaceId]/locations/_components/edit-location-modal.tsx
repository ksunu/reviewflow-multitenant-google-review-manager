'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateLocationAction } from '@/app/actions/locations'
import { Loader2 } from 'lucide-react'
import type { Location } from '@/types/models'
import { useTranslation } from 'react-i18next'

export default function EditLocationModal({
  workspaceId,
  location,
  isOpen,
  onClose,
  onUpdated,
}: {
  workspaceId: string
  location: Location | null
  isOpen: boolean
  onClose: () => void
  onUpdated: (updatedLocation: Location) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(location?.name ?? '')
  const [address, setAddress] = useState(location?.address ?? '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!location) return

    setLoading(true)
    const res = await updateLocationAction(location.id, workspaceId, {
      name,
      address,
    })
    setLoading(false)

    if (res.success) {
      onUpdated({ ...location, name, address })
      onClose()
    } else {
      alert(`Failed to update location: ${res.error}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('locations.editTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t('locations.name')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">{t('locations.address')}</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
