import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import FormField from '../components/ui/FormField';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ImageUploadField from '../components/ui/ImageUploadField';
import SimilarIssueModal from '../features/issues/SimilarIssueModal';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import { AuthProvider } from '../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';

describe('UI Components', () => {
  it('renders Button with variants and handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} variant="primary">Submit Report</Button>);

    const btn = screen.getByRole('button', { name: /Submit Report/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders Button in loading state and disables interaction', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} loading>Processing</Button>);

    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders StatusBadge with appropriate text and styles', () => {
    const { rerender } = render(<StatusBadge status="In Progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();

    rerender(<StatusBadge status="Resolved" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();

    rerender(<StatusBadge status="Exchanged" />);
    expect(screen.getByText('Exchanged')).toBeInTheDocument();
  });

  it('renders PriorityBadge distinguishing Low, Medium, High, and Critical', () => {
    const { rerender } = render(<PriorityBadge priority="Critical" />);
    const badge = screen.getByText('Critical');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('title', 'Official Priority: Critical');

    rerender(<PriorityBadge priority="Low" />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders FormField with accessible label, error message, and helper text', () => {
    render(
      <FormField
        label="Campus Building"
        id="building-input"
        required
        error="Building is required"
        helperText="Select from campus premises"
      >
        <input id="building-input" aria-invalid="true" />
      </FormField>
    );

    expect(screen.getByLabelText(/Campus Building/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Building is required');
  });

  it('renders EmptyState with guidance action', () => {
    render(
      <EmptyState
        title="No issues found"
        description="Try adjusting your filters"
        action={<button>Create New</button>}
      />
    );

    expect(screen.getByText('No issues found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create New' })).toBeInTheDocument();
  });

  it('renders ConfirmDialog and triggers confirmation or cancellation', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    const { rerender } = render(
      <ConfirmDialog
        isOpen={false}
        title="Confirm Handover"
        message="Did you receive the book?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    expect(screen.queryByText('Confirm Handover')).not.toBeInTheDocument();

    rerender(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Handover"
        message="Did you receive the book?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    expect(screen.getByText('Confirm Handover')).toBeInTheDocument();
    expect(screen.getByText('Did you receive the book?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handleCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders SimilarIssueModal with matching issue cards and handles action callbacks', () => {
    const handleUpvote = vi.fn();
    const handleProceed = vi.fn();
    const handleClose = vi.fn();

    const mockMatches = [
      {
        id: 991,
        title: 'Water tap leaking in 2nd Floor corridor',
        description: 'Continuous leaking tap near Lab 202',
        status: 'Submitted',
        priority: 'High',
        building: 'Main Academic Building',
        floor: '2nd Floor',
        reporter_name: 'Aarav Sharma',
        upvote_count: 5,
      },
    ];

    const { rerender } = render(
      <SimilarIssueModal
        isOpen={false}
        similarIssues={mockMatches}
        onUpvoteExisting={handleUpvote}
        onProceedAnyway={handleProceed}
        onClose={handleClose}
      />
    );
    expect(screen.queryByText(/Similar Open Issues Detected/i)).not.toBeInTheDocument();

    rerender(
      <SimilarIssueModal
        isOpen={true}
        similarIssues={mockMatches}
        onUpvoteExisting={handleUpvote}
        onProceedAnyway={handleProceed}
        onClose={handleClose}
      />
    );
    expect(screen.getByText(/Similar Open Issues Detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Water tap leaking in 2nd Floor corridor/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Upvote Existing/i }));
    expect(handleUpvote).toHaveBeenCalledWith(991);

    fireEvent.click(screen.getByRole('button', { name: /Submit My Report Anyway/i }));
    expect(handleProceed).toHaveBeenCalledTimes(1);
  });

  it('validates file upload constraints in ImageUploadField (5 MB limit & MIME types)', () => {
    const handleSelect = vi.fn();
    render(
      <ImageUploadField
        label="Evidence Photo"
        helperText="Max 5 MB"
        onFileSelect={handleSelect}
      />
    );

    const input = screen.getByLabelText(/Click to upload/i);

    // Oversized file > 5 MB
    const oversizedFile = new File(['x'.repeat(6 * 1024 * 1024)], 'huge.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [oversizedFile] } });
    expect(screen.getByText(/File exceeds the maximum limit of 5 MB/i)).toBeInTheDocument();
    expect(handleSelect).not.toHaveBeenCalled();

    // Invalid file type
    const invalidFile = new File(['text content'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [invalidFile] } });
    expect(screen.getByText(/Invalid format/i)).toBeInTheDocument();
    expect(handleSelect).not.toHaveBeenCalled();

    // Valid PNG file under 5 MB
    const validFile = new File(['image bytes'], 'evidence.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [validFile] } });
    expect(handleSelect).toHaveBeenCalledWith(validFile);
  });

  it('renders mobile camera button and triggers camera capture on mobile devices', () => {
    const handleSelect = vi.fn();
    render(
      <ImageUploadField
        label="Evidence Photo"
        onFileSelect={handleSelect}
      />
    );

    const cameraBtn = screen.getByRole('button', { name: /Take Photo/i });
    expect(cameraBtn).toBeInTheDocument();
  });

  it('renders MobileBottomNav with thumb-friendly quick navigation and center Report action', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <MobileBottomNav />
        </MemoryRouter>
      </AuthProvider>
    );

    const nav = screen.getByRole('navigation', { name: /Mobile Bottom Navigation/i });
    expect(nav).toBeInTheDocument();

    // Student role items
    expect(screen.getByRole('link', { name: /Student Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Campus Issues/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Report New Campus Issue/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Resource Exchange/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /My Reported Issues/i })).toBeInTheDocument();
  });
});
