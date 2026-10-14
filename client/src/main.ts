import './pwa';
import './pwa.css';
import {installGameInputGuard} from './input/game-input-guard';
installGameInputGuard();
import { installRuntimeErrorRecorder } from './diagnostics/runtime-errors';

installRuntimeErrorRecorder();

// Server mode remains opt-in; the default production client has no room/API dependency.
if (import.meta.env.VITE_GAME_MODE === 'online') {
  void import('./main-online');
} else {
  void import('./local/local-main');
}
export {};
