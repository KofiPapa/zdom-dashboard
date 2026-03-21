import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  subscribeToCollection,
  subscribeToDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  schedulesQuery,
} from "../lib/api";
import type { Schedule } from "@shared/types/firestore-schema";

export function useSchedules() {
  const { profile } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToCollection<Schedule>(
      "schedules",
      schedulesQuery(profile.organizationId),
      (data) => {
        setSchedules(data);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [profile?.organizationId]);

  return { schedules, loading };
}

export function useSchedule(scheduleId: string | undefined) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scheduleId) {
      setSchedule(null);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToDocument<Schedule>(
      "schedules",
      scheduleId,
      (data) => {
        setSchedule(data);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [scheduleId]);

  return { schedule, loading };
}

export function useScheduleActions() {
  const { profile, user } = useAuth();

  const createSchedule = useCallback(
    async (data: {
      name: string;
      screenIds: string[];
      defaultPlaylistId: string;
      rules: Schedule["rules"];
    }) => {
      if (!profile?.organizationId || !user) {
        throw new Error("Not authenticated");
      }

      const id = await createDocument("schedules", {
        ...data,
        organizationId: profile.organizationId,
      });

      return id;
    },
    [profile?.organizationId, user]
  );

  const updateSchedule = useCallback(
    async (scheduleId: string, data: Partial<Schedule>) => {
      await updateDocument("schedules", scheduleId, data);
    },
    []
  );

  const deleteSchedule = useCallback(async (scheduleId: string) => {
    await deleteDocument("schedules", scheduleId);
  }, []);

  return { createSchedule, updateSchedule, deleteSchedule };
}
