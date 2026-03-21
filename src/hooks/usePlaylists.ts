import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  subscribeToCollection,
  subscribeToDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  playlistsQuery,
} from "../lib/api";
import type { Playlist } from "@shared/types/firestore-schema";

export function usePlaylists() {
  const { profile } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToCollection<Playlist>(
      "playlists",
      playlistsQuery(profile.organizationId),
      (data) => {
        setPlaylists(data);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [profile?.organizationId]);

  return { playlists, loading };
}

export function usePlaylist(playlistId: string | undefined) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playlistId) {
      setPlaylist(null);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToDocument<Playlist>(
      "playlists",
      playlistId,
      (data) => {
        setPlaylist(data);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [playlistId]);

  return { playlist, loading };
}

export function usePlaylistActions() {
  const { profile, user } = useAuth();

  const createPlaylist = useCallback(
    async (data: {
      name: string;
      orientation: string;
      items: Playlist["items"];
      totalDuration: number;
    }) => {
      if (!profile?.organizationId || !user) {
        throw new Error("Not authenticated");
      }

      const id = await createDocument("playlists", {
        ...data,
        organizationId: profile.organizationId,
        createdBy: user.uid,
      });

      return id;
    },
    [profile?.organizationId, user]
  );

  const updatePlaylist = useCallback(
    async (playlistId: string, data: Partial<Playlist>) => {
      await updateDocument("playlists", playlistId, data);
    },
    []
  );

  const deletePlaylist = useCallback(async (playlistId: string) => {
    await deleteDocument("playlists", playlistId);
  }, []);

  return { createPlaylist, updatePlaylist, deletePlaylist };
}
