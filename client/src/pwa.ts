type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
let pending: InstallEvent | undefined;
const installed = () =>
  matchMedia('(display-mode: standalone)').matches ||
  matchMedia('(display-mode: fullscreen)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone;
const button = document.createElement('button');
button.id = 'install-game';
button.type = 'button';
button.textContent = '✦ 게임 설치';
button.setAttribute('aria-label', '던전 ZERO 앱 설치');
const dialog = document.createElement('dialog');
dialog.id = 'install-guide';
dialog.innerHTML =
  '<h2>던전 ZERO 설치</h2><p id="install-description"></p><button type="button">확인</button>';
dialog.querySelector('button')!.onclick = () => dialog.close();
document.body.append(button, dialog);
const sync = () => {
  button.hidden = !!installed();
};
sync();
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  pending = e as InstallEvent;
  sync();
});
window.addEventListener('appinstalled', () => {
  pending = undefined;
  button.hidden = true;
});
button.onclick = async () => {
  if (pending) {
    const event = pending;
    pending = undefined;
    await event.prompt();
    await event.userChoice;
    sync();
    return;
  }
  const ua = navigator.userAgent;
  dialog.querySelector('p')!.textContent = /KAKAOTALK/i.test(ua)
    ? '카카오 메뉴에서 다른 브라우저로 열기를 선택한 뒤 Chrome 또는 Safari에서 설치하세요.'
    : /iPhone|iPad|iPod/i.test(ua)
      ? 'Safari의 공유 메뉴에서 홈 화면에 추가를 선택하세요. 홈 화면 아이콘으로 실행하면 앱 화면으로 열립니다.'
      : 'Chrome 또는 Edge 메뉴의 앱 설치 / 홈 화면에 추가를 선택하세요. 설치 메뉴가 준비되면 이 버튼에서 바로 설치할 수 있습니다.';
  dialog.showModal();
};
