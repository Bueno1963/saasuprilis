import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface PollingState {
  isRunning: boolean;
  lastPoll: Date | null;
  pendingSamples: number;
  lastError: string | null;
}

/**
 * Polls every `intervalMs` (default 5s) for active integrations:
 * - Outbound: finds samples in "processing" status matched to this integration and logs sync
 * - Inbound: checks for new results received (via last_sync timestamp)
 * Updates integration last_sync and logs activity.
 */
export function useIntegrationPolling(
  integrationId: string | null,
  enabled: boolean = false,
  intervalMs: number = 5000
) {
  const qc = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState<PollingState>({
    isRunning: false,
    lastPoll: null,
    pendingSamples: 0,
    lastError: null,
  });

  const poll = useCallback(async () => {
    if (!integrationId) return;

    try {
      // 1. Get integration info
      const { data: integration, error: intErr } = await supabase
        .from("integrations")
        .select("id, name, status, type, endpoint_url")
        .eq("id", integrationId)
        .single();

      if (intErr || !integration || integration.status !== "active") {
        setState(prev => ({ ...prev, lastPoll: new Date(), pendingSamples: 0 }));
        return;
      }

      // 2. Find samples in "processing" status matching this equipment's sector
      const { data: exams } = await supabase
        .from("exam_catalog")
        .select("sector")
        .ilike("equipment", `%${integration.name}%`)
        .eq("status", "active");

      const sectors = [...new Set((exams || []).map(e => e.sector).filter(Boolean))];

      let pendingCount = 0;

      if (sectors.length > 0) {
        // Outbound: check for samples waiting to be sent
        const { data: pendingSamples } = await supabase
          .from("samples")
          .select("id, barcode, sector, order_id")
          .in("sector", sectors)
          .eq("status", "triagem")
          .limit(50);

        if (pendingSamples && pendingSamples.length > 0) {
          pendingCount = pendingSamples.length;

          for (const sample of pendingSamples) {
            // Update sample to processing
            await supabase
              .from("samples")
              .update({ status: "processing" })
              .eq("id", sample.id);

            // Log outbound sync
            await supabase.from("integration_sync_logs").insert({
              integration_id: integration.id,
              status: "success",
              direction: "outbound",
              source_system: "LIS",
              destination_system: integration.name,
              message: `Polling automático: amostra ${sample.barcode} enviada — Setor: ${sample.sector}`,
              records_created: 1,
              records_updated: 0,
              records_failed: 0,
              duration_ms: 0,
            });
          }

          // Update last_sync
          await supabase
            .from("integrations")
            .update({ last_sync: new Date().toISOString() })
            .eq("id", integration.id);

          // Refresh queries
          qc.invalidateQueries({ queryKey: ["integration-detail", integrationId] });
          qc.invalidateQueries({ queryKey: ["integration-logs", integrationId] });
          qc.invalidateQueries({ queryKey: ["samples"] });
        }
      }

      // 3. Inbound: check for recently analyzed samples (results received)
      const { data: analyzedSamples } = await supabase
        .from("samples")
        .select("id, barcode, sector")
        .in("sector", sectors.length > 0 ? sectors : ["__none__"])
        .eq("status", "analyzed")
        .limit(50);

      if (analyzedSamples && analyzedSamples.length > 0) {
        // Log that we detected inbound results
        for (const sample of analyzedSamples) {
          await supabase
            .from("samples")
            .update({ status: "completed" })
            .eq("id", sample.id);
        }

        await supabase.from("integration_sync_logs").insert({
          integration_id: integration.id,
          status: "success",
          direction: "inbound",
          source_system: integration.name,
          destination_system: "LIS",
          message: `Polling: ${analyzedSamples.length} resultado(s) recebido(s) e confirmado(s)`,
          records_created: 0,
          records_updated: analyzedSamples.length,
          records_failed: 0,
          duration_ms: 0,
        });

        await supabase
          .from("integrations")
          .update({ last_sync: new Date().toISOString() })
          .eq("id", integration.id);

        qc.invalidateQueries({ queryKey: ["integration-detail", integrationId] });
        qc.invalidateQueries({ queryKey: ["integration-logs", integrationId] });
        qc.invalidateQueries({ queryKey: ["samples"] });
      }

      setState({
        isRunning: true,
        lastPoll: new Date(),
        pendingSamples: pendingCount,
        lastError: null,
      });
    } catch (err: any) {
      console.error("Polling error:", err);
      setState(prev => ({
        ...prev,
        lastPoll: new Date(),
        lastError: err.message || "Erro desconhecido",
      }));
    }
  }, [integrationId, qc]);

  useEffect(() => {
    if (enabled && integrationId) {
      // Run immediately on start
      poll();
      timerRef.current = setInterval(poll, intervalMs);
      setState(prev => ({ ...prev, isRunning: true }));
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setState(prev => ({ ...prev, isRunning: false }));
    };
  }, [enabled, integrationId, intervalMs, poll]);

  const start = useCallback(() => {
    if (!timerRef.current && integrationId) {
      poll();
      timerRef.current = setInterval(poll, intervalMs);
      setState(prev => ({ ...prev, isRunning: true }));
    }
  }, [integrationId, intervalMs, poll]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setState(prev => ({ ...prev, isRunning: false }));
    }
  }, []);

  return { ...state, start, stop };
}
