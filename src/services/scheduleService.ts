/**
 * Shipment scheduling service module.
 */

import { apiClient, toQueryString } from './api';
import type { ScheduleRequest, ScheduleRun, GanttScheduleRequest, GanttApiResponse } from '../types/schedule';

export const scheduleService = {
  /** Trigger the AI schedule generation for the given date range. */
  generateSchedule: (req: ScheduleRequest) =>
    apiClient.post<ScheduleRun>('/schedule', req),

  /** Poll a schedule run by ID to retrieve its current status and results. */
  getScheduleRun: (id: string) =>
    apiClient.get<ScheduleRun>(`/schedule/${id}`),

  /** Lấy dữ liệu lịch xe (Gantt) theo khoảng thời gian. */
  getGanttSchedule: (req: GanttScheduleRequest) =>
    apiClient.get<GanttApiResponse>(`/trip-schedules/time-schedule?${toQueryString(req as unknown as Record<string, unknown>)}`),
};
