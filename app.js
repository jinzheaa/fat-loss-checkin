(() => {
  'use strict';
  const STORAGE_KEY = 'cut-checkin-local-v1';
  const BODY_PARTS = ['胸部','背部','腿部','肩部','手臂','腹肌','全身','休息'];
  const CARDIO_TYPES = ['爬坡走','椭圆机','骑行','快走','其他','无'];
  const CARB = {
    high: { label:'高碳', cls:'high', carbs:'240–260g', protein:'约 200g', fat:'40–45g', calories:'2150–2250 kcal' },
    medium: { label:'中碳', cls:'medium', carbs:'160–180g', protein:'约 205g', fat:'55–60g', calories:'1950–2050 kcal' },
    low: { label:'低碳', cls:'low', carbs:'70–90g', protein:'215–220g', fat:'70–75g', calories:'1750–1850 kcal' },
    refeed: { label:'Refeed', cls:'high', carbs:'约 250g', protein:'约 200g', fat:'低脂', calories:'按当天执行' }
  };
  const TRAINING_OPTIONS = [
    { id:'chest_triceps', label:'胸部 + 三头', parts:['胸部','手臂'], carb:'medium', cardio:'训练后爬坡走 / 椭圆机 30 分钟', cardioType:'爬坡走', cardioMinutes:30, note:'中碳：训练前后集中碳水' },
    { id:'back_biceps', label:'背部 + 二头', parts:['背部','手臂'], carb:'high', cardio:'训练后爬坡走 30 分钟（累时可取消）', cardioType:'爬坡走', cardioMinutes:30, note:'高碳：大肌群训练日，脂肪控制在 50g 内' },
    { id:'legs_full', label:'腿部 / 全身复合', parts:['腿部','全身'], carb:'high', cardio:'不安排有氧，优先恢复', cardioType:'无', cardioMinutes:null, note:'高碳：优先保证力量和恢复' },
    { id:'shoulders_arms', label:'肩部 + 手臂', parts:['肩部','手臂'], carb:'medium', cardio:'训练后爬坡走 / 骑行 35 分钟', cardioType:'爬坡走', cardioMinutes:35, note:'中碳：碳水集中训练前后' },
    { id:'accessory_abs', label:'小肌群 / 腹肌', parts:['腹肌'], carb:'low', cardio:'爬坡走 / 骑行 45 分钟', cardioType:'爬坡走', cardioMinutes:45, note:'低碳：碳水放白天或有氧前' },
    { id:'rest', label:'休息日', parts:['休息'], carb:'low', cardio:'骑行 / 快走 45–60 分钟', cardioType:'骑行', cardioMinutes:50, note:'低碳：晚餐零主食，优先恢复' },
    { id:'custom', label:'自定义训练', parts:[], carb:'medium', cardio:'自己安排', cardioType:'无', cardioMinutes:null, note:'自定义日：按身体状态选择碳循环' }
  ];
  function trainingOption(id) { return TRAINING_OPTIONS.find(x=>x.id===id) || TRAINING_OPTIONS.find(x=>x.id==='custom'); }
  function inferTrainingChoice(entry) {
    if (entry.trainingChoice) return entry.trainingChoice;
    if ((entry.trainingParts||[]).includes('胸部') && (entry.trainingParts||[]).includes('手臂')) return 'chest_triceps';
    if ((entry.trainingParts||[]).includes('背部') && (entry.trainingParts||[]).includes('手臂')) return 'back_biceps';
    if ((entry.trainingParts||[]).includes('腿部') || (entry.trainingParts||[]).includes('全身')) return 'legs_full';
    if ((entry.trainingParts||[]).includes('肩部')) return 'shoulders_arms';
    if ((entry.trainingParts||[]).includes('休息')) return 'rest';
    return 'custom';
  }
  const DAILY_GUIDES = {
    chest_triceps: { carb:'训练前 40% · 训练后 40% · 其他餐 20%', focus:'训练后低冲击有氧约 30 分钟；优先维持复合动作的力量和动作质量。' },
    back_biceps: { carb:'训练前 35% · 训练后 45% · 其他餐 20%', focus:'训练后爬坡走约 30 分钟；如果明显疲劳，可以取消有氧，优先恢复。' },
    legs_full: { carb:'训练前 35% · 训练后 45% · 其他餐 20%', focus:'今天不安排额外有氧；训练前吃够碳水，训练后补充蛋白质和碳水。' },
    shoulders_arms: { carb:'训练前 40% · 训练后 40% · 其他餐 20%', focus:'训练后低冲击有氧约 35 分钟；不要为了消耗热量无限增加训练量。' },
    accessory_abs: { carb:'训练前后各约 50%，其余放白天', focus:'低碳日训练量适中；爬坡走或骑行约 45 分钟，观察训练表现和恢复。' },
    rest: { carb:'碳水主要放白天，晚餐可减少主食', focus:'骑行或快走 45–60 分钟；今天优先睡眠、饮水和恢复。' },
    custom: { carb:'根据当天训练量灵活分配，优先放在训练前后', focus:'自定义日不要同时大幅降低热量、增加有氧和增加训练量。' }
  };
  function renderDailyGuide(choice, carbKey, carb, entry) {
    const guide=DAILY_GUIDES[choice]||DAILY_GUIDES.custom;
    const alert=entry.alert || entry.trainingPerformance==='bad' ? '出现恢复预警：先减少有氧或提高碳水，不要硬扛。' : '单日体重波动不代表脂肪变化，结合 7 天平均体重判断。';
    return `<div class="card guide-card"><div class="section-heading"><h2>今天要点</h2><span>${carb.label} · 打开就能看</span></div><div class="guide-highlight"><strong>碳水安排</strong><span>${guide.carb}</span></div><ul class="guide-list"><li>${escapeHTML(guide.focus)}</li><li>目标：${escapeHTML(carb.carbs)} 碳水，${escapeHTML(carb.protein)} 蛋白质，${escapeHTML(carb.fat)} 脂肪。</li><li>${escapeHTML(alert)}</li></ul><details class="guide-details"><summary>查看减脂与保肌提醒</summary><div class="guide-copy"><p><b>训练前：</b>训练前 1–2 小时安排主要训练前餐，以易消化碳水和适量蛋白质为主，避免大量高脂和难消化食物。</p><p><b>训练后：</b>训练后 1–2 小时内完成一餐即可，补充蛋白质和计划中的训练后碳水，不需要暴食。</p><p><b>保肌：</b>复合动作尽量保持熟悉重量；高质量有效组约 14–16 组，复合动作休息 90–120 秒，孤立动作约 60 秒。</p><p><b>红线：</b>连续两次主项掉力超过约 10%，并伴随睡眠差、晨起心率升高或极度疲劳时，考虑把一个低碳日改为 Refeed。</p></div></details></div>`;
  }
  function renderGuideLibrary() {
    return `<div class="card guide-card"><div class="section-heading"><h2>执行指南</h2><span>减脂 · 训练 · 恢复</span></div><div class="guide-copy"><h3>碳循环速查</h3><p><b>高碳：</b>240–260g 碳水、约 200g 蛋白质、40–45g 脂肪，适合背部、腿部或全身复合训练。</p><p><b>中碳：</b>160–180g 碳水、约 205g 蛋白质、55–60g 脂肪，主要碳水放在训练前后。</p><p><b>低碳：</b>70–90g 碳水、215–220g 蛋白质、70–75g 脂肪，碳水优先放白天或有氧前。</p><h3>训练与有氧</h3><p>优先爬坡走、椭圆机、骑行和快走；参考心率 125–135 bpm，每周总量约 150–180 分钟。腿部或全身复合日优先恢复。</p><p>减脂期优先维持力量和动作质量，不要同时大幅减热量、加有氧和加训练量。</p><h3>体重与恢复</h3><p>观察 7 天平均体重、腰围、力量、睡眠和疲劳。不要因为单日体重上涨就立刻减少碳水，也不要因为一天吃多而第二天极端节食。</p><h3>Refeed 条件</h3><p>连续两次主项掉力超过约 10%，并伴随晨起心率升高、睡眠变差或极度疲劳时，可将一个低碳日改为 Refeed。参考碳水约 250g、蛋白质约 200g、脂肪保持较低。</p><h3>每日最小清单</h3><p>蛋白质达标 · 记录训练部位 · 记录有氧 · 记录体重和睡眠 · 睡前完成打卡 · 异常疲劳时写下备注。</p></div></div>`;
  }

  function renderNutritionCard(c, entry) {
    return `<div class="card" id="nutrition-card"><div class="section-heading"><h2>今日营养</h2><span>${c.protein} · ${c.fat}</span></div><div class="macro-grid"><div class="macro ${c.cls}"><strong>${c.carbs}</strong><span>目标碳水</span></div><div class="macro"><strong>${c.protein}</strong><span>目标蛋白</span></div><div class="macro"><strong>${c.fat}</strong><span>目标脂肪</span></div><div class="macro"><strong>${c.calories}</strong><span>目标热量</span></div></div><div class="field-grid" style="margin-top:14px">${inputField('实际碳水（g）','carbs',entry.carbs ?? '', 'number')}${inputField('实际蛋白质（g）','protein',entry.protein ?? '', 'number')}${inputField('实际脂肪（g）','fat',entry.fat ?? '', 'number')}${inputField('实际热量（kcal）','calories',entry.calories ?? '', 'number')}</div>${selectField('饮食完成','dietStatus',entry.dietStatus,[['','未填写'],['done','达标'],['mostly','基本达标'],['miss','未达标']])}<p class="hint">按大概值记录即可，不需要精确到每一克。</p></div>`;
  }

  const state = loadState();
  let currentView = 'today';
  let selectedDate = localDateKey(new Date());
  let calendarCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let statsWeekStart = startOfWeek(new Date());
  let toastTimer;

  function blankState() { return { version:1, entries:{}, settings:{ reminderEnabled:true, reminderTime:'21:30', seeded:false } }; }
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return blankState();
      const parsed = JSON.parse(raw); return parsed && parsed.version === 1 ? parsed : blankState();
    } catch { return blankState(); }
  }
  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function localDateKey(date) { const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; }
  function parseDate(key) { const [y,m,d]=key.split('-').map(Number); return new Date(y,m-1,d); }
  function todayKey() { return localDateKey(new Date()); }
  function startOfWeek(date) { const d=new Date(date.getFullYear(),date.getMonth(),date.getDate()); const day=d.getDay() || 7; d.setDate(d.getDate()-day+1); return d; }
  function fmtDate(key, short=false) { return new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:short?'short':'long'}).format(parseDate(key)); }
  function escapeHTML(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function num(value) { const n=Number(value); return Number.isFinite(n) && n >= 0 ? n : null; }
  function defaultEntry(key) {
    const day = parseDate(key);
    const planChoice = ['chest_triceps','back_biceps','rest','shoulders_arms','legs_full','accessory_abs','rest'][(day.getDay()+6)%7];
    const plan=trainingOption(planChoice);
    return { date:key, trainingChoice:planChoice, plannedChoice:planChoice, plannedCarb:plan.carb, plannedTraining:plan.label, plannedCardio:plan.cardio, trainingParts:[], customParts:'', strengthDone:false, trainingPerformance:'', trainingMinutes:null, cardioDone:false, cardioType:plan.cardioType, cardioMinutes:plan.cardioMinutes, heartRate:null, carbs:null, protein:null, fat:null, calories:null, weight:null, sleep:null, water:null, fatigue:'', hunger:'', dietStatus:'', alert:false, notes:'', updatedAt:null };
  }
  function getEntry(key) { if (!state.entries[key]) state.entries[key]=defaultEntry(key); return state.entries[key]; }
  function seed90() { if (state.settings.seeded) return; const start=parseDate(todayKey()); for(let i=0;i<90;i++){const d=new Date(start);d.setDate(start.getDate()+i);getEntry(localDateKey(d));} state.settings.seeded=true; persist(); }
  function setView(view) { currentView=view; document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id===`view-${view}`)); document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.view===view)); document.getElementById('page-title').textContent={today:'今日打卡',calendar:'训练日历',stats:'本周统计',settings:'设置与备份'}[view]; render(); }
  function toast(message) { const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200); }
  function saveEntryFromForm(form) {
    const key=form.dataset.date, e=getEntry(key); const get=(name)=>form.elements[name]?.value ?? '';
    e.trainingChoice=get('trainingChoice'); const selectedPlan=trainingOption(e.trainingChoice); if (e.trainingChoice && e.trainingChoice!=='custom') { e.carbCycle=selectedPlan.carb; e.plannedTraining=selectedPlan.label; e.plannedCardio=selectedPlan.cardio; e.cardioType=selectedPlan.cardioType; e.cardioMinutes=selectedPlan.cardioMinutes; e.trainingParts=[...selectedPlan.parts]; if (selectedPlan.cardioType==='无') e.cardioDone=false; }
    e.plannedCarb=get('plannedCarb') || e.plannedCarb; e.trainingParts=[...form.querySelectorAll('.part-chip.selected')].map(x=>x.dataset.part); e.customParts=get('customParts').trim();
    e.plannedTraining=get('plannedTraining'); e.plannedCardio=get('plannedCardio'); e.strengthDone=form.elements.strengthDone.checked; e.trainingPerformance=get('trainingPerformance'); e.trainingMinutes=num(get('trainingMinutes')); e.carbCycle=get('carbCycle'); if (e.trainingChoice && e.trainingChoice!=='custom') e.carbCycle=selectedPlan.carb; e.cardioDone=form.elements.cardioDone.checked; e.cardioType=get('cardioType'); e.cardioMinutes=num(get('cardioMinutes')); e.heartRate=num(get('heartRate')); e.carbs=num(get('carbs')); e.protein=num(get('protein')); e.fat=num(get('fat')); e.calories=num(get('calories')); e.weight=num(get('weight')); e.sleep=num(get('sleep')); e.water=num(get('water')); e.fatigue=get('fatigue'); e.hunger=get('hunger'); e.dietStatus=get('dietStatus'); e.alert=form.elements.alert.checked; e.notes=get('notes'); e.updatedAt=new Date().toISOString(); persist(); toast('已保存今天的打卡'); renderToday(); }
  function inputField(label,name,value,type='text',extra='') { return `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${escapeHTML(value ?? '')}" ${type==='number'?'min="0" inputmode="decimal"':''} ${extra}></div>`; }
  function selectField(label,name,value,options) { return `<div class="field"><label for="${name}">${label}</label><select id="${name}" name="${name}">${options.map(o=>`<option value="${escapeHTML(o[0])}" ${value===o[0]?'selected':''}>${escapeHTML(o[1])}</option>`).join('')}</select></div>`; }
  function renderToday() {
    const e=getEntry(selectedDate), choice=inferTrainingChoice(e), choiceData=trainingOption(choice), carb=e.carbCycle || e.plannedCarb || choiceData.carb || 'medium', c=CARB[carb]||CARB.medium;
    const customParts=e.customParts ? e.customParts.split(',').map(x=>x.trim()).filter(Boolean) : [];
    const checks=[e.weight,e.carbs,e.protein,e.fat,e.calories,e.trainingParts.length||e.strengthDone,e.cardioDone||e.cardioType==='无',e.sleep,e.dietStatus].filter(Boolean).length; const progress=Math.round(checks/9*100);
    document.getElementById('today-content').innerHTML=`
      <div class="card hero" id="hero-card"><p class="hero-date">${fmtDate(selectedDate)} · ${selectedDate===todayKey()?'今天':'历史记录'}</p><div class="hero-row"><div><h2 id="hero-carb-label">${c.label}日</h2><p class="hero-sub" id="hero-training-label">参考：${escapeHTML(e.plannedTraining || '自由安排')}</p></div><span class="pill ${c.cls}" id="hero-carb-pill">${c.carbs}</span></div><div class="progress-track"><div class="progress-bar" style="width:${progress}%"></div></div><div class="progress-label">今日完成度 ${progress}% · ${e.updatedAt?`最后保存 ${new Date(e.updatedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`:'尚未保存'}</div></div>
      <div id="daily-guide-container">${renderDailyGuide(choice, carb, c, e)}</div>
      <form id="checkin-form" data-date="${selectedDate}">
        <input type="hidden" name="trainingChoice" value="${choice}">
        <div class="card"><div class="section-heading"><h2>今日计划</h2><span>只是参考，可随时改</span></div>${selectField('碳循环','carbCycle',carb,Object.entries(CARB).map(([k,v])=>[k,v.label]))}<div class="field-grid">${inputField('计划训练参考','plannedTraining',e.plannedTraining)}${inputField('计划有氧参考','plannedCardio',e.plannedCardio)}</div><p class="hint">计划不会限制你的实际记录；每天可以完全不同。</p></div>
        <div class="card"><div class="section-heading"><h2>今天练什么</h2><span>选择后自动带出营养和有氧</span></div><div class="chips training-choice-chips">${TRAINING_OPTIONS.map(o=>`<button type="button" class="chip training-choice ${choice===o.id?'selected':''}" data-choice="${o.id}">${o.label}</button>`).join('')}</div><p class="hint">选择今日主要训练项目后，今日要点和今日营养会同步切换到对应碳循环。你仍可在下面微调实际执行。</p><div class="section-heading" style="margin-top:16px"><h2>实际训练部位</h2><span>可多选</span></div><div class="chips">${BODY_PARTS.map(p=>`<button type="button" class="chip part-chip ${e.trainingParts.includes(p)?'selected':''}" data-part="${p}">${p}</button>`).join('')}</div><div class="field-grid" style="margin-top:12px">${inputField('自定义部位（用逗号分隔）','customParts',e.customParts)}${selectField('整体表现','trainingPerformance',e.trainingPerformance,[['','未填写'],['better','比平时好'],['same','基本保持'],['down','轻微下降'],['bad','明显下降']])}</div><label class="check-row"><input type="checkbox" name="strengthDone" ${e.strengthDone?'checked':''}> 今天完成力量训练</label>${inputField('训练时长（分钟）','trainingMinutes',e.trainingMinutes ?? '', 'number')}</div>
        ${renderNutritionCard(c, e)}
        <div class="card"><div class="section-heading"><h2>有氧记录</h2><span>低冲击优先</span></div><label class="check-row"><input type="checkbox" name="cardioDone" ${e.cardioDone?'checked':''}> 今天完成有氧</label><div class="field-grid">${selectField('有氧类型','cardioType',e.cardioType,CARDIO_TYPES.map(x=>[x,x]))}${inputField('时长（分钟）','cardioMinutes',e.cardioMinutes ?? '', 'number')}${inputField('平均心率（bpm）','heartRate',e.heartRate ?? '', 'number')}</div><p class="hint">计划参考心率 125–135 bpm；本周总有氧建议 150–180 分钟。</p></div>
        <div class="card"><div class="section-heading"><h2>身体与恢复</h2><span>不舒服要记录</span></div><div class="field-grid">${inputField('体重（kg）','weight',e.weight ?? '', 'number')}${inputField('睡眠（小时）','sleep',e.sleep ?? '', 'number')}${inputField('饮水（L）','water',e.water ?? '', 'number')}${selectField('疲劳程度','fatigue',e.fatigue,[['','未填写'],['1','1 · 很好'],['2','2 · 正常'],['3','3 · 一般'],['4','4 · 较累'],['5','5 · 极度疲惫']])}${selectField('饥饿程度','hunger',e.hunger,[['','未填写'],['1','1 · 轻微'],['2','2'],['3','3'],['4','4'],['5','5 · 很强']])}</div><label class="check-row"><input type="checkbox" name="alert" ${e.alert?'checked':''}> 今日出现掉力/恢复预警</label><p class="hint">连续两次主项掉力超过 10%、晨起心率升高且极度疲惫时，考虑将一个低碳日改为 Refeed。</p></div>
        <div class="card"><div class="section-heading"><h2>备注</h2><span>写下最重要的一件事</span></div><div class="field full"><textarea name="notes" placeholder="今天的状态、饮食情况或明天要调整的内容">${escapeHTML(e.notes)}</textarea></div></div>
        <button class="button block" type="submit">保存 ${selectedDate===todayKey()?'今天':'这一天'}的记录</button>
      </form>`;
    const form=document.getElementById('checkin-form');
    form.querySelectorAll('.part-chip').forEach(btn=>btn.addEventListener('click',()=>btn.classList.toggle('selected')));
      form.querySelectorAll('.training-choice').forEach(btn=>btn.addEventListener('click',()=>{
        const selected=trainingOption(btn.dataset.choice);
        form.elements.trainingChoice.value=selected.id;
        form.querySelectorAll('.training-choice').forEach(x=>x.classList.toggle('selected',x===btn));
        form.elements.carbCycle.value=selected.carb;
        form.elements.plannedTraining.value=selected.label;
        form.elements.plannedCardio.value=selected.cardio;
        form.elements.cardioType.value=selected.cardioType;
        form.elements.cardioMinutes.value=selected.cardioMinutes ?? '';
        form.querySelectorAll('.part-chip').forEach(x=>x.classList.toggle('selected',selected.parts.includes(x.dataset.part)));
        const selectedCarb=CARB[selected.carb]||CARB.medium;
        const selectedEntry=getEntry(selectedDate);
        selectedEntry.trainingChoice=selected.id;
        selectedEntry.carbCycle=selected.carb;
        selectedEntry.plannedTraining=selected.label;
        selectedEntry.plannedCardio=selected.cardio;
        selectedEntry.trainingParts=[...selected.parts];
        document.getElementById('hero-carb-label').textContent=`${selectedCarb.label}日`;
        document.getElementById('hero-training-label').textContent=`参考：${selected.label}`;
        const heroPill=document.getElementById('hero-carb-pill');
        heroPill.textContent=selectedCarb.carbs;
        heroPill.className=`pill ${selectedCarb.cls}`;
        document.getElementById('daily-guide-container').innerHTML=renderDailyGuide(selected.id, selected.carb, selectedCarb, selectedEntry);
        const nutrition=document.getElementById('nutrition-card');
        if (nutrition) {
          const macros=nutrition.querySelectorAll('.macro');
          [selectedCarb.carbs,selectedCarb.protein,selectedCarb.fat,selectedCarb.calories].forEach((value,index)=>{if(macros[index]) macros[index].querySelector('strong').textContent=value;});
          nutrition.querySelector('.section-heading span').textContent=`${selectedCarb.protein} · ${selectedCarb.fat}`;
          macros.forEach((macro,index)=>macro.classList.toggle(selectedCarb.cls,index===0));
        }
        toast(`${selected.label} · 今日要点和营养目标已切换为${selectedCarb.label}`);
      }));
    form.addEventListener('submit',ev=>{ev.preventDefault();saveEntryFromForm(form);});
  }
  function renderCalendar() {
    const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0), offset=(first.getDay()+6)%7; let cells='';
    for(let i=0;i<offset;i++) cells+='<div class="day-cell empty"></div>';
    for(let d=1;d<=last.getDate();d++){
      const key=localDateKey(new Date(y,m,d)), e=state.entries[key], choice=e?inferTrainingChoice(e):'', plan=e?trainingOption(choice):null, carbKey=e?(e.carbCycle||e.plannedCarb||plan?.carb):'', cls=carbKey||'', done=Boolean(e&&([e.weight,e.carbs,e.protein,e.fat,(e.trainingParts||[]).length,e.cardioDone,e.dietStatus,e.strengthDone].some(Boolean)));
      cells+=`<button class="day-cell ${key===todayKey()?'today':''} ${key===selectedDate?'selected':''} ${cls} ${done?'done':''}" data-date="${key}" title="${plan?`${plan.label} · ${CARB[carbKey]?.label||''}`:'未记录'}"><span>${d}</span><i class="dot"></i></button>`;
    }
    document.getElementById('calendar-content').innerHTML=`<div class="card"><div class="calendar-head"><button id="prev-month">‹</button><div class="calendar-title">${y}年${m+1}月</div><button id="next-month">›</button></div><div class="weekday-row">${['一','二','三','四','五','六','日'].map(x=>`<div class="weekday">${x}</div>`).join('')}</div><div class="calendar-grid">${cells}</div><p class="hint" style="margin:14px 0 0">点日期进入记录 · 颜色表示碳循环 · 绿色点表示已有打卡内容</p></div><div class="card"><div class="section-heading"><h2>快速跳转</h2><span>${fmtDate(selectedDate)}</span></div><button class="button secondary block" id="open-selected">打开所选日期</button></div>`;
    document.getElementById('prev-month').onclick=()=>{calendarCursor=new Date(y,m-1,1);renderCalendar()}; document.getElementById('next-month').onclick=()=>{calendarCursor=new Date(y,m+1,1);renderCalendar()}; document.querySelectorAll('.day-cell[data-date]').forEach(btn=>btn.onclick=()=>{selectedDate=btn.dataset.date;setView('today')}); document.getElementById('open-selected').onclick=()=>setView('today');
  }
  function weeklyEntries() { const arr=[];for(let i=0;i<7;i++){const d=new Date(statsWeekStart);d.setDate(d.getDate()+i);const e=state.entries[localDateKey(d)];if(e)arr.push(e)}return arr; }
  function avg(entries,key){const vals=entries.map(e=>num(e[key])).filter(v=>v!==null);return vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length):null;}
  function renderStats(){const entries=weeklyEntries(), weights=entries.map(e=>num(e.weight)).filter(v=>v!==null), avgW=avg(entries,'weight'), cardio=entries.reduce((s,e)=>s+(num(e.cardioMinutes)||0),0), strength=entries.filter(e=>e.strengthDone).length, cardioDays=entries.filter(e=>e.cardioDone).length, diet=entries.filter(e=>e.dietStatus==='done').length;const end=new Date(statsWeekStart);end.setDate(end.getDate()+6);document.getElementById('stats-content').innerHTML=`<div class="card"><div class="week-controls"><button id="prev-week">‹</button><div><p class="hint" style="margin:0">统计周</p><strong>${localDateKey(statsWeekStart)} — ${localDateKey(end)}</strong></div><button id="next-week">›</button></div></div><div class="stat-grid"><div class="stat"><small>平均体重</small><strong>${avgW===null?'—':avgW.toFixed(1)}<small style="display:inline"> kg</small></strong></div><div class="stat"><small>力量训练</small><strong>${strength}<small style="display:inline"> 次</small></strong></div><div class="stat"><small>有氧时长</small><strong>${cardio}<small style="display:inline"> 分</small></strong></div><div class="stat"><small>饮食达标</small><strong>${diet}<small style="display:inline"> 天</small></strong></div></div><div class="card"><div class="section-heading"><h2>本周概览</h2><span>${entries.length}/7 天有记录</span></div><div class="bar-list"><div class="bar-item"><span>训练天数</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min(strength/4*100,100)}%"></div></div><b>${strength}/4</b></div><div class="bar-item"><span>有氧天数</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min(cardioDays/5*100,100)}%"></div></div><b>${cardioDays}</b></div><div class="bar-item"><span>有氧目标</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min(cardio/150*100,100)}%"></div></div><b>${cardio}/150</b></div></div></div><div class="card"><div class="section-heading"><h2>宏量平均</h2><span>仅统计已填写天</span></div><div class="macro-grid"><div class="macro"><strong>${avg(entries,'carbs')===null?'—':Math.round(avg(entries,'carbs'))}</strong><span>碳水 g</span></div><div class="macro"><strong>${avg(entries,'protein')===null?'—':Math.round(avg(entries,'protein'))}</strong><span>蛋白质 g</span></div><div class="macro"><strong>${avg(entries,'fat')===null?'—':Math.round(avg(entries,'fat'))}</strong><span>脂肪 g</span></div><div class="macro"><strong>${avg(entries,'calories')===null?'—':Math.round(avg(entries,'calories'))}</strong><span>热量 kcal</span></div></div></div>`;document.getElementById('prev-week').onclick=()=>{statsWeekStart.setDate(statsWeekStart.getDate()-7);renderStats()};document.getElementById('next-week').onclick=()=>{statsWeekStart.setDate(statsWeekStart.getDate()+7);renderStats()};}
  function renderSettings(){const s=state.settings;document.getElementById('settings-content').innerHTML=`${renderGuideLibrary()}<div class="card"><div class="section-heading"><h2>本地数据</h2><span>只在本设备保存</span></div><p class="hint">建议定期导出备份。清除浏览器网站数据可能会删除本地记录。</p><div class="button-row"><button class="button" id="export-data">导出备份</button><button class="button secondary" id="import-data">导入备份</button><input id="import-file" type="file" accept="application/json" hidden></div></div><div class="card"><div class="section-heading"><h2>每日提醒</h2><span>网页打开时生效</span></div><label class="check-row"><input type="checkbox" id="reminder-enabled" ${s.reminderEnabled?'checked':''}> 启用 ${escapeHTML(s.reminderTime)} 打卡提醒</label><div class="field">${inputField('提醒时间','reminderTime',s.reminderTime,'time')}</div><p class="hint">iPhone 纯本地网页在完全关闭时不能保证后台推送。添加到主屏幕后，打开网页时会显示提醒；也可在系统“提醒事项”中设置每日提醒。</p></div><div class="card"><div class="section-heading"><h2>使用方式</h2></div><ol class="hint"><li>Safari 打开本地网页后，点击分享 → 添加到主屏幕。</li><li>每天进入“今日”，选择实际训练部位并保存。</li><li>定期点击“导出备份”，将 JSON 文件保存到安全位置。</li></ol></div><div class="card"><button class="button danger block" id="clear-data">清除全部本地数据</button></div>`;document.getElementById('reminder-enabled').onchange=e=>{s.reminderEnabled=e.target.checked;persist();checkReminder()};document.getElementById('reminderTime').onchange=e=>{s.reminderTime=e.target.value;persist();toast('提醒时间已保存')};document.getElementById('export-data').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`减脂打卡备份-${todayKey()}.json`;a.click();URL.revokeObjectURL(a.href);toast('备份已导出')};document.getElementById('import-data').onclick=()=>document.getElementById('import-file').click();document.getElementById('import-file').onchange=importData;document.getElementById('clear-data').onclick=()=>{if(confirm('确定清除全部本地打卡数据吗？此操作不可撤销，请先导出备份。')){localStorage.removeItem(STORAGE_KEY);location.reload()}};}
  function importData(ev){const file=ev.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);if(!parsed||parsed.version!==1||!parsed.entries||!parsed.settings)throw Error();state.version=1;state.entries=parsed.entries;state.settings=parsed.settings;persist();toast('备份已恢复');render()}catch{alert('备份文件无效或版本不兼容。')}};reader.readAsText(file);}
  function checkReminder(){const b=document.getElementById('reminder-banner'),s=state.settings;if(!s.reminderEnabled){b.classList.add('hidden');return}const now=new Date(), [h,m]=s.reminderTime.split(':').map(Number);if(now.getHours()===h&&now.getMinutes()>=m&&now.getMinutes()<m+10&&!localStorage.getItem('reminder-shown-'+todayKey())){b.textContent='🌙 该完成今天的减脂打卡了；记录一下，明天更轻松。';b.classList.remove('hidden');localStorage.setItem('reminder-shown-'+todayKey(),'1')}else if(!b.textContent)b.classList.add('hidden');}
  function render(){if(currentView==='today')renderToday();if(currentView==='calendar')renderCalendar();if(currentView==='stats')renderStats();if(currentView==='settings')renderSettings();checkReminder();}
  document.querySelectorAll('.nav-item').forEach(btn=>btn.onclick=()=>setView(btn.dataset.view));document.getElementById('quick-today').onclick=()=>{selectedDate=todayKey();setView('today')};seed90();render();setInterval(checkReminder,30000);
})();
