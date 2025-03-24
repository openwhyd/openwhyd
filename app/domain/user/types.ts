export interface Playlist {
  id: number;
  name: string;
}

export interface User {
  id: string;
  name: string;
  playlists: Playlist[];
  addNewPlaylist: (playlistName: string) => Promise<[User, Playlist]>;
  deletePlaylist: (playlistId: number) => Promise<User>;
}
