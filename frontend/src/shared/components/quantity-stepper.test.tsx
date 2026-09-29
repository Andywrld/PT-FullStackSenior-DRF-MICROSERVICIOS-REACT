import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { QuantityStepper } from './quantity-stepper'

describe('QuantityStepper', () => {
  it('turns the minus button into "remove" at the minimum when removal is allowed', async () => {
    const onRemove = vi.fn()
    render(<QuantityStepper value={1} max={5} onChange={vi.fn()} onRemove={onRemove} />)

    await userEvent.click(screen.getByRole('button', { name: 'Quitar del carrito' }))

    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('cannot go below 1 or above the available stock', () => {
    const { rerender } = render(<QuantityStepper value={1} max={5} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Disminuir cantidad' })).toBeDisabled()

    rerender(<QuantityStepper value={5} max={5} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Aumentar cantidad' })).toBeDisabled()
  })
})
