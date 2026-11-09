import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Provide standard ResizeObserver mock for Recharts responsive containers in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Fail-fast fetch in headless test environment so tests use local demo state without waiting for OS socket timeout
global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch (test offline)'));
