import { ObjectId } from 'mongodb';

export interface UserDocument {
  _id: ObjectId;
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
  lastFm: unknown;
  fbTok: unknown;
  twTok: unknown;
  twSec: unknown;
}

/** To be completed */
export interface PostDocument {
  _id: ObjectId;
  name: string;
  eId: string;
  uId: string;
  uNm: string;
  pl?: { id: string | number; name: string };
}
