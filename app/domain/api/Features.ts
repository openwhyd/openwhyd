import type { Playlist, User } from '../user/types.ts';

/**
 * Hexagonal Architecture Domain API (primary ports)
 */
export interface Features {
  createPlaylist: CreatePlaylist;
  deletePlaylist: DeletePlaylist;
}

export type CreatePlaylist = (
  userId: string,
  playlistName: string,
) => Promise<Playlist>;

export type DeletePlaylist = (
  userId: string,
  playlistId: number,
) => Promise<void>;

// expected payload/body of requests to `POST /api/v2/postTrack`
export type PostTrackRequest = {
  url: string;
  title: string;
  thumbnail?: string;
  description?: string;
  // TODO: Add fields: playlistId, etc...
};

/**
 * Post a track to a user's playlist or profile.
 */
export type PostTrack = (
  user: User,
  postTrackRequest: PostTrackRequest,
) => Promise<{ url: string }>;
