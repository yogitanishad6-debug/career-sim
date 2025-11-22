// Simple client-side CareerSim prototype
const FAMILIES = [
  {id:'health', name:'Medical & Healthcare'},
  {id:'tech', name:'Engineering & Tech'},
  {id:'design', name:'Design & Creativity'},
  {id:'biz', name:'Business & Management'},
  {id:'edu', name:'Education & Social'},
];

const MISSIONS = {
  health:[
    {id:'h1', title:'Triage a simple case', desc:'Read a short patient story and choose next step.', effects:{empathy:2,analysis:1}},
    {id:'h2', title:'Explain a health tip', desc:'Create a short tip an elder can follow.', effects:{communication:2}},
  ],
  tech:[
    {id:'t1', title:'Debug a simple logic', desc:'Spot which step is wrong in a flow.', effects:{analysis:2}},
    {id:'t2', title:'Build a mini-algorithm', desc:'Plan steps to sort objects.', effects:{analysis:1,creativity:1}},
  ],
  design:[
    {id:'d1', title:'Sketch a simple product', desc:'Design a small item for school use.', effects:{creativity:2}},
    {id:'d2', title:'Respond to feedback', desc:'Edit your sketch based on critique.', effects:{creativity:1,communication:1}},
  ]
};

// default skills
const DEFAULT_SKILLS = {creativity:0,communication:0,analysis:0,empathy:0};

let state = {
  user:null, family:null, skills:{...DEFAULT_SKILLS}, badges:[], completed:[]
};

// helpers
const qs = id=>document.getElementById(id);
function toast(t){ const el=qs('toast'); el.textContent=t; el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'),2000); }

function save(){
  localStorage.setItem('careerSim', JSON.stringify(state));
}
function load(){
  const s = localStorage.getItem('careerSim');
  if(s) state = JSON.parse(s);
  return state;
}

// UI init
function init(){
  load();
  renderFamilies();
  qs('startBtn').onclick = start;
  qs('export').onclick = ()=> {
    const a = document.createElement('a');
    const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
    a.href = URL.createObjectURL(blob);
    a.download = `${(state.user?.name||'profile')}-portfolio.json`;
    a.click();
  };
  qs('reset').onclick = ()=>{ if(confirm('Reset progress?')){ localStorage.removeItem('careerSim'); location.reload(); } };
  if(state.user) enterGame();
}

function renderFamilies(){
  const cont = qs('families');
  cont.innerHTML='';
  FAMILIES.forEach(f=>{
    const b = document.createElement('div');
    b.className='choice'+(state.family===f.id?' active':'');
    b.textContent=f.name;
    b.onclick = ()=> {
      document.querySelectorAll('.choice').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      state.family = f.id;
    };
    cont.appendChild(b);
  });
}

function start(){
  const name = qs('name').value.trim();
  const birth = parseInt(qs('birth').value,10);
  if(!name || !birth || birth>2016){ toast('Enter valid name and birth year (<=2016)'); return; }
  if(!state.family){ toast('Pick a career family'); return; }
  state.user = {name, birth};
  save();
  enterGame();
}

function enterGame(){
  qs('onboard').classList.add('hidden');
  qs('game').classList.remove('hidden');
  qs('userTag').textContent = `${state.user.name} • ${state.family}`;
  renderProfile();
  renderMentor();
  renderMissions();
  renderDashboard();
}

function renderProfile(){
  qs('profileInfo').innerHTML = `<div><strong>${state.user.name}</strong><div class="muted">Born ${state.user.birth}</div></div>`;
  const sk = qs('skills');
  sk.innerHTML = '';
  Object.entries(state.skills).forEach(([k,v])=>{
    const div = document.createElement('div');
    div.innerHTML = `<div style="text-transform:capitalize">${k} <span style="float:right">${v}</span></div>
      <div class="skillBar"><div class="skillFill" style="width:${Math.min(100, v*10)}%"></div></div>`;
    sk.appendChild(div);
  });
  const bad = qs('badges'); bad.innerHTML='';
  state.badges.forEach(b=>{ const el=document.createElement('span'); el.className='badge'; el.textContent=b; bad.appendChild(el); });
}

function renderMentor(){
  const mentorText = {
    health:'I am Dr. Aria — try missions and I will guide you.',
    tech:'I am Rian the Researcher — solve small problems to grow your profile.',
    design:'I am Zoya the Designer — creativity matters here.'
  }[state.family] || 'I am your mentor — try missions to practice skills.';
  qs('mentorText').textContent = mentorText;
}

function renderMissions(){
  const list = qs('missionList');
  list.innerHTML = '';
  const family = state.family;
  const pool = MISSIONS[family] || [];
  pool.forEach(m=>{
    const div = document.createElement('div'); div.className='mission';
    div.innerHTML = `<div><strong>${m.title}</strong><div style="font-size:13px;color:#555">${m.desc}</div></div>
      <div><button data-id="${m.id}">Do Mission</button></div>`;
    list.appendChild(div);
    div.querySelector('button').onclick = ()=> doMission(m);
  });
}

function doMission(m){
  // simulate a small interaction: prompt with confirm & simple input
  const ok = confirm(`${m.title}\n\n${m.desc}\n\nDo you want to attempt it?`);
  if(!ok) return;
  // small simulated task: ask a short question
  const answer = prompt('Write 1-2 lines about your approach. (this is simulated)') || '';
  // reward: update skills
  Object.entries(m.effects).forEach(([k,v])=>{
    state.skills[k] = (state.skills[k] || 0) + v;
  });
  if(!state.completed.includes(m.id)) state.completed.push(m.id);
  // badge awarding heuristic
  if(state.skills.creativity>=3 && !state.badges.includes('Creative')) state.badges.push('Creative');
  if(state.skills.analysis>=3 && !state.badges.includes('Analytical')) state.badges.push('Analytical');
  if(state.skills.empathy>=3 && !state.badges.includes('Caring')) state.badges.push('Caring');

  save(); renderProfile(); renderDashboard();
  toast('Mission completed — skills updated');
}

function renderDashboard(){
  const d = qs('readiness');
  // simple fit score: weighted by family-relevant skills
  const w = {
    health:{empathy:0.5, analysis:0.3, communication:0.2},
    tech:{analysis:0.6, creativity:0.2, communication:0.2},
    design:{creativity:0.6, communication:0.2, analysis:0.2},
    biz:{communication:0.4, analysis:0.4, creativity:0.2},
    edu:{communication:0.4, empathy:0.4, analysis:0.2}
  }[state.family] || {analysis:0.4,creativity:0.3,communication:0.3};

  let score=0;
  Object.entries(w).forEach(([k,wk])=>{
    score += (state.skills[k]||0)*wk;
  });
  const fit = Math.min(100, Math.round(score*10));
  d.innerHTML = `<div>Fit Score: <strong>${fit}%</strong></div>
    <div>Completed Missions: ${state.completed.length}</div>
    <div>Suggested next step: Try 3 different missions in other families to compare fit.</div>`;
}

// init
init();
