import { useState, useCallback, useRef, useEffect } from 'react';
import {
  lookupCep,
  type ViaCepResponse,
  isViaCepError,
  type ViaCepSuccessResponse,
} from '../services/viaCepService';

export interface CepLookupState {
  data: ViaCepSuccessResponse | null;
  isLookingUp: boolean;
  error: string | null;
}

export interface UseCepLookupReturn extends CepLookupState {
  lookup: (cep: string) => void;
  clearError: () => void;
}

const DEBOUNCE_MS = 400;

export function useCepLookup(): UseCepLookupReturn {
  const [cepResult, setCepResult] = useState<ViaCepSuccessResponse | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const lookup = useCallback((cep: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const normalizedCep = cep.replace(/\D/g, '');

    if (normalizedCep.length !== 8) {
      setCepResult(null);
      setError(null);
      return;
    }

    debounceTimerRef.current = window.setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setIsLookingUp(true);
      setError(null);

      try {
        const response: ViaCepResponse = await lookupCep(normalizedCep);

        if (isViaCepError(response)) {
          setCepResult(null);
          setError('CEP_NOT_FOUND');
        } else {
          setCepResult(response);
          setError(null);
        }
      } catch {
        setCepResult(null);
        setError('NETWORK_ERROR');
      } finally {
        setIsLookingUp(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  return {
    data: cepResult,
    isLookingUp,
    error,
    lookup,
    clearError,
  };
}
