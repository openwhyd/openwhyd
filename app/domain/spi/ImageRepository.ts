import { User, Playlist } from '../user/types';

export interface ImageRepository {
  getImageUrlForPlaylist: GetImageUrlForPlaylist;
}

export type GetImageUrlForPlaylist = (
  userId: User['id'],
  playlistId: Playlist['id'],
) => Promise<string>;
