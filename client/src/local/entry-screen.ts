export const ENTRY_CHARACTERS=[
 {id:0,name:'수호자',tag:'검과 방패',detail:'강철의 의지로 폐허의 문을 여는 모험가.',portrait:'guardian'},
 {id:10,name:'별의 학자',tag:'별빛과 마법',detail:'잊힌 별의 기록을 따라 어둠을 밝히는 탐구자.',portrait:'scholar'},
 {id:18,name:'숲의 방랑자',tag:'숲과 탐험',detail:'바람의 흔적을 읽으며 미지의 길을 걷는 여행자.',portrait:'ranger'},
] as const;
/** Only flags are interpolated; saved names are assigned via textContent. */
export function entryScreen(hasSave:boolean,hasStorageError:boolean){return `<section class="entry title-entry" aria-label="던전 zero 시작 화면">
 <div class="entry-world" aria-hidden="true"></div><div class="entry-vignette" aria-hidden="true"></div>
 <header class="entry-masthead"><span>DUNGEON ZERO</span><span>THE FIRST CHAPTER</span></header>
 <div class="entry-layout"><div class="entry-intro"><p class="entry-kicker">잊힌 세계의 문이 열린다</p><h1>던전 <em>zero</em></h1><div class="title-rule" aria-hidden="true"><span>✦</span></div><p class="entry-story">모든 모험은, 하나의 이름에서 시작된다.</p></div>
 <form id="entry-form" class="entry-card" aria-label="캐릭터 생성"><div class="creation-heading"><span class="eyebrow">BEGIN YOUR JOURNEY</span><h2>당신의 모험을 시작하세요</h2></div>
 <label class="name-label" for="name"><span>01</span> 캐릭터 이름</label><input id="name" name="character-name" maxlength="20" required value="모험가" autocomplete="nickname" spellcheck="false" aria-describedby="name-hint"/><small id="name-hint">이 세계에 남길 이름 · 최대 20자</small>
 <fieldset class="character-field"><legend><span>02</span> 캐릭터 선택</legend><div class="character-options">${ENTRY_CHARACTERS.map((c,i)=>`<label class="character-card"><input type="radio" name="character" value="${c.id}" ${i===0?'checked':''}/><span class="character-portrait ${c.portrait}" aria-hidden="true"></span><span class="character-copy"><strong>${c.name}</strong><small>${c.tag}</small></span><span class="character-check" aria-hidden="true">◆</span></label>`).join('')}</div></fieldset>
 <div class="character-description"><strong id="selected-class-name">수호자</strong><p id="selected-class-detail">${ENTRY_CHARACTERS[0].detail}</p></div>
 <button id="start" class="primary start-adventure" type="submit"><span>${hasSave?'새로운 모험 시작':'게임 시작'}</span><b aria-hidden="true">⟶</b></button>
 ${hasSave?'<button id="continue" type="button" class="continue-adventure">이전 모험 이어하기 <span id="continue-name"></span></button>':''}
 ${hasStorageError?'<button id="recover" type="button">백업 슬롯 복구</button>':''}
 <div id="browser-help" hidden><p>카카오에서는 전체화면이 제한될 수 있습니다.</p><button id="external-browser" type="button">다른 브라우저로 열기</button><button id="copy-game-url" type="button">게임 주소 복사</button><input id="game-url" readonly hidden aria-label="복사할 게임 주소"></div>
 <p id="screen-status" role="status"></p><p id="entry-status" role="status"></p><small class="entry-save-note">진행 상황은 이 기기에 자동 저장됩니다.</small></form></div>
 <footer class="entry-footer"><span>던전 zero · 당신의 첫 번째 모험</span><span>오리지널 타이틀 아트</span></footer>
 </section>`;}
