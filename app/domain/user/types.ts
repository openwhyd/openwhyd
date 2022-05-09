export interface Playlist {
  id: number;
  name: string;
}

export interface User {
  id: string;
  playlists: Playlist[];
  addNewPlaylist: (playlistName: string) => Promise<[User, Playlist]>;
}
