import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  it('shows its message and invokes the optional action', () => {
    const onAction = vi.fn()

    render(
      <EmptyState
        icon={<span aria-hidden="true">i</span>}
        title="No locations"
        description="Add a location to get started."
        actionLabel="Add location"
        onAction={onAction}
      />,
    )

    expect(screen.getByRole('heading', { name: 'No locations' })).toBeVisible()
    expect(screen.getByText('Add a location to get started.')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Add location' }))
    expect(onAction).toHaveBeenCalledOnce()
  })
})
