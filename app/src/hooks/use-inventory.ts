import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInventoryItem,
  deleteInventoryItems,
  fetchInventoryActivity,
  fetchInventoryItems,
  updateInventoryItem,
  type InventoryMutationOptions,
} from "@/lib/inventory-api";
import type { InventoryRowInput, UnifiedItem } from "@/types/inventory";

export const INVENTORY_QUERY_KEY = ["inventory"] as const;
export const inventoryActivityQueryKey = (itemId: string) =>
  ["inventory-activity", itemId] as const;

export function useInventoryItems() {
  return useQuery({
    queryKey: INVENTORY_QUERY_KEY,
    queryFn: fetchInventoryItems,
  });
}

export function useInventoryActivity(itemId: string | null, enabled = true) {
  return useQuery({
    queryKey: inventoryActivityQueryKey(itemId ?? ""),
    queryFn: () => fetchInventoryActivity(itemId!),
    enabled: enabled && !!itemId,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      item,
      operatore,
    }: {
      item: InventoryRowInput;
      operatore: InventoryMutationOptions["operatore"];
    }) => createInventoryItem(item, { operatore }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY }),
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
      operatore,
      previous,
      skipActivityLog,
      activityNote,
    }: {
      id: string;
      patch: Partial<InventoryRowInput>;
      operatore: InventoryMutationOptions["operatore"];
      previous?: UnifiedItem;
      skipActivityLog?: boolean;
      activityNote?: string;
    }) =>
      updateInventoryItem(id, patch, {
        operatore,
        previous,
        skipActivityLog,
        activityNote,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY }),
  });
}

export function useDeleteInventoryItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      operatore,
      items,
    }: {
      ids: string[];
      operatore: InventoryMutationOptions["operatore"];
      items: UnifiedItem[];
    }) => deleteInventoryItems(ids, { operatore, items }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY }),
  });
}
