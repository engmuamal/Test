// --- Data ---
const mkCharacters = [
    "Rambo", "Rain", "Mileena", "RoboCop", "Sheeva", "Fujin",
    "The Terminator", "The Joker", "Spawn", "Shang Tsung",
    "Nightwolf", "Sindel", "Shao Kahn", "Scorpion", "Sub-Zero",
    "Liu Kang", "Raiden", "Kitana", "Jade", "Johnny Cage",
    "Cassie Cage", "Sonya Blade", "Jax", "Jacqui Briggs",
    "Noob Saibot", "Baraka", "Kano", "Kabal", "Kung Lao",
    "Kotal Kahn", "Erron Black", "D'Vorah", "Skarlet", "Geras"
];

let playersInput = [];
let drawPool = [];
let matches = [];
let currentMatchId = null;
let roundData = { r1: null, r2: null, r3: null };
let tournamentData = { name: "MK11 TOURNAMENT", prize: "Glory" };

// --- Player Stats Object (Database) ---
// Key: Player Name
// Value: { titles: 0, finals: 0, prizes: [] }
let statsDB = JSON.parse(localStorage.getItem('mk11_stats_v6')) || {};

// --- Setup ---
window.onload = function() {
    renderHoF();
};

function startSetup() {
    const tName = document.getElementById('tourney-name').value.trim();
    const tPrize = document.getElementById('tourney-prize').value.trim();
    
    if(tName) tournamentData.name = tName;
    if(tPrize) tournamentData.prize = tPrize;

    document.getElementById('header-title').innerHTML = `${tournamentData.name}`;
    document.getElementById('setup-title-display').innerText = `KOMBATANTS FOR: ${tournamentData.name}`;
    
    switchView('setup-view');
}

function handleEnter(e) { if(e.key === 'Enter') addPlayer(); }
function addPlayer() {
    const input = document.getElementById('player-input');
    const name = input.value.trim();
    if(name) { playersInput.push(name); input.value = ''; renderPlayerGrid(); }
}
function removePlayer(idx) { playersInput.splice(idx, 1); renderPlayerGrid(); }

function renderPlayerGrid() {
    const grid = document.getElementById('kombat-grid');
    grid.innerHTML = '';
    const totalSlots = Math.max(8, playersInput.length + 1); 
    for(let i=0; i<totalSlots; i++) {
        const p = playersInput[i];
        const div = document.createElement('div');
        if(p) {
            div.className = 'kombat-slot filled';
            div.innerHTML = `<span class="slot-tag">P${i+1}</span><span class="slot-name">${p}</span><div class="slot-remove" onclick="removePlayer(${i})">✕</div>`;
        } else {
            div.className = 'kombat-slot';
            div.innerHTML = `<span class="slot-tag">P${i+1}</span>`;
        }
        grid.appendChild(div);
    }
    document.getElementById('player-count').innerText = `${playersInput.length} KOMBATANTS`;
    document.getElementById('start-btn').disabled = playersInput.length < 2;
}

// --- Draw Engine ---
let drawState = { matchesToCreate: 0, currentMatchIdx: 0, step: 0, isRolling: false, tempP1Name: null, tempP1Char: null, tempP2Name: null, tempP2Char: null };

function initDrawCeremony() {
    let size = 2; while(size < playersInput.length) size *= 2;
    drawPool = [...playersInput];
    for(let i=0; i<size-playersInput.length; i++) drawPool.push("BYE");
    drawPool.sort(() => Math.random() - 0.5);

    drawState.matchesToCreate = size / 2;
    drawState.currentMatchIdx = 0;
    matches = [];
    let idCounter = 1;
    for(let i=0; i<size/2; i++) {
        matches.push({ id: idCounter++, round: 1, phase: getPhaseName(size/2), p1: null, p2: null, status: 'locked', winner: null, nextIdx: null, nextSlot: null });
    }
    createFutureRounds(size/2, idCounter);
    
    switchView('draw-view');
    resetDrawUI();
}

function createFutureRounds(r1Count, startId) {
    let count = r1Count, startIdx = 0, id = startId, roundNum = 2;
    while(count > 1) {
        let nextCount = count / 2;
        for(let i=0; i<nextCount; i++) {
            matches.push({ id: id++, round: roundNum, phase: getPhaseName(nextCount), p1: {name:'TBD'}, p2: {name:'TBD'}, status:'locked', winner:null });
            let p1Idx = startIdx + (i*2), p2Idx = startIdx + (i*2) + 1, targetIdx = matches.length - 1;
            matches[p1Idx].nextIdx = targetIdx; matches[p1Idx].nextSlot = 'p1';
            matches[p2Idx].nextIdx = targetIdx; matches[p2Idx].nextSlot = 'p2';
        }
        startIdx += count; count = nextCount; roundNum++;
    }
}

// --- UI Draw Logic ---
function resetDrawUI() {
    drawState.step = 0; drawState.isRolling = false;
    document.getElementById('draw-match-num').innerText = `MATCH #${drawState.currentMatchIdx + 1}`;
    ['p1','p2'].forEach(p => { updateBox(p, 'name', '???'); updateBox(p, 'char', '???'); });
    document.getElementById('side-p1').className = 'draw-side side-green';
    document.getElementById('side-p2').className = 'draw-side side-red';
    updateDrawButton("سحب المتنافس الأول (P1)", false);
}

function handleDrawStep() {
    if(drawState.isRolling) return;
    const s = drawState;
    if(s.step === 0) {
        focusSide('p1');
        runAutoRoll('p1', 'name', drawPool, (val) => {
            s.tempP1Name = val;
            const idx = drawPool.indexOf(val); if(idx>-1) drawPool.splice(idx,1);
            if(val==='BYE') { s.tempP1Char='-'; updateBox('p1','char','-',true); s.step=2; updateDrawButton("سحب الخصم (P2)", false); }
            else { s.step=1; updateDrawButton("اختيار شخصية P1", false); }
        });
    } else if (s.step === 1) {
        runAutoRoll('p1', 'char', mkCharacters, (val) => { s.tempP1Char=val; s.step=2; updateDrawButton("سحب الخصم (P2)", false); });
    } else if (s.step === 2) {
        focusSide('p2');
        runAutoRoll('p2', 'name', drawPool, (val) => {
            s.tempP2Name = val;
            const idx = drawPool.indexOf(val); if(idx>-1) drawPool.splice(idx,1);
            if(val==='BYE') { s.tempP2Char='-'; updateBox('p2','char','-',true); s.step=4; updateDrawButton("اعتماد المباراة", true); }
            else { s.step=3; updateDrawButton("اختيار شخصية P2", false); }
        });
    } else if (s.step === 3) {
        runAutoRoll('p2', 'char', mkCharacters, (val) => { s.tempP2Char=val; s.step=4; updateDrawButton("اعتماد المباراة", true); });
    } else if (s.step === 4) { saveAndNextMatch(); }
}

function runAutoRoll(p, f, src, cb) {
    drawState.isRolling = true;
    const btn = document.getElementById('draw-action-btn'); btn.style.opacity = "0.5";
    const el = document.getElementById(`roll-${p}-${f}`);
    el.classList.remove('selected'); el.classList.add('blur');
    let timer = setInterval(() => { el.innerText = src[Math.floor(Math.random()*src.length)]; }, 50);
    setTimeout(() => {
        clearInterval(timer); el.classList.remove('blur');
        let steps=0, max=6, delay=100;
        function step() {
            let val = src[Math.floor(Math.random()*src.length)];
            if(f==='char') while(val==='BYE') val = src[Math.floor(Math.random()*src.length)];
            el.innerText = val; el.classList.add('slow');
            if(steps<max) { steps++; delay+=50; setTimeout(step, delay); }
            else { el.classList.remove('slow'); el.classList.add('selected'); drawState.isRolling=false; btn.style.opacity="1"; cb(val); }
        }
        step();
    }, 1000);
}

function updateDrawButton(t, c) { const btn = document.getElementById('draw-action-btn'); btn.innerText = t; btn.className = c ? "ios-btn-action confirm-mode" : "ios-btn-action"; }
function updateBox(p, f, v, s) { const el = document.getElementById(`roll-${p}-${f}`); el.innerText = v; el.className = s?'rolling-text selected':'rolling-text'; }
function focusSide(s) { document.getElementById('side-p1').classList.remove('active-turn'); document.getElementById('side-p2').classList.remove('active-turn'); document.getElementById(`side-${s}`).classList.add('active-turn'); }

function saveAndNextMatch() {
    const idx = drawState.currentMatchIdx;
    let p1Obj = { name: drawState.tempP1Name, char: drawState.tempP1Char, type: drawState.tempP1Name==='BYE'?'bye':'player' };
    let p2Obj = { name: drawState.tempP2Name, char: drawState.tempP2Char, type: drawState.tempP2Name==='BYE'?'bye':'player' };
    matches[idx].p1 = p1Obj; matches[idx].p2 = p2Obj;
    if(p1Obj.type==='bye') { matches[idx].status='finished'; matches[idx].winner='p2'; }
    else if(p2Obj.type==='bye') { matches[idx].status='finished'; matches[idx].winner='p1'; }
    else { matches[idx].status='ready'; }
    
    drawState.currentMatchIdx++;
    if(drawState.currentMatchIdx < drawState.matchesToCreate) resetDrawUI();
    else { propagateWinners(); switchView('bracket-view'); renderTreeBracket(); }
}

function renderTreeBracket() {
    const c = document.getElementById('bracket-tree-container'); c.innerHTML = '';
    let rounds = {};
    matches.forEach(m => { if(!rounds[m.round]) rounds[m.round]=[]; rounds[m.round].push(m); });
    const treeDiv = document.createElement('div'); treeDiv.style.display = 'flex'; treeDiv.style.gap = '50px'; treeDiv.style.padding = '20px';
    Object.keys(rounds).forEach(r => {
        const col = document.createElement('div'); col.className = 'bracket-round';
        col.innerHTML = `<div class="bracket-round-title">${rounds[r][0].phase}</div>`;
        rounds[r].forEach(m => {
            let p1=m.p1?m.p1.name:'TBD', p2=m.p2?m.p2.name:'TBD';
            let p1c=(m.p1&&m.p1.char!=='?')?m.p1.char:'', p2c=(m.p2&&m.p2.char!=='?')?m.p2.char:'';
            let btn='';
            if(m.status==='ready') btn=`<button class="node-start-btn" onclick="openMatch(${m.id})">FIGHT</button>`;
            else if(m.status==='active') btn=`<span style="color:#0f0">LIVE</span> <button class="node-start-btn" onclick="openMatch(${m.id})">VIEW</button>`;
            else if(m.status==='finished') { if(m.p1.type==='bye'||m.p2.type==='bye') btn=`<span style="color:#666">BYE</span>`; else btn=`<span style="color:gold">DONE</span>`; }
            let p1Cls=m.winner==='p1'?'winner':'', p2Cls=m.winner==='p2'?'winner':'';
            col.innerHTML += `<div class="match-node ${m.status==='active'?'active':''} ${m.status==='finished'?'finished':''}"><div class="node-header"><span>#${m.id}</span> ${btn}</div><div class="node-player ${p1Cls}"><span>${p1}</span> <span class="node-char">${p1c}</span></div><div class="node-player ${p2Cls}"><span>${p2}</span> <span class="node-char">${p2c}</span></div></div>`;
        });
        treeDiv.appendChild(col);
    });
    c.appendChild(treeDiv);
}

function openMatch(id) {
    const m = matches.find(x => x.id === id);
    if(m.status === 'locked' || (m.status === 'finished' && !m.winner)) return;
    if(m.p1.type === 'bye' || m.p2.type === 'bye') return;
    currentMatchId = id;
    if(m.status !== 'finished') m.status = 'active';
    renderTreeBracket();
    roundData = {r1:null, r2:null, r3:null};
    document.querySelectorAll('.r-chk').forEach(e => e.classList.remove('checked'));
    document.getElementById('round-1-strip').classList.remove('hidden');
    document.getElementById('round-2-strip').classList.remove('hidden');
    document.getElementById('round-3-strip').classList.add('hidden');
    document.getElementById('finish-match-btn').classList.add('hidden');
    document.getElementById('match-phase-badge').innerText = m.phase;
    document.getElementById('p1-name').innerText = m.p1.name; document.getElementById('p1-char').innerText = m.p1.char;
    document.getElementById('p2-name').innerText = m.p2.name; document.getElementById('p2-char').innerText = m.p2.char;
    updateScoreBoard(); switchView('match-view'); showFx("ROUND 1", "white");
}

function triggerRoundWin(round, w) {
    roundData[`r${round}`] = w;
    const wName = w==='p1' ? document.getElementById('p1-name').innerText : document.getElementById('p2-name').innerText;
    const col = w==='p1' ? 'var(--col-p1)' : 'var(--col-p2)';
    showFx(`${wName} WINS`, col);
    document.getElementById(`r${round}-p1`).classList.toggle('checked', w==='p1');
    document.getElementById(`r${round}-p2`).classList.toggle('checked', w==='p2');
    updateScoreBoard();
}

function updateScoreBoard() {
    let p1=0, p2=0;
    if(roundData.r1 === 'p1') p1++; else if(roundData.r1 === 'p2') p2++;
    if(roundData.r2 === 'p1') p1++; else if(roundData.r2 === 'p2') p2++;
    document.getElementById('p1-score').innerText = p1; document.getElementById('p2-score').innerText = p2;
    if(p1===1 && p2===1) { document.getElementById('round-3-strip').classList.remove('hidden'); if(roundData.r3) { if(roundData.r3==='p1') p1++; else p2++; } } else { document.getElementById('round-3-strip').classList.add('hidden'); }
    if(p1 >= 2 || p2 >= 2) document.getElementById('finish-match-btn').classList.remove('hidden'); else document.getElementById('finish-match-btn').classList.add('hidden');
}

function confirmMatchResult() {
    let p1 = parseInt(document.getElementById('p1-score').innerText);
    let p2 = parseInt(document.getElementById('p2-score').innerText);
    showFx("FATALITY", "var(--col-p2)");
    setTimeout(() => {
        const m = matches.find(x => x.id === currentMatchId);
        m.status = 'finished'; m.winner = p1>p2?'p1':'p2';
        
        // --- DATA TRACKING (Who made it to next round?) ---
        // Just rely on the bracket flow. Stats are updated at the END.
        
        propagateWinners();
        
        // Check if this was the FINAL match
        // Condition: nextIdx is null (it's the root of tree)
        if(m.nextIdx === null || m.nextIdx === undefined) {
            // CHAMPION FOUND
            const winnerName = m.winner==='p1'?m.p1.name:m.p2.name;
            const loserName = m.winner==='p1'?m.p2.name:m.p1.name;
            const winnerChar = m.winner==='p1'?m.p1.char:m.p2.char;
            
            // Temporary store for Save Button
            drawState.champion = { name: winnerName, char: winnerChar, loser: loserName };
            
            document.getElementById('champion-name').innerText = winnerName;
            document.getElementById('champion-char').innerText = winnerChar;
            document.getElementById('prize-display').innerText = tournamentData.prize ? `Prize: ${tournamentData.prize}` : "VICTORY";
            
            switchView('champion-view');
        } else {
            switchView('bracket-view'); renderTreeBracket();
        }
    }, 2000);
}

// --- Hall of Fame System ---
function saveToHistory() {
    const winner = drawState.champion.name;
    const loser = drawState.champion.loser; // Runner up
    
    // Update Winner Stats
    if(!statsDB[winner]) statsDB[winner] = { titles: 0, finals: 0, prizes: [] };
    statsDB[winner].titles++;
    statsDB[winner].finals++;
    if(tournamentData.prize) statsDB[winner].prizes.push(tournamentData.prize);
    
    // Update Runner-up Stats
    if(!statsDB[loser]) statsDB[loser] = { titles: 0, finals: 0, prizes: [] };
    statsDB[loser].finals++;
    
    // Save to LocalStorage
    localStorage.setItem('mk11_stats_v6', JSON.stringify(statsDB));
    
    if(confirm("تم حفظ البطولة! هل تريد العودة للشاشة الرئيسية؟")) location.reload();
}

function renderHoF() {
    const tbody = document.getElementById('hof-tbody');
    tbody.innerHTML = '';
    
    // Convert DB to Array
    let rows = Object.keys(statsDB).map(key => ({
        name: key,
        ...statsDB[key]
    }));
    
    // Sort by Titles (Desc), then Finals (Desc)
    rows.sort((a,b) => {
        if(b.titles !== a.titles) return b.titles - a.titles;
        return b.finals - a.finals;
    });
    
    if(rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:30px;color:#666">لا يوجد سجلات بعد</td></tr>`;
        return;
    }

    rows.forEach((row, idx) => {
        const tr = document.createElement('tr');
        if(idx === 0) tr.className = 'rank-1';
        
        // Format Prizes
        let prizeText = row.prizes.length > 0 ? row.prizes.join(', ') : '-';
        
        tr.innerHTML = `
            <td><span class="rank-badge">${idx+1}</span></td>
            <td class="winner-name">${row.name}</td>
            <td style="color:gold;font-weight:bold">${row.titles}</td>
            <td>${row.finals}</td>
            <td style="font-size:12px;color:#888">${prizeText}</td>
        `;
        tbody.appendChild(tr);
    });
}

function clearHistory() {
    if(confirm("هل أنت متأكد من مسح جميع السجلات؟ لا يمكن التراجع!")) {
        localStorage.removeItem('mk11_stats_v6');
        statsDB = {};
        renderHoF();
    }
}

// Utils
function showFx(txt, col) {
    const el = document.getElementById('fx-overlay'), t = document.getElementById('fx-text');
    t.innerText = txt; t.style.color = col; t.style.textShadow = `0 0 40px ${col}`;
    el.classList.remove('hidden'); t.style.animation = 'none'; t.offsetHeight; t.style.animation = null; 
    setTimeout(() => el.classList.add('hidden'), 1800);
}
function propagateWinners() {
    let ch=true; while(ch){ch=false; matches.forEach(m=>{
        if(m.status==='finished' && m.winner && m.nextIdx!==null){
            const nm = matches[m.nextIdx], wo = m.winner==='p1'?m.p1:m.p2;
            if(nm[m.nextSlot].name==='TBD'){ nm[m.nextSlot]=wo; ch=true; }
            if(nm.p1.name!=='TBD'&&nm.p2.name!=='TBD'&&nm.status==='locked'){ nm.status='ready'; ch=true; }
        }
    });}
}
function getPhaseName(c) { return c===1?"FINAL":c===2?"SEMI FINAL":c===4?"QUARTER FINAL":`ROUND OF ${c*2}`; }
function switchView(id) { document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); document.getElementById(id).classList.add('active'); if(id==='hof-view') renderHoF(); }
function goToBracket() { switchView('bracket-view'); }
function closeMatch() { switchView('bracket-view'); }
function resetApp() { if(confirm("إلغاء البطولة والعودة؟")) location.reload(); }
