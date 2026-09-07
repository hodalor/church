import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

jest.mock('../../api/endpoints/auth', () => ({
  getPublicBranding: jest.fn(async () => ({
    appName: 'Prynova',
    tagline: 'Church OS',
    promotedApps: [],
  })),
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  refreshToken: jest.fn(),
  getMe: jest.fn(),
}));

const LoginPage = require('./LoginPage').default;

const renderLoginPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    window.localStorage.clear();

    act(() => {
      useAuthStore.setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        tenantId: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    });
  });

  it('renders the church, username, and pin fields', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/church id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username or phone/i)).toBeInTheDocument();
    expect(screen.getByText(/^pin$/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /access workspace/i }),
    ).toBeInTheDocument();
  });

  it('shows validation error when tenantId is empty on submit', async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: /access workspace/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/tenant id must be at least 3 characters/i),
      ).toBeInTheDocument();
    });
  });

  it('shows validation error when username is empty on submit', async () => {
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/church id/i), {
      target: { value: 'calvary' },
    });

    const pinInputs = screen.getAllByRole('textbox').slice(-6);
    fireEvent.change(pinInputs[0], { target: { value: '1' } });
    fireEvent.change(pinInputs[1], { target: { value: '2' } });
    fireEvent.change(pinInputs[2], { target: { value: '3' } });
    fireEvent.change(pinInputs[3], { target: { value: '4' } });

    fireEvent.click(screen.getByRole('button', { name: /access workspace/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/username or phone must be at least 2 characters/i),
      ).toBeInTheDocument();
    });
  });
});
