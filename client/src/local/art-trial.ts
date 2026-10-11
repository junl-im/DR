import type { PlayerManifestEntry } from '../scene/creature/player-manifest';
export const ART_TRIALS: Record<string,PlayerManifestEntry> = {
  knight: {classId:0,displayName:'V3 중갑 기사',model:'/models/characters/system-g6/knight.glb',scale:.5,feetOffsetY:.9,clipMap:{idle:'Idle',move:'Run',attack:'Attack',cast:'Cast',die:'Death'}},
  ranger: {classId:0,displayName:'V3 경갑 모험가',model:'/models/characters/system-g6/ranger.glb',scale:.5,feetOffsetY:.9,clipMap:{idle:'Idle',move:'Run',attack:'Attack',cast:'Cast',die:'Death'}},
  traveler: {classId:0,displayName:'V3 여행자',model:'/models/characters/system-g6/traveler.glb',scale:.5,feetOffsetY:.9,clipMap:{idle:'Idle',move:'Run',attack:'Attack',cast:'Cast',die:'Death'}},
};
