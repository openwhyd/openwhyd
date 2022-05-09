import { Playlist } from '../user/types';

/**
 * Hexagonal Architecture Domain API (primary ports)
 */
export interface Features {
  createPlaylist: CreatePlaylist;
}

export type CreatePlaylist = (
  userId: string,
  playlistName: string
) => Promise<Playlist>;
