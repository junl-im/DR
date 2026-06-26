/// <reference types="vite/client" />

declare module 'howler' {
  export const Howler: any;
  export class Howl { constructor(options: any); play(): any; }
}

declare module 'pixi.js' {
  export class Application { [key: string]: any; constructor(...args: any[]); init(...args: any[]): Promise<void>; }
  export const Assets: any;
  export class Container { [key: string]: any; constructor(...args: any[]); }
  export class Graphics { [key: string]: any; constructor(...args: any[]); }
  export class Sprite { [key: string]: any; constructor(...args: any[]); }
  export const Texture: any;
  export class Text { [key: string]: any; constructor(...args: any[]); }
}

declare module 'gsap' {
  export const gsap: any;
}

declare module '@esotericsoftware/spine-pixi-v8' {
  const runtime: any;
  export default runtime;
}

declare module 'firebase/firestore' {
  export const collection: any;
  export const doc: any;
  export const getDocs: any;
  export const limit: any;
  export const orderBy: any;
  export const query: any;
  export const serverTimestamp: any;
  export const setDoc: any;
}


interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
