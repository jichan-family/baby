/* 우리 아이 기록장 v1.1.0 */
'use strict';
var APP_VERSION = '1.1.0';

/* ───────── 기본 도우미 ───────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const num = v => (v === '' || v == null || isNaN(Number(v))) ? null : Number(v);
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICON = {
  home: svg('<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>'),
  chart: svg('<path d="M4 19h16"/><path d="M5 15l4-5 4 3 6-7"/>'),
  plus: svg('<circle cx="12" cy="12" r="10" fill="currentColor" stroke="none"/><path d="M12 7.5v9M7.5 12h9" stroke="#fff" stroke-width="2.2"/>'),
  chat: svg('<path d="M5 18l-1 3 4-1.5A8 8 0 1 0 5 18z"/>'),
  health: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M9.5 11h5M12 8.5v5"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>'),
  down: svg('<path d="M6 9l6 6 6-6"/>'),
  back: svg('<path d="M15 18l-6-6 6-6"/>'),
  heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
  heartOn: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  photo: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 16l-5-5-8 8"/>')
};

/* 태그: 기본 태그 + 설정에서 만든 태그 (Tags 표) */
const DEFAULT_TAGS = [
  { k: 'first', l: '⭐ 처음 한 일' }, { k: 'word', l: '💬 새 말' }, { k: 'sick', l: '🏥 아픈 날' },
  { k: 'outing', l: '🚗 나들이' }, { k: 'anniv', l: '🎂 기념일' }
];
function allTags() {
  const map = {};
  DEFAULT_TAGS.forEach((t, i) => { map[t.k] = { k: t.k, l: t.l, order: i, hidden: false, base: true }; });
  T('Tags').forEach(r => {
    const k = r.key || r.id;
    map[k] = Object.assign(map[k] || { k, base: false }, { l: r.label || (map[k] || {}).l || k, order: num(r.order) != null ? num(r.order) : 99, hidden: String(r.hidden).toUpperCase() === 'TRUE', rowId: r.id });
  });
  return Object.values(map).sort((a, b) => a.order - b.order);
}
const visibleTags = () => allTags().filter(t => !t.hidden);
const tagLabel = k => (allTags().find(t => t.k === k) || { l: k }).l;

/* 발달 체크리스트
   출처: 미국 CDC "Learn the Signs. Act Early." 발달 체크리스트 (2022 개정, 공공 자료)
   각 시기까지 대부분(75% 이상)의 아이가 하는 것. d: 사회 / 말 / 인지 / 몸 */
const MS_GROUPS = [
  { m: 2, label: '2개월', items: [
    ['m2_calm', '말을 걸거나 안아주면 진정해요', '사회'], ['m2_face', '엄마·아빠 얼굴을 바라봐요', '사회'], ['m2_happy', '다가가면 반가워하는 것 같아요', '사회'], ['m2_smile', '말을 걸거나 웃어주면 따라 웃어요', '사회'],
    ['m2_sound', '울음 말고 다른 소리를 내요', '말'], ['m2_loud', '큰 소리에 반응해요', '말'],
    ['m2_watch', '움직이는 사람을 눈으로 따라가요', '인지'], ['m2_toy', '장난감을 몇 초 동안 바라봐요', '인지'],
    ['m2_headup', '엎드렸을 때 머리를 들어요', '몸'], ['m2_limbs', '팔다리를 모두 움직여요', '몸'], ['m2_hands', '손을 잠깐씩 펴요', '몸']] },
  { m: 4, label: '4개월', items: [
    ['m4_smile', '관심을 끌려고 먼저 웃어요', '사회'], ['m4_chuckle', '웃기려고 하면 킥킥거려요', '사회'], ['m4_attn', '관심을 끌려고 보거나 움직이거나 소리 내요', '사회'],
    ['m4_coo', '"우~", "아~" 같은 옹알이를 해요', '말'], ['m4_back', '말을 걸면 소리로 대답해요', '말'], ['m4_turn', '목소리 나는 쪽으로 고개를 돌려요', '말'],
    ['m4_hungry', '배고플 때 젖병·젖을 보면 입을 벌려요', '인지'], ['m4_handlook', '자기 손을 신기하게 바라봐요', '인지'],
    ['head', '안고 있을 때 목을 혼자 가눠요', '몸'], ['m4_hold', '손에 쥐여주면 장난감을 잡아요', '몸'], ['m4_swing', '장난감을 향해 팔을 휘둘러요', '몸'], ['m4_mouth', '손을 입으로 가져가요', '몸'], ['m4_elbow', '엎드려서 팔꿈치로 상체를 받쳐요', '몸']] },
  { m: 6, label: '6개월', items: [
    ['m6_know', '익숙한 사람을 알아봐요', '사회'], ['m6_mirror', '거울 속 자기 모습을 좋아해요', '사회'], ['m6_laugh', '소리 내어 웃어요', '사회'],
    ['m6_turns', '주고받으며 소리를 내요', '말'], ['m6_raspb', '혀를 내밀고 "푸~" 하고 불어요', '말'], ['m6_squeal', '꺅꺅 높은 소리를 내요', '말'],
    ['m6_explore', '물건을 입에 넣어 탐색해요', '인지'], ['m6_reach', '갖고 싶은 장난감에 손을 뻗어 잡아요', '인지'], ['m6_lips', '더 먹기 싫으면 입을 다물어요', '인지'],
    ['roll', '배에서 등으로 뒤집어요', '몸'], ['m6_push', '엎드려서 팔을 펴고 상체를 들어요', '몸'], ['m6_lean', '앉을 때 손으로 바닥을 짚고 버텨요', '몸']] },
  { m: 9, label: '9개월', items: [
    ['m9_shy', '낯선 사람 앞에서 낯을 가리거나 매달려요', '사회'], ['m9_faces', '기쁨·슬픔·화남·놀람 등 여러 표정을 지어요', '사회'], ['m9_name', '이름을 부르면 쳐다봐요', '사회'], ['m9_leave', '엄마·아빠가 떠나면 반응해요 (찾거나 울어요)', '사회'], ['m9_peek', '까꿍 놀이에 웃어요', '사회'],
    ['m9_babble', '"마마마", "바바바" 같은 소리를 내요', '말'], ['m9_arms', '안아달라고 팔을 들어요', '말'],
    ['m9_look', '떨어뜨린 물건을 찾아요', '인지'], ['m9_bang', '두 물건을 맞부딪쳐요', '인지'],
    ['m9_getsit', '혼자 앉는 자세를 잡아요', '몸'], ['m9_pass', '물건을 한 손에서 다른 손으로 옮겨요', '몸'], ['m9_rake', '손가락으로 음식을 끌어와요', '몸'], ['sit', '받쳐주지 않아도 혼자 앉아요', '몸'],
    ['crawl', '기어 다녀요 (CDC 목록 외 참고 항목)', '몸']] },
  { m: 12, label: '12개월', items: [
    ['m12_game', '짝짜꿍 같은 놀이를 함께해요', '사회'],
    ['wave', '빠이빠이 손을 흔들어요', '말'], ['mama', '엄마·아빠를 "엄마", "아빠"처럼 불러요', '말'], ['m12_no', '"안 돼"를 알아들어요 (멈칫하거나 멈춰요)', '말'],
    ['m12_put', '컵에 블록을 넣는 것처럼 물건을 통에 넣어요', '인지'], ['m12_hide', '숨기는 걸 본 물건을 찾아요', '인지'],
    ['stand_help', '잡고 일어서요', '몸'], ['walk_help', '가구를 잡고 걸어요', '몸'], ['m12_cup', '잡아주면 뚜껑 없는 컵으로 마셔요', '몸'], ['m12_pinch', '엄지와 검지로 작은 것을 집어요', '몸']] },
  { m: 15, label: '15개월', items: [
    ['m15_copy', '놀 때 다른 아이를 따라 해요', '사회'], ['m15_show', '좋아하는 물건을 보여줘요', '사회'], ['m15_clap', '신나면 손뼉을 쳐요', '사회'], ['m15_hug', '인형이나 장난감을 안아요', '사회'], ['m15_aff', '안기거나 뽀뽀하며 애정을 표현해요', '사회'],
    ['word1', '엄마·아빠 말고 한두 단어를 말하려 해요', '말'], ['m15_name', '이름을 말하면 그 물건을 쳐다봐요', '말'], ['m15_follow', '손짓과 말로 하는 지시를 따라요', '말'], ['point', '원하는 것을 달라고 손가락으로 가리켜요', '말'],
    ['m15_use', '전화기·컵·책을 제대로 쓰려고 해요', '인지'], ['blocks2', '블록 같은 작은 물건을 2개 이상 쌓아요', '인지'],
    ['m15_steps', '혼자 몇 걸음 걸어요', '몸'], ['m15_feed', '손가락으로 음식을 집어 먹어요', '몸']] },
  { m: 18, label: '18개월', items: [
    ['m18_away', '떨어져 놀다가 엄마·아빠가 있는지 돌아봐요', '사회'], ['m18_point', '재미있는 것을 가리켜 보여줘요', '사회'], ['m18_wash', '손 씻으라면 손을 내밀어요', '사회'], ['m18_book', '책 몇 장을 함께 봐요', '사회'], ['m18_dress', '옷 입힐 때 팔을 넣거나 발을 들어 도와요', '사회'],
    ['words3', '엄마·아빠 말고 단어를 3개 이상 말해요', '말'], ['follow1', '손짓 없이 말로만 해도 한 단계 지시를 따라요', '말'],
    ['copy', '청소 같은 집안일을 따라 해요', '인지'], ['m18_car', '장난감 자동차를 밀며 노는 등 간단하게 놀아요', '인지'],
    ['walk', '아무것도 잡지 않고 걸어요', '몸'], ['scribble', '끄적거려요', '몸'], ['cup', '뚜껑 없는 컵으로 마셔요 (가끔 흘려요)', '몸'], ['m18_finger', '손가락으로 집어 먹어요', '몸'], ['spoon', '숟가락을 써보려 해요', '몸'], ['m18_climb', '소파나 의자에 혼자 오르내려요', '몸']] },
  { m: 24, label: '2세 (24개월)', items: [
    ['m24_notice', '다른 사람이 다치거나 속상하면 알아채요', '사회'], ['m24_look', '낯선 상황에서 엄마·아빠 얼굴을 보고 반응을 살펴요', '사회'],
    ['m24_bookpt', '"곰돌이 어디 있어?" 하면 책에서 가리켜요', '말'], ['two', '"우유 더"처럼 두 단어를 붙여 말해요', '말'], ['body', '물어보면 신체 부위를 2곳 이상 가리켜요', '말'], ['m24_gest', '손 흔들기·가리키기 말고 뽀뽀 날리기, 고개 끄덕이기 같은 몸짓을 해요', '말'],
    ['m24_switch', '장난감의 버튼·스위치·손잡이를 써보려 해요', '인지'], ['m24_two', '장난감 음식을 접시에 담듯 두 가지 이상으로 함께 놀아요', '인지'], ['m24_hold', '한 손으로 통을 잡고 다른 손으로 뚜껑을 여는 식으로 두 손을 따로 써요', '인지'],
    ['kick', '공을 차요', '몸'], ['run', '뛰어요', '몸'], ['stairs', '도움을 받거나 혼자 계단 몇 칸을 걸어 올라가요', '몸'], ['m24_spoon', '숟가락으로 먹어요', '몸']] },
  { m: 30, label: '30개월', items: [
    ['m30_play', '다른 아이 옆에서 놀고 가끔 같이 놀아요', '사회'], ['m30_look', '"나 봐!" 하며 할 수 있는 걸 보여줘요', '사회'], ['m30_routine', '"정리할 시간이야" 하면 장난감 정리를 도와요', '사회'],
    ['words50', '단어를 50개쯤 말해요', '말'], ['m30_action', '"멍멍이 뛰어"처럼 동작어를 넣어 두 단어 이상 말해요', '말'], ['m30_name', '책 그림을 가리키며 "이게 뭐야?" 하면 이름을 말해요', '말'], ['m30_me', '"나", "내가", "우리" 같은 말을 써요', '말'],
    ['m30_pretend', '블록을 음식인 척 인형에게 먹이는 등 흉내 놀이를 해요', '인지'], ['m30_solve', '높은 곳 물건을 잡으려고 작은 의자에 올라가는 등 문제를 해결해요', '인지'], ['m30_two', '"장난감 내려놓고 문 닫아" 같은 두 단계 지시를 따라요', '인지'], ['m30_color', '색깔을 하나 이상 알아요', '인지'],
    ['m30_twist', '문손잡이를 돌리거나 뚜껑을 돌려 열어요', '몸'], ['m30_undress', '헐렁한 바지나 열린 겉옷을 혼자 벗어요', '몸'], ['m30_jump', '두 발로 깡충 뛰어요', '몸'], ['m30_page', '책을 한 장씩 넘겨요', '몸']] },
  { m: 36, label: '3세', items: [
    ['m36_calm', '어린이집에 데려다주면 10분 안에 진정해요', '사회'], ['m36_join', '다른 아이를 보고 함께 놀아요', '사회'],
    ['m36_talk', '두 번 이상 주고받으며 대화해요', '말'], ['m36_ask', '"누구?", "뭐?", "어디?", "왜?"라고 물어요', '말'], ['m36_action', '그림 속 동작을 말해요 (달려, 먹어)', '말'], ['m36_name', '물어보면 자기 이름을 말해요', '말'], ['m36_clear', '다른 사람도 대부분 알아듣게 말해요', '말'],
    ['m36_circle', '보여주면 동그라미를 그려요', '인지'], ['m36_hot', '"뜨거워" 하면 뜨거운 것을 피해요', '인지'],
    ['m36_string', '큰 구슬 같은 것을 줄에 꿰어요', '몸'], ['m36_dress', '헐렁한 바지나 겉옷을 혼자 입어요', '몸'], ['m36_fork', '포크를 써요', '몸']] },
  { m: 48, label: '4세', items: [
    ['m48_pretend', '선생님·영웅·강아지 등 다른 무언가인 척 놀아요', '사회'], ['m48_ask', '친구와 놀고 싶다고 말해요', '사회'], ['m48_comfort', '다치거나 슬픈 친구를 달래줘요', '사회'], ['m48_danger', '높은 곳에서 뛰어내리지 않는 등 위험을 피해요', '사회'], ['m48_helper', '"도와주는 사람" 역할을 좋아해요', '사회'], ['m48_place', '장소에 따라 행동을 바꿔요 (도서관, 놀이터)', '사회'],
    ['m48_four', '네 단어 이상으로 된 문장을 말해요', '말'], ['m48_song', '노래나 동화의 말을 조금 따라 해요', '말'], ['m48_day', '그날 있었던 일을 하나 이상 말해요', '말'], ['m48_what', '"외투는 뭐 할 때 써?" 같은 질문에 대답해요', '말'],
    ['m48_colors', '물건 색깔 몇 가지를 말해요', '인지'], ['m48_story', '잘 아는 이야기에서 다음 내용을 말해요', '인지'], ['m48_person', '몸 부분이 3개 이상 있는 사람을 그려요', '인지'],
    ['m48_catch', '큰 공을 대부분 받아요', '몸'], ['m48_pour', '어른이 보는 앞에서 음식을 덜거나 물을 따라요', '몸'], ['m48_unbutton', '단추를 몇 개 풀어요', '몸'], ['m48_crayon', '크레용을 주먹이 아닌 손가락으로 쥐어요', '몸']] },
  { m: 60, label: '5세', items: [
    ['m60_rules', '친구들과 놀 때 규칙을 지키거나 차례를 기다려요', '사회'], ['m60_perform', '노래하거나 춤추거나 연기를 보여줘요', '사회'], ['m60_chores', '양말 짝 맞추기, 식탁 치우기 같은 간단한 집안일을 해요', '사회'],
    ['m60_tell', '사건이 2개 이상인 이야기를 들려줘요', '말'], ['m60_answer', '책을 읽어준 뒤 간단한 질문에 대답해요', '말'], ['m60_convo', '세 번 넘게 주고받으며 대화를 이어가요', '말'], ['m60_rhyme', '끝말이 같은 말장난을 알아요', '말'],
    ['m60_count', '10까지 세요', '인지'], ['m60_numbers', '1~5 사이 숫자를 몇 개 읽어요', '인지'], ['m60_time', '"어제", "내일", "아침", "밤" 같은 시간 말을 써요', '인지'], ['m60_focus', '5~10분 동안 집중해서 활동해요', '인지'], ['m60_write', '자기 이름 글자 몇 개를 써요', '인지'], ['m60_letters', '가리키는 글자 몇 개를 읽어요', '인지'],
    ['m60_button', '단추를 몇 개 채워요', '몸'], ['m60_hop', '한 발로 깡충 뛰어요', '몸']] }
];
const MS_DOMAINS = ['사회', '말', '인지', '몸', '기타'];
const MS_DOMAIN_LABEL = { 사회: '사회·정서', 말: '말·소통', 인지: '인지', 몸: '몸 움직임', 기타: '직접 추가' };

/* 이: 젖니 20개 + 영구치 32개
   젖니 나는 시기·빠지는 시기, 영구치 나는 시기: 미국치과협회(ADA) 치아 발달표 기준 (개월) */
const PRIMARY_NAMES = ['가운데 앞니', '옆 앞니', '송곳니', '첫째 어금니', '둘째 어금니'];
const PRIMARY_RANGE = { U: [[8, 12], [9, 13], [16, 22], [13, 19], [25, 33]], L: [[6, 10], [10, 16], [17, 23], [14, 18], [23, 31]] };
const PRIMARY_SHED = { U: [[72, 84], [84, 96], [120, 144], [108, 132], [120, 144]], L: [[72, 84], [84, 96], [108, 144], [108, 132], [120, 144]] };
const PERM_NAMES = ['가운데 앞니', '옆 앞니', '송곳니', '첫째 작은어금니', '둘째 작은어금니', '첫째 큰어금니', '둘째 큰어금니', '사랑니'];
const PERM_RANGE = { U: [[84, 96], [96, 108], [132, 144], [120, 132], [120, 144], [72, 84], [144, 156], [204, 252]],
                     L: [[72, 84], [84, 96], [108, 120], [120, 144], [132, 144], [72, 84], [132, 156], [204, 252]] };
const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
const TEETH = [], PERM = [];
['U', 'L'].forEach(j => ['R', 'L'].forEach(s => {
  [0, 1, 2, 3, 4].forEach(i => TEETH.push({ code: j + s + i, jaw: j, side: s, i, no: i + 1,
    name: (j === 'U' ? '위 ' : '아래 ') + (s === 'R' ? '오른쪽 ' : '왼쪽 ') + CIRCLED[i] + ' ' + PRIMARY_NAMES[i],
    from: PRIMARY_RANGE[j][i][0], to: PRIMARY_RANGE[j][i][1], shedFrom: PRIMARY_SHED[j][i][0], shedTo: PRIMARY_SHED[j][i][1] }));
  [0, 1, 2, 3, 4, 5, 6, 7].forEach(i => PERM.push({ code: 'P' + j + s + i, jaw: j, side: s, i, no: i + 1, perm: true,
    name: (j === 'U' ? '위 ' : '아래 ') + (s === 'R' ? '오른쪽 ' : '왼쪽 ') + CIRCLED[i] + ' ' + PERM_NAMES[i],
    from: PERM_RANGE[j][i][0], to: PERM_RANGE[j][i][1] }));
}));
const toothByCode = c => TEETH.find(t => t.code === c) || PERM.find(t => t.code === c);
const yrs = m => m >= 24 && m % 12 === 0 ? `${m / 12}세` : m >= 24 ? `${(m / 12).toFixed(1).replace('.0', '')}세` : `${m}개월`;

const WORD_CATS = ['사람', '음식', '동물', '물건', '탈것', '몸', '동작', '표현', '기타'];
const VISIT_KINDS = ['진료', '아픈 날', '치과', '응급실', '입원', '기타'];

/* ───────── 상태 ───────── */
const S = {
  token: LS.get('token', null), user: LS.get('user', null), data: LS.get('data', null),
  child: LS.get('child', null), showRef: LS.get('showRef', true),
  filter: { q: '', tag: '', month: '', author: '' }, page: 20, devTab: 'growth', measure: 'height', wordKind: 'word',
  wordQ: '', showDone: false, waitingSW: null, loading: false
};
const T = name => (S.data && S.data[name]) || [];

/* ───────── 날짜·나이 ───────── */
const pad = n => String(n).padStart(2, '0');
const parseD = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const fmtD = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => fmtD(new Date());
const diffDays = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
const addMonths = (b, m) => { const y = b.getFullYear(), mo = b.getMonth() + m; const last = new Date(y, mo + 1, 0).getDate(); return new Date(y, mo, Math.min(b.getDate(), last)); };
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const dayTitle = s => { const d = parseD(s); return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`; };

function age(child, date) {
  date = date || today();
  const b = parseD(child.birth), d = parseD(date);
  const days = diffDays(child.birth, date);
  let m = (d.getFullYear() - b.getFullYear()) * 12 + d.getMonth() - b.getMonth();
  while (m > 0 && addMonths(b, m) > d) m--;
  if (days < 0) m = 0;
  const rem = days < 0 ? 0 : Math.round((d - addMonths(b, m)) / 864e5);
  return { days, dplus: days + 1, months: m, rem, mDec: days / 30.4375 };
}
function monthText(m) { return m < 36 ? `${m}개월` : `만 ${Math.floor(m / 12)}세${m % 12 ? ' ' + (m % 12) + '개월' : ''}`; }
function ageLabel(child, date, long) {
  if (!child || !child.birth) return '';
  const a = age(child, date);
  if (a.days < 0) return '태어나기 전';
  return `D+${a.dplus} · ${monthText(a.months)}${long && a.months < 36 ? ' ' + a.rem + '일' : ''}`;
}

/* 날짜 정확도(정확한 날짜 / ○개월쯤 / 기간 / ○개월 이전) */
function dtLabel(r, child) {
  if (!r) return '';
  if (r.dateType === 'approx') return `약 ${r.month}개월`;
  if (r.dateType === 'range') return `${r.month}~${r.monthTo}개월`;
  if (r.dateType === 'before') return `${r.month}개월 이전`;
  if (isDate(r.date)) return child ? `${r.date.slice(2).replace(/-/g, '.')} (${monthText(age(child, r.date).months)})` : r.date;
  return '';
}
function dtMonth(r, child) {
  if (!r) return null;
  if (r.dateType === 'approx' || r.dateType === 'before') return num(r.month);
  if (r.dateType === 'range') return (num(r.month) + num(r.monthTo)) / 2;
  if (isDate(r.date) && child) return age(child, r.date).mDec;
  return null;
}
function dtForm(v, child) {
  v = v || {};
  const type = v.dateType || 'exact';
  const opt = [['exact', '정확한 날짜'], ['approx', '○개월쯤'], ['range', '기간'], ['before', '○개월 이전부터']];
  const cur = child ? age(child).months : '';
  return `<div class="dtf">
    <div class="chips" style="margin:4px 0 8px">${opt.map(([k, l]) => `<button type="button" class="chip ${k === type ? 'on' : ''}" data-act="dtType" data-v="${k}">${l}</button>`).join('')}</div>
    <input type="hidden" name="dateType" value="${type}">
    <div data-dt="exact" class="${type === 'exact' ? '' : 'hidden'}"><input class="i" type="date" name="date" value="${esc(isDate(v.date) ? v.date : today())}"></div>
    <div data-dt="approx" class="${type === 'approx' ? '' : 'hidden'} row"><input class="i" type="number" inputmode="decimal" name="m_approx" value="${esc(v.month || '')}" placeholder="예: 10" style="width:110px"> <span class="muted">개월쯤</span></div>
    <div data-dt="range" class="${type === 'range' ? '' : 'hidden'} row"><input class="i" type="number" inputmode="decimal" name="m_from" value="${esc(v.month || '')}" placeholder="9" style="width:80px"> ~ <input class="i" type="number" inputmode="decimal" name="m_to" value="${esc(v.monthTo || '')}" placeholder="11" style="width:80px"> <span class="muted">개월 사이</span></div>
    <div data-dt="before" class="${type === 'before' ? '' : 'hidden'} row"><input class="i" type="number" inputmode="decimal" name="m_before" value="${esc(v.month || cur)}" style="width:110px"> <span class="muted">개월 이전부터 (언제인지 모름)</span></div>
  </div>`;
}
function readDt(root) {
  const g = n => (root.querySelector(`[name="${n}"]`) || {}).value;
  const t = g('dateType');
  if (t === 'exact') { if (!isDate(g('date'))) throw new Error('날짜를 골라주세요.'); return { dateType: 'exact', date: g('date'), month: '', monthTo: '' }; }
  if (t === 'approx') { if (num(g('m_approx')) == null) throw new Error('몇 개월쯤인지 적어주세요.'); return { dateType: 'approx', date: '', month: num(g('m_approx')), monthTo: '' }; }
  if (t === 'range') { const a = num(g('m_from')), b = num(g('m_to')); if (a == null || b == null || b < a) throw new Error('기간을 바르게 적어주세요.'); return { dateType: 'range', date: '', month: a, monthTo: b }; }
  if (num(g('m_before')) == null) throw new Error('개월 수를 적어주세요.');
  return { dateType: 'before', date: '', month: num(g('m_before')), monthTo: '' };
}

/* ───────── 아이 ───────── */
const children = () => T('Children').slice().sort((a, b) => (num(a.order) || 0) - (num(b.order) || 0));
const childById = id => T('Children').find(c => c.id === id);
function curChild() {
  const cs = children();
  if (S.child === 'all' && cs.length > 1) return null;
  return cs.find(c => c.id === S.child) || cs[0] || null;
}
const pageChild = () => curChild() || children()[0] || null;

/* ───────── 서버 ───────── */
async function api(action, payload) {
  const url = APP_CONFIG.API_URL || '';
  if (!/^https:\/\/script\.google\.com\//.test(url)) throw new Error('config.js에 웹 앱 주소(API_URL)를 넣어주세요.');
  let res;
  try {
    res = await fetch(url, { method: 'POST', body: JSON.stringify(Object.assign({ action, token: S.token }, payload || {})) });
  } catch (e) { throw new Error('인터넷 연결을 확인해 주세요.'); }
  let j;
  try { j = await res.json(); } catch (e) { throw new Error('서버 응답을 읽지 못했어요. 웹 앱 배포 설정을 확인해 주세요.'); }
  if (!j.ok) {
    if (j.code === 'AUTH') { logoutLocal(); render(); }
    const err = new Error(j.error || '문제가 생겼어요.'); err.code = j.code; throw err;
  }
  return j;
}
function persist() { LS.set('data', S.data); }
function mergeRows(table, rows) {
  if (!S.data[table]) S.data[table] = [];
  const list = S.data[table];
  rows.forEach(r => {
    const i = list.findIndex(x => x.id === r.id);
    const dead = String(r.deleted).toUpperCase() === 'TRUE';
    if (dead) { if (i >= 0) list.splice(i, 1); }
    else if (i >= 0) list[i] = r; else list.push(r);
  });
  persist();
}
async function saveRow(table, row) { const j = await api('upsert', { table, row }); mergeRows(table, j.rows); return j.rows[0]; }
async function saveRows(table, rows) { if (!rows.length) return []; const j = await api('upsertMany', { table, rows }); mergeRows(table, j.rows); return j.rows; }
async function removeRow(table, id) { const j = await api('remove', { table, id }); mergeRows(table, j.rows); }
async function load() {
  S.loading = true;
  try {
    const j = await api('bootstrap');
    S.data = j.data; S.user = j.user; persist(); LS.set('user', S.user);
  } finally { S.loading = false; }
  render();
}
function logoutLocal() { S.token = null; LS.del('token'); }

/* ───────── 사진 ───────── */
const IDB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((ok, no) => { const r = indexedDB.open('baby-photos', 1); r.onupgradeneeded = () => r.result.createObjectStore('p'); r.onsuccess = () => { this.db = r.result; ok(this.db); }; r.onerror = () => no(r.error); });
  },
  async get(k) { try { const db = await this.open(); return await new Promise(ok => { const q = db.transaction('p').objectStore('p').get(k); q.onsuccess = () => ok(q.result || null); q.onerror = () => ok(null); }); } catch (e) { return null; } },
  async set(k, v) { try { const db = await this.open(); db.transaction('p', 'readwrite').objectStore('p').put(v, k); } catch (e) {} }
};
const memPhoto = new Map();
let hydrating = false;
async function hydratePhotos() {
  if (hydrating) return; hydrating = true;
  try {
    const imgs = $$('img[data-pid]:not([data-done])');
    const need = [];
    for (const img of imgs) {
      const id = img.dataset.pid;
      const v = memPhoto.get(id) || await IDB.get(id);
      if (v) { memPhoto.set(id, v); img.src = v; img.dataset.done = '1'; } else need.push(id);
    }
    const ids = Array.from(new Set(need));
    for (let i = 0; i < ids.length; i += 10) {
      const chunk = ids.slice(i, i + 10);
      try {
        const j = await api('photos', { ids: chunk });
        chunk.forEach(id => {
          const f = j.files[id]; if (!f) return;
          const url = `data:${f.mime};base64,${f.data}`;
          memPhoto.set(id, url); IDB.set(id, url);
          $$(`img[data-pid="${id}"]`).forEach(im => { im.src = url; im.dataset.done = '1'; });
        });
      } catch (e) { console.warn(e); break; }
    }
  } finally { hydrating = false; if ($('img[data-pid]:not([data-done])') && navigator.onLine) setTimeout(hydratePhotos, 1500); }
}
const splitPhoto = p => { const [t, f] = String(p).split(':'); return { thumb: t, full: f || t }; };
const photosOf = e => String(e.photos || '').split(',').filter(p => p && !p.startsWith('PAGE:')).map(splitPhoto);

async function resizeImage(file, max, q) {
  let src;
  try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch (e) {
    src = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('이 사진은 열 수 없어요 (HEIC 사진이면 JPG로 바꿔 올려주세요).')); im.src = URL.createObjectURL(file); });
  }
  const w = src.width, h = src.height, s = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', q);
}
const b64 = dataUrl => dataUrl.slice(dataUrl.indexOf(',') + 1);

/* 사진 촬영 날짜 읽기 (EXIF) */
async function photoDate(file) {
  try {
    const buf = await file.slice(0, 262144).arrayBuffer();
    const v = new DataView(buf);
    if (v.getUint16(0) !== 0xFFD8) return fallbackDate(file);
    let off = 2;
    while (off + 4 < v.byteLength) {
      const marker = v.getUint16(off), size = v.getUint16(off + 2);
      if (marker === 0xFFE1 && v.getUint32(off + 4) === 0x45786966) {
        const t = off + 10, le = v.getUint16(t) === 0x4949;
        const u16 = o => v.getUint16(t + o, le), u32 = o => v.getUint32(t + o, le);
        const readIfd = (o, want) => {
          const n = u16(o); const found = {};
          for (let i = 0; i < n; i++) { const e = o + 2 + i * 12; const tag = u16(e); if (want.includes(tag)) found[tag] = { count: u32(e + 4), val: u32(e + 8) }; }
          return found;
        };
        const str = (ent) => { let s = ''; for (let i = 0; i < 19; i++) s += String.fromCharCode(v.getUint8(t + ent.val + i)); return s; };
        const ifd0 = readIfd(u32(4), [0x8769, 0x0132]);
        let s = null;
        if (ifd0[0x8769]) { const ex = readIfd(ifd0[0x8769].val, [0x9003, 0x9004]); const e = ex[0x9003] || ex[0x9004]; if (e) s = str(e); }
        if (!s && ifd0[0x0132]) s = str(ifd0[0x0132]);
        if (s && /^\d{4}:\d{2}:\d{2}/.test(s) && !s.startsWith('0000')) return s.slice(0, 10).replace(/:/g, '-');
        return fallbackDate(file);
      }
      if ((marker & 0xFF00) !== 0xFF00) break;
      off += 2 + size;
    }
  } catch (e) {}
  return fallbackDate(file);
}
const fallbackDate = f => f.lastModified ? fmtD(new Date(f.lastModified)) : null;

/* ───────── 화면 틀 ───────── */
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add('hidden'), 2600);
}
function openSheet(html, onMount) {
  const s = $('#sheet');
  s.innerHTML = `<div class="panel">${html}</div>`;
  s.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  if (onMount) onMount(s.firstElementChild);
}
function closeSheet() { const s = $('#sheet'); s.classList.add('hidden'); s.innerHTML = ''; document.body.style.overflow = ''; }
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });

function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [name, id] = h.split('/');
  return { name: name || 'home', id: id ? decodeURIComponent(id) : null };
}
const go = h => { if (location.hash === '#' + h) render(); else location.hash = h; };

function topBar(title) {
  const c = curChild();
  const many = children().length > 1;
  const who = title ? `<div class="page-title" style="margin:0">${esc(title)}</div>` :
    `<button class="name" data-act="pickChild">${esc(c ? c.name : '모든 아이')}${ICON.down.replace('<svg', '<svg style="width:18px;height:18px"')}</button>
     <div class="age">${c ? ageLabel(c, null, true) : many ? children().map(x => esc(x.name)).join(' · ') : ''}</div>`;
  return `<div class="top"><div class="who">${who}</div><button class="icon-btn" data-act="go" data-h="settings" aria-label="설정">${ICON.gear}</button></div>`;
}
function navBar(on) {
  const it = (h, ic, l) => `<a href="#${h}" class="${on === h ? 'on' : ''}">${ic}<span>${l}</span></a>`;
  return `<nav class="nav"><div class="nav-in">${it('home', ICON.home, '홈')}${it('dev', ICON.chart, '발달')}
    <a href="#new" class="plus" aria-label="기록 쓰기">${ICON.plus}</a>${it('words', ICON.chat, '단어장')}${it('health', ICON.health, '건강')}</div></nav>`;
}
const updateBanner = () => S.waitingSW ? `<div class="banner"><span>새 버전이 있어요.</span><button class="btn small" data-act="applyUpdate">업데이트</button></div>` : '';

function render() {
  const app = $('#app');
  if (!S.token) { app.innerHTML = loginView(); mountLogin(); return; }
  if (!S.data) { app.innerHTML = `<div class="splash"><img src="icons/icon-192.png" alt=""><p>기록을 불러오는 중…</p></div>`; if (!S.loading) load().catch(e => { app.innerHTML = errorView(e); }); return; }
  const r = route();
  const views = { home: homeView, dev: devView, words: wordsView, health: healthView, settings: settingsView, new: () => editorView(null), edit: () => editorView(r.id), entry: () => entryView(r.id), bulk: bulkView };
  const v = views[r.name] || homeView;
  app.innerHTML = v(r);
  if (r.name === 'new' || r.name === 'edit') mountEditor();
  if (r.name === 'bulk') mountBulk();
  hydratePhotos();
}
function errorView(e) {
  return `<div class="login"><img src="icons/icon-192.png" alt=""><h1>불러오지 못했어요</h1><p class="muted">${esc(e.message)}</p>
    <div class="btns" style="max-width:280px;margin:16px auto"><button class="btn primary" data-act="reload">다시 시도</button></div></div>`;
}

/* ───────── 로그인 ───────── */
function loginView() {
  return `<div class="login"><img src="icons/icon-192.png" alt=""><h1>우리 아이 기록장</h1>
    <p class="muted">가족 구글 계정으로 들어와 주세요.</p><div id="gbtn"></div><p id="loginErr" class="err"></p></div>`;
}
function loadScript(src) {
  return new Promise((ok, no) => {
    if ($(`script[src="${src}"]`)) return ok();
    const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('불러오기 실패: ' + src)); document.head.appendChild(s);
  });
}
async function mountLogin() {
  const errEl = () => $('#loginErr');
  try {
    if (!/apps\.googleusercontent\.com$/.test(APP_CONFIG.CLIENT_ID || '')) throw new Error('config.js에 클라이언트 ID를 넣어주세요.');
    await loadScript('https://accounts.google.com/gsi/client');
    google.accounts.id.initialize({
      client_id: APP_CONFIG.CLIENT_ID,
      callback: async r => {
        try {
          errEl().textContent = '확인하는 중…';
          const j = await api('login', { idToken: r.credential });
          S.token = j.token; S.user = { name: j.name, email: j.email };
          LS.set('token', S.token); LS.set('user', S.user);
          toast(`${j.name}, 반가워요!`);
          await load();
        } catch (e) { if (errEl()) errEl().textContent = e.message; }
      }
    });
    google.accounts.id.renderButton($('#gbtn'), { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'ko' });
  } catch (e) { if (errEl()) errEl().textContent = e.message; }
}

/* ───────── 홈 ───────── */
function latestGrowth(child) {
  const rows = T('Growth').filter(g => g.childId === child.id).sort((a, b) => a.date < b.date ? 1 : -1);
  const h = rows.find(g => num(g.height) != null), w = rows.find(g => num(g.weight) != null), hc = rows.find(g => num(g.head) != null);
  return { h, w, hc };
}
function nextVaccines(child, withinDays) {
  const t = today();
  return T('Vaccines').filter(v => (!child || v.childId === child.id) && v.status === '예정' && isDate(v.date) && v.date >= t)
    .sort((a, b) => a.date < b.date ? -1 : 1).filter(v => withinDays == null || diffDays(t, v.date) <= withinDays);
}
function homeView() {
  const c = curChild();
  let top = '';
  if (c) {
    const g = latestGrowth(c);
    const wc = T('Words').filter(w => w.childId === c.id && w.kind !== 'sentence').length;
    const md = r => r ? `<span class="sdate">${shortDate(r.date)}</span>` : '';
    top = `<div class="sum sum3">
      <div class="s coral" data-act="growthGo" data-v="height"><small>키</small><b>${g.h ? num(g.h.height) + 'cm' : '-'}</b>${md(g.h)}</div>
      <div class="s coral" data-act="growthGo" data-v="weight"><small>몸무게</small><b>${g.w ? num(g.w.weight) + 'kg' : '-'}</b>${md(g.w)}</div>
      <div class="s honey" data-act="go" data-h="words"><small>말한 단어</small><b>${wc}개</b><span class="sdate">${wordStage(c).now}</span></div></div>`;
  }
  const nv = nextVaccines(c, 60);
  const vac = nv.slice(0, 2).map(v => `<div class="card notice" data-act="go" data-h="health"><span>${c ? '' : esc((childById(v.childId) || {}).name || '') + ' '}${esc(v.disease)} ${esc(v.dose)} 접종 예정</span><span class="d">D-${diffDays(today(), v.date)}</span></div>`).join('');
  const drafts = entries().filter(e => isTrue(e.draft)).length;
  const f = S.filter;
  const months = Array.from(new Set(entries().map(e => String(e.date).slice(0, 7)))).sort().reverse();
  return `${topBar()}${updateBanner()}<div class="page">${top}${vac}
    ${drafts ? `<div class="card notice" data-act="filterDraft"><span>내용을 채울 사진 기록 ${drafts}개</span><span class="d">보기</span></div>` : ''}
    <div class="row" style="margin:6px 0 8px">
      <input class="i grow" type="search" placeholder="기록 검색" value="${esc(f.q)}" data-in="search">
      <select class="i" style="width:auto" data-ch="month"><option value="">전체 기간</option>${months.map(m => `<option value="${m}" ${f.month === m ? 'selected' : ''}>${m.replace('-', '년 ')}월</option>`).join('')}</select>
    </div>
    <div class="chips" style="margin-bottom:4px"><button class="chip ${!f.tag && !f.author ? 'on' : ''}" data-act="tagFilter" data-v="">전체</button>${authors().map(a => `<button class="chip ${f.author === a ? 'on' : ''}" data-act="authorFilter" data-v="${esc(a)}">${esc(a)}${josa(a)} 쓴</button>`).join('')}<span class="chip-sep"></span>${visibleTags().map(t => `<button class="chip ${f.tag === t.k ? 'on' : ''}" data-act="tagFilter" data-v="${t.k}">${esc(t.l)}</button>`).join('')}</div>
    <div id="tl">${timelineHtml()}</div></div>${navBar('home')}`;
}
const isTrue = v => String(v).toUpperCase() === 'TRUE';
const josa = w => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이' : '가'; };
const authorBadge = a => a ? `<span class="auth ${a === '엄마' ? 'mom' : a === '아빠' ? 'dad' : ''}">${esc(a)}</span>` : '';
const firstLine = t => { const l = String(t).split('\n').map(x => x.trim()).filter(Boolean); return (l[0] || '') + (l.length > 1 ? ' …' : ''); };
const shortDate = d => isDate(d) ? `${d.slice(2, 4)}.${Number(d.slice(5, 7))}.${Number(d.slice(8))}` : '';
function authors() {
  const set = new Set(T('Entries').map(e => e.author).filter(Boolean));
  if (S.user && S.user.name) set.add(S.user.name);
  return ['엄마', '아빠'].filter(a => set.has(a)).concat([...set].filter(a => a !== '엄마' && a !== '아빠'));
}
function entries() {
  const c = curChild();
  return T('Entries').filter(e => !c || String(e.childIds || '').split(',').includes(c.id));
}
function timelineHtml() {
  const f = S.filter, q = f.q.trim().toLowerCase();
  let list = entries().filter(e => (!f.tag || (f.tag === '__draft' ? isTrue(e.draft) : String(e.tags).split(',').includes(f.tag))) && (!f.author || e.author === f.author)
    && (!f.month || String(e.date).startsWith(f.month)) && (!q || String(e.text).toLowerCase().includes(q)));
  list.sort((a, b) => a.date === b.date ? (num(b.createdAt) || 0) - (num(a.createdAt) || 0) : (a.date < b.date ? 1 : -1));
  if (!list.length) return `<div class="card muted" style="text-align:center;padding:28px 12px">${T('Entries').length ? '조건에 맞는 기록이 없어요.' : '첫 기록을 남겨보세요. 아래 ＋ 버튼을 누르면 돼요.'}</div>`;
  const shown = list.slice(0, S.page);
  let html = '', lastDay = '';
  const many = children().length > 1;
  shown.forEach(e => {
    if (e.date !== lastDay) {
      lastDay = e.date;
      const kid = curChild() || childById(String(e.childIds).split(',')[0]);
      html += `<div class="day">${dayTitle(e.date)}${kid ? ' · ' + ageLabel(kid, e.date) : ''}</div>`;
    }
    const ph = photosOf(e);
    const hearts = T('Hearts').filter(h => h.entryId === e.id).length;
    const cm = T('Comments').filter(x => x.entryId === e.id).length;
    const tags = String(e.tags || '').split(',').filter(Boolean);
    const names = many ? String(e.childIds).split(',').map(id => (childById(id) || {}).name).filter(Boolean).join('·') : '';
    html += `<div class="card entry" data-act="go" data-h="entry/${e.id}">
      ${ph.length ? `<div class="thumb"><img data-pid="${ph[0].thumb}" alt="">${ph.length > 1 ? `<span class="more">+${ph.length - 1}</span>` : ''}</div>` : ''}
      <div class="grow"><div class="txt">${e.text ? esc(firstLine(e.text)) : `<span class="muted">${isTrue(e.draft) ? '내용을 채워주세요' : '사진 기록'}</span>`}</div>
      <div class="meta">${isTrue(e.draft) ? '<span class="tag draft">초안</span>' : ''}${tags.map(t => `<span class="tag ${t === 'first' ? 'star' : ''}">${esc(tagLabel(t))}</span>`).join('')}
      ${names ? `<span>${esc(names)}</span>` : ''}${authorBadge(e.author)}${hearts ? `<span>♥ ${hearts}</span>` : ''}${cm ? `<span>댓글 ${cm}</span>` : ''}</div></div></div>`;
  });
  if (list.length > S.page) html += `<button class="btn block" data-act="more">더 보기 (${list.length - S.page}개 남음)</button>`;
  return html;
}

/* ───────── 기록 쓰기 ───────── */
let E = null;
function editorView(id) {
  const ex = id ? T('Entries').find(e => e.id === id) : null;
  if (id && !ex) return `${topBar('기록')}<div class="page"><div class="card">기록을 찾을 수 없어요.</div></div>${navBar('')}`;
  const c = pageChild();
  if (!E || E.id !== (ex ? ex.id : null)) {
    E = ex ? { id: ex.id, date: ex.date, childIds: String(ex.childIds).split(',').filter(Boolean), photos: photosOf(ex).map(p => ({ existing: p })), text: ex.text || '', tags: String(ex.tags || '').split(',').filter(Boolean), msKey: '', newWords: '', dateTouched: true, draft: isTrue(ex.draft) }
      : { id: null, date: today(), childIds: c ? [c.id] : [], photos: [], text: '', tags: [], msKey: '', newWords: '', dateTouched: false };
  }
  const cs = children();
  return `<div class="top"><button class="icon-btn" data-act="cancelEdit">${ICON.back}</button><div class="who"><div class="page-title" style="margin:0">${ex ? '기록 고치기' : '새 기록'}</div></div></div>
  <div class="page"><div class="card">
    <label class="f">날짜</label><input class="i" type="date" id="e_date" value="${esc(E.date)}" max="${today()}">
    <div class="tiny muted" id="e_age" style="margin-top:4px">${editorAgeText()}</div>
    ${cs.length > 1 ? `<label class="f">누구의 기록인가요?</label><div class="chips">${cs.map(k => `<button type="button" class="chip ${E.childIds.includes(k.id) ? 'on' : ''}" data-act="eChild" data-v="${k.id}">${esc(k.name)}</button>`).join('')}</div>` : ''}
    <label class="f">사진 (최대 5장)</label><div class="pics" id="e_pics">${editorPicsHtml()}</div>
    <input type="file" id="e_file" accept="image/*" multiple class="hidden">
    <label class="f">내용</label><textarea class="i" id="e_text" placeholder="오늘 있었던 일을 적어보세요">${esc(E.text)}</textarea>
    <label class="f">태그</label><div class="chips" id="e_tags">${visibleTags().filter(t => !E.tags.includes(t.k)).concat(allTags().filter(t => E.tags.includes(t.k))).map(t => `<button type="button" class="chip ${E.tags.includes(t.k) ? 'on' : ''}" data-act="eTag" data-v="${t.k}">${esc(t.l)}</button>`).join('')}</div>
    <div id="e_extra">${editorExtraHtml()}</div>
    <p class="err" id="e_err"></p>
    <div class="progress hidden" id="e_prog"><div></div></div>
    <div class="btns"><button class="btn" data-act="cancelEdit">취소</button><button class="btn primary" data-act="saveEntry" id="e_save">저장</button></div>
  </div></div>`;
}
function editorAgeText() { const k = childById(E.childIds[0]); return k && isDate(E.date) ? ageLabel(k, E.date, true) : ''; }
function editorPicsHtml() {
  return E.photos.map((p, i) => `<div class="p">${p.existing ? `<img data-pid="${p.existing.thumb}" alt="">` : `<img src="${p.thumbUrl}" alt="">`}<button type="button" data-act="ePicDel" data-i="${i}">✕</button></div>`).join('')
    + (E.photos.length < 5 ? `<button type="button" class="add" data-act="ePicAdd" aria-label="사진 추가">${ICON.photo}</button>` : '');
}
function editorExtraHtml() {
  let h = '';
  if (E.tags.includes('first')) {
    const k = childById(E.childIds[0]);
    const done = k ? new Set(T('Milestones').filter(m => m.childId === k.id).map(m => m.key)) : new Set();
    const cur = k ? age(k, E.date).months : 0;
    const groups = msGroups().filter(g => !done.size || g.items.some(d => !done.has(d.key)));
    const near = groups.filter(g => g.m >= cur - 6 && g.m <= cur + 12);
    h += `<label class="f">발달 체크에도 표시할까요? (선택)</label><select class="i" id="e_ms"><option value="">표시 안 함</option>${(near.length ? near : groups).map(g => `<optgroup label="${g.label}">${g.items.filter(d => !done.has(d.key)).map(d => `<option value="${d.key}" ${E.msKey === d.key ? 'selected' : ''}>${esc(d.t)}</option>`).join('')}</optgroup>`).join('')}</select>`;
  }
  if (E.tags.includes('word')) {
    h += `<label class="f">단어장에 추가할 말 (쉼표로 구분, 선택)</label><input class="i" id="e_words" placeholder="예: 까까, 아빠 차" value="${esc(E.newWords)}">
      <div class="tiny muted" style="margin-top:4px">띄어쓰기가 있으면 문장으로 저장돼요.</div>`;
  }
  return h;
}
function mountEditor() {
  const d = $('#e_date');
  d.addEventListener('change', () => { E.date = d.value; E.dateTouched = true; $('#e_age').textContent = editorAgeText(); });
  $('#e_text').addEventListener('input', ev => { E.text = ev.target.value; });
  $('#e_file').addEventListener('change', async ev => {
    const files = Array.from(ev.target.files || []).slice(0, 5 - E.photos.length);
    ev.target.value = '';
    for (const file of files) {
      try {
        const thumbUrl = await resizeImage(file, 360, 0.72);
        const fullUrl = await resizeImage(file, 2560, 0.86);
        const pd = await photoDate(file);
        E.photos.push({ thumbUrl, fullUrl, date: pd });
      } catch (e) { toast(e.message); }
    }
    const dates = E.photos.map(p => p.date).filter(isDate).sort();
    if (!E.id && !E.dateTouched && dates.length && dates[0] < today()) {
      E.date = dates[0]; d.value = E.date; $('#e_age').textContent = editorAgeText();
      toast(`사진 찍은 날(${E.date})로 날짜를 맞췄어요.`);
    }
    $('#e_pics').innerHTML = editorPicsHtml(); hydratePhotos();
  });
}
async function saveEntry() {
  const err = $('#e_err'), btn = $('#e_save'), prog = $('#e_prog');
  err.textContent = '';
  const ms = $('#e_ms'), wd = $('#e_words');
  if (ms) E.msKey = ms.value; if (wd) E.newWords = wd.value;
  if (!isDate(E.date)) return err.textContent = '날짜를 골라주세요.';
  if (!E.childIds.length) return err.textContent = '아이를 골라주세요.';
  if (!E.text.trim() && !E.photos.length) return err.textContent = '내용이나 사진을 넣어주세요.';
  btn.disabled = true; btn.textContent = '저장하는 중…';
  try {
    const newOnes = E.photos.filter(p => !p.existing);
    if (newOnes.length) prog.classList.remove('hidden');
    let done = 0;
    const photoStrs = [];
    for (const p of E.photos) {
      if (p.existing) { photoStrs.push(p.existing.thumb + ':' + p.existing.full); continue; }
      const j = await api('uploadPhoto', { date: E.date, thumb: b64(p.thumbUrl), full: b64(p.fullUrl) });
      const sp = splitPhoto(j.photo);
      memPhoto.set(sp.thumb, p.thumbUrl); IDB.set(sp.thumb, p.thumbUrl); memPhoto.set(sp.full, p.fullUrl); IDB.set(sp.full, p.fullUrl);
      p.existing = sp; photoStrs.push(j.photo);
      done++; prog.firstElementChild.style.width = Math.round(done / newOnes.length * 100) + '%';
    }
    const row = { id: E.id || uid(), date: E.date, childIds: E.childIds.join(','), text: E.text.trim(), tags: E.tags.join(','), photos: photoStrs.join(','), draft: '' };
    const saved = await saveRow('Entries', row);
    if (E.tags.includes('first') && E.msKey) {
      await saveRows('Milestones', E.childIds.map(cid => ({ id: cid + '_' + E.msKey, childId: cid, key: E.msKey, dateType: 'exact', date: E.date, month: '', monthTo: '', entryId: saved.id, deleted: '' })));
    }
    if (E.tags.includes('word') && E.newWords.trim()) {
      const ws = E.newWords.split(',').map(s => s.trim()).filter(Boolean);
      const rows = [];
      E.childIds.forEach(cid => ws.forEach(w => {
        if (T('Words').some(x => x.childId === cid && x.word === w)) return;
        rows.push({ id: uid() + rows.length, childId: cid, word: w, meaning: '', category: /\s/.test(w) ? '문장' : '기타', kind: /\s/.test(w) ? 'sentence' : 'word', dateType: 'exact', date: E.date });
      }));
      await saveRows('Words', rows);
    }
    E = null;
    toast('저장했어요.');
    go('entry/' + saved.id);
  } catch (e) {
    err.textContent = e.message; btn.disabled = false; btn.textContent = '저장';
  }
}

/* ───────── 기록 보기 ───────── */
function entryView(id) {
  const e = T('Entries').find(x => x.id === id);
  if (!e) return `${topBar('기록')}<div class="page"><div class="card">기록을 찾을 수 없어요.</div></div>${navBar('')}`;
  const kid = childById(String(e.childIds).split(',')[0]);
  const hearts = T('Hearts').filter(h => h.entryId === e.id);
  const mine = S.user && hearts.some(h => h.author === S.user.name);
  const cms = T('Comments').filter(x => x.entryId === e.id).sort((a, b) => (num(a.createdAt) || 0) - (num(b.createdAt) || 0));
  const tags = String(e.tags || '').split(',').filter(Boolean);
  const names = String(e.childIds).split(',').map(i => (childById(i) || {}).name).filter(Boolean).join(' · ');
  return `<div class="top"><button class="icon-btn" data-act="back">${ICON.back}</button><div class="who"><div class="name" style="font-size:16px">${dayTitle(e.date)}</div><div class="age">${kid ? ageLabel(kid, e.date, true) : ''}${children().length > 1 ? ' · ' + esc(names) : ''}</div></div>
    <button class="btn small ghost" data-act="go" data-h="edit/${e.id}">고치기</button></div>
  <div class="page">${photosOf(e).map(p => `<img class="photo-full" data-pid="${p.full}" alt="">`).join('')}
    <div class="card"><div style="white-space:pre-wrap;word-break:break-word">${e.text ? esc(e.text) : '<span class="muted">내용 없음</span>'}</div>
      <div class="meta" style="margin-top:8px">${tags.map(t => `<span class="tag ${t === 'first' ? 'star' : ''}">${tagLabel(t)}</span>`).join('')}${authorBadge(e.author)}<span>씀</span></div>
      <div class="between" style="margin-top:6px"><button class="heart ${mine ? 'on' : ''}" data-act="heart" data-id="${e.id}">${mine ? ICON.heartOn : ICON.heart}<span>${hearts.length ? hearts.map(h => esc(h.author)).join(', ') : '좋아요'}</span></button></div>
    </div>
    <div class="card"><div class="small muted">댓글</div>
      ${cms.map(cm => `<div class="cmt"><div class="between"><b class="small">${esc(cm.author)}</b>${S.user && cm.author === S.user.name ? `<button class="btn small ghost" data-act="delComment" data-id="${cm.id}">지우기</button>` : ''}</div><div style="white-space:pre-wrap">${esc(cm.text)}</div></div>`).join('')}
      <div class="row" style="margin-top:8px"><input class="i grow" id="c_text" placeholder="댓글 달기"><button class="btn small primary" data-act="addComment" data-id="${e.id}">등록</button></div>
    </div>
    <button class="btn block ghost danger" data-act="delEntry" data-id="${e.id}">이 기록 지우기</button>
  </div>${navBar('')}`;
}

/* ───────── 발달 ───────── */
function devView() {
  const c = pageChild();
  if (!c) return noChild('발달');
  const many = children().length > 1;
  const tabs = [['growth', '성장'], ['ms', '발달 체크'], ['teeth', '이']].concat(many ? [['compare', '형제 비교']] : []);
  if (S.devTab === 'compare' && !many) S.devTab = 'growth';
  const body = S.devTab === 'ms' ? msHtml(c) : S.devTab === 'teeth' ? teethHtml(c) : S.devTab === 'compare' ? compareHtml() : growthHtml(c);
  const refBtn = S.devTab === 'growth' || S.devTab === 'teeth' ? `<button class="chip ${S.showRef ? 'on' : ''}" data-act="toggleRef" style="margin-left:8px">기준</button>` : '';
  return `${topBar()}${updateBanner()}<div class="page">
    <div class="between" style="margin-bottom:8px"><div class="seg grow" style="margin:0">${tabs.map(([k, l]) => `<button class="${S.devTab === k ? 'on' : ''}" data-act="devTab" data-v="${k}">${l}</button>`).join('')}</div>${refBtn}</div>
    ${body}</div>${navBar('dev')}`;
}
function noChild(where) { return `${topBar(where)}<div class="page"><div class="card">설정에서 아이를 먼저 등록해 주세요.</div></div>${navBar('')}`; }

/* 성장 도표 계산 (WHO LMS) */
function lmsAt(measure, sex, days) {
  const arr = WHO_LMS[measure][sex === 'F' ? 'F' : 'M'];
  const x = Math.max(0, days) / WHO_STEP;
  if (x >= arr.length - 1) return x > arr.length + 5 ? null : arr[arr.length - 1];
  const i = Math.floor(x), t = x - i, a = arr[i], b = arr[i + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
const zOf = (v, [L, M, S_]) => L ? (Math.pow(v / M, L) - 1) / (L * S_) : Math.log(v / M) / S_;
const valAtZ = (z, [L, M, S_]) => L ? M * Math.pow(1 + L * S_ * z, 1 / L) : M * Math.exp(S_ * z);
function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
const pctOfZ = z => 50 * (1 + erf(z / Math.SQRT2));
function percentile(child, measure, date, value) {
  const lms = lmsAt(measure, child.sex, age(child, date).days);
  if (!lms || value == null) return null;
  return pctOfZ(zOf(value, lms));
}
function pctText(p) {
  if (p == null) return '';
  if (p >= 99.5) return '또래 100명 중 99번째 이상';
  if (p < 1) return '또래 100명 중 1번째 미만';
  return `또래 100명 중 약 ${Math.max(1, Math.round(p))}번째`;
}
const MEASURES = { height: { l: '키', u: 'cm', f: 'height' }, weight: { l: '몸무게', u: 'kg', f: 'weight' }, head: { l: '머리둘레', u: 'cm', f: 'head' } };
const KID_COLORS = ['#D85A30', '#3B6FB6', '#3F8F5A', '#8A5BB5'];
const kidColor = c => KID_COLORS[Math.max(0, children().findIndex(k => k.id === c.id)) % KID_COLORS.length];
const growthRows = (c, f) => T('Growth').filter(g => g.childId === c.id && num(g[f]) != null).sort((a, b) => a.date < b.date ? -1 : 1);
function growthHtml(c) {
  const m = MEASURES[S.measure];
  const rows = growthRows(c, m.f);
  const last = rows[rows.length - 1];
  const p = last && S.showRef ? percentile(c, S.measure, last.date, num(last[m.f])) : null;
  const all = T('Growth').filter(g => g.childId === c.id).sort((a, b) => a.date < b.date ? 1 : -1);
  return `<div class="seg">${Object.keys(MEASURES).map(k => `<button class="${S.measure === k ? 'on' : ''}" data-act="measure" data-v="${k}">${MEASURES[k].l}</button>`).join('')}</div>
    <div class="card">${last ? `<div class="between"><div><b style="font-size:18px">${num(last[m.f])}${m.u}</b> <span class="small muted">${last.date.slice(2).replace(/-/g, '.')} · ${monthText(age(c, last.date).months)}</span></div>
      ${p != null ? `<span class="tag" style="background:var(--green-bg);color:var(--green-ink)">${pctText(p)}</span>` : ''}</div>` : `<div class="muted small">${m.l} 기록이 아직 없어요.</div>`}
      ${growthChart(c, S.measure, rows)}
      ${S.showRef ? `<div class="tiny muted">진한 띠: 또래 가운데 70% · 연한 띠: 94% · 점선: 평균 (WHO 성장 기준)</div>` : ''}</div>
    <div class="btns" style="margin-top:0;margin-bottom:10px"><button class="btn" data-act="growthEdit">＋ 측정 기록</button><button class="btn" data-act="growthPaste">표로 붙여넣기</button></div>
    <div class="card"><div class="small muted" style="margin-bottom:4px">측정 기록 ${all.length}개</div>
    ${all.slice(0, S.growthAll ? 999 : 12).map(g => `<div class="list-row" data-act="growthEdit" data-id="${g.id}"><span>${g.date.slice(2).replace(/-/g, '.')} <span class="tiny muted">${monthText(age(c, g.date).months)}</span></span>
      <span class="small">${[num(g.height) != null ? num(g.height) + 'cm' : '', num(g.weight) != null ? num(g.weight) + 'kg' : '', num(g.head) != null ? '머리 ' + num(g.head) : ''].filter(Boolean).join(' · ')}${g.source === '검진' ? ' <span class="tag">검진</span>' : ''}</span></div>`).join('')}
    ${all.length > 12 && !S.growthAll ? `<button class="btn block ghost" data-act="growthAll">전체 보기</button>` : ''}</div>`;
}
function growthChart(c, measure, rows) {
  const nowM = age(c).mDec;
  const lastM = rows.length ? age(c, rows[rows.length - 1].date).mDec : 0;
  const xmax = Math.min(60, Math.max(12, Math.ceil((Math.max(nowM, lastM) + 2) / 6) * 6));
  const pts = rows.map(g => ({ x: age(c, g.date).mDec, y: num(g[MEASURES[measure].f]) })).filter(p => p.x >= 0);
  let ref = null;
  if (S.showRef) {
    const curve = z => { const out = []; for (let mth = 0; mth <= xmax + 0.001; mth += xmax / 60) { const l = lmsAt(measure, c.sex, mth * 30.4375); if (l) out.push({ x: mth, y: valAtZ(z, l) }); } return out; };
    ref = { p3: curve(-1.881), p15: curve(-1.036), p50: curve(0), p85: curve(1.036), p97: curve(1.881) };
  }
  return lineChart([{ color: '#D85A30', pts, dots: true }], { xmax, ref, label: MEASURES[measure].l + ' 성장 그래프' });
}
/* 공통 선 그래프 (가로: 개월) */
function lineChart(series, o) {
  const W = 340, H = 230, L = 36, R = 8, Tp = 10, B = 24;
  const xmax = o.xmax;
  let ys = [].concat(...series.map(s => s.pts.map(p => p.y)));
  if (o.ref) ys = ys.concat(o.ref.p3.map(p => p.y), o.ref.p97.map(p => p.y));
  if (!ys.length) return '<div class="muted small" style="padding:20px 0;text-align:center">아직 기록이 없어요.</div>';
  let y0 = o.y0 != null ? o.y0 : Math.min(...ys), y1 = Math.max(...ys);
  const padY = (y1 - y0) * 0.06 || 1; if (o.y0 == null) y0 -= padY; y1 += padY;
  const sx = x => L + (x / xmax) * (W - L - R), sy = y => Tp + (1 - (y - y0) / (y1 - y0)) * (H - Tp - B);
  const path = arr => arr.map((p, i) => (i ? 'L' : 'M') + sx(p.x).toFixed(1) + ' ' + sy(p.y).toFixed(1)).join(' ');
  const band = (a, b) => path(a) + ' ' + b.slice().reverse().map(p => 'L' + sx(p.x).toFixed(1) + ' ' + sy(p.y).toFixed(1)).join(' ') + ' Z';
  const step = xmax <= 24 ? 3 : 6;
  let grid = '';
  for (let x = 0; x <= xmax; x += step) grid += `<line x1="${sx(x)}" x2="${sx(x)}" y1="${Tp}" y2="${H - B}" stroke="#F1E6D3"/><text x="${sx(x)}" y="${H - 8}" font-size="10" text-anchor="middle" fill="#B4A58E">${x}</text>`;
  const yStep = niceStep((y1 - y0) / 5);
  for (let y = Math.ceil(y0 / yStep) * yStep; y <= y1; y += yStep) grid += `<line x1="${L}" x2="${W - R}" y1="${sy(y)}" y2="${sy(y)}" stroke="#F1E6D3"/><text x="${L - 4}" y="${sy(y) + 3}" font-size="10" text-anchor="end" fill="#B4A58E">${+y.toFixed(1)}</text>`;
  const ref = o.ref ? `<path d="${band(o.ref.p3, o.ref.p97)}" fill="#F7E6D6"/><path d="${band(o.ref.p15, o.ref.p85)}" fill="#F2D3BC"/><path d="${path(o.ref.p50)}" fill="none" stroke="#D85A30" stroke-width="1" stroke-dasharray="3 3" opacity=".6"/>` : '';
  const lines = series.map(s => {
    const pts = s.pts.filter(p => p.x >= 0 && p.x <= xmax);
    let d = '';
    if (s.stepLine && pts.length) { d = 'M' + sx(pts[0].x).toFixed(1) + ' ' + sy(0).toFixed(1); pts.forEach(p => { d += ' L' + sx(p.x).toFixed(1) + ' ' + sy(p.prev).toFixed(1) + ' L' + sx(p.x).toFixed(1) + ' ' + sy(p.y).toFixed(1); }); d += ' L' + sx(s.until != null ? Math.min(s.until, xmax) : pts[pts.length - 1].x).toFixed(1) + ' ' + sy(pts[pts.length - 1].y).toFixed(1); }
    else if (pts.length > 1) d = path(pts);
    const line = d ? `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="1.8"/>` : '';
    const dots = s.dots ? pts.map(p => `<circle cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="3.2" fill="${s.color}" stroke="#fff" stroke-width="1.2"/>`).join('') : '';
    return line + dots;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || '그래프')}">${grid}${ref}${lines}
    <text x="${W - R}" y="${H - 8}" font-size="10" text-anchor="end" fill="#B4A58E" dy="-12">개월</text></svg>`;
}
function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const n = (raw || 1) / p; return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p; }

/* ───────── 발달 체크 (CDC 개월별) ───────── */
function msGroups() {
  const groups = MS_GROUPS.map(g => ({ m: g.m, label: g.label, items: g.items.map(([key, t, d]) => ({ key, t, d })) }));
  T('MilestoneDefs').forEach(d => {
    const mm = num(d.month) || 0;
    const g = groups.find(x => x.m >= mm) || groups[groups.length - 1];
    g.items.push({ key: 'x_' + d.id, t: d.title, d: MS_DOMAINS.includes(d.category) ? d.category : '기타', custom: d.id });
  });
  return groups;
}
const msItem = key => { for (const g of msGroups()) { const it = g.items.find(i => i.key === key); if (it) return Object.assign({ group: g }, it); } return null; };
const curGroup = c => { const m = age(c).months; const gs = MS_GROUPS; return (gs.find(g => g.m >= m) || gs[gs.length - 1]).m; };
function msHtml(c) {
  const got = Object.fromEntries(T('Milestones').filter(m => m.childId === c.id).map(m => [m.key, m]));
  const nowM = age(c).months, cur = curGroup(c);
  const groups = msGroups();
  if (!S.msOpen || S.msOpenFor !== c.id) { S.msOpen = new Set([cur]); S.msOpenFor = c.id; }
  const order = [groups.find(g => g.m === cur)].concat(groups.filter(g => g.m < cur).reverse(), groups.filter(g => g.m > cur));
  const card = g => {
    const done = g.items.filter(i => got[i.key]).length, open = S.msOpen.has(g.m);
    const past = g.m <= nowM && done < g.items.length;
    const body = open ? MS_DOMAINS.map(dm => {
      const its = g.items.filter(i => i.d === dm);
      if (!its.length) return '';
      return `<div class="ms-dom">${MS_DOMAIN_LABEL[dm]}</div>` + its.map(i => {
        const r = got[i.key];
        return `<div class="ms-row"><button class="ck ${r ? 'on' : ''}" data-act="msQuick" data-k="${i.key}" data-m="${g.m}" aria-label="체크">${r ? '✓' : ''}</button>
          <span class="grow" data-act="msEdit" data-k="${i.key}">${esc(i.t)}</span>${r ? `<span class="tiny muted" data-act="msEdit" data-k="${i.key}">${dtLabel(r, c)}</span>` : ''}</div>`;
      }).join('');
    }).join('') + (past ? `<button class="btn small block" style="margin-top:8px" data-act="msAllDone" data-m="${g.m}">남은 항목 모두 "${g.label} 이전에 했어요"</button>` : '') : '';
    return `<div class="card ms-card ${g.m === cur ? 'cur' : ''}"><div class="between" data-act="msToggle" data-m="${g.m}">
      <span><b>${g.label}</b>${g.m === cur ? ' <span class="tag star">지금 시기</span>' : ''}</span>
      <span class="small ${done === g.items.length ? 'ok' : 'muted'}">${done}/${g.items.length} ${open ? '▴' : '▾'}</span></div>${body}</div>`;
  };
  const idx = order.findIndex(g => g.m > cur);
  return `<div class="card small"><div class="between"><span><b>${esc(c.name)}</b>는 지금 ${monthText(nowM)}, <b>${groups.find(g => g.m === cur).label}</b> 체크리스트 시기예요.</span><button class="btn small" data-act="msAdd">＋ 항목</button></div>
    <div class="tiny muted" style="margin-top:6px">각 시기까지 대부분(75% 이상)의 아이가 하는 것이에요. 동그라미를 누르면 체크되고, 글자를 누르면 날짜를 넣을 수 있어요. 아이마다 차이가 커서 참고로만 봐주세요.</div></div>
    ${order.map((g, i) => (i === 1 && g.m < cur ? '<div class="sec-title">지난 시기</div>' : '') + (i === idx ? '<div class="sec-title">다음 시기</div>' : '') + card(g)).join('')}
    <div class="tiny muted" style="margin:10px 4px">출처: 미국 CDC "Learn the Signs. Act Early." 발달 체크리스트 (2022 개정)를 우리말로 옮김. '기어 다녀요'는 CDC 목록에 없는 참고 항목이에요.</div>`;
}

/* ───────── 이 (젖니·영구치) ───────── */
function teethHtml(c) {
  const set = S.teethSet || 'D';
  const got = Object.fromEntries(T('Teeth').filter(t => t.childId === c.id).map(t => [t.tooth, t]));
  const list0 = set === 'P' ? PERM : TEETH;
  const N = set === 'P' ? 8 : 5;
  const W = 300, cx = 150;
  const sizes = set === 'P' ? [15, 14, 14, 15, 15, 18, 18, 16] : [22, 20, 20, 25, 27];
  const H = set === 'P' ? 300 : 250, uy = set === 'P' ? 132 : 108, ly = set === 'P' ? 168 : 142;
  const place = t => {
    const k = t.side === 'R' ? -1 : 1;
    const ang = (0.06 + t.i * (0.88 / (N - 1))) * Math.PI / 2;
    const rx = set === 'P' ? 124 : 118, ry = set === 'P' ? 112 : 72;
    return { x: cx + k * Math.sin(ang) * rx, y: t.jaw === 'U' ? uy - Math.cos(ang) * ry : ly + Math.cos(ang) * ry, sz: sizes[t.i] };
  };
  const teeth = list0.map(t => {
    const p = place(t), g = got[t.code], lost = g && isDate(g.lostDate);
    const fill = lost ? '#F1EDE6' : g ? (set === 'P' ? '#3B6FB6' : '#D85A30') : '#fff';
    const stroke = lost ? '#B4A58E' : g ? (set === 'P' ? '#244A80' : '#993C1D') : '#D3C4AA';
    const tc = g && !lost ? '#fff' : '#B4A58E';
    return `<g class="t" data-act="toothEdit" data-k="${t.code}"><rect x="${(p.x - p.sz / 2).toFixed(1)}" y="${(p.y - p.sz / 2).toFixed(1)}" width="${p.sz}" height="${p.sz}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="1.5" ${lost ? 'stroke-dasharray="3 2"' : ''}/>
      <text x="${p.x.toFixed(1)}" y="${(p.y + 4).toFixed(1)}" font-size="${set === 'P' ? 10 : 11}" text-anchor="middle" fill="${tc}" font-weight="600">${lost ? '×' : t.no}</text></g>`;
  }).join('');
  const erupted = list0.filter(t => got[t.code]).length;
  const lostN = set === 'D' ? TEETH.filter(t => got[t.code] && isDate(got[t.code].lostDate)).length : 0;
  const list = list0.filter(t => got[t.code]).map(t => ({ t, g: got[t.code] })).sort((a, b) => (dtMonth(a.g, c) || 0) - (dtMonth(b.g, c) || 0));
  const refTxt = set === 'P' ? ' 영구치는 보통 6~7세에 첫째 큰어금니와 아래 앞니부터 나요.' : ' 보통 첫 이는 6~10개월쯤, 젖니 20개는 30개월 전후에 다 나고, 6~7세부터 빠지기 시작해요.';
  return `<div class="seg"><button class="${set === 'D' ? 'on' : ''}" data-act="teethSet" data-v="D">젖니 (20개)</button><button class="${set === 'P' ? 'on' : ''}" data-act="teethSet" data-v="P">영구치 (32개)</button></div>
    <div class="card"><div class="between"><span>난 이 <b>${erupted}</b>개 / ${list0.length}개${lostN ? ` · 빠진 이 <b>${lostN}</b>개` : ''}</span><button class="btn small" data-act="teethBulk">한꺼번에 체크</button></div>
    <div class="teeth"><svg viewBox="0 0 ${W} ${H}"><text x="${cx}" y="${uy - 10}" font-size="12" text-anchor="middle" fill="#B4A58E">위</text><text x="${cx}" y="${ly + 18}" font-size="12" text-anchor="middle" fill="#B4A58E">아래</text>
      <text x="4" y="${(uy + ly) / 2 + 4}" font-size="10" fill="#B4A58E">오른쪽</text><text x="296" y="${(uy + ly) / 2 + 4}" font-size="10" text-anchor="end" fill="#B4A58E">왼쪽</text>${teeth}</svg></div>
    <div class="tiny muted">번호는 가운데부터 바깥쪽으로 세요. 이를 누르면 난 날${set === 'D' ? '과 빠진 날' : ''}을 기록할 수 있어요.${S.showRef ? refTxt : ''}</div></div>
    ${list.length ? `<div class="card">${list.map(({ t, g }) => `<div class="list-row" data-act="toothEdit" data-k="${t.code}"><span>${t.name}</span><span class="small" style="text-align:right">${dtLabel(g, c)}${isDate(g.lostDate) ? `<br><span class="tiny muted">빠짐 ${shortDate(g.lostDate)}</span>` : ''}</span></div>`).join('')}</div>` : ''}`;
}

/* ───────── 형제 비교 ───────── */
function wordSeries(c) {
  const ws = T('Words').filter(w => w.childId === c.id && w.kind !== 'sentence').map(w => ({ m: dtMonth(w, c), w })).filter(x => x.m != null).sort((a, b) => a.m - b.m);
  const pts = []; let n = 0;
  ws.forEach(x => { const prev = n; n++; if (pts.length && Math.abs(pts[pts.length - 1].x - x.m) < 0.01) { pts[pts.length - 1].y = n; } else pts.push({ x: x.m, y: n, prev }); });
  return pts;
}
function wordAt(c, k) {
  const ws = T('Words').filter(w => w.childId === c.id && w.kind !== 'sentence').map(w => ({ m: dtMonth(w, c), w })).filter(x => x.m != null).sort((a, b) => a.m - b.m);
  return ws.length >= k ? ws[k - 1].w : null;
}
const firstSentence = c => T('Words').filter(w => w.childId === c.id && w.kind === 'sentence').map(w => ({ m: dtMonth(w, c), w })).filter(x => x.m != null).sort((a, b) => a.m - b.m).map(x => x.w)[0] || null;
const firstTooth = c => T('Teeth').filter(t => t.childId === c.id && !String(t.tooth).startsWith('P')).map(t => ({ m: dtMonth(t, c), t })).filter(x => x.m != null).sort((a, b) => a.m - b.m).map(x => x.t)[0] || null;
const msRec = (c, k) => T('Milestones').find(m => m.childId === c.id && m.key === k) || null;
function mLabel(r, c) {
  if (!r) return '<span class="muted">-</span>';
  if (r.dateType === 'approx') return `약 ${r.month}개월`;
  if (r.dateType === 'range') return `${r.month}~${r.monthTo}개월`;
  if (r.dateType === 'before') return `${r.month}개월 이전`;
  return isDate(r.date) ? monthText(age(c, r.date).months) : '-';
}
function compareHtml() {
  const kids = children();
  const legend = `<div class="legend">${kids.map(k => `<span><i style="background:${kidColor(k)}"></i>${esc(k.name)}</span>`).join('')}</div>`;
  const xmaxOf = extra => Math.min(72, Math.max(12, Math.ceil((Math.max(...kids.map(k => age(k).mDec), extra || 0) + 2) / 6) * 6));
  const m = MEASURES[S.measure];
  const gSeries = kids.map(k => ({ color: kidColor(k), dots: true, pts: growthRows(k, m.f).map(g => ({ x: age(k, g.date).mDec, y: num(g[m.f]) })) }));
  const wSeries = kids.map(k => ({ color: kidColor(k), stepLine: true, until: age(k).mDec, pts: wordSeries(k) }));
  const rows = [
    ['첫 이', k => mLabel(firstTooth(k), k)],
    ['뒤집기', k => mLabel(msRec(k, 'roll'), k)],
    ['혼자 앉기', k => mLabel(msRec(k, 'sit'), k)],
    ['혼자 걷기', k => mLabel(msRec(k, 'walk'), k)],
    ['첫 단어', k => mLabel(wordAt(k, 1), k)],
    ['단어 10개', k => mLabel(wordAt(k, 10), k)],
    ['단어 50개', k => mLabel(wordAt(k, 50), k)],
    ['두 단어 조합', k => mLabel(firstSentence(k), k)]
  ];
  return `<div class="card"><div class="between"><b>성장</b>${legend}</div>
      <div class="seg" style="margin-top:8px">${Object.keys(MEASURES).map(k => `<button class="${S.measure === k ? 'on' : ''}" data-act="measure" data-v="${k}">${MEASURES[k].l}</button>`).join('')}</div>
      ${lineChart(gSeries, { xmax: xmaxOf(), label: '형제 ' + m.l + ' 비교' })}<div class="tiny muted">같은 개월 수끼리 겹쳐서 보여줘요.</div></div>
    <div class="card"><div class="between"><b>말한 단어 수</b>${legend}</div>
      ${lineChart(wSeries, { xmax: xmaxOf(), y0: 0, label: '형제 단어 수 비교' })}<div class="tiny muted">날짜를 모르는 단어는 '○개월 이전'의 시점에 모아서 보여요.</div></div>
    <div class="card"><b>처음 해낸 때</b>
      <table class="cmp"><tr><th></th>${kids.map(k => `<th style="color:${kidColor(k)}">${esc(k.name)}</th>`).join('')}</tr>
      ${rows.map(([l, f]) => `<tr><td>${l}</td>${kids.map(k => `<td>${f(k)}</td>`).join('')}</tr>`).join('')}</table></div>`;
}

/* ───────── 단어장 ───────── */
function wordsView() {
  const c = pageChild();
  if (!c) return noChild('단어장');
  const all = T('Words').filter(w => w.childId === c.id);
  const words = all.filter(w => w.kind !== 'sentence'), sents = all.filter(w => w.kind === 'sentence');
  const list = (S.wordKind === 'sentence' ? sents : words).filter(w => !S.wordQ || (w.word + ' ' + w.meaning).includes(S.wordQ));
  const cats = S.wordKind === 'sentence' ? ['문장'] : WORD_CATS;
  const byCat = cats.map(cat => {
    const ws = list.filter(w => (S.wordKind === 'sentence' ? true : (w.category || '기타') === cat)).sort((a, b) => (dtMonth(a, c) || 99) - (dtMonth(b, c) || 99));
    return ws.length ? `<div class="sec-title">${cat} <span>${ws.length}</span></div><div>${ws.map(w => `<span class="word" data-act="wordEdit" data-id="${w.id}">${esc(w.word)}${w.meaning ? `<small>${esc(w.meaning)}</small>` : ''}</span>`).join('')}</div>` : '';
  }).join('');
  const other = S.wordKind === 'word' ? list.filter(w => !WORD_CATS.includes(w.category || '기타')) : [];
  return `${topBar()}${updateBanner()}<div class="page">
    <div class="card between"><div><div class="big-num">${words.length}<span style="font-size:15px;font-weight:500;color:var(--ink2)"> 단어</span></div><div class="small muted">문장 ${sents.length}개</div></div>
      <button class="btn primary" data-act="wordEdit">＋ 추가</button></div>
    ${wordStageHtml(c)}
    <div class="card"><div class="between"><b>말한 단어 수</b><span class="tiny muted">${monthText(age(c).months)}</span></div>
      ${lineChart([{ color: '#D85A30', stepLine: true, until: age(c).mDec, pts: wordSeries(c) }], { xmax: Math.min(72, Math.max(24, Math.ceil((age(c).mDec + 3) / 6) * 6)), y0: 0, label: '단어 수 그래프' })}
      <div class="tiny muted">날짜를 모르는 단어는 '○개월 이전'의 시점에 모아서 보여요. 앞으로 새 말을 날짜와 함께 적으면 곡선이 생겨요.</div></div>
    ${wordCatHtml(words)}
    <div class="seg"><button class="${S.wordKind === 'word' ? 'on' : ''}" data-act="wordKind" data-v="word">단어</button><button class="${S.wordKind === 'sentence' ? 'on' : ''}" data-act="wordKind" data-v="sentence">문장</button></div>
    <input class="i" type="search" placeholder="찾기" value="${esc(S.wordQ)}" data-in="wordQ" style="margin-bottom:4px">
    <div id="wl">${byCat}${other.length ? `<div class="sec-title">기타</div>${other.map(w => `<span class="word" data-act="wordEdit" data-id="${w.id}">${esc(w.word)}</span>`).join('')}` : ''}
    ${list.length ? '' : '<div class="card muted" style="text-align:center">아직 없어요.</div>'}</div>
  </div>${navBar('words')}`;
}

/* 말 발달 단계 (CDC 2022 체크리스트 기준 시기) */
function wordStage(c) {
  const n = T('Words').filter(w => w.childId === c.id && w.kind !== 'sentence').length;
  const sents = T('Words').filter(w => w.childId === c.id && w.kind === 'sentence');
  const long = sents.filter(w => String(w.meaning || w.word).trim().split(/\s+/).length >= 4);
  const firstLong = long.map(w => ({ m: dtMonth(w, c), w })).sort((a, b) => (a.m || 0) - (b.m || 0)).map(x => x.w)[0];
  const steps = [
    { t: '첫 단어', done: n >= 1, when: wordAt(c, 1), ref: '15개월까지 한두 단어' },
    { t: '단어 3개', done: n >= 3, when: wordAt(c, 3), ref: '18개월까지' },
    { t: '두 단어 조합', done: sents.length > 0, when: firstSentence(c), ref: '24개월까지' },
    { t: '단어 50개', done: n >= 50, when: wordAt(c, 50), ref: '30개월쯤' },
    { t: '네 단어 이상 문장', done: long.length > 0, when: firstLong, ref: '4세까지' }
  ];
  const next = steps.find(x => !x.done);
  return { steps, n, now: next ? '다음: ' + next.t : '단계 모두 ✓' };
}
function wordStageHtml(c) {
  const st = wordStage(c);
  return `<div class="card"><b>말 발달 단계</b>
    <div class="stages">${st.steps.map(x => `<div class="stg ${x.done ? 'on' : ''}"><span class="dotc">${x.done ? '✓' : ''}</span><div><div>${x.t}</div>
      <div class="tiny muted">${x.done ? (x.when ? mLabel(x.when, c) : '') + ' · ' : ''}보통 ${x.ref}</div></div></div>`).join('')}</div>
    <div class="tiny muted" style="margin-top:6px">'보통'은 대부분(75% 이상)의 아이가 그때까지 하는 것이에요 (미국 CDC 2022). 단어장에 적은 것만 세서, 실제로 아는 말은 더 많아요.</div></div>`;
}
const CAT_COLORS = { 사람: '#D85A30', 음식: '#EF9F27', 동물: '#3F8F5A', 물건: '#3B6FB6', 탈것: '#5BA3C9', 몸: '#D4537E', 동작: '#8A5BB5', 표현: '#B4762E', 기타: '#B4A58E' };
function wordCatHtml(words) {
  if (!words.length) return '';
  const cnt = {}; words.forEach(w => { const k = WORD_CATS.includes(w.category) ? w.category : '기타'; cnt[k] = (cnt[k] || 0) + 1; });
  const ks = WORD_CATS.filter(k => cnt[k]);
  const act = (cnt['동작'] || 0) + (cnt['표현'] || 0);
  return `<div class="card"><b>말의 종류</b>
    <div class="catbar">${ks.map(k => `<span style="width:${cnt[k] / words.length * 100}%;background:${CAT_COLORS[k]}" title="${k} ${cnt[k]}"></span>`).join('')}</div>
    <div class="legend wrap">${ks.map(k => `<span><i style="background:${CAT_COLORS[k]}"></i>${k} ${cnt[k]}</span>`).join('')}</div>
    <div class="tiny muted" style="margin-top:6px">사물 이름 다음에 '먹어', '가자' 같은 동작어가 늘어나는 게 다음 단계의 신호예요. 지금 동작어·표현은 ${act}개예요.</div></div>`;
}

/* ───────── 건강 ───────── */
function healthView() {
  const c = pageChild();
  if (!c) return noChild('건강');
  const vs = T('Vaccines').filter(v => v.childId === c.id);
  const plan = vs.filter(v => v.status !== '완료').sort((a, b) => (a.date || '9999') < (b.date || '9999') ? -1 : 1);
  const done = vs.filter(v => v.status === '완료').sort((a, b) => (a.date || '') < (b.date || '') ? 1 : -1);
  const nx = nextVaccines(c)[0];
  const ck = T('Checkups').filter(k => k.childId === c.id).sort((a, b) => a.date < b.date ? 1 : -1);
  const vis = T('Visits').filter(k => k.childId === c.id).sort((a, b) => a.date < b.date ? 1 : -1);
  const vRow = v => `<div class="list-row" data-act="vacEdit" data-id="${v.id}"><span>${esc(v.disease)} <span class="tiny muted">${esc(v.vaccine)} ${esc(v.dose)}</span></span>
    <span class="small" style="text-align:right">${v.date ? esc(v.date.slice(2).replace(/-/g, '.')) : '<span class="muted">날짜 모름</span>'}${v.status !== '완료' && isDate(v.date) && v.date >= today() && diffDays(today(), v.date) <= 365 ? `<br><span class="tiny" style="color:var(--accent)">D-${diffDays(today(), v.date)}</span>` : ''}</span></div>`;
  return `${topBar()}${updateBanner()}<div class="page">
    ${nx ? `<div class="card notice" data-act="vacEdit" data-id="${nx.id}"><span>다음 접종: <b>${esc(nx.disease)} ${esc(nx.dose)}</b><br><span class="small muted">${dayTitle(nx.date)}</span></span><span class="d">D-${diffDays(today(), nx.date)}</span></div>` : ''}
    <div class="sec-title">예방접종 예정 <button class="btn small" data-act="vacEdit">＋ 추가</button></div>
    <div class="card">${plan.length ? plan.map(vRow).join('') : '<div class="muted small">예정된 접종이 없어요.</div>'}</div>
    <div class="sec-title">완료한 접종 ${done.length}개 <button class="btn small ghost" data-act="toggleDone">${S.showDone ? '접기' : '펼치기'}</button></div>
    ${S.showDone ? `<div class="card">${done.map(vRow).join('')}</div>` : ''}
    <div class="sec-title">영유아검진 <button class="btn small" data-act="ckEdit">＋ 추가</button></div>
    <div class="card">${ck.length ? ck.map(k => `<div class="list-row" data-act="ckEdit" data-id="${k.id}"><span>${esc(k.date.slice(2).replace(/-/g, '.'))} <span class="tiny muted">${monthText(age(c, k.date).months)} · ${esc(k.place)}</span>
      <br><span class="tiny muted">키 ${esc(k.height)}${k.hPct ? `(${esc(k.hPct)})` : ''} · 몸무게 ${esc(k.weight)}${k.wPct ? `(${esc(k.wPct)})` : ''} · 머리 ${esc(k.head)}${k.hcPct ? `(${esc(k.hcPct)})` : ''}</span></span>
      <span class="small">${esc(k.overall)}</span></div>`).join('') : '<div class="muted small">검진 기록이 없어요.</div>'}</div>
    <div class="sec-title">병원 · 아픈 날 <button class="btn small" data-act="visitEdit">＋ 추가</button></div>
    <div class="card">${vis.length ? vis.map(k => `<div class="list-row" data-act="visitEdit" data-id="${k.id}"><span>${esc(k.date.slice(2).replace(/-/g, '.'))} <span class="tag">${esc(k.kind)}</span><br><span class="small">${esc(k.reason)}</span></span><span class="tiny muted">${esc(k.place)}</span></div>`).join('') : '<div class="muted small">기록이 없어요.</div>'}</div>
  </div>${navBar('health')}`;
}

/* ───────── 설정 ───────── */
function settingsView() {
  return `<div class="top"><button class="icon-btn" data-act="back">${ICON.back}</button><div class="who"><div class="page-title" style="margin:0">설정</div></div></div>
  <div class="page">
    <div class="card"><div class="small muted">로그인</div><div>${esc(S.user ? S.user.name : '')} <span class="small muted">${esc(S.user ? S.user.email : '')}</span></div></div>
    <div class="sec-title">아이 <button class="btn small" data-act="childEdit">＋ 아이 추가</button></div>
    <div class="card">${children().map(c => `<div class="list-row" data-act="childEdit" data-id="${c.id}"><span>${esc(c.name)} <span class="tiny muted">${c.sex === 'F' ? '여아' : '남아'}</span></span><span class="small muted">${esc(c.birth)} · ${ageLabel(c)}</span></div>`).join('') || '<div class="muted small">등록된 아이가 없어요.</div>'}</div>
    <div class="sec-title">화면</div>
    <div class="card list-row" data-act="toggleRef"><span>발달·성장 기준 범위 보기</span><span class="small" style="color:var(--accent)">${S.showRef ? '켜짐' : '꺼짐'}</span></div>
    <div class="sec-title">기록</div>
    <div class="card list-row" data-act="tagManage"><span>태그 관리<br><span class="tiny muted">태그 추가, 이름 바꾸기, 순서, 숨기기</span></span><span>›</span></div>
    <div class="sec-title">지난 기록</div>
    <div class="card list-row" data-act="go" data-h="bulk"><span>지난 사진 한꺼번에 올리기<br><span class="tiny muted">찍은 날짜별로 묶어서 기록 초안을 만들어요 (PC 추천)</span></span><span>›</span></div>
    <div class="sec-title">보관</div>
    <div class="card"><div class="list-row" data-act="backup"><span>지금 백업 만들기<br><span class="tiny muted">구글 드라이브 '백업' 폴더에 시트 사본을 만들어요</span></span><span>›</span></div>
      <div class="list-row" data-act="exportAll"><span>전체 기록 내려받기<br><span class="tiny muted">표 기록을 엑셀에서 열 수 있는 파일(CSV)로 받아요</span></span><span>›</span></div></div>
    <div class="sec-title">앱</div>
    <div class="card"><div class="list-row" data-act="reload"><span>서버에서 다시 불러오기</span><span>›</span></div>
      <div class="list-row" data-act="logout"><span>로그아웃</span><span>›</span></div>
      <div class="list-row"><span class="muted">버전</span><span class="muted">${APP_VERSION}</span></div></div>
  </div>`;
}

/* ───────── 지난 사진 한꺼번에 ───────── */
let BULK = null;
function bulkView() {
  const cs = children();
  if (!BULK) BULK = { childIds: cs[0] ? [cs[0].id] : [], files: [], groups: [], running: false };
  return `<div class="top"><button class="icon-btn" data-act="back">${ICON.back}</button><div class="who"><div class="page-title" style="margin:0">지난 사진 올리기</div></div></div>
  <div class="page"><div class="card">
    <div class="small muted">사진을 여러 장 고르면 찍은 날짜별로 묶어서 기록 초안을 만들어요. 하루 사진이 많으면 5장씩 나눠서 만들어져요. 내용은 나중에 홈에서 채우면 돼요.</div>
    ${cs.length > 1 ? `<label class="f">누구의 사진인가요?</label><div class="chips">${cs.map(k => `<button class="chip ${BULK.childIds.includes(k.id) ? 'on' : ''}" data-act="bulkChild" data-v="${k.id}">${esc(k.name)}</button>`).join('')}</div>` : ''}
    <label class="f">사진 고르기</label><input type="file" id="b_file" accept="image/*" multiple class="i">
    <div id="b_sum" class="small" style="margin-top:10px"></div>
    <div class="progress hidden" id="b_prog"><div></div></div>
    <div class="btns"><button class="btn primary" data-act="bulkRun" id="b_run" disabled>올리기</button></div>
  </div></div>`;
}
function mountBulk() {
  $('#b_file').addEventListener('change', async ev => {
    const files = Array.from(ev.target.files || []);
    $('#b_sum').textContent = '날짜를 읽는 중…';
    const items = [];
    for (const f of files) items.push({ f, date: (await photoDate(f)) || today() });
    const byDate = {};
    items.forEach(it => { (byDate[it.date] = byDate[it.date] || []).push(it); });
    const groups = [];
    Object.keys(byDate).sort().forEach(d => { const arr = byDate[d]; for (let i = 0; i < arr.length; i += 5) groups.push({ date: d, items: arr.slice(i, i + 5) }); });
    BULK.groups = groups;
    $('#b_sum').innerHTML = `사진 ${files.length}장 → 날짜 ${Object.keys(byDate).length}일 · 기록 ${groups.length}개가 만들어져요.<br><span class="tiny muted">${Object.keys(byDate).sort().slice(0, 8).map(d => `${d} (${byDate[d].length}장)`).join(', ')}${Object.keys(byDate).length > 8 ? ' …' : ''}</span>`;
    $('#b_run').disabled = !groups.length;
  });
}
async function bulkRun() {
  if (!BULK.groups.length || BULK.running) return;
  if (!BULK.childIds.length) return toast('아이를 골라주세요.');
  BULK.running = true;
  const btn = $('#b_run'), prog = $('#b_prog');
  btn.disabled = true; prog.classList.remove('hidden');
  const total = BULK.groups.reduce((s, g) => s + g.items.length, 0);
  let done = 0, made = 0;
  try {
    for (const g of BULK.groups) {
      const strs = [];
      for (const it of g.items) {
        try {
          const thumb = await resizeImage(it.f, 360, 0.72), full = await resizeImage(it.f, 2560, 0.86);
          const j = await api('uploadPhoto', { date: g.date, thumb: b64(thumb), full: b64(full) });
          const sp = splitPhoto(j.photo); memPhoto.set(sp.thumb, thumb); IDB.set(sp.thumb, thumb);
          strs.push(j.photo);
        } catch (e) { console.warn(e); }
        done++; prog.firstElementChild.style.width = Math.round(done / total * 100) + '%';
        btn.textContent = `올리는 중… ${done}/${total}`;
      }
      if (strs.length) { await saveRow('Entries', { id: uid(), date: g.date, childIds: BULK.childIds.join(','), text: '', tags: '', photos: strs.join(','), draft: 'TRUE' }); made++; }
    }
    toast(`기록 초안 ${made}개를 만들었어요.`);
    BULK = null; S.filter.tag = '__draft'; go('home');
  } catch (e) { toast(e.message); btn.disabled = false; btn.textContent = '이어서 올리기'; }
  finally { if (BULK) BULK.running = false; }
}

/* ───────── 시트(입력 창)들 ───────── */
function formVal(root, n) { const el = root.querySelector(`[name="${n}"]`); return el ? el.value.trim() : ''; }
function sheetButtons(delAct, id) {
  return `<p class="err" data-err></p><div class="btns">${delAct && id ? `<button class="btn danger" data-act="${delAct}" data-id="${id}">지우기</button>` : `<button class="btn" data-act="closeSheet">취소</button>`}<button class="btn primary" data-act="sheetSave">저장</button></div>`;
}
let sheetSave = null;
function bindSave(fn) { sheetSave = fn; }
async function runSheetSave() {
  const panel = $('#sheet .panel'); if (!panel || !sheetSave) return;
  const errEl = panel.querySelector('[data-err]'); const btn = panel.querySelector('[data-act="sheetSave"]');
  errEl.textContent = ''; btn.disabled = true; btn.textContent = '저장하는 중…';
  try { await sheetSave(panel); closeSheet(); render(); }
  catch (e) { errEl.textContent = e.message; btn.disabled = false; btn.textContent = '저장'; }
}

function growthSheet(id) {
  const c = pageChild();
  const g = id ? T('Growth').find(x => x.id === id) : { date: today() };
  openSheet(`<h3>${id ? '측정 기록 고치기' : '측정 기록 추가'}</h3>
    <label class="f">날짜</label><input class="i" type="date" name="date" value="${esc(g.date)}">
    <div class="grid3"><div><label class="f">키(cm)</label><input class="i" name="height" inputmode="decimal" value="${esc(g.height || '')}"></div>
    <div><label class="f">몸무게(kg)</label><input class="i" name="weight" inputmode="decimal" value="${esc(g.weight || '')}"></div>
    <div><label class="f">머리둘레(cm)</label><input class="i" name="head" inputmode="decimal" value="${esc(g.head || '')}"></div></div>
    <label class="f">메모</label><input class="i" name="memo" value="${esc(g.memo || '')}">${sheetButtons('growthDel', id)}`);
  bindSave(async p => {
    const row = { id: id || uid(), childId: c.id, date: formVal(p, 'date'), height: formVal(p, 'height'), weight: formVal(p, 'weight'), head: formVal(p, 'head'), memo: formVal(p, 'memo'), source: g.source || '' };
    if (!isDate(row.date)) throw new Error('날짜를 골라주세요.');
    if (['height', 'weight', 'head'].every(k => num(row[k]) == null)) throw new Error('값을 하나 이상 넣어주세요.');
    ['height', 'weight', 'head'].forEach(k => { if (row[k] && num(row[k]) == null) throw new Error('숫자만 넣어주세요.'); });
    await saveRow('Growth', row);
  });
}
function growthPasteSheet() {
  const c = pageChild();
  openSheet(`<h3>표로 붙여넣기</h3><div class="small muted">한 줄에 하나씩: 날짜 키 몸무게 머리둘레<br>엑셀에서 복사해 붙여넣어도 돼요. 없는 값은 - 로 적어주세요.</div>
    <textarea class="i" name="txt" style="min-height:160px;margin-top:8px" placeholder="2026-09-10 83.2 13.4 -&#10;2026-11-01 85 13.9 49"></textarea>${sheetButtons()}`);
  bindSave(async p => {
    const rows = [];
    formVal(p, 'txt').split('\n').map(s => s.trim()).filter(Boolean).forEach((line, i) => {
      const parts = line.split(/[\s,\t]+/);
      const d = parts[0].replace(/[./]/g, '-');
      if (!isDate(d)) throw new Error(`${i + 1}번째 줄의 날짜를 확인해 주세요.`);
      const v = k => parts[k] && parts[k] !== '-' ? parts[k] : '';
      rows.push({ id: uid() + i, childId: c.id, date: d, height: v(1), weight: v(2), head: v(3), memo: '', source: '' });
    });
    if (!rows.length) throw new Error('붙여넣을 내용이 없어요.');
    await saveRows('Growth', rows);
    toast(`${rows.length}개를 넣었어요.`);
  });
}
function msSheet(key) {
  const c = pageChild();
  const d = msItem(key);
  if (!d) return toast('항목을 찾을 수 없어요.');
  const g = T('Milestones').find(m => m.childId === c.id && m.key === key);
  openSheet(`<h3>${esc(d.t)}</h3><div class="small muted">${d.group.label} 체크리스트 · ${MS_DOMAIN_LABEL[d.d] || ''}${d.custom ? ' · 직접 추가한 항목' : ''}</div>
    <label class="f">언제 했나요?</label>${dtForm(g || { dateType: 'exact' }, c)}
    <label class="f">메모</label><input class="i" name="memo" value="${esc(g ? g.memo : '')}">
    ${d.custom ? `<button class="btn small ghost danger" data-act="msDefDel" data-id="${d.custom}" style="margin-top:8px">이 항목 자체를 목록에서 빼기</button>` : ''}
    ${sheetButtons(g ? 'msDel' : null, g ? g.id : null)}`);
  bindSave(async p => {
    const dt = readDt(p);
    await saveRow('Milestones', Object.assign({ id: c.id + '_' + key, childId: c.id, key, memo: formVal(p, 'memo'), deleted: '' }, dt));
  });
}
function msAddSheet() {
  const c = pageChild();
  const cur = c ? curGroup(c) : 12;
  openSheet(`<h3>발달 체크 항목 추가</h3><label class="f">항목 이름</label><input class="i" name="title" placeholder="예: 혼자 신발 신기">
    <div class="grid2"><div><label class="f">시기</label><select class="i" name="month">${MS_GROUPS.map(g => `<option value="${g.m}" ${g.m === cur ? 'selected' : ''}>${g.label}</option>`).join('')}</select></div>
    <div><label class="f">분류</label><select class="i" name="category">${MS_DOMAINS.map(d => `<option value="${d}" ${d === '기타' ? 'selected' : ''}>${MS_DOMAIN_LABEL[d]}</option>`).join('')}</select></div></div>${sheetButtons()}`);
  bindSave(async p => {
    if (!formVal(p, 'title')) throw new Error('항목 이름을 적어주세요.');
    await saveRow('MilestoneDefs', { id: uid(), title: formVal(p, 'title'), category: formVal(p, 'category'), month: formVal(p, 'month') });
  });
}
function toothSheet(code) {
  const c = pageChild();
  const t = toothByCode(code);
  const g = T('Teeth').find(x => x.childId === c.id && x.tooth === code);
  const lostPart = t.perm ? '' : `<label class="f">빠진 날 (빠졌을 때만)</label><input class="i" type="date" name="lostDate" value="${esc(g && isDate(g.lostDate) ? g.lostDate : '')}">
    ${S.showRef ? `<div class="tiny muted" style="margin-top:4px">보통 ${yrs(t.shedFrom)}~${yrs(t.shedTo)}에 빠져요.</div>` : ''}`;
  openSheet(`<h3>${t.perm ? '영구치' : '젖니'} · ${t.name}</h3>${S.showRef ? `<div class="small muted">보통 ${yrs(t.from)}~${yrs(t.to)}에 나요. (미국치과협회 기준)</div>` : ''}
    <label class="f">언제 났나요?</label>${dtForm(g || { dateType: 'exact' }, c)}
    ${lostPart}
    <label class="f">메모</label><input class="i" name="memo" value="${esc(g ? g.memo : '')}">${sheetButtons(g ? 'toothDel' : null, g ? g.id : null)}`);
  bindSave(async p => {
    const lost = formVal(p, 'lostDate');
    await saveRow('Teeth', Object.assign({ id: c.id + '_' + code, childId: c.id, tooth: code, memo: formVal(p, 'memo'), lostDate: lost || '', deleted: '' }, readDt(p)));
  });
}
function teethBulkSheet() {
  const c = pageChild();
  const list = S.teethSet === 'P' ? PERM : TEETH;
  const have = new Set(T('Teeth').filter(t => t.childId === c.id).map(t => t.tooth));
  openSheet(`<h3>지금 난 ${S.teethSet === 'P' ? '영구치' : '젖니'} 한꺼번에 체크</h3><div class="small muted">이미 난 이를 모두 고르면 '${age(c).months}개월 이전'으로 기록돼요. 날짜는 나중에 하나씩 고칠 수 있어요.</div>
    <div class="chips" style="margin-top:10px">${list.map(t => `<button type="button" class="chip ${have.has(t.code) ? 'on' : ''}" data-act="chipToggle" data-v="${t.code}" ${have.has(t.code) ? 'disabled' : ''}>${t.name}</button>`).join('')}</div>${sheetButtons()}`);
  bindSave(async p => {
    const picked = $$('.chip.on:not([disabled])', p).map(b => b.dataset.v);
    if (!picked.length) throw new Error('새로 고른 이가 없어요.');
    await saveRows('Teeth', picked.map(code => ({ id: c.id + '_' + code, childId: c.id, tooth: code, dateType: 'before', date: '', month: age(c).months, monthTo: '', memo: '', lostDate: '', deleted: '' })));
  });
}
/* 태그 관리 */
function tagRowHtml(t) {
  return `<div class="tagrow" data-k="${esc(t.k)}" data-row="${esc(t.rowId || '')}">
    <input class="i" name="label" value="${esc(t.l)}" maxlength="20">
    <label class="tiny muted hide-lb"><input type="checkbox" name="hidden" ${t.hidden ? 'checked' : ''}> 숨김</label>
    <button type="button" class="btn small ghost" data-act="tagUp" aria-label="위로">▲</button><button type="button" class="btn small ghost" data-act="tagDown" aria-label="아래로">▼</button></div>`;
}
function tagSheet() {
  openSheet(`<h3>태그 관리</h3><div class="small muted">이름 앞에 이모지를 넣으면 보기 좋아요. 숨긴 태그는 새 기록에 안 보이고, 예전 기록에는 그대로 남아요.</div>
    <div id="tagrows" style="margin-top:10px">${allTags().map(tagRowHtml).join('')}</div>
    <div class="row" style="margin-top:10px"><input class="i grow" id="newtag" placeholder="예: 🍚 먹은 것" maxlength="20"><button type="button" class="btn small" data-act="tagAdd">추가</button></div>
    ${sheetButtons()}`);
  bindSave(async p => {
    const rows = $$('.tagrow', p).map((r, i) => {
      const label = r.querySelector('[name="label"]').value.trim();
      if (!label) throw new Error('태그 이름이 비어 있어요.');
      return { id: r.dataset.row || 'tag_' + r.dataset.k, key: r.dataset.k, label, order: i, hidden: r.querySelector('[name="hidden"]').checked ? 'TRUE' : '', deleted: '' };
    });
    await saveRows('Tags', rows);
  });
}
function wordSheet(id) {
  const c = pageChild();
  const w = id ? T('Words').find(x => x.id === id) : { kind: S.wordKind, category: S.wordKind === 'sentence' ? '문장' : '기타', dateType: 'exact' };
  openSheet(`<h3>${id ? '말 고치기' : '새로 한 말'}</h3>
    <div class="grid2"><div><label class="f">아이가 한 말</label><input class="i" name="word" value="${esc(w.word || '')}" placeholder="멈머"></div>
    <div><label class="f">뜻 (발음 메모)</label><input class="i" name="meaning" value="${esc(w.meaning || '')}" placeholder="멍멍이"></div></div>
    <div class="grid2"><div><label class="f">종류</label><select class="i" name="kind"><option value="word" ${w.kind !== 'sentence' ? 'selected' : ''}>단어</option><option value="sentence" ${w.kind === 'sentence' ? 'selected' : ''}>문장</option></select></div>
    <div><label class="f">분류</label><select class="i" name="category">${WORD_CATS.concat(['문장']).map(k => `<option ${w.category === k ? 'selected' : ''}>${k}</option>`).join('')}</select></div></div>
    <label class="f">처음 말한 때</label>${dtForm(w, c)}
    <label class="f">메모</label><input class="i" name="memo" value="${esc(w.memo || '')}">${sheetButtons(id ? 'wordDel' : null, id)}`);
  bindSave(async p => {
    if (!formVal(p, 'word')) throw new Error('아이가 한 말을 적어주세요.');
    await saveRow('Words', Object.assign({ id: id || uid(), childId: c.id, word: formVal(p, 'word'), meaning: formVal(p, 'meaning'), kind: formVal(p, 'kind'), category: formVal(p, 'kind') === 'sentence' ? '문장' : formVal(p, 'category'), memo: formVal(p, 'memo') }, readDt(p)));
  });
}
function vacSheet(id) {
  const c = pageChild();
  const v = id ? T('Vaccines').find(x => x.id === id) : { status: '예정' };
  const willComplete = id && v.status !== '완료';
  openSheet(`<h3>${id ? esc(v.disease + ' ' + v.dose) : '접종 추가'}</h3>
    <div class="grid2"><div><label class="f">감염병</label><input class="i" name="disease" value="${esc(v.disease || '')}"></div><div><label class="f">백신</label><input class="i" name="vaccine" value="${esc(v.vaccine || '')}"></div></div>
    <div class="grid2"><div><label class="f">차수</label><input class="i" name="dose" value="${esc(v.dose || '')}" placeholder="2차"></div>
    <div><label class="f">상태</label><select class="i" name="status"><option ${v.status !== '완료' && !willComplete ? 'selected' : ''}>예정</option><option ${v.status === '완료' || willComplete ? 'selected' : ''}>완료</option></select></div></div>
    <label class="f">${willComplete ? '접종한 날' : '날짜'}</label><input class="i" type="date" name="date" value="${esc(willComplete ? today() : (v.date || ''))}">
    ${willComplete ? `<div class="tiny muted" style="margin-top:4px">예정일: ${esc(v.date || '-')} · 접종을 마쳤으면 날짜를 확인하고 저장하세요.</div>` : ''}
    <div class="grid2"><div><label class="f">접종기관</label><input class="i" name="place" value="${esc(v.place || '')}"></div><div><label class="f">백신명</label><input class="i" name="product" value="${esc(v.product || '')}"></div></div>
    <div class="grid2"><div><label class="f">제조사</label><input class="i" name="maker" value="${esc(v.maker || '')}"></div><div><label class="f">로트번호</label><input class="i" name="lot" value="${esc(v.lot || '')}"></div></div>
    <label class="f">비고</label><input class="i" name="note" value="${esc(v.note || '')}">${sheetButtons(id ? 'vacDel' : null, id)}`);
  bindSave(async p => {
    const row = { id: id || uid(), childId: c.id };
    ['disease', 'vaccine', 'dose', 'status', 'date', 'place', 'product', 'maker', 'lot', 'note'].forEach(k => row[k] = formVal(p, k));
    if (!row.disease) throw new Error('감염병 이름을 적어주세요.');
    await saveRow('Vaccines', row);
  });
}
function ckSheet(id) {
  const c = pageChild();
  const k = id ? T('Checkups').find(x => x.id === id) : { date: today() };
  const f = (n, l, ph) => `<div><label class="f">${l}</label><input class="i" name="${n}" value="${esc(k[n] || '')}" ${ph ? `placeholder="${ph}"` : ''}></div>`;
  openSheet(`<h3>${id ? '영유아검진' : '영유아검진 추가'}</h3>
    <div class="grid2"><div><label class="f">검진일</label><input class="i" type="date" name="date" value="${esc(k.date)}"></div>${f('place', '검진기관')}</div>
    <div class="grid2">${f('height', '키(cm)')}${f('hPct', '키 백분위')}</div><div class="grid2">${f('weight', '몸무게(kg)')}${f('wPct', '몸무게 백분위')}</div>
    <div class="grid2">${f('head', '머리둘레(cm)')}${f('hcPct', '머리둘레 백분위')}</div>
    <div class="grid2">${f('dev', '발달평가', '양호')}${f('overall', '종합판정', '양호')}</div>${f('note', '소견')}
    <label class="f">결과지 (PDF·사진)</label>${k.fileId ? `<button class="btn small" data-act="openFile" data-id="${k.fileId}">첨부 보기</button> ` : ''}<input type="file" name="file" accept="application/pdf,image/*" class="i" style="margin-top:6px">
    ${sheetButtons(id ? 'ckDel' : null, id)}`);
  bindSave(async p => {
    const row = { id: id || uid(), childId: c.id, fileId: k.fileId || '' };
    ['date', 'place', 'height', 'hPct', 'weight', 'wPct', 'head', 'hcPct', 'dev', 'overall', 'note'].forEach(n => row[n] = formVal(p, n));
    if (!isDate(row.date)) throw new Error('검진일을 골라주세요.');
    const file = p.querySelector('[name="file"]').files[0];
    if (file) {
      if (file.size > 8e6) throw new Error('파일이 너무 커요 (8MB 이하).');
      const data = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(b64(r.result)); r.onerror = no; r.readAsDataURL(file); });
      const j = await api('uploadFile', { name: `영유아검진_${row.date}_${file.name}`, mime: file.type, data });
      row.fileId = j.fileId;
    }
    await saveRow('Checkups', row);
    const same = T('Growth').find(g => g.childId === c.id && g.date === row.date);
    if (!same && [row.height, row.weight, row.head].some(v => num(v) != null)) {
      await saveRow('Growth', { id: uid(), childId: c.id, date: row.date, height: row.height, weight: row.weight, head: row.head, memo: '영유아검진' + (row.place ? '(' + row.place + ')' : ''), source: '검진' });
    }
  });
}
function visitSheet(id) {
  const c = pageChild();
  const v = id ? T('Visits').find(x => x.id === id) : { date: today(), kind: '진료' };
  openSheet(`<h3>${id ? '병원 · 아픈 날' : '병원 · 아픈 날 추가'}</h3>
    <div class="grid2"><div><label class="f">날짜</label><input class="i" type="date" name="date" value="${esc(v.date)}"></div>
    <div><label class="f">종류</label><select class="i" name="kind">${VISIT_KINDS.map(k => `<option ${v.kind === k ? 'selected' : ''}>${k}</option>`).join('')}</select></div></div>
    <label class="f">병원</label><input class="i" name="place" value="${esc(v.place || '')}">
    <label class="f">이유 · 증상</label><input class="i" name="reason" value="${esc(v.reason || '')}" placeholder="예: 열 38.5도, 콧물">
    <label class="f">메모 (진단, 처방, 경과)</label><textarea class="i" name="memo">${esc(v.memo || '')}</textarea>${sheetButtons(id ? 'visitDel' : null, id)}`);
  bindSave(async p => {
    const row = { id: id || uid(), childId: c.id };
    ['date', 'kind', 'place', 'reason', 'memo'].forEach(n => row[n] = formVal(p, n));
    if (!isDate(row.date)) throw new Error('날짜를 골라주세요.');
    await saveRow('Visits', row);
  });
}
function childSheet(id) {
  const k = id ? childById(id) : { sex: 'M', birth: '' };
  openSheet(`<h3>${id ? '아이 정보' : '아이 추가'}</h3>
    <label class="f">이름 (태명도 괜찮아요)</label><input class="i" name="name" value="${esc(k.name || '')}">
    <div class="grid2"><div><label class="f">성별</label><select class="i" name="sex"><option value="M" ${k.sex !== 'F' ? 'selected' : ''}>남아</option><option value="F" ${k.sex === 'F' ? 'selected' : ''}>여아</option></select></div>
    <div><label class="f">생일 (예정일)</label><input class="i" type="date" name="birth" value="${esc(k.birth || '')}"></div></div>
    <div class="tiny muted" style="margin-top:6px">성별은 성장 기준(남아·여아)을 고를 때 써요.</div>${sheetButtons()}`);
  bindSave(async p => {
    if (!formVal(p, 'name')) throw new Error('이름을 적어주세요.');
    if (!isDate(formVal(p, 'birth'))) throw new Error('생일을 골라주세요.');
    const row = await saveRow('Children', { id: id || 'c' + uid(), name: formVal(p, 'name'), sex: formVal(p, 'sex'), birth: formVal(p, 'birth'), order: id ? k.order : children().length + 1 });
    if (!id) { S.child = row.id; LS.set('child', S.child); }
  });
}
function pickChildSheet() {
  const cs = children();
  openSheet(`<h3>누구의 기록을 볼까요?</h3>
    ${cs.map(c => `<div class="list-row" data-act="setChild" data-v="${c.id}"><span>${esc(c.name)}</span><span class="small muted">${ageLabel(c)}</span></div>`).join('')}
    ${cs.length > 1 ? `<div class="list-row" data-act="setChild" data-v="all"><span>모든 아이</span><span></span></div>` : ''}
    <div class="btns"><button class="btn" data-act="closeSheet">닫기</button><button class="btn" data-act="childEdit">＋ 아이 추가</button></div>`);
}

/* ───────── 내려받기 ───────── */
async function exportAll() {
  toast('파일을 만드는 중…');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  const zip = new JSZip();
  Object.keys(S.data).forEach(t => {
    const rows = S.data[t]; if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const csv = '﻿' + [cols.join(',')].concat(rows.map(r => cols.map(c => `"${String(r[c] == null ? '' : r[c]).replace(/"/g, '""')}"`).join(','))).join('\r\n');
    zip.file(t + '.csv', csv);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `우리아이기록장_${today()}.zip`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function openFile(id) {
  toast('파일을 여는 중…');
  const j = await api('file', { id }); const f = j.files[id];
  if (!f) return toast('파일을 찾을 수 없어요.');
  const bytes = Uint8Array.from(atob(f.data), ch => ch.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: f.mime }));
  const a = document.createElement('a'); a.href = url; a.download = f.name; a.target = '_blank'; a.click();
}

/* ───────── 이벤트 ───────── */
const ACT = {
  go: el => go(el.dataset.h),
  back: () => { if (history.length > 1) history.back(); else go('home'); },
  reload: () => { S.data = null; render(); },
  pickChild: () => pickChildSheet(),
  setChild: el => { S.child = el.dataset.v; LS.set('child', S.child); S.page = 20; closeSheet(); render(); },
  closeSheet: () => closeSheet(),
  sheetSave: () => runSheetSave(),
  applyUpdate: () => { if (S.waitingSW) S.waitingSW.postMessage('skipWaiting'); },
  more: () => { S.page += 20; $('#tl').innerHTML = timelineHtml(); hydratePhotos(); },
  tagFilter: el => { S.filter.tag = el.dataset.v; if (!el.dataset.v) S.filter.author = ''; S.page = 20; render(); },
  authorFilter: el => { S.filter.author = S.filter.author === el.dataset.v ? '' : el.dataset.v; S.page = 20; render(); },
  growthGo: el => { S.devTab = 'growth'; S.measure = el.dataset.v; go('dev'); },
  msToggle: el => { const m = Number(el.dataset.m); S.msOpen.has(m) ? S.msOpen.delete(m) : S.msOpen.add(m); render(); },
  msQuick: async el => {
    const c = pageChild(), key = el.dataset.k, gm = Number(el.dataset.m);
    if (T('Milestones').some(m => m.childId === c.id && m.key === key)) return msSheet(key);
    const nowM = age(c).months;
    el.classList.add('on'); el.textContent = '✓';
    try { await saveRow('Milestones', { id: c.id + '_' + key, childId: c.id, key, dateType: 'before', date: '', month: Math.min(gm, nowM), monthTo: '', memo: '', deleted: '' }); render(); }
    catch (e) { toast(e.message); render(); }
  },
  msAllDone: async el => {
    const c = pageChild(), gm = Number(el.dataset.m);
    const g = msGroups().find(x => x.m === gm);
    const have = new Set(T('Milestones').filter(m => m.childId === c.id).map(m => m.key));
    const rows = g.items.filter(i => !have.has(i.key)).map(i => ({ id: c.id + '_' + i.key, childId: c.id, key: i.key, dateType: 'before', date: '', month: gm, monthTo: '', memo: '', deleted: '' }));
    if (!rows.length || !confirm(`${g.label} 항목 ${rows.length}개를 '${gm}개월 이전에 했어요'로 체크할까요?`)) return;
    try { await saveRows('Milestones', rows); toast('체크했어요.'); render(); } catch (e) { toast(e.message); }
  },
  teethSet: el => { S.teethSet = el.dataset.v; render(); },
  tagManage: () => tagSheet(),
  tagUp: el => { const r = el.closest('.tagrow'); if (r.previousElementSibling) r.parentNode.insertBefore(r, r.previousElementSibling); },
  tagDown: el => { const r = el.closest('.tagrow'); if (r.nextElementSibling) r.parentNode.insertBefore(r.nextElementSibling, r); },
  tagAdd: () => { const inp = $('#newtag'); const v = inp.value.trim(); if (!v) return; $('#tagrows').insertAdjacentHTML('beforeend', tagRowHtml({ k: 't' + uid(), l: v, hidden: false })); inp.value = ''; },
  filterDraft: () => { S.filter.tag = '__draft'; render(); },
  /* 기록 쓰기 */
  cancelEdit: () => { E = null; ACT.back(); },
  eChild: el => { const v = el.dataset.v; E.childIds = E.childIds.includes(v) ? E.childIds.filter(x => x !== v) : E.childIds.concat(v); el.classList.toggle('on'); $('#e_age').textContent = editorAgeText(); },
  eTag: el => { const v = el.dataset.v; const ms = $('#e_ms'), wd = $('#e_words'); if (ms) E.msKey = ms.value; if (wd) E.newWords = wd.value; E.tags = E.tags.includes(v) ? E.tags.filter(x => x !== v) : E.tags.concat(v); el.classList.toggle('on'); $('#e_extra').innerHTML = editorExtraHtml(); },
  ePicAdd: () => $('#e_file').click(),
  ePicDel: el => { E.photos.splice(Number(el.dataset.i), 1); $('#e_pics').innerHTML = editorPicsHtml(); hydratePhotos(); },
  saveEntry: () => saveEntry(),
  delEntry: async el => { if (!confirm('이 기록을 지울까요? 사진 파일은 드라이브에 남아요.')) return; try { await removeRow('Entries', el.dataset.id); toast('지웠어요.'); go('home'); } catch (e) { toast(e.message); } },
  heart: async el => {
    const id = el.dataset.id, hid = id + '_' + S.user.name;
    try { if (T('Hearts').some(h => h.id === hid)) await removeRow('Hearts', hid); else await saveRow('Hearts', { id: hid, entryId: id, author: S.user.name, deleted: '' }); render(); } catch (e) { toast(e.message); }
  },
  addComment: async el => { const t = $('#c_text').value.trim(); if (!t) return; try { await saveRow('Comments', { id: uid(), entryId: el.dataset.id, text: t }); render(); } catch (e) { toast(e.message); } },
  delComment: async el => { if (!confirm('댓글을 지울까요?')) return; try { await removeRow('Comments', el.dataset.id); render(); } catch (e) { toast(e.message); } },
  /* 발달 */
  devTab: el => { S.devTab = el.dataset.v; render(); },
  measure: el => { S.measure = el.dataset.v; render(); },
  toggleRef: () => { S.showRef = !S.showRef; LS.set('showRef', S.showRef); render(); },
  growthAll: () => { S.growthAll = true; render(); },
  growthEdit: el => growthSheet(el.dataset.id),
  growthPaste: () => growthPasteSheet(),
  msEdit: el => msSheet(el.dataset.k),
  msAdd: () => msAddSheet(),
  toothEdit: el => toothSheet(el.dataset.k),
  teethBulk: () => teethBulkSheet(),
  chipToggle: el => el.classList.toggle('on'),
  dtType: el => { const root = el.closest('.dtf'); $$('.chip', root).forEach(b => b.classList.toggle('on', b === el)); root.querySelector('[name="dateType"]').value = el.dataset.v; $$('[data-dt]', root).forEach(d => d.classList.toggle('hidden', d.dataset.dt !== el.dataset.v)); },
  /* 단어 */
  wordKind: el => { S.wordKind = el.dataset.v; render(); },
  wordEdit: el => wordSheet(el.dataset.id),
  /* 건강 */
  toggleDone: () => { S.showDone = !S.showDone; render(); },
  vacEdit: el => vacSheet(el.dataset.id),
  ckEdit: el => ckSheet(el.dataset.id),
  visitEdit: el => visitSheet(el.dataset.id),
  openFile: el => openFile(el.dataset.id).catch(e => toast(e.message)),
  /* 설정 */
  childEdit: el => childSheet(el.dataset.id),
  backup: async () => { toast('백업을 만드는 중…'); try { const j = await api('backup'); toast(`'${j.name}'을 만들었어요.`); } catch (e) { toast(e.message); } },
  exportAll: () => exportAll().catch(e => toast(e.message)),
  logout: async () => { if (!confirm('로그아웃할까요?')) return; try { await api('logout'); } catch (e) {} logoutLocal(); LS.del('data'); S.data = null; render(); },
  bulkChild: el => { const v = el.dataset.v; BULK.childIds = BULK.childIds.includes(v) ? BULK.childIds.filter(x => x !== v) : BULK.childIds.concat(v); el.classList.toggle('on'); },
  bulkRun: () => bulkRun()
};
/* 지우기 버튼들 */
[['growthDel', 'Growth'], ['msDel', 'Milestones'], ['toothDel', 'Teeth'], ['wordDel', 'Words'], ['vacDel', 'Vaccines'], ['ckDel', 'Checkups'], ['visitDel', 'Visits'], ['msDefDel', 'MilestoneDefs']].forEach(([act, table]) => {
  ACT[act] = async el => { if (!confirm('지울까요?')) return; try { await removeRow(table, el.dataset.id); closeSheet(); render(); toast('지웠어요.'); } catch (e) { toast(e.message); } };
});

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.in;
  if (k === 'search') { S.filter.q = e.target.value; S.page = 20; $('#tl').innerHTML = timelineHtml(); hydratePhotos(); }
  if (k === 'wordQ') { S.wordQ = e.target.value.trim(); const pos = e.target.selectionStart; render(); const inp = $('[data-in="wordQ"]'); if (inp) { inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (er) {} } }
});
document.addEventListener('change', e => {
  if (e.target.dataset && e.target.dataset.ch === 'month') { S.filter.month = e.target.value; S.page = 20; $('#tl').innerHTML = timelineHtml(); hydratePhotos(); }
});
window.addEventListener('hashchange', () => { const r = route().name; if (r !== 'new' && r !== 'edit') E = null; closeSheet(); render(); window.scrollTo(0, 0); });

/* ───────── 시작 ───────── */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').then(reg => {
    const show = w => { S.waitingSW = w; if (S.data) render(); };
    if (reg.waiting && navigator.serviceWorker.controller) show(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) show(nw); });
    });
    setInterval(() => reg.update(), 3600e3);
  }).catch(() => {});
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshing) return; refreshing = true; location.reload(); });
}
render();
if (S.token && S.data) load().catch(e => console.warn(e));
