import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MigrationProvider, useMigration } from './context/MigrationContext';
import * as geminiService from './services/geminiService';

// Mock the Gemini service
vi.mock('./services/geminiService', () => ({
  analyzeCobolCode: vi.fn(),
  transformToSpringBoot: vi.fn(),
  generateCloudConfig: vi.fn(),
}));

describe('MigrationContext Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // basic mock implementations
    (geminiService.analyzeCobolCode as any).mockResolvedValue({
      complexity: 'Low',
      dependencies: [],
      businessLogic: 'Test Logic',
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MigrationProvider>{children}</MigrationProvider>
  );

  it('initializes with default state', () => {
    const { result } = renderHook(() => useMigration(), { wrapper });
    expect(result.current.state.step).toBe('INPUT');
    expect(result.current.state.isProcessing).toBe(false);
  });

  it('updates API key', () => {
    const { result } = renderHook(() => useMigration(), { wrapper });
    act(() => {
      result.current.setApiKey('test-key');
    });
    expect(result.current.apiKey).toBe('test-key');
  });

  it('starts migration and updates state', async () => {
    const { result } = renderHook(() => useMigration(), { wrapper });

    // Set some code and api key
    act(() => {
      result.current.setState((prev) => ({ ...prev, cobolCode: 'DISPLAY "HELLO".' }));
      result.current.setApiKey('test-key');
    });

    // Mock ensureApiKey to assume key is present or we bypass it logic if possible
    // The real code checks using window.aistudio or assumes local key.
    // Since we provided a key in state, let's see if that's enough for the service calls themselves,
    // but the context's ensureApiKey might try window calls.
    // Ideally we should mock window.aistudio or the ensureApiKey helper if it was exported.
    // However, ensureApiKey is internal.
    // Let's mock window.aistudio just in case.
    vi.stubGlobal('window', { aistudio: { hasSelectedApiKey: () => Promise.resolve(true) } });

    await act(async () => {
      await result.current.startMigration();
    });

    expect(result.current.state.isProcessing).toBe(false);
    expect(result.current.state.step).toBe('ANALYSIS');
    expect(geminiService.analyzeCobolCode).toHaveBeenCalled();
  });
});
