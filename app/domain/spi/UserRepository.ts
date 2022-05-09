import { Playlist, User } from '../user/types';

export interface UserRepository {
  getByUserId: GetByUserId;
  insertPlaylist: InsertPlaylist;
}

export type GetByUserId = (userId: string) => Promise<User>;
export type InsertPlaylist = (
  userid: string,
  playlist: Playlist
) => Promise<void>;
