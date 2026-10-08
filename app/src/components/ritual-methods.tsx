import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldLabel } from '@/components/ui/field';

// Every timer belongs to the mounted interaction. Leaving or retrying cancels it.
function useRitualTimer() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = useRef(false);
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current); }, []);
  return (delay: number, start: () => void, finish: () => void) => {
    if (locked.current) return;
    locked.current = true;
    start();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timer.current = setTimeout(() => {
      timer.current = null;
      finish();
      locked.current = false;
    }, reduced ? 0 : delay);
  };
}

export function LuckyNumber({ onSubmit }: { onSubmit: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const run = useRitualTimer();
  return <div className={`choices lucky-numbers ${selected !== null ? 'has-selection' : ''}`} aria-label="选择幸运数字">
    {Array.from({ length: 9 }, (_, i) => i + 1).map(number =>
      <Button key={number} variant="outline" className={selected === number ? 'is-chosen' : undefined} disabled={selected !== null} onClick={() => run(180, () => setSelected(number), onSubmit)}>{number}</Button>)}
  </div>;
}

const colors = [
  { name: '红色', value: '#ba6868' }, { name: '橙色', value: '#ce9660' },
  { name: '黄色', value: '#d9bf69' }, { name: '绿色', value: '#80a48a' },
  { name: '蓝色', value: '#799bc0' }, { name: '紫色', value: '#a28bb7' },
];
export function ColorChoice({ onSubmit }: { onSubmit: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const run = useRitualTimer();
  return <div className={`choices color-choices ${selected !== null ? 'has-selection' : ''}`} aria-label="选择颜色">
    {colors.map(color => <Button key={color.name} variant="outline" className={selected === color.name ? 'is-chosen' : undefined} disabled={selected !== null} onClick={() => run(180, () => setSelected(color.name), onSubmit)}>
      <span className="color-swatch" style={{ backgroundColor: color.value }} aria-hidden="true" />
      {color.name}
    </Button>)}
  </div>;
}

export function NameForm({ onSubmit }: { onSubmit: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const run = useRitualTimer();
  // No name attribute, storage, or network submission. The optional nickname dies with this form.
  return <form className={`name-form ${submitting ? 'is-submitting' : ''}`} autoComplete="off" onSubmit={event => { event.preventDefault(); run(160, () => setSubmitting(true), onSubmit); }}>
    <Field><FieldLabel htmlFor="nickname">昵称（选填）</FieldLabel>
      <FieldControl id="nickname" readOnly={submitting} className="nickname-input" type="text" maxLength={32} autoComplete="off" spellCheck={false} />
    </Field>
    <Button className="primary-action" disabled={submitting} type="submit">测一测</Button>
  </form>;
}

export function Pendulum({ onReveal, revealed }: { onReveal: () => void; revealed: boolean }) {
  const [swinging, setSwinging] = useState(false);
  const run = useRitualTimer();
  return <div className="ritual">
    <Button variant="ghost" className={`ritual-target pendulum-target ${swinging ? 'is-moving' : ''}`}
      disabled={swinging || revealed} aria-label={swinging ? '灵摆摆动中' : '轻触灵摆'}
      onClick={() => run(1200, () => setSwinging(true), () => { setSwinging(false); onReveal(); })}>
      <svg className="size-40 ritual-svg" viewBox="0 0 160 180" fill="none" aria-hidden="true">
        <circle cx="80" cy="20" r="4" fill="currentColor" />
        <g className="pendulum-arm"><path d="M80 24v89" stroke="currentColor" strokeWidth="1.5" />
          <path d="m80 109 15 24-15 23-15-23 15-24Z" fill="#eeeae4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M80 110v45m-15-22h30" stroke="currentColor" strokeOpacity=".3" />
        </g>
      </svg>
    </Button>
  </div>;
}

export function CrystalBall({ onReveal, revealed }: { onReveal: () => void; revealed: boolean }) {
  const [glowing, setGlowing] = useState(false);
  const run = useRitualTimer();
  return <div className="ritual">
    <Button variant="ghost" className={`ritual-target crystal-target ${glowing ? 'is-moving' : ''}`}
      disabled={glowing || revealed} aria-label={glowing ? '水晶球显现中' : '轻触水晶球'}
      onClick={() => run(960, () => setGlowing(true), () => { setGlowing(false); onReveal(); })}>
      <svg className="size-40 ritual-svg" viewBox="0 0 180 180" fill="none" aria-hidden="true">
        <defs><radialGradient id="crystal-fill" cx=".35" cy=".3" r=".8"><stop stopColor="#fff"/><stop offset="1" stopColor="#e5e2ef"/></radialGradient>
          <clipPath id="crystal-clip"><circle cx="90" cy="77" r="55" /></clipPath></defs>
        <circle className="crystal-halo" cx="90" cy="77" r="64" fill="#ece8f4" />
        <circle cx="90" cy="77" r="55" fill="url(#crystal-fill)" stroke="#b9b4c5" />
        <g clipPath="url(#crystal-clip)"><path className="crystal-mist" d="M20 95q35-43 70-9t70-15v67H20Z" fill="#c8bfdc" opacity=".24" /></g>
        <path d="M56 56a39 39 0 0 1 30-18" stroke="white" strokeWidth="5" strokeLinecap="round" />
        <path d="m68 132-8 14h60l-8-14M54 150h72" stroke="#8b8792" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </Button>
  </div>;
}

type Cast = { coins: boolean[]; yang: boolean };
export function SixYao({ onReveal, revealed }: { onReveal: () => void; revealed: boolean }) {
  const [casts, setCasts] = useState<Cast[]>([]);
  const [casting, setCasting] = useState(false);
  const run = useRitualTimer();
  const [coins, setCoins] = useState([true, false, true]);
  function cast() {
    if (casts.length >= 6) return;
    const nextCoins = Array.from({ length: 3 }, () => Math.random() < .5);
    run(540, () => { setCasting(true); setCoins(nextCoins); }, () => {
      const next = [...casts, { coins: nextCoins, yang: nextCoins.filter(Boolean).length % 2 === 1 }];
      setCasts(next);
      setCasting(false);
      if (next.length === 6) onReveal();
    });
  }
  return <div className="six-yao-ritual">
    <div className={`coins ${casting ? 'is-moving' : ''}`} aria-hidden="true">
      {coins.map((head, i) => <span className="coin" key={i}>{head ? '正' : '反'}</span>)}
    </div>
    <div className="yao-lines" role="img" aria-label={casts.length ? `已成 ${casts.length} 爻，自下而上：${casts.map(c => c.yang ? '阳' : '阴').join('、')}` : '等待第一爻'}>
      {Array.from({ length: 6 }, (_, i) => <div key={i} className={`yao-line ${casts[i] ? (casts[i].yang ? 'yang' : 'yin') : 'empty'} ${casts[i] && i === casts.length - 1 ? 'is-new' : ''}`} data-line={casts[i] ? (casts[i].yang ? 'yang' : 'yin') : 'empty'}><span /><span /></div>)}
    </div>
    <span className="cast-count" role="status">{casts.length} / 6</span>
    <div className="cast-action-slot">{!revealed && <Button className="primary-action" disabled={casting || casts.length >= 6} onClick={cast}>{casting ? '落币中' : `掷第 ${casts.length + 1} 次`}</Button>}</div>
  </div>;
}
