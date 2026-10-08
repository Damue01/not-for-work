import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from '@daypicker/react/locale';
import type { DropdownProps } from '@daypicker/react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem, SelectGroup } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { LuckyNumber, ColorChoice, NameForm, Pendulum, CrystalBall, SixYao } from '@/components/ritual-methods';

type Method = 'mbti'|'zodiac'|'animal'|'bazi'|'tarot'|'fortune'|'number'|'color'|'name'|'pendulum'|'crystal'|'sixyao';
const methods: {id:Method;label:string}[] = [{id:'mbti',label:'MBTI'},{id:'zodiac',label:'星座'},{id:'animal',label:'生肖'},{id:'bazi',label:'八字'},{id:'tarot',label:'塔罗牌'},{id:'fortune',label:'抽签'},{id:'number',label:'幸运数字'},{id:'color',label:'色彩心理'},{id:'name',label:'姓名测试'},{id:'pendulum',label:'灵摆'},{id:'crystal',label:'水晶球'},{id:'sixyao',label:'六爻'}];
const titles = {mbti:'MBTI',zodiac:'选择星座',animal:'选择生肖',bazi:'八字',tarot:'选一张牌',fortune:'抽签',number:'选择幸运数字',color:'选择一个颜色',name:'姓名测试',pendulum:'轻触灵摆',crystal:'轻触水晶球',sixyao:'六爻'};
const options = {zodiac:['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'],animal:['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪']};
const questions = [{title:'周末更想？',answers:['一个人待着','和朋友见面']},{title:'做事习惯？',answers:['先计划','凭感觉']}];
const cards = ['愚者','魔术师','女祭司','皇后','皇帝','教皇','恋人','战车','力量','隐者','命运之轮','正义','倒吊人','死神','节制','恶魔','高塔','星星','月亮','太阳','审判','世界'];
const hours = ['不清楚','子时　23:00–00:59','丑时　01:00–02:59','寅时　03:00–04:59','卯时　05:00–06:59','辰时　07:00–08:59','巳时　09:00–10:59','午时　11:00–12:59','未时　13:00–14:59','申时　15:00–16:59','酉时　17:00–18:59','戌时　19:00–20:59','亥时　21:00–22:59'];
function CalendarDropdown({options,value,onChange,'aria-label':ariaLabel}:DropdownProps) {
 const items = options?.map(o=>({label:o.label,value:String(o.value),disabled:o.disabled}))??[];
 return <Select items={items} value={String(value)} onValueChange={v=>{if(v!==null)onChange?.({target:{value:v}} as ChangeEvent<HTMLSelectElement>)}}><SelectTrigger aria-label={ariaLabel} size="sm" className="min-w-0 flex-1"><SelectValue /></SelectTrigger><SelectPopup alignItemWithTrigger={false} className="calendar-select-popup"><SelectGroup>{items.map(o=><SelectItem key={o.value} value={o.value} disabled={o.disabled}>{o.label}</SelectItem>)}</SelectGroup></SelectPopup></Select>;
}
function BirthForm({onSubmit}:{onSubmit:()=>void}) {
 const [date,setDate] = useState<Date>(); const [hour,setHour] = useState('不清楚'); const [open,setOpen] = useState(false);
 return <form className="birth-form" onSubmit={e=>{e.preventDefault();onSubmit()}} autoComplete="off">
 <Popover open={open} onOpenChange={setOpen}><Field><FieldLabel htmlFor="birth-date">出生日期</FieldLabel><PopoverTrigger id="birth-date" render={<Button variant="outline" className="form-control justify-between"/>}>{date?format(date,'yyyy年M月d日'):'选择日期'}<CalendarIcon aria-hidden="true"/></PopoverTrigger></Field><PopoverPopup align="start" className="date-popup w-auto p-0"><Calendar className="[--cell-size:clamp(1.9rem,10vw,2.5rem)] sm:[--cell-size:2.25rem]" formatters={{formatMonthDropdown:d=>`${d.getMonth()+1}月`}} locale={zhCN} mode="single" captionLayout="dropdown" components={{Dropdown:CalendarDropdown}} defaultMonth={date??new Date(2000,0)} startMonth={new Date(1900,0)} endMonth={new Date()} disabled={{after:new Date()}} selected={date} onSelect={d=>{setDate(d);if(d)setOpen(false)}} /></PopoverPopup></Popover>
 <Field><FieldLabel htmlFor="birth-hour">出生时辰</FieldLabel><Select items={hours.map(label=>({label,value:label}))} value={hour} onValueChange={v=>setHour(v??'不清楚')}><SelectTrigger id="birth-hour" className="form-control"><SelectValue/></SelectTrigger><SelectPopup alignItemWithTrigger={false}><SelectGroup>{hours.map(h=><SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectGroup></SelectPopup></Select></Field>
 <Button type="submit" className="primary-action">测一测</Button></form>;
}
export default function App(){
 const [method,setMethod]=useState<Method|null>(null); const [screen,setScreen]=useState<'home'|'selection'|'loading'|'result'>('home'); const [question,setQuestion]=useState(0); const [deck,setDeck]=useState<string[]>([]); const [flipped,setFlipped]=useState<number|null>(null); const [revealed,setRevealed]=useState(false); const [round,setRound]=useState(0);
 const stageBody=useRef<HTMLDivElement>(null); const [stageHeight,setStageHeight]=useState(0);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null); const heading=useRef<HTMLHeadingElement>(null); const busy=useRef(false);
 const cancel=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;busy.current=false;};
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 useEffect(()=>{if(screen!=='home')heading.current?.focus({preventScroll:true})},[screen,method,question,revealed,round]);
 useLayoutEffect(()=>{if(screen==='selection'&&stageBody.current)setStageHeight(stageBody.current.getBoundingClientRect().height)},[screen,method,round]);
 function later(ms:number,fn:()=>void){timer.current=setTimeout(()=>{timer.current=null;fn()},window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:ms)}
 function select(m:Method){cancel();setStageHeight(0);setMethod(m);setQuestion(0);setFlipped(null);setRevealed(false);setRound(v=>v+1);const shuffled=[...cards];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}setDeck(shuffled.slice(0,3));setScreen('selection')}
 function home(){cancel();setScreen('home');timer.current=setTimeout(()=>{timer.current=null;document.querySelector<HTMLButtonElement>(`[data-method="${method}"]`)?.focus({preventScroll:true})},0)}
 function test(){if(busy.current)return;busy.current=true;setScreen('loading');later(360,()=>{setScreen('result');busy.current=false})}
 function answer(){if(busy.current)return;if(question===0){busy.current=true;later(180,()=>{setQuestion(1);busy.current=false})}else test()}
 function flip(i:number){if(busy.current)return;busy.current=true;setFlipped(i);later(660,()=>setRevealed(true))}
 const back=<Button variant="ghost" className="back-action" onClick={home}>换个方式</Button>;
 const complete=screen==='result'||revealed;
 const actions=<div className="stage-footer"><div className="retry-slot">{complete&&<Button className="primary-action" onClick={()=>select(method!)}>{method==='tarot'?'再抽一次':'再测一次'}</Button>}</div>{back}</div>;
 return <><header className="masthead"><h1>今天适合上班吗？</h1></header><main>
 {screen==='home'&&<section className="methods" aria-label="选择方式">{methods.map(m=><Button variant="outline" key={m.id} data-method={m.id} onClick={()=>select(m.id)}>{m.label}</Button>)}</section>}
 {screen!=='home'&&<div className={`test-stage stage-${method}`}><div ref={stageBody} className={`stage-body ${screen==='result'?'is-result':''}`} style={screen!=='selection'&&stageHeight?{minHeight:stageHeight}:undefined}>
 {screen==='selection'&&method&&<section className={`selection ${method}`} key={`${method}-${round}`}><h2 ref={heading} tabIndex={-1}>{method==='mbti'?questions[question].title:titles[method]}</h2>
 {method==='mbti'&&<div className="choices mbti" key={question}>{questions[question].answers.map(a=><Button key={a} variant="outline" onClick={answer}>{a}</Button>)}</div>}
 {(method==='zodiac'||method==='animal')&&<div className="choices">{options[method].map(o=><Button key={o} variant="outline" onClick={test}>{o}</Button>)}</div>}
 {method==='fortune'&&<div className="draw-action"><Button className="primary-action" onClick={test}>抽一签</Button></div>}
 {method==='bazi'&&<BirthForm onSubmit={test}/>}
 {method==='number'&&<LuckyNumber onSubmit={test}/>}
 {method==='color'&&<ColorChoice onSubmit={test}/>}
 {method==='name'&&<NameForm onSubmit={test}/>}
 {method==='pendulum'&&<Pendulum onReveal={()=>setRevealed(true)} revealed={revealed}/>}
 {method==='crystal'&&<CrystalBall onReveal={()=>setRevealed(true)} revealed={revealed}/>}
 {method==='sixyao'&&<SixYao onReveal={()=>setRevealed(true)} revealed={revealed}/>}
 {['pendulum','crystal','sixyao'].includes(method)&&<div className="answer-slot" aria-live="polite">{revealed&&<div className="ritual-answer"><h2 ref={heading} tabIndex={-1}>不适合上班</h2></div>}</div>}
 {method==='tarot'&&<><div className="choices tarot">{deck.map((name,i)=><Button key={i} variant="ghost" className={`tarot-card ${flipped===i?'is-flipped is-selected':''}`} disabled={flipped!==null} onClick={()=>flip(i)} aria-label={flipped===i?name:`翻开第 ${i+1} 张牌`}><span className="card-inner"><span className="card-side card-back"><img src="./assets/card-back.svg" alt=""/></span><span className="card-side card-front" aria-hidden={flipped!==i}><img src="./assets/card-face.svg" alt=""/><span className="card-name">{name}</span></span></span></Button>)}</div><div className="answer-slot" aria-live="polite">{revealed&&<div className="tarot-answer"><h2 ref={heading} tabIndex={-1}>不适合上班</h2></div>}</div></>}
 </section>}
 {screen==='loading'&&<section className="loading" aria-label="测试中" aria-live="polite"><Spinner aria-label="测试中" className="size-6"/></section>}
 {screen==='result'&&<section className="result" aria-live="polite"><h2 ref={heading} tabIndex={-1}>不适合上班</h2></section>}
 </div>{actions}</div>}
 </main></>;
}
