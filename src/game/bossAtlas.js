export const BOSS_ATLAS_SHEET = { width: 1800, height: 675, image: `${import.meta.env.BASE_URL}assets/atlas/boss-frames-v2.png`, webp: `${import.meta.env.BASE_URL}assets/atlas/boss-frames-v2.webp` };

export const BOSS_ATLAS_FRAMES = {
  "boss-motion-v2/frame-01.png": {
    "x": 3,
    "y": 13,
    "w": 293,
    "h": 198
  },
  "boss-motion-v2/frame-02.png": {
    "x": 300,
    "y": 12,
    "w": 300,
    "h": 201
  },
  "boss-motion-v2/frame-03.png": {
    "x": 602,
    "y": 21,
    "w": 296,
    "h": 183
  },
  "boss-motion-v2/frame-04.png": {
    "x": 905,
    "y": 0,
    "w": 289,
    "h": 225
  },
  "boss-motion-v2/frame-05.png": {
    "x": 1200,
    "y": 0,
    "w": 300,
    "h": 225
  },
  "boss-motion-v2/frame-06.png": {
    "x": 1502,
    "y": 0,
    "w": 296,
    "h": 225
  },
  "boss-motion-v2/frame-07.png": {
    "x": 3,
    "y": 238,
    "w": 293,
    "h": 199
  },
  "boss-motion-v2/frame-08.png": {
    "x": 300,
    "y": 236,
    "w": 300,
    "h": 202
  },
  "boss-motion-v2/frame-09.png": {
    "x": 602,
    "y": 238,
    "w": 296,
    "h": 199
  },
  "boss-sticker-v2/frame-01.png": {
    "x": 919,
    "y": 231,
    "w": 262,
    "h": 213
  },
  "boss-sticker-v2/frame-02.png": {
    "x": 1221,
    "y": 232,
    "w": 257,
    "h": 211
  },
  "boss-sticker-v2/frame-03.png": {
    "x": 1513,
    "y": 235,
    "w": 274,
    "h": 205
  },
  "boss-sticker-v2/frame-04.png": {
    "x": 16,
    "y": 450,
    "w": 267,
    "h": 225
  },
  "boss-sticker-v2/frame-05.png": {
    "x": 318,
    "y": 450,
    "w": 263,
    "h": 225
  },
  "boss-sticker-v2/frame-06.png": {
    "x": 619,
    "y": 450,
    "w": 262,
    "h": 225
  },
  "boss-sticker-v2/frame-07.png": {
    "x": 923,
    "y": 466,
    "w": 254,
    "h": 193
  },
  "boss-sticker-v2/frame-08.png": {
    "x": 1207,
    "y": 466,
    "w": 286,
    "h": 193
  },
  "boss-sticker-v2/frame-09.png": {
    "x": 1513,
    "y": 469,
    "w": 274,
    "h": 187
  }
};

export function getBossAtlasFrame(frameKey) {
  return BOSS_ATLAS_FRAMES[frameKey] || null;
}
