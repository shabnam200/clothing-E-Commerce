"use client";

import { useCallback, useEffect, useState } from "react";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { api } from "@/services";
import { FINAL_STATUSES } from "@/lib/v2/orders";

// Loads one order of the signed-in customer (api.orders.get). With `poll` the order is refreshed every 15 s
// until it is delivered or cancelled, so the tracking timeline moves by itself.
export default function useOrder(id, { poll = false } = {}) {
  const { hydrated, isLoggedIn } = useV2Store();
  const [state, setState] = useState({ status: "loading", order: null, message: "" });

  const load = useCallback(async (silent = false) => {
    if (!silent) setState((s) => ({ ...s, status: "loading" }));
    try { setState({ status: "ready", order: await api.orders.get(id), message: "" }); }
    catch (e) { setState((s) => (silent && s.order ? s : { status: e?.status === 404 ? "missing" : "error", order: null, message: e?.message || "" })); }
  }, [id]);

  useEffect(() => { if (hydrated && isLoggedIn) load(); }, [hydrated, isLoggedIn, load]);

  const live = poll && state.status === "ready" && !FINAL_STATUSES.includes(state.order.status);
  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(() => load(true), 15000);
    return () => clearInterval(t);
  }, [live, load]);

  const setOrder = useCallback((order) => setState({ status: "ready", order, message: "" }), []);
  return { ...state, load, setOrder };
}
