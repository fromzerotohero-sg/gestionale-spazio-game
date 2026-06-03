import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Operatore } from "@/data/operators";
import {
  createSchedaPrenotazione,
  deleteSchedaPrenotazione,
  fetchSchedePrenotazioni,
} from "@/lib/schede-prenotazioni-api";

export const SCHEDE_PRENOTAZIONI_QUERY_KEY = ["schede-prenotazioni"] as const;

export function useSchedePrenotazioni(enabled = true) {
  return useQuery({
    queryKey: SCHEDE_PRENOTAZIONI_QUERY_KEY,
    queryFn: fetchSchedePrenotazioni,
    enabled,
  });
}

export function useCreateSchedaPrenotazione() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      numeroScheda,
      cliente,
      operatore,
    }: {
      numeroScheda: string;
      cliente: string;
      operatore: Operatore;
    }) => createSchedaPrenotazione(numeroScheda, cliente, operatore),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: SCHEDE_PRENOTAZIONI_QUERY_KEY,
      }),
  });
}

export function useDeleteSchedaPrenotazione() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSchedaPrenotazione(id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: SCHEDE_PRENOTAZIONI_QUERY_KEY,
      }),
  });
}
