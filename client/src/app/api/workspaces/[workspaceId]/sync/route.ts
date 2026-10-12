import { NextResponse } from 'next/server'
import { getWorkspaceAuthorization } from '@/lib/supabase/authorization'

const SAMPLE_REVIEWERS = [
  {
    name: 'Sarah Jenkins',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
  },
  {
    name: 'Marcus Chen',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
  },
  {
    name: 'Elena Rostova',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
  },
  {
    name: 'David Miller',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
  },
  {
    name: 'Chloe Vance',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
  },
]

const SAMPLE_COMMENTS = [
  {
    rating: 5,
    text: 'Absolutely stellar service! The team went above and beyond to help me out. Will definitely be returning.',
  },
  {
    rating: 4,
    text: 'Great experience overall. Clean store environment and friendly staff, though wait times were a little long.',
  },
  {
    rating: 1,
    text: 'Very disappointed with my recent visit. Ordered online and the product was defective upon arrival with no support.',
  },
  {
    rating: 3,
    text: 'Decent location with standard offerings. Nothing extraordinary, but gets the job done.',
  },
  {
    rating: 5,
    text: 'Best customer support I have encountered in a long time. Fast, efficient, and courteous!',
  },
]

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const { workspaceId } = await params
    const access = await getWorkspaceAuthorization(workspaceId)
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.status === 401 ? 'Unauthorized' : 'Forbidden' },
        { status: access.status },
      )
    }
    const { supabase } = access

    // 1. Fetch locations for this workspace
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id')
      .eq('workspace_id', workspaceId)

    if (locError || !locations || locations.length === 0) {
      return NextResponse.json(
        {
          error: 'No locations found in this workspace. Add a location first.',
        },
        { status: 400 },
      )
    }

    // 2. Pick a random location and sample review
    const randomLocation =
      locations[Math.floor(Math.random() * locations.length)]
    const randomReviewer =
      SAMPLE_REVIEWERS[Math.floor(Math.random() * SAMPLE_REVIEWERS.length)]
    const randomContent =
      SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)]

    // 3. Insert simulated incoming review using existing table columns
    const { data: newReview, error: insertError } = await supabase
      .from('reviews')
      .insert({
        workspace_id: workspaceId,
        location_id: randomLocation.id,
        author_name: randomReviewer.name,
        rating: randomContent.rating,
        review_text: randomContent.text,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ success: true, review: newReview })
  } catch (err: any) {
    console.error('Sync error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to sync reviews' },
      { status: 500 },
    )
  }
}
