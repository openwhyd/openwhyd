interface JQuery {
  ajaxify: () => void;
}

interface Playem {
  pause: () => void;
  resume: () => void;
  seekTo: (position: number) => void;
  setVolume: (volume: number) => void;
  addTrackByUrl: (
    src: string,
    metadata: unknown,
  ) => {
    player: unknown;
  };
  clearQueue: () => void;
  getQueue: () => { metadata: { post: unknown } }[];
  play: (index: number) => void;
  next: () => void;
  stop: () => void;
  on: (eventName: string, wrapLogger: () => void) => void;
  addPlayer: (playerInstance: unknown, defaultDefaultParams: unknown) => void;
  prev: () => void;
}

interface WhydPlayer {
  emit: (eventName: string, params: uknown) => void;
  playAll: (node: unknown) => void;
  pause: () => void;
  playPause: () => void;
  refresh: () => void;
}

interface Window {
  jQuery: JQuery;
  Playem: (unknown) => void;
  playem: Playem;
  playTrack: () => void;
  showMessage: (message: string, isError?: boolean) => void;
  Whyd: {
    tracking: { logTrackPlay: (postId: string) => void };
  };
  user: {
    lastFm: unknown;
  };
  loadMore: (params: unknown, callback: () => void) => void;
  BandcampPatchedPlayer: () => unknown;
  toggleLovePost: (postId: string) => void;
  publishPost: (postId: string) => void;
  goToPage: (url: string) => void;
  whydPlayer: WhydPlayer;
}
