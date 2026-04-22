import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Logs from '../pages/Logs';
import React from 'react';

// Help testing by providing a basic Auth state
beforeEach(() => {
  window.localStorage.setItem('auth', JSON.stringify({
    user: { email: 'test@repkon.com.tr', fullName: 'Test Admin' }
  }));
});

describe('Page Smoke Tests', () => {
  it('renders Dashboard without crashing', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    // Check for some static text in Dashboard
    expect(screen.getByText(/MISSION CONTROL/i)).toBeInTheDocument();
  });

  it('renders Logs without crashing', () => {
    render(
      <MemoryRouter>
        <Logs />
      </MemoryRouter>
    );
    // Wait for or check for the loading or header
    expect(screen.getByText(/Sistem Logları/i)).toBeInTheDocument();
  });
});
