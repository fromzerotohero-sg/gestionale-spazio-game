import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createInventoryItem,
  deleteInventoryItems,
  fetchInventoryItems,
  updateInventoryItem,
} from '@/lib/inventory-api';
import type { InventoryRowInput } from '@/types/inventory';

export const INVENTORY_QUERY_KEY = ['inventory'] as const;

export function useInventoryItems() {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEY,
    queryFn: fetchInventoryItems,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: InventoryRowInput) => createInventoryItem(item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY }),
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<InventoryRowInput> }) =>
      updateInventoryItem(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY }),
  });
}

export function useDeleteInventoryItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteInventoryItems(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY }),
  });
}
