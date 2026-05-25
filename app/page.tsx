"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Define TypeScript interfaces for our API responses
interface InventoryItem {
  warehouseId: string;
  warehouseName: string;
  totalUnits: number;
  reservedUnits: number;
  availableUnits: number;
}

interface Product {
  id: string;
  name: string;
  inventory: InventoryItem[];
}

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track loading state per warehouse reservation to show localized loading spinner
  const [reservingId, setReservingId] = useState<{ productId: string; warehouseId: string } | null>(null);
  const [reserveError, setReserveError] = useState<string | null>(null);

  // Fetch products function
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/products");
      if (!res.ok) {
        throw new Error(`Failed to fetch products (Status: ${res.status})`);
      }
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      console.error("Fetch products error:", err);
      setError(err.message || "An unexpected error occurred while loading products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle stock reservation
  const handleReserve = async (productId: string, warehouseId: string) => {
    try {
      setReservingId({ productId, warehouseId });
      setReserveError(null);

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          warehouseId,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("Not enough stock available");
        }
        throw new Error(data.error || "Failed to make reservation");
      }

      // Successful reservation, redirect to the reservation detail page
      router.push(`/reservation/${data.id}`);
    } catch (err: any) {
      console.error("Reservation error:", err);
      setReserveError(err.message || "Something went wrong. Please try again.");
    } finally {
      setReservingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Intro Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Available Inventory
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time stock status across distribution centers. Select a warehouse to reserve units.
          </p>
        </div>
        <div>
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh Stock
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="rounded-2xl bg-red-500/10 p-4 border border-red-500/20 text-red-600 dark:text-red-400 flex gap-3 items-start animate-shake">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mt-0.5 shrink-0">
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="font-semibold text-sm">System Error</h3>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Reservation Error Banner */}
      {reserveError && (
        <div className="rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex gap-3 items-start animate-fadeIn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mt-0.5 shrink-0">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Reservation Denied</h3>
            <p className="text-xs mt-0.5 opacity-90">{reserveError}</p>
          </div>
          <button 
            onClick={() => setReserveError(null)} 
            className="text-xs font-semibold underline opacity-80 hover:opacity-100 shrink-0 self-center"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && products.length === 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-6">
              <div className="h-6 bg-zinc-200 dark:bg-zinc-850 rounded-md w-1/3"></div>
              <div className="space-y-3">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-850 rounded-md w-full"></div>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-850 rounded-md w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="mx-auto h-12 w-12 text-zinc-400"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">No Products Found</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">The database doesn&apos;t seem to contain any active inventory items.</p>
        </div>
      ) : (
        /* Product Cards Grid */
        <div className="grid gap-8 md:grid-cols-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="group overflow-hidden rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 flex flex-col justify-between"
            >
              {/* Product Header */}
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-850 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {product.name}
                    </h2>
                    <span className="text-xs text-zinc-400 font-mono">ID: {product.id}</span>
                  </div>
                </div>
              </div>

              {/* Warehouse Table Section */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Warehouse
                        </th>
                        <th scope="col" className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Total
                        </th>
                        <th scope="col" className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Reserved
                        </th>
                        <th scope="col" className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Available
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                      {product.inventory.map((inv) => {
                        const isReserving =
                          reservingId?.productId === product.id &&
                          reservingId?.warehouseId === inv.warehouseId;
                        const anyReserving = reservingId !== null;
                        const isOutOfStock = inv.availableUnits <= 0;

                        return (
                          <tr key={inv.warehouseId} className="group/row hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30 transition-colors">
                            {/* Warehouse Name */}
                            <td className="py-4 text-sm">
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                {inv.warehouseName}
                              </span>
                              <span className="block text-[10px] text-zinc-400 font-mono">
                                ID: {inv.warehouseId}
                              </span>
                            </td>

                            {/* Total Units */}
                            <td className="px-3 py-4 text-center text-sm font-medium text-zinc-650 dark:text-zinc-400 font-mono">
                              {inv.totalUnits}
                            </td>

                            {/* Reserved Units */}
                            <td className="px-3 py-4 text-center text-sm text-zinc-500 dark:text-zinc-500 font-mono">
                              {inv.reservedUnits}
                            </td>

                            {/* Available Units */}
                            <td className="px-3 py-4 text-center text-sm font-semibold font-mono">
                              {isOutOfStock ? (
                                <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-0.5 text-xs text-red-600 dark:text-red-400 ring-1 ring-red-500/10">
                                  0
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/10">
                                  {inv.availableUnits}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Reservation Actions Section */}
                <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-6 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Create Stock Reservation (1 Unit)
                  </h3>
                  <div className="grid gap-2">
                    {product.inventory.map((inv) => {
                      const isReserving =
                        reservingId?.productId === product.id &&
                        reservingId?.warehouseId === inv.warehouseId;
                      const anyReserving = reservingId !== null;
                      const isOutOfStock = inv.availableUnits <= 0;

                      return (
                        <button
                          key={`btn-${inv.warehouseId}`}
                          onClick={() => handleReserve(product.id, inv.warehouseId)}
                          disabled={isOutOfStock || anyReserving}
                          className={`w-full inline-flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all shadow-sm ${
                            isOutOfStock
                              ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200/50 dark:bg-zinc-850 dark:text-zinc-600 dark:border-zinc-800/50"
                              : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {isReserving ? (
                              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125H3.375zM3.375 11.25c-.621 0-1.125.504-1.125 1.125v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026c0-.621-.504-1.125-1.125-1.125H3.375z" />
                              </svg>
                            )}
                            {isReserving ? "Requesting Stock..." : `Reserve at ${inv.warehouseName}`}
                          </span>
                          <span className="text-xs font-normal opacity-95 flex items-center gap-1">
                            {isOutOfStock ? "Sold Out" : `1 Unit Available →`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
