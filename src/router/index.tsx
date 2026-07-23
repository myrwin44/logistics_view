import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AppShell from '../components/layout/AppShell';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Login';

const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const Schedule = lazy(() => import('../pages/schedule/Schedule'));
const ScheduleViewPage = lazy(() => import('../pages/schedule/ScheduleViewPage'));
const AllTrips = lazy(() => import('../pages/transportTrip/AllTrips'));
const SpatialSchedulePage = lazy(() => import('../pages/transportTrip/SpatialSchedulePage'));
const TransportTripDetail = lazy(() => import('../pages/transportTrip/TransportTripDetail'));
const BillOfLading = lazy(() => import('../pages/billOfLading/BillOfLading'));
const BillOfLadingDetail = lazy(() => import('../pages/billOfLading/BillOfLadingDetail'));
const Settings = lazy(() => import('../pages/Settings'));

/**
 * RouteHandle — attached to route definitions to supply breadcrumb metadata.
 *
 * `crumb` is a function so dynamic segments (`:id`) can be resolved at render
 * time by passing the route params from `useMatches()`.
 */
export interface RouteHandle {
  crumb?: (
    params: Record<string, string | undefined>,
    state?: unknown,
  ) => Array<{ label: string; href?: string }>;
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Suspense fallback={null}><Dashboard /></Suspense> },
          // ── Schedule ──────────────────────────────────────────────
          {
            path: '/schedule',
            element: <Suspense fallback={null}><Schedule /></Suspense>,
            handle: {
              crumb: () => [{ label: 'Tạo Lịch Tự Động', href: '/schedule' }],
            } satisfies RouteHandle,
          },
          {
            path: '/schedule-view',
            element: <Suspense fallback={null}><ScheduleViewPage /></Suspense>,
            handle: {
              crumb: () => [{ label: 'Xem Lịch Xe', href: '/schedule-view' }],
            } satisfies RouteHandle,
          },
          // ── Transport Trips ───────────────────────────────────────────────
          {
            path: '/transport-trips',
            element: <Suspense fallback={null}><AllTrips /></Suspense>,
            handle: {
              crumb: () => [{ label: 'Thông tin tuyến', href: '/transport-trips' }],
            } satisfies RouteHandle,
          },
          {
            path: '/transport-trips/spatial-schedule',
            element: <Suspense fallback={null}><SpatialSchedulePage /></Suspense>,
            handle: {
              crumb: () => [
                { label: 'Tuyến Xe', href: '/transport-trips' },
                { label: 'Xem lộ trình xe', href: '/transport-trips/spatial-schedule' },
              ],
            } satisfies RouteHandle,
          },
          {
            path: '/transport-trips/:id',
            element: <Suspense fallback={null}><TransportTripDetail /></Suspense>,
            // Req 7.6: Breadcrumb "Transport Trips / [Trip ID]"
            handle: {
              crumb: (params: Record<string, string | undefined>) => [
                { label: 'Transport Trips', href: '/transport-trips' },
                { label: params.id ? `Trip ${params.id}` : 'Trip Detail' },
              ],
            } satisfies RouteHandle,
          },
          { path: '/bills', element: <Suspense fallback={null}><BillOfLading /></Suspense> },
          {
            path: '/bills/:id',
            element: <Suspense fallback={null}><BillOfLadingDetail /></Suspense>,
            // Req 10.6: Breadcrumb "Bills of Lading / [Bill ID]"
            handle: {
              crumb: (params: Record<string, string | undefined>, state?: unknown) => {
                const billsSearch = (state as { billsSearch?: string } | null)?.billsSearch ?? '';
                return [
                  { label: 'Bills of Lading', href: `/bills${billsSearch}` },
                  { label: params.id ? `Bill ${params.id}` : 'Bill Detail' },
                ];
              },
            } satisfies RouteHandle,
          },
          { path: '/settings', element: <Suspense fallback={null}><Settings /></Suspense> },
        ],
      },
    ],
  },
]);
