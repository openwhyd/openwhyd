export interface UserDocument {
  _id: any;
  bio: string;
  consent: {
    date: string;
    lang: string;
  };
  cvrImg: string;
  email: string;
  handle: string;
  id: string;
  img: string;
  lnk: {
    home: string;
    tw: string;
  };
  loc: string;
  md5: string;
  mid: string;
  n: string;
  name: string;
  pl: { id: string; name: string; nbTracks: number; url: string }[];
  pref: {
    emAcc: number;
    emAdd: number;
    emCom: number;
    emFrd: number;
    emLik: number;
    emMen: number;
    emRep: number;
    emSam: number;
    emSub: number;
    hideBkAd: boolean;
    mnAcc: number;
    mnAdd: number;
    mnCom: number;
    mnFrd: number;
    mnLik: number;
    mnMen: number;
    mnRep: number;
    mnSam: number;
    mnSnp: number;
    mnSnt: number;
    mnSub: number;
    pendEN: number;
  };
  pwd: string;
}
