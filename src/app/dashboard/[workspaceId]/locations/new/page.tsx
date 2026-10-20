'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

export default function NewLocationPage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const supabase = createClient()

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase.from('locations').insert({
        workspace_id: workspaceId,
        name: name.trim(),
        address: address.trim() || null,
      })

      if (insertError) throw insertError

      // Redirect back to locations list
      router.push(`/dashboard/${workspaceId}/locations`)
      router.refresh()
    } catch (err) {
      console.error('Error creating location:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create location. Please try again.',
      )
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4">
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href={`/dashboard/${workspaceId}/locations`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Locations
          </Link>
        </Button>

        <Card>
          <form onSubmit={handleCreateLocation}>
            <CardHeader>
              <div className="bg-primary/10 text-primary p-3 rounded-full w-fit mb-2">
                <MapPin className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">Add New Location</CardTitle>
              <CardDescription>
                Add a physical storefront or business branch to track reviews
                under this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Location Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Downtown Branch #4"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  placeholder="e.g. 123 Main Street, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding
                    location...
                  </>
                ) : (
                  'Save Location'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
