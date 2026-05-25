"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface Reservation {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  expiresAt: string;
  createdAt: string;
}

export default function ReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Resolve params Promise using React's use hook
  const { id } = use(params);

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Timer state
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  
  // Action loading states
  const [confirming, setConfirming] = useState<boolean>(false);
  const [releasing, setReleasing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch reservation details
  const fetchReservation = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const res = await fetch(`/api/reservations/${id}`);
      
      if (!res.ok) {
        throw new Error(`Reservation not found (Status: ${res.status})`);
      }
      
      const data = (await res.json()) as Reservation;
      setReservation(data);
      
      // Calculate seconds left for countdown
      if (data.status === "PENDING") {
        const diff = new Date(data.expiresAt).getTime() - Date.now();
        setSecondsLeft(Math.max(0, Math.floor(diff / 1000)));
      } else {
        setSecondsLeft(0);
      }
    } catch (err: any) {
      console.error("Fetch reservation error:", err);
      setError(err.message || "Failed to load reservation details.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservation();
  }, [id]);

  // Live countdown timer logic
  useEffect(() => {
    if (!reservation || reservation.status !== "PENDING") return;

    // Check immediately and set up timer
    const diff = new Date(reservation.expiresAt).getTime() - Date.now();
    const initialSeconds = Math.max(0, Math.floor(diff / 1000));
    setSecondsLeft(initialSeconds);

    if (initialSeconds <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // If hits 0, refetch to sync with server status (e.g. server-released or expired)
          fetchReservation(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation?.status, reservation?.expiresAt]);

  // Handle Confirm Purchase
  const handleConfirm = async () => {
    if (!reservation) return;
    try {
      setConfirming(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch(`/api/reservations/${id}/confirm`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to confirm purchase.");
      }

      setSuccessMessage("Purchase confirmed! Stock has been successfully allocated permanently.");
      // Automatically refresh data to update UI reactively
      await fetchReservation(false);
    } catch (err: any) {
      console.error("Confirmation error:", err);
      setError(err.message || "Could not confirm purchase.");
    } finally {
      setConfirming(false);
    }
  };

  // Handle Cancel Reservation (Release)
  const handleRelease = async () => {
    if (!reservation) return;
    try {
      setReleasing(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch(`/api/reservations/${id}/release`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel reservation.");
      }

      setSuccessMessage("Reservation cancelled! Stock has been released back to general availability.");
      // Automatically refresh data to update UI reactively
      await fetchReservation(false);
    } catch (err: any) {
      console.error("Release error:", err);
      setError(err.message || "Could not release stock reservation.");
    } finally {
      setReleasing(false);
    }
  };

  const isExpired = reservation?.status === "PENDING" && secondsLeft <= 0;
  const isPending = reservation?.status === "PENDING" && !isExpired;

  // Formatting helpers
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <svg className="animate-spin h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-semibold text-zinc-500">Loading reservation status...</span>
      </div>
    );
  }

  if (error && !reservation) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="rounded-2xl bg-red-500/10 p-6 border border-red-500/20 text-red-600 dark:text-red-400">
          <h3 className="font-bold text-lg">Failed to Retrieve Reservation</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          ← Back to Inventory
        </Link>
      </div>
    );
  }

  if (!reservation) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
      {/* Back Button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          ← Back to Inventory
        </Link>
      </div>

      {/* Success / Error Boxes */}
      {successMessage && (
        <div className="rounded-2xl bg-emerald-500/10 p-4 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex gap-3 items-start animate-fadeIn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mt-0.5 shrink-0">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.748-5.25z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="font-semibold text-sm">Action Successful</h3>
            <p className="text-xs mt-0.5 opacity-95">{successMessage}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-500/10 p-4 border border-red-500/20 text-red-600 dark:text-red-400 flex gap-3 items-start animate-shake">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mt-0.5 shrink-0">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="font-semibold text-sm">Request Failed</h3>
            <p className="text-xs mt-0.5 opacity-95">{error}</p>
          </div>
        </div>
      )}

      {/* Main Reservation Card */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-xl relative">
        
        {/* Glow Header effect depending on status */}
        <div className={`h-2 w-full ${
          reservation.status === "CONFIRMED"
            ? "bg-emerald-500 shadow-lg shadow-emerald-500/50"
            : reservation.status === "RELEASED"
            ? "bg-zinc-400 dark:bg-zinc-650"
            : isExpired
            ? "bg-red-500 shadow-lg shadow-red-500/50"
            : "bg-amber-500 shadow-lg shadow-amber-500/50"
        }`} />

        {/* State Banner / Timer Display */}
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 text-center space-y-4">
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold block">
            Reservation Ticket
          </span>

          {/* Status Badge */}
          <div className="flex justify-center">
            {reservation.status === "CONFIRMED" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20 ring-1 ring-emerald-500/25">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                CONFIRMED
              </span>
            ) : reservation.status === "RELEASED" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-500/10 px-4 py-1.5 text-sm font-bold text-zinc-600 dark:text-zinc-450 dark:bg-zinc-800 ring-1 ring-zinc-500/25">
                <span className="h-2 w-2 rounded-full bg-zinc-400" />
                RELEASED
              </span>
            ) : isExpired ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-4 py-1.5 text-sm font-bold text-red-600 dark:text-red-400 dark:bg-red-500/20 ring-1 ring-red-500/25">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                EXPIRED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-bold text-amber-600 dark:text-amber-400 dark:bg-amber-500/20 ring-1 ring-amber-500/25 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                PENDING HOLD
              </span>
            )}
          </div>

          {/* Live Timer Module */}
          {isPending && (
            <div className="py-4 space-y-2">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-white font-mono tracking-tight block">
                {formatTime(secondsLeft)}
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Time remaining before stock is auto-released
              </p>
            </div>
          )}

          {isExpired && (
            <div className="py-4">
              <span className="text-xl font-bold text-red-600 dark:text-red-400 block">
                Reservation Expired
              </span>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
                The hold duration of 10 minutes has ended. Stock was released.
              </p>
            </div>
          )}

          {reservation.status === "CONFIRMED" && (
            <div className="py-4 text-emerald-600 dark:text-emerald-450">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 mx-auto">
                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 00-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.748-5.25z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-semibold mt-2">Purchase Completed Successfully</p>
            </div>
          )}

          {reservation.status === "RELEASED" && (
            <div className="py-4 text-zinc-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 mx-auto">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-semibold mt-2">Reservation Cancelled & Stock Released</p>
            </div>
          )}
        </div>

        {/* Detailed Info Section */}
        <div className="p-8 space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Allocation Metadata
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Ticket ID */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col justify-center">
              <span className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold uppercase">Ticket ID</span>
              <span className="text-sm font-mono text-zinc-900 dark:text-white mt-1 break-all">{reservation.id}</span>
            </div>

            {/* Product ID */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col justify-center">
              <span className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold uppercase">Product ID</span>
              <span className="text-sm font-mono text-zinc-900 dark:text-white mt-1 break-all">{reservation.productId}</span>
            </div>

            {/* Warehouse ID */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col justify-center">
              <span className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold uppercase">Warehouse ID</span>
              <span className="text-sm font-mono text-zinc-900 dark:text-white mt-1 break-all">{reservation.warehouseId}</span>
            </div>

            {/* Quantity */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col justify-center">
              <span className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold uppercase">Quantity Reserved</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">{reservation.quantity} unit</span>
            </div>

            {/* Created At */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col justify-center">
              <span className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold uppercase">Hold Started</span>
              <span className="text-sm text-zinc-850 dark:text-zinc-300 mt-1">
                {new Date(reservation.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Expires At */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col justify-center">
              <span className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold uppercase">Hold Expires</span>
              <span className="text-sm text-zinc-850 dark:text-zinc-300 mt-1">
                {new Date(reservation.expiresAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Control Panel */}
          <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-4">
            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={!isPending || confirming || releasing}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold shadow-lg shadow-emerald-500/10 transition-all ${
                !isPending
                  ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200/50 dark:bg-zinc-850 dark:text-zinc-650 dark:border-zinc-800/50 shadow-none"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
              }`}
            >
              {confirming ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              )}
              {confirming ? "Processing Purchase..." : "Confirm Purchase"}
            </button>

            {/* Release Button */}
            <button
              onClick={handleRelease}
              disabled={!isPending || confirming || releasing}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold border transition-all ${
                !isPending
                  ? "bg-zinc-50 text-zinc-300 border-zinc-200/30 cursor-not-allowed dark:bg-zinc-850 dark:text-zinc-650 dark:border-zinc-800/30"
                  : "bg-white text-red-600 border-red-200 hover:bg-red-50 dark:bg-zinc-900 dark:text-red-400 dark:border-red-950/50 dark:hover:bg-red-950/20 active:scale-[0.99] disabled:opacity-50"
              }`}
            >
              {releasing ? (
                <svg className="animate-spin h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {releasing ? "Releasing Stock..." : "Cancel Reservation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
