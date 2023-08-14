import { User, Playlist } from '../user/types';

export interface ImageRepository {
  getImageUrlForPlaylist: GetImageUrlForPlaylist;
  deletePlaylistImage: DeletePlaylistImage;
}

export type GetImageUrlForPlaylist = (
  userId: User['id'],
  playlistId: Playlist['id'],
) => Promise<string>;

export type DeletePlaylistImage = (
  userId: User['id'],
  playlistId: Playlist['id'],
) => Promise<void>;
