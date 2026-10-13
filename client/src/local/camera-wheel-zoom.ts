/** Limit wheel zoom to an intentionally modest RPG framing window. */
export const CAMERA_ZOOM_MIN=.82;
export const CAMERA_ZOOM_MAX=1.24;
export const CAMERA_ZOOM_STEP=.08;
export function clampCameraZoom(value:number):number {
 if(!Number.isFinite(value))return 1;
 return Math.min(CAMERA_ZOOM_MAX,Math.max(CAMERA_ZOOM_MIN,value));
}
export function nextWheelZoom(current:number,deltaY:number):number {
 if(!Number.isFinite(deltaY)||deltaY===0)return clampCameraZoom(current);
 // Wheel down zooms OUT, wheel up IN. Never enable free camera rotation.
 return clampCameraZoom(current+(deltaY>0?CAMERA_ZOOM_STEP:-CAMERA_ZOOM_STEP));
}
