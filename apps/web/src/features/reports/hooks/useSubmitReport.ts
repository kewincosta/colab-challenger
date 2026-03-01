import { useState } from 'react';
import { reportService } from '../services/reportsService';
import { CreateReportPayload, ReportResponse } from '../types/reportTypes';

interface UseSubmitReportReturn {
  submit: (payload: CreateReportPayload) => Promise<ReportResponse | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useSubmitReport(): UseSubmitReportReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (payload: CreateReportPayload): Promise<ReportResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await reportService.createReport(payload);
      await new Promise((r) => setTimeout(r, 1000));
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    submit,
    isLoading,
    error,
    clearError,
  };
}
