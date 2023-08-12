import { Playlist, User } from '../user/types';

export interface UserRepository {
  getByUserId: GetByUserId;
  insertPlaylist: InsertPlaylist;
  removePlaylist: RemovePlaylist;
}

export type GetByUserId = (userId: string) => Promise<User>;

export type InsertPlaylist = (
  userid: string,
  playlist: Playlist,
) => Promise<void>;

export type RemovePlaylist = (
  userId: string,
  playlistId: number,
) => Promise<void>;
