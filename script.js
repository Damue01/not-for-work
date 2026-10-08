(() => {
  'use strict';
  const options = {
    zodiac: ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'],
    animal: ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'],
    fortune: ['抽一签']
  };
  const questions = [
    { title: '周末更想？', answers: ['一个人待着', '和朋友见面'] },
    { title: '做事习惯？', answers: ['先计划', '凭感觉'] }
  ];
  const tarot = ['愚者', '魔术师', '女祭司', '皇后', '皇帝', '教皇', '恋人', '战车', '力量', '隐者', '命运之轮', '正义', '倒吊人', '死神', '节制', '恶魔', '高塔', '星星', '月亮', '太阳', '审判', '世界'];
  const labels = { mbti: 'MBTI', zodiac: '选择星座', fortune: '抽签', animal: '选择生肖', tarot: '选一张牌', bazi: '八字' };
  const screens = ['methods', 'selection', 'loading', 'result'];
  const get = id => document.getElementById(id);
  const choices = get('choices');
  const birthForm = get('birth-form');
  const title = get('selection-title');
  const tarotAnswer = get('tarot-answer');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let method = null;
  let timer = null;
  let generation = 0;
  let busy = false;
  function cancel() {
    clearTimeout(timer);
    generation++;
    busy = false;
  }
  function after(delay, action) {
    const current = generation;
    timer = setTimeout(() => {
      if (generation === current) action();
    }, reducedMotion.matches ? 0 : delay);
  }
  function show(screen) {
    screens.forEach(id => { get(id).hidden = id !== screen; });
  }
  function button(label, action) {
    const el = document.createElement('button');
    el.type = 'button';
    el.textContent = label;
    el.addEventListener('click', () => action(el));
    return el;
  }
  function markSelected(el) {
    busy = true;
    choices.querySelectorAll('button').forEach(item => { item.disabled = true; });
    el.classList.add('is-selected');
  }
  function question(index) {
    busy = false;
    title.textContent = questions[index].title;
    choices.replaceChildren(...questions[index].answers.map(label => button(label, el => {
      if (busy) return;
      markSelected(el);
      after(180, () => index + 1 < questions.length ? question(index + 1) : test());
    })));
    title.focus();
  }
  function select(nextMethod) {
    cancel();
    method = nextMethod;
    // Optional birth fields are never read, persisted, or transmitted.
    birthForm.reset();
    birthForm.hidden = method !== 'bazi';
    title.textContent = labels[method];
    tarotAnswer.hidden = true;
    choices.hidden = method === 'bazi';
    choices.className = `choices ${method}`;
    choices.replaceChildren();
    if (method === 'tarot') {
      const deck = tarot.slice();
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      choices.replaceChildren(...deck.slice(0, 3).map((name, i) => {
        const card = button('', el => drawCard(el, name));
        card.className = 'tarot-card';
        card.setAttribute('aria-label', `翻开第 ${i + 1} 张牌`);
        card.innerHTML = '<span class="card-inner"><span class="card-side card-back"><img src="assets/card-back.svg" alt=""></span><span class="card-side card-front" aria-hidden="true"><img src="assets/card-face.svg" alt=""><span class="card-name"></span></span></span>';
        card.querySelector('.card-name').textContent = name;
        return card;
      }));
    } else if (options[method]) {
      choices.replaceChildren(...options[method].map(label => button(label, el => {
        if (busy) return;
        markSelected(el);
        after(160, test);
      })));
    }
    show('selection');
    if (method === 'mbti') question(0);
    else title.focus();
  }
  function drawCard(card, name) {
    if (busy) return;
    markSelected(card);
    // Flip this same card immediately; no replacement card or second tap.
    card.classList.add('is-flipped');
    card.setAttribute('aria-label', name);
    after(720, () => {
      tarotAnswer.hidden = false;
      get('tarot-result').focus();
    });
  }
  function test() {
    busy = true;
    birthForm.reset();
    show('loading');
    get('loading').querySelector('button').focus();
    after(360, () => {
      show('result');
      get('result-title').focus();
    });
  }
  birthForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!busy) test();
  });
  document.querySelectorAll('[data-method]').forEach(el => {
    el.addEventListener('click', () => select(el.dataset.method));
  });
  document.querySelectorAll('[data-action="home"]').forEach(el => {
    el.addEventListener('click', () => {
      cancel();
      birthForm.reset();
      show('methods');
      document.querySelector(`[data-method="${method || 'mbti'}"]`).focus();
    });
  });
  get('tarot-retry').addEventListener('click', () => select('tarot'));
  get('retry').addEventListener('click', () => select(method));
})();
