const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>{const t=clamp(v);return t*t*(3-2*t)};
const mix=(a,b,t)=>a+(b-a)*t;
addEventListener('load',()=>setTimeout(()=>$('.loader').classList.add('done'),1300));

const canvas=$('#particles'),ctx=canvas.getContext('2d');
let fragments=[],mouse={x:innerWidth/2,y:innerHeight/2};
function resizeCanvas(){
  canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  fragments=Array.from({length:innerWidth<700?24:55},(_,i)=>({
    x:Math.random()*innerWidth,y:Math.random()*innerHeight,s:Math.random()*3+1,
    vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22,r:Math.random()*6,
    color:i%5?'#bfc5bf':i%2?'#2864ff':'#ff6b20'
  }));
}
function drawFragments(){
  ctx.clearRect(0,0,innerWidth,innerHeight);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)fragments.forEach(p=>{
    p.x+=p.vx+(mouse.x-innerWidth/2)*.000015;p.y+=p.vy;p.r+=.008;
    if(p.x<-20)p.x=innerWidth+20;if(p.x>innerWidth+20)p.x=-20;
    if(p.y<-20)p.y=innerHeight+20;if(p.y>innerHeight+20)p.y=-20;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.globalAlpha=.35;
    ctx.fillStyle=p.color;ctx.fillRect(-p.s*2,-p.s/2,p.s*4,p.s);ctx.restore();
  });
  requestAnimationFrame(drawFragments);
}
resizeCanvas();drawFragments();
addEventListener('pointermove',e=>{mouse={x:e.clientX,y:e.clientY};$('.cursor').style.left=e.clientX+'px';$('.cursor').style.top=e.clientY+'px'});
$$('a').forEach(link=>{link.addEventListener('pointerenter',()=>$('.cursor').classList.add('on'));link.addEventListener('pointerleave',()=>$('.cursor').classList.remove('on'))});

const directions=[[-76,-9,7],[79,7,-6],[-8,-78,10],[19,80,-7],[-72,49,10],[86,-45,-9],[0,85,4]];
const chapters=$$('.panel');
chapters.forEach((section,chapterIndex)=>{
  section.classList.add('assembly-scene');
  const sticky=document.createElement('div');sticky.className='scene-sticky';
  [...section.children].forEach((child,i)=>{
    child.classList.add('scene-piece');
    const [x,y,r]=directions[(i+chapterIndex*2)%directions.length];
    child.dataset.sx=x;child.dataset.sy=y;child.dataset.sr=r;sticky.appendChild(child);
  });
  const status=document.createElement('div');status.className='assembly-status';
  status.innerHTML=`<span>${section.dataset.index} / ASSEMBLING</span><i></i><b>00%</b>`;
  sticky.appendChild(status);section.appendChild(sticky);
});

const roles=[['ART DIRECTOR','#ff5b43'],['DESIGNER 01','#4e8cff'],['DESIGNER 02','#ffca3a'],['DEVELOPER','#65e6a4'],['MOTION','#d36cff'],['TYPE DESIGN','#ff8fc5'],['QA / SYSTEM','#55d8ff'],['ROHULLAH','#f5f5f1']];
const team=document.createElement('div');team.className='cursor-team';
roles.forEach(([role,color])=>{
  const cursor=document.createElement('div');cursor.className='remote-cursor';
  cursor.style.setProperty('--cursor-color',color);cursor.dataset.role=role;
  cursor.innerHTML=`<i class="arrow"></i><span class="who">${role}</span><i class="pulse"></i>`;
  team.appendChild(cursor);
});
document.body.appendChild(team);
const workers=[...team.children];
const tasks=['PLACING TITLE','BUILDING FRAME','ALIGNING COPY','MOVING IMAGE','SETTING TYPE','DRAWING GUIDE','CHECKING LAYOUT','FINISHING'];

function movePart(element,local,index,project,finalScene=false){
  const start=-.085+index*(project?.05:.052),duration=project?.56:.62;
  const phase=clamp((local-start)/duration),arrival=ease(phase);
  const departure=finalScene?0:ease((local-.94-index*.002)/.06);
  const x=Number(element.dataset[project?'x':'sx']||0);
  const y=Number(element.dataset[project?'y':'sy']||0);
  const r=Number(element.dataset[project?'r':'sr']||0);
  const distance=1-arrival+departure,sign=departure?-1:1;
  element.style.transform=`translate3d(${x*distance*sign}vw,${y*distance*sign}vh,0) rotate(${r*distance*sign}deg) scale(${.88+arrival*.12-departure*.06})`;
  element.style.opacity=String(clamp(arrival*(1-departure)*2.1));
  return {start,phase,departure};
}

function animateWorkers(parts,states,local,sceneNumber){
  if(!parts.length)return;
  team.classList.add('show');
  workers.forEach((cursor,index)=>{
    const partIndex=index%parts.length,part=parts[partIndex],state=states[partIndex];
    const rect=part.getBoundingClientRect();
    // The pointer grips the moving element itself. Its path follows the same scroll state.
    const gripX=rect.left+rect.width*(index%2?.88:.12);
    const gripY=rect.top+rect.height*(index%3?.17:.82);
    const entryX=index%2?innerWidth+55:-55,entryY=index%3?innerHeight+35:-35;
    const approach=ease((local-state.start+.075)/.105);
    const x=mix(entryX,gripX,approach),y=mix(entryY,gripY,approach);
    cursor.style.transform=`translate3d(${x}px,${y}px,0) rotate(${Math.sin(local*21+index+sceneNumber)*3}deg)`;
    cursor.style.opacity=String(clamp((local-state.start+.075)/.06)*(1-state.departure));
    cursor.classList.toggle('dragging',state.phase>.03&&state.phase<.97);
    cursor.querySelector('.who').textContent=state.phase<.03?'SELECT':state.phase<.97?tasks[index]:state.phase<1?'RELEASE':cursor.dataset.role;
    const click=state.phase>=.97&&state.phase<1;
    if(click&&!cursor.dataset.clicked){cursor.classList.remove('click');void cursor.offsetWidth;cursor.classList.add('click');cursor.dataset.clicked='1'}
    if(!click)cursor.dataset.clicked='';
  });
}

const work=$('.build-section'),projects=$$('.build-project'),sections=$$('section[data-index]');
function renderScroll(){
  const max=document.documentElement.scrollHeight-innerHeight;
  $('.progress i').style.height=`${(max?scrollY/max:0)*75}px`;
  let current=0;sections.forEach((section,i)=>{if(section.getBoundingClientRect().top<innerHeight*.52)current=i});
  $('.progress b').textContent=String(current+1).padStart(2,'0');
  team.classList.remove('show');
  chapters.forEach((section,chapterIndex)=>{
    const rect=section.getBoundingClientRect();
    if(rect.top>0||rect.bottom<innerHeight)return;
    const local=clamp(-rect.top/(section.offsetHeight-innerHeight));
    const parts=[...section.querySelectorAll('.scene-sticky > .scene-piece')];
    const states=parts.map((part,i)=>movePart(part,local,i,false,chapterIndex===chapters.length-1));
    const status=section.querySelector('.assembly-status');
    status.style.setProperty('--scene-progress',`${Math.round(local*100)}%`);
    status.querySelector('b').textContent=`${String(Math.round(local*100)).padStart(2,'0')}%`;
    animateWorkers(parts,states,local,chapterIndex);
  });
  const rect=work.getBoundingClientRect();
  if(rect.top<=0&&rect.bottom>=innerHeight){
    const progress=clamp(-rect.top/(work.offsetHeight-innerHeight));
    const scaled=progress*projects.length,index=Math.min(projects.length-1,Math.floor(scaled));
    const local=index===projects.length-1?Math.min(scaled-index,.94):scaled-index;
    projects.forEach((project,i)=>project.classList.toggle('active',i===index));
    const parts=[...projects[index].querySelectorAll('.assembly-piece')];
    const states=parts.map((part,i)=>movePart(part,local,i,true));
    $('.build-count b').textContent=String(index+1).padStart(2,'0');
    $('.build-rail i').style.height=`${16+progress*84}%`;
    animateWorkers(parts,states,local,index+3);
  }
}
addEventListener('scroll',renderScroll,{passive:true});
addEventListener('resize',()=>{resizeCanvas();renderScroll()});
function updateClock(){
  $('#clock').textContent=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());
}
updateClock();setInterval(updateClock,1000);renderScroll();
