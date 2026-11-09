import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('GREEN CAMPUS Application End-to-End Workflows', () => {
  it('renders Green Campus navigation, role banner, and student home dashboard', async () => {
    render(<App />);

    // Brand and header
    expect(screen.getAllByText(/GREEN CAMPUS/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/DYPCOE Akurdi/i).length).toBeGreaterThan(0);

    // Persona switcher
    expect(screen.getByText(/Preview Persona:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Maintenance Staff/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Administrator/i })).toBeInTheDocument();

    // Student Dashboard metrics
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      expect(screen.getByText(/My Reported Issues/i)).toBeInTheDocument();
      expect(screen.getByText(/My Marketplace Listings/i)).toBeInTheDocument();
    });
  });

  it('navigates to Campus Issues and lists reported issues with upvote count', async () => {
    render(<App />);

    const issuesLinks = screen.getAllByRole('link', { name: /Issues/i });
    fireEvent.click(issuesLinks[0]);

    await waitFor(() => {
      expect(screen.getByText(/Continuous Water Leakage in 2nd Floor Washroom/i)).toBeInTheDocument();
      expect(screen.getByText(/Faulty Switchboard and Exposed Wiring/i)).toBeInTheDocument();
    });
  });

  it('navigates to Marketplace and displays academic items for reuse', async () => {
    render(<App />);

    const marketplaceLinks = screen.getAllByRole('link', { name: /Marketplace/i });
    fireEvent.click(marketplaceLinks[0]);

    await waitFor(() => {
      expect(screen.getByText(/Student Resource Exchange Marketplace/i)).toBeInTheDocument();
      expect(screen.getByText(/Casio fx-991EX Scientific Calculator/i)).toBeInTheDocument();
      expect(screen.getByText(/Data Structures and Algorithms in C\+\+/i)).toBeInTheDocument();
    });
  });

  it('switches persona to Maintenance Staff and loads Staff Task Portal', async () => {
    render(<App />);

    const staffBtn = screen.getByRole('button', { name: /Maintenance Staff/i });
    fireEvent.click(staffBtn);

    await waitFor(() => {
      expect(screen.getByText(/Maintenance Staff Work Order Portal/i)).toBeInTheDocument();
      expect(screen.getByText(/Pending & In Progress/i)).toBeInTheDocument();
      expect(screen.getByText(/Assigned Maintenance Tasks/i)).toBeInTheDocument();
    });
  });

  it('switches persona to Administrator and displays full Sustainability Dashboard with all required metrics & trends', async () => {
    render(<App />);

    const adminBtn = screen.getByRole('button', { name: /Administrator/i });
    fireEvent.click(adminBtn);

    await waitFor(() => {
      expect(screen.getByText(/Operational Sustainability Analysis Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/Resolution Rate/i)).toBeInTheDocument();
      expect(screen.getByText(/Avg Resolution Time/i)).toBeInTheDocument();
      expect(screen.getByText(/Confirmed Reused Items/i)).toBeInTheDocument();
      expect(screen.getByText(/Verified Database Records • Demo Data Active/i)).toBeInTheDocument();
      // Verified chart headers
      expect(screen.getByText(/Campus Issues by Category/i)).toBeInTheDocument();
      expect(screen.getByText(/Campus Building Hotspots/i)).toBeInTheDocument();
      expect(screen.getByText(/Monthly Submissions vs Resolutions/i)).toBeInTheDocument();
      expect(screen.getByText(/Marketplace Category Breakdown/i)).toBeInTheDocument();
      expect(screen.getByText(/Confirmed Resource Reuse Trends/i)).toBeInTheDocument();
      expect(screen.getByText(/Exchange Arrangement Breakdown/i)).toBeInTheDocument();
    }, { timeout: 4000 });
  });

  it('navigates to Administrator Overview and verifies pending student accounts (Screen 10)', async () => {
    render(<App />);

    const adminBtn = screen.getByRole('button', { name: /Administrator/i });
    fireEvent.click(adminBtn);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Admin Overview/i })).toBeInTheDocument();
    });

    const adminOverviewLink = screen.getByRole('link', { name: /Admin Overview/i });
    fireEvent.click(adminOverviewLink);

    await waitFor(() => {
      expect(screen.getByText(/Administrator Control Center/i)).toBeInTheDocument();
      expect(screen.getByText(/Institutional Account Verification Queue/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Tanvi Salunkhe/i).length).toBeGreaterThan(0);
    });
  });
});
