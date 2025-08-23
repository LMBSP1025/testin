"use client";

import React, { useEffect, useState } from "react";
import MusicFooter from "./MusicFooter";

export default function GlobalMusicFooter() {
  const [playlist, setPlaylist] = useState<{ id: string; title?: string | null } | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/playlist/global", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        if (!mounted) return;
        if (d?.playlist?.id) setPlaylist(d.playlist);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  if (!playlist) return null;
  return <MusicFooter playlistId={playlist.id} playlistTitle={playlist.title ?? undefined} />
}

