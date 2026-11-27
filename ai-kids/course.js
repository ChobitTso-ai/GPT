/** © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * AI 遊戲實驗室 · 動態網頁簡報 v0.1
 */
'use strict';
const VERSION='0.1';
const slide=document.querySelector('#slide');
const next=document.querySelector('#next'),prev=document.querySelector('#prev');
const replay=document.querySelector('#replay'),pause=document.querySelector('#pause');
const notes=document.querySelector('#notes');
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let page=0,step=0,question=0,selected=null,revealed=false,animations=[],paused=false;
let motionToken=0;
const maxSteps=[0,3,2,0,0];
const questions=[
  {claim:'紅鑰匙可以打開北門。',correct:1,label:'不符',reason:'規則①：藍鑰匙開北門；規則②：紅鑰匙開南門。',detail:'口氣很確定，也要回到規則核對。',color:'red',success:false},
  {claim:'藍鑰匙可以開一次北門。',correct:0,label:'支持',reason:'規則①加上規則③，共同支持這句話。',detail:'藍鑰匙開北門，而且每把只能開一次。',color:'blue',success:true},
  {claim:'藍鑰匙藏在圖書館。',correct:2,label:'資料不足',reason:'三條規則都沒有寫鑰匙藏在哪裡。',detail:'還不能判定位置。沒有依據，不代表一定是錯的。',color:'blue',success:null}
];
const rules=['藍鑰匙開北門','紅鑰匙開南門','每把鑰匙只能開一次'];
const eyebrow=(text)=>`<p class="eyebrow">第 03 堂 · ${text}</p>`;
function world(color='blue',thinking=false){
 return `<div class="world" aria-label="方塊校園，北門與南門並排。${color==='blue'?'藍':'紅'}鑰匙與方塊軍師在門前。"><span class="world-status" id="world-status">先找規則，再下結論</span><img class="door north" src="assets/door.webp" alt="北門"><img class="door south" src="assets/door.webp" alt="南門"><span class="door-label north-label">北門</span><span class="door-label south-label">南門</span><img class="robot" src="assets/${thinking?'robot-think':'robot'}.webp" alt="沿用課程原角色的方塊軍師"><img class="key" src="assets/key-${color}.webp" alt="${color==='blue'?'藍':'紅'}鑰匙"></div>`;
}
function stopMotion(){motionToken++;for(const a of animations)a.cancel();animations=[];paused=false;pause.textContent='暫停動作';pause.disabled=true;}
function moveKey(color,target,success){
 const key=slide.querySelector('.key'),door=slide.querySelector('.'+target),status=slide.querySelector('#world-status');
 if(!key||!door)return;
 if(!door.complete||!key.complete){
  const token=motionToken;
  Promise.all([door.decode(),key.decode()]).then(()=>{if(token===motionToken)moveKey(color,target,success);}).catch(()=>{});
  return;
 }
 const kr=key.getBoundingClientRect(),dr=door.getBoundingClientRect();
 const dx=dr.left+dr.width*.55-kr.left-kr.width*.5,dy=dr.top+dr.height*.45-kr.top-kr.height*.5;
 status.textContent=success?'依規則，這把鑰匙可以開門':'依規則，這把鑰匙不能開北門';
 if(reduceMotion.matches){key.style.transform=`translate(${dx}px,${dy}px)`;return;}
 const token=motionToken;
 const keyMotion=key.animate([{transform:'translate(0,0) rotate(-12deg)',offset:0},{transform:`translate(${dx}px,${dy}px) rotate(0deg)`,offset:.65},{transform:`translate(${dx}px,${dy}px) rotate(${success?30:-12}deg)`,offset:.8},{transform:`translate(${dx}px,${dy}px) rotate(${success?0:10}deg)`,offset:.9},{transform:`translate(${dx}px,${dy}px) rotate(0deg)`,offset:1}],{duration:2200,easing:'ease-in-out',fill:'forwards'});
 const doorMotion=door.animate(success?[{filter:'brightness(1)'},{filter:'brightness(1)',offset:.65},{filter:'brightness(1.4)'},{filter:'brightness(1.1)'}]:[{transform:'translateX(0)'},{transform:'translateX(0)',offset:.65},{transform:'translateX(-5px)',offset:.75},{transform:'translateX(5px)',offset:.85},{transform:'translateX(0)'}],{duration:2200,fill:'forwards'});
 animations=[keyMotion,doorMotion];pause.disabled=false;
 Promise.all(animations.map(a=>a.finished)).then(()=>{if(token===motionToken){pause.disabled=true;paused=false;pause.textContent='暫停動作';}}).catch(()=>{});
}
function revealIn(){if(reduceMotion.matches)return;const el=slide.querySelector('.copy');const a=el.animate([{opacity:.25,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:380,easing:'ease-out'});animations.push(a);}
function render(){
 stopMotion();
 let html='',caption='',motion=null;
 if(page===0){html=`<section class="slide intro"><div class="copy">${eyebrow('先猜先玩')}<h1>AI 也會<br>瞎掰嗎？</h1><p class="lead">說得很有自信，<br>就能相信？</p><p class="small">先各自想一想，再一起說。<br>今天用規則當證據。</p><p class="sample-label">親子動態課程 · 核心樣板</p></div></section>`;}
 if(page===1){
  caption=['點「看第一條」，一起認識這個校園的規則。','藍鑰匙靠近北門。依規則①，它可以開這扇門。','紅鑰匙靠近南門。依規則②，它可以開這扇門。','「只能開一次」是條件；判斷時也要一起看。'][step];
  html=`<section class="slide"><div class="copy">${eyebrow('概念聊天')}<h1>我們的<br>方塊規則</h1>${rules.map((r,i)=>step>i?`<p class="rule ${step===i+1?'active':''}"><span class="rule-number">規則${['①','②','③'][i]}</span>${r}</p>`:'').join('')}<p class="small" style="margin-top:1rem">這是本課自創的規則</p></div><div class="scene-wrap">${world(step===2?'red':'blue')}<p class="stage-caption">${caption}</p></div></section>`;
  if(step===1||step===2)motion=[step===1?'blue':'red',step===1?'north':'south',true];
 }
 if(page===2){
  html=`<section class="slide"><div class="copy">${eyebrow('概念聊天')}<p class="simulation">教學模擬 · 人工編寫的說法</p><h1>方塊軍師<br>說對了嗎？</h1><p class="quote">「紅鑰匙開北門，<br>我非常確定！」</p>${step===0?'<p class="small">先各自想：哪一條規則支持它？</p>':`<div class="answer bad"><strong>和規則不符</strong>規則①寫藍鑰匙開北門，<br>規則②寫紅鑰匙開南門。</div>`}${step===2?'<p class="evidence">AI 可能弄錯。<br><span class="emphasis">說錯和故意騙人，要分開看。</span></p>':''}</div><div class="scene-wrap">${world('red',step>0)}<p class="stage-caption">${step===0?'看起來有把握，還需要核對證據。':step===1?'紅鑰匙到北門，依規則不能開。':'生成的內容可能有錯；不能因此認定每次都錯。'}</p></div></section>`;
  if(step===1)motion=['red','north',false];
 }
 if(page===3){const q=questions[question];
  html=`<section class="slide"><div class="copy">${eyebrow('動手小遊戲')}<p class="question-count">${question===0?'暖身 · 剛才的例子':`新情境 · ${question} / 2`}</p><h1>證據在哪裡？</h1><p class="quote">${q.claim}</p><div class="choices" role="group" aria-label="選擇判斷">${['支持','不符','資料不足'].map((c,i)=>`<button data-choice="${i}" class="${selected===i?'chosen':''}" aria-pressed="${selected===i}">${c}</button>`).join('')}</div>${revealed?`<div class="answer ${q.correct===1?'bad':'good'}" role="status"><strong>${q.label}</strong>${q.reason}</div><p class="hint">${q.detail}</p>`:`<p class="hint">${selected===null?'先各自選，再說理由。':'已選「'+['支持','不符','資料不足'][selected]+'」。先說依據，再看解答。'}</p>`}</div><div class="scene-wrap">${world(q.color,q.success===null)}<div class="rules-reminder">${rules.map((r,i)=>`<span>${['①','②','③'][i]}${r}</span>`).join('')}</div><p class="stage-caption">${question===2?'規則沒交代位置；畫面也不是藏鑰匙的證據。':'可以口述或舉紙卡，彼此不用搶快。'}</p></div></section>`;
  if(revealed&&q.success!==null)motion=[q.color,'north',q.success];
 }
 if(page===4){html=`<section class="slide recap"><div class="copy">${eyebrow('今天的發現')}<h1>答案的證據在哪裡？</h1><p class="lead">我的結論是……<br>依據是……<br>還不知道的是……</p><p class="small" style="margin-top:1.4rem">請每個人用自己的話說一次。</p><p class="small" style="margin-top:1.2rem">這次示範到這裡。<br>八堂完整課程正等待動態風格確認。</p><div class="finish-actions"><button id="restart">再上一次</button><a href="../">回知識冒險島</a></div></div></section>`;}
 slide.innerHTML=html;
 document.querySelector('#position').textContent=`${page+1} / 5 頁`;
 prev.disabled=page===0&&step===0;
 next.disabled=page===4||(page===3&&!revealed&&selected===null);
 next.textContent=page===0?'開始找證據':page===1?['看第一條','看第二條','看第三條','聽軍師怎麼說'][step]:page===2?['一起核對','看看為什麼','換你找證據'][step]:page===3?(revealed?(question<2?'下一個情境':'說說今天的發現'):'揭曉依據'):'已完成樣板';
 replay.disabled=!motion;
 if(motion)moveKey(...motion);else revealIn();
 if(page===1&&step===3)slide.querySelector('#world-status').textContent='每把鑰匙只能開一次';
 if(page===3&&question===2)slide.querySelector('#world-status').textContent='位置：規則沒有提供';
 slide.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{selected=Number(b.dataset.choice);revealed=false;render();slide.querySelector(`[data-choice="${selected}"]`).focus();}));
 slide.querySelector('#restart')?.addEventListener('click',()=>{page=0;step=0;question=0;selected=null;revealed=false;render();next.focus();});
 document.title=`${page===4?'今天的發現':'AI 遊戲實驗室'}｜動態課程 v${VERSION}`;
}
function forward(){
 if(notes.open||next.disabled)return;
 if(page===3){if(!revealed){revealed=true;}else if(question<2){question++;selected=null;revealed=false;}else{page++;step=0;}}
 else if(step<maxSteps[page])step++;else{page++;step=0;}
 render();
}
function back(){
 if(notes.open||prev.disabled)return;
 if(page===4){page=3;question=2;selected=2;revealed=true;}
 else if(page===3){if(revealed)revealed=false;else if(question>0){question--;selected=null;}else{page=2;step=2;}}
 else if(step>0)step--;else{page--;step=maxSteps[page];}
 render();
}
next.addEventListener('click',forward);prev.addEventListener('click',back);
replay.addEventListener('click',render);
pause.addEventListener('click',()=>{paused=!paused;animations.forEach(a=>paused?a.pause():a.play());pause.textContent=paused?'繼續動作':'暫停動作';});
document.addEventListener('keydown',e=>{
 if(notes.open||e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.target.closest('input,textarea,select'))return;
 if(e.key===' '&&e.target.closest('button,a'))return;
 if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();forward();}
 if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();back();}
});
const teacherNotes=[
 '<p>對象：八至十歲孩子與陪同家長。這是第03堂前半段的互動樣板，約5～8分鐘，由家長控制節奏。</p><p>先各自想五秒，再一起公開答案。不排名，也不以搶快為獎勵。</p>',
 '<p>請先收集孩子「怎麼確認」的方法。三條規則按步驟出現，鑰匙的移動只表示配對關係，不是現有遊戲的設定。</p><p>先講規則，再聽軍師的說法。這段取代原本口述／影片示範，不重複計入課時。</p>',
 '<p>這是人工編寫的教學模擬，不是真實模型答錯的紀錄。先停在軍師說法，問「哪條規則支持？」再揭曉。</p><p>AI可能弄錯，與人蓄意詐騙分開講；不能教成AI每次都錯。</p>',
 '<p>第一題只作暖身，約20秒。第二題合併規則①與③；第三題檢查孩子是否能保留「資料不足」，而非一律判錯。</p><p>選擇可以更改；沒有分數或排名。請每人先說理由，再揭曉依據。</p>',
 '<p>讓每個孩子各說一句，八歲可口述或畫圖，十歲再補理由或反例。樣板未包含原第03堂後半的AI操作與生活情境，也尚未轉完八堂。</p>'
];
document.querySelector('#teacher').addEventListener('click',()=>{
 if(!pause.disabled&&!paused)pause.click();
 document.querySelector('#notes-body').innerHTML=teacherNotes[page]+'<p class="note">操作：上一步／推進、方向鍵、空白鍵；動作可暫停或重播。系統開啟「減少動態效果」時，直接呈現配對結果。</p><p class="note">概念來源：<a href="https://support.google.com/gemini/answer/13954172" target="_blank" rel="noopener noreferrer">Google：生成式 AI 的運作、錯誤與測試</a>。活動、規則與角色是課程自創。</p>';
 notes.showModal();
});
document.querySelector('#close-notes').addEventListener('click',()=>notes.close());
reduceMotion.addEventListener('change',render);
render();

