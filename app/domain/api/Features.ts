import { Playlist } from '../user/types';

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
