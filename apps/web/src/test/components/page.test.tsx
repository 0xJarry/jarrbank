import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from '../../app/page'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('Hello There JarrBank')
  })

  it('renders the description', () => {
    render(<Home />)
    
    const description = screen.getByText('Professional multi-chain DeFi portfolio management platform')
    expect(description).toBeInTheDocument()
  })

  it('renders all feature cards', () => {
    render(<Home />)
    
    expect(screen.getByText('Portfolio')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('LP Tracking')).toBeInTheDocument()
    expect(screen.getByText('Automation')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<Home />)
    
    const getStartedButton = screen.getByRole('button', { name: /get started/i })
    const learnMoreButton = screen.getByRole('button', { name: /learn more/i })
    
    expect(getStartedButton).toBeInTheDocument()
    expect(learnMoreButton).toBeInTheDocument()
  })

  it('has proper card descriptions', () => {
    render(<Home />)
    
    expect(screen.getByText('Multi-chain DeFi portfolio tracking and management')).toBeInTheDocument()
    expect(screen.getByText('Advanced portfolio health analytics and insights')).toBeInTheDocument()
    expect(screen.getByText('Liquidity provider position tracking and management')).toBeInTheDocument()
    expect(screen.getByText('Cross-LP compounding workflows and automation')).toBeInTheDocument()
  })
})