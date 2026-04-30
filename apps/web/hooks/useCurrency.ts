import { useAuthStore } from '@/store/useAuthStore';
import { formatCurrency } from '@/lib/format';
import { useCallback } from 'react';

export const useCurrency = () => {
  const user = useAuthStore((state) => state.user);
  
  const currencyCode = user?.tenant?.currency || 'SAR';
  const currencySymbol = user?.tenant?.currencySymbol || 'SAR';

  const format = useCallback((amount: number | string) => {
    return formatCurrency(amount, currencyCode, currencySymbol);
  }, [currencyCode, currencySymbol]);

  return {
    format,
    currencyCode,
    currencySymbol
  };
};
