/* ساعة الغدر — automatic game engine (runs on the host phone). Pure logic, no network. */
(function (root) {
'use strict';
var GOOD = [
['الطبيب','كل ليلة يحمي لاعباً من القتل، ولا يحمي الشخص نفسه ليلتين متتاليتين.'],
['المحقّق','كل ليلة يسأل عن لاعب: هل هو طيب أم شرير؟'],
['الحارس الشخصي','كل ليلة يختار لاعباً، وإذا هوجم يموت الحارس بدلاً منه.'],
['القاضي','مرة واحدة في اللعبة يلغي إعدام اليوم.'],
['الصيّاد','إذا مات يختار لاعباً يموت معه.'],
['الشرطي','مرة واحدة يطلق النار على لاعب: إن كان شريراً مات، وإن كان طيباً مات الشرطي.'],
['العمدة','صوته يُحسب بصوتين.'],
['صاحب الغراب','إذا قُتل ليلاً يعرف شخصية لاعب واحد يختاره.'],
['الجندي','ينجو من أول محاولة قتل.'],
['الجدّة','في الليلة الأولى تعرف لاعباً طيباً وشخصيته.'],
['السجّان','كل ليلة يختار لاعباً فلا يستخدم قدرته تلك الليلة، حتى لو كان شريراً.'],
['المحامي','كل ليلة يختار لاعباً، وإذا حُكم عليه بالإعدام غداً لا يموت.'],
['المُسعِف','مرة واحدة في اللعبة يعيد لاعباً طيباً ميتاً إلى الحياة.'],
['الحارس الليلي','كل ليلة يعرف عدد اللاعبين الذين استيقظوا لاستخدام قدراتهم.'],
['الطبّاخ','في الليلة الأولى يعرف كم زوجاً من الأشرار يجلسون متجاورين.'],
['المراقب','كل ليلة يختار لاعباً، ويعرف من زاره تلك الليلة.'],
['العجوز','في الليلة الأولى تعرف شخصية لاعب واحد يختاره الراوي عشوائياً.'],
['الخيّاطة','مرة واحدة تختار لاعبَين، وتعرف إن كانا من الفريق نفسه.'],
['القائد','إذا مات، يعرف الطيبون الأحياء كم شريراً بقي في اللعبة.'],
['صانع المرايا','إذا استخدم شرير قدرته عليه ليلاً، ترتدّ القدرة على الشرير نفسه.']
];
var EVIL = [
['الزعيم','من الليلة الثانية، يختار لاعباً كل ليلة ليقتله.'],
['الجاسوس','في الليلة الأولى يرى شخصيات جميع اللاعبين.'],
['المُخادع','يظهر كشخص طيب لكل من يتحرّى عنه.'],
['المُسكِت','كل ليلة يختار لاعباً، فلا يتكلم ولا يصوّت في اليوم التالي.'],
['الوريث','إذا مات الزعيم يصبح هو الزعيم الجديد.']
];
var R = {
  BOSS:'الزعيم', SPY:'الجاسوس', DEC:'المُخادع', SIL:'المُسكِت', HEIR:'الوريث',
  DOC:'الطبيب', DET:'المحقّق', BG:'الحارس الشخصي', JUDGE:'القاضي', HUNT:'الصيّاد', COP:'الشرطي',
  MAYOR:'العمدة', RAVEN:'صاحب الغراب', SOLD:'الجندي', GRAN:'الجدّة', JAIL:'السجّان', LAW:'المحامي',
  MEDIC:'المُسعِف', NGUARD:'الحارس الليلي', CHEF:'الطبّاخ', WATCH:'المراقب', OLD:'العجوز',
  SEAM:'الخيّاطة', LEAD:'القائد', MIRROR:'صانع المرايا'
};
var ABIL = {}; GOOD.concat(EVIL).forEach(function (c) { ABIL[c[0]] = c[1]; });
function isEvilRole(r) { return EVIL.some(function (c) { return c[0] === r; }); }
function evilCount(n) { return n <= 7 ? 2 : 3; }

function rnd(n, rng) { return Math.floor((rng || Math.random)() * n); }
function shuffle(a, rng) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1, rng); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* ---------- setup ---------- */
function create(room, host) {
  return { room: room, hostId: host.id, phase: 'lobby', night: 0, day: 0, players: [], removed: {}, processed: {},
    acts: {}, nightDone: {}, lastDoc: {}, used: {}, soldierUsed: {}, silenced: {}, lawyerProt: null,
    today: null, log: [], info: {}, pendingHunter: [], winner: null, v: 1, fake: null, bluffs: [] };
}
function addPlayer(G, p) {
  if (G.removed[p.id]) return false;
  var name = String(p.name || '').slice(0, 20).trim() || 'لاعب';
  var ex = find(G, p.id);
  if (ex) { if (ex.name !== name || ex.pub !== p.pub) { ex.name = name; ex.pub = p.pub; G.v++; return true; } return false; }
  if (G.phase !== 'lobby' || G.players.length >= 10) return false;
  G.players.push({ id: p.id, name: name, pub: p.pub, alive: true, bot: !!p.bot }); G.v++; return true;
}
function removePlayer(G, id) { if (G.phase !== 'lobby' || id === G.hostId) return; G.removed[id] = 1; G.players = G.players.filter(function (p) { return p.id !== id; }); G.v++; }
function start(G, rng) {
  var n = G.players.length; if (n < 5 || n > 10) return false;
  var ne = evilCount(n);
  var minions = shuffle(EVIL.slice(1).map(function (c) { return c[0]; }), rng).slice(0, ne - 1);
  var goods = shuffle(GOOD.map(function (c) { return c[0]; }), rng);
  var roles = shuffle([R.BOSS].concat(minions, goods.slice(0, n - ne)), rng);
  G.players = shuffle(G.players, rng);           // random seating
  G.players.forEach(function (p, i) { p.role = roles[i]; p.team = isEvilRole(roles[i]) ? 'evil' : 'good'; p.alive = true; p.seat = i + 1; G.info[p.id] = []; G.used[p.id] = {}; });
  G.bluffs = goods.slice(n - ne, n - ne + 3);
  // the Deceiver's cover: any good role (in play or not) except the Boss's bluffs
  var cover = GOOD.map(function (c) { return c[0]; }).filter(function (r) { return G.bluffs.indexOf(r) < 0; });
  G.fake = cover[rnd(cover.length, rng)];
  G.phase = 'night'; G.night = 1; G.day = 0; G.acts = {}; G.nightDone = {};
  G.log = ['بدأت اللعبة. الليلة الأولى: كل لاعب يفتح شخصيته ثم يضغط "إنهاء الليلة".'];
  // first-night knowledge
  G.players.forEach(function (p) {
    if (p.team === 'evil') addInfo(G, p, 'فريق الأشرار: ' + G.players.filter(function (x) { return x.team === 'evil'; }).map(function (x) { return x.name + ' (' + x.role + ')'; }).join('، '));
  });
  firstNightInfo(G);
  G.v++; return true;
}

/* ---------- helpers ---------- */
function find(G, id) { for (var i = 0; i < G.players.length; i++) if (G.players[i].id === id) return G.players[i]; return null; }
function byRole(G, r) { var l = G.players.filter(function (p) { return p.role === r; }); return l.filter(function (p) { return p.alive; })[0] || l[0] || null; }
function alive(G) { return G.players.filter(function (p) { return p.alive; }); }
function addInfo(G, p, s) { (G.info[p.id] = G.info[p.id] || []).push((G.phase === 'night' ? 'الليلة ' + G.night : 'النهار ' + G.day) + ': ' + s); }
function seemsGood(p) { return p.team === 'good' || p.role === R.DEC; }
function shownRole(G, p) { return p.role === R.DEC ? G.fake : p.role; }

/* What can this player do now? */
function actionSpec(G, p) {
  if (!p) return null;
  if (G.phase === 'over') return null;
  if (G.pendingHunter[0] === p.id) return { kind: 'hunter', n: 1, pool: ids(alive(G), p.id), optional: true, label: 'أنت الصيّاد ومتّ: اختر لاعباً يموت معك' };
  if (G.phase !== 'night' || !p.alive) return null;
  var a = ids(alive(G), p.id), all = ids(alive(G));
  var u = G.used[p.id] || {};
  switch (p.role) {
    case R.BOSS: return G.night >= 2 ? { kind: 'night', n: 1, pool: a, label: 'اختر لاعباً لقتله' } : none();
    case R.SIL: return { kind: 'night', n: 1, pool: a, label: 'اختر لاعباً لإسكاته غداً' };
    case R.JAIL: return { kind: 'night', n: 1, pool: a, label: 'اختر لاعباً لتعطيل قدرته الليلة' };
    case R.DOC: return { kind: 'night', n: 1, pool: all.filter(function (x) { return x !== G.lastDoc[p.id]; }), label: 'اختر لاعباً لحمايته' };
    case R.BG: return { kind: 'night', n: 1, pool: a, label: 'اختر لاعباً لحراسته (تموت بدلاً منه)' };
    case R.DET: return { kind: 'night', n: 1, pool: a, label: 'اختر لاعباً لتعرف إن كان طيباً أم شريراً' };
    case R.WATCH: return { kind: 'night', n: 1, pool: a, label: 'اختر لاعباً لتعرف من زاره' };
    case R.LAW: return { kind: 'night', n: 1, pool: a, label: 'اختر لاعباً لتحميه من إعدام الغد' };
    case R.RAVEN: return { kind: 'night', n: 1, pool: a, label: 'إن قُتلت الليلة، ستعرف شخصية هذا اللاعب' };
    case R.SEAM: return u.seam ? none() : { kind: 'night', n: 2, pool: a, optional: true, label: 'مرة واحدة: اختر لاعبَين لتعرف إن كانا من الفريق نفسه (أو تجاوز)' };
    case R.MEDIC: return (u.medic || G.night < 2) ? none() : { kind: 'night', n: 1, pool: ids(G.players.filter(function (x) { return !x.alive; })), optional: true, label: 'مرة واحدة: اختر لاعباً ميتاً لإعادته (أو تجاوز)' };
    case R.GRAN: case R.OLD: case R.CHEF: return G.night === 1 ? { kind: 'night', n: 0, pool: [], label: 'اقرأ معلومتك أعلاه، ثم اضغط "إنهاء الليلة".' } : none();
    default: return none();
  }
  function none() { return { kind: 'night', n: 0, pool: [], label: 'لا يوجد ما تفعله الليلة.' }; }
}
function ids(list, except) { return list.filter(function (p) { return p.id !== except; }).map(function (p) { return p.id; }); }

/* ---------- actions ---------- */
function act(G, from, a) {
  if (!a || !a.n || G.processed[a.n]) return false;
  G.processed[a.n] = 1;
  var p = find(G, from); if (!p || G.phase === 'over' || G.phase === 'lobby') return false;
  var ch = false;
  if (a.kind === 'hunter' && G.pendingHunter[0] === p.id) {
    G.pendingHunter.shift();
    var t = find(G, a.t && a.t[0]);
    if (t && t.alive) { G.log.push('الصيّاد ' + p.name + ' أخذ معه ' + t.name + '.'); kill(G, t, 'hunter'); }
    else G.log.push('الصيّاد ' + p.name + ' لم يختر أحداً.');
    ch = true; afterResolve(G);
  } else if (a.kind === 'night' && G.phase === 'night' && p.alive && !G.nightDone[p.id]) {
    var spec = actionSpec(G, p), t2 = (a.t || []).filter(function (x, i, arr) { return spec.pool.indexOf(x) >= 0 && arr.indexOf(x) === i; });
    if (spec.n && !spec.optional && t2.length !== spec.n) return false;
    if (spec.n && spec.optional && t2.length && t2.length !== spec.n) return false;
    G.acts[p.id] = t2.slice(0, spec.n); G.nightDone[p.id] = 1; ch = true;
    if (alive(G).every(function (x) { return G.nightDone[x.id]; }) && !G.pendingHunter.length) resolveNight(G);
  } else if (G.phase === 'day' && p.alive) {
    var T = G.today;
    if (a.kind === 'nominate' && !G.silenced[p.id] && !T.nominators[p.id] && !openNom(G)) {
      var tg = find(G, a.t && a.t[0]);
      if (tg && tg.alive && !T.nominees[tg.id]) { T.nominators[p.id] = 1; T.nominees[tg.id] = 1; T.noms.push({ by: p.id, target: tg.id, votes: {}, open: true, yes: 0 }); G.log.push(p.name + ' رشّح ' + tg.name + ' للإعدام. صوّتوا الآن.'); ch = true; }
    } else if (a.kind === 'vote' && !G.silenced[p.id]) {
      var o = openNom(G);
      if (o && o.votes[p.id] === undefined) { o.votes[p.id] = !!a.yes; ch = true; closeIfDone(G, o); }
    } else if (a.kind === 'cop' && p.role === R.COP && !G.used[p.id].cop) {
      var ct = find(G, a.t && a.t[0]);
      if (ct && ct.alive && ct.id !== p.id) {
        G.used[p.id].cop = 1;
        if (ct.team === 'evil') { G.log.push('الشرطي ' + p.name + ' أطلق النار على ' + ct.name + ' وكان شريراً، فمات.'); kill(G, ct, 'cop'); }
        else { G.log.push('الشرطي ' + p.name + ' أطلق النار على ' + ct.name + ' وكان طيباً، فمات الشرطي.'); kill(G, p, 'cop'); }
        ch = true; afterResolve(G);
      }
    } else if (a.kind === 'judge' && p.role === R.JUDGE && !G.used[p.id].judge && !T.judged) {
      G.used[p.id].judge = 1; T.judged = true; G.log.push('القاضي استخدم قدرته: لا إعدام اليوم.'); ch = true;
    } else if (a.kind === 'endday') {
      T.end[p.id] = a.on === false ? 0 : 1; ch = true; maybeEndDay(G);
    }
  }
  if (ch) G.v++;
  return ch;
}
function openNom(G) { var T = G.today; if (!T) return null; for (var i = 0; i < T.noms.length; i++) if (T.noms[i].open) return T.noms[i]; return null; }
function voters(G) { return alive(G).filter(function (p) { return !G.silenced[p.id]; }); }
function closeIfDone(G, o) {
  var vs = voters(G);
  if (!vs.every(function (p) { return o.votes[p.id] !== undefined; })) return;
  o.open = false;
  o.yes = vs.reduce(function (s, p) { return s + (o.votes[p.id] ? (p.role === R.MAYOR ? 2 : 1) : 0); }, 0);
  var need = Math.ceil(alive(G).length / 2), t = find(G, o.target);
  G.log.push('نتيجة التصويت على ' + t.name + ': ' + o.yes + ' صوت (المطلوب ' + need + ').');
  maybeEndDay(G);
}
function voteCleanup(G) { var o = openNom(G); if (o) closeIfDone(G, o); }
function leader(G) {
  var T = G.today, need = Math.ceil(alive(G).length / 2), best = null, tie = false;
  T.noms.forEach(function (o) { if (o.open || o.yes < need) return; if (!best || o.yes > best.yes) { best = o; tie = false; } else if (o.yes === best.yes) tie = true; });
  return best && !tie ? best : null;
}
function maybeEndDay(G) {
  if (G.phase !== 'day' || openNom(G) || G.pendingHunter.length) return;
  var al = alive(G);
  if (!al.every(function (p) { return G.today.end[p.id]; })) return;
  var L = leader(G), from = G.log.length;
  if (G.today.judged) G.log.push('انتهى النهار دون إعدام (قرار القاضي).');
  else if (!L) G.log.push('انتهى النهار دون إعدام.');
  else {
    var t = find(G, L.target);
    if (G.lawyerProt === t.id) G.log.push('حُكم على ' + t.name + ' بالإعدام، لكنه نجا!');
    else { G.log.push('أُعدم ' + t.name + '.'); kill(G, t, 'exec'); }
  }
  G.lawyerProt = null;
  G.carry = G.log.slice(from);
  if (checkWin(G)) return;
  if (G.pendingHunter.length) { G.afterHunter = 'night'; return; }
  toNight(G);
}
function toNight(G) {
  G.phase = 'night'; G.night++; G.acts = {}; G.nightDone = {}; G.silenced = {}; G.afterHunter = null;
  G.log = (G.carry || []).concat(G.log.slice(-1).filter(function (l) { return /الصيّاد/.test(l); }), ['حلّ الليل (الليلة ' + G.night + '). نفّذ قدرتك إن وُجدت ثم اضغط "إنهاء الليلة".']);
  G.carry = null;
}
function toDay(G) {
  G.phase = 'day'; G.day++; G.today = { noms: [], nominators: {}, nominees: {}, end: {}, judged: false }; G.afterHunter = null;
}
function afterResolve(G) {
  if (checkWin(G)) return;
  if (G.pendingHunter.length) return;
  if (G.afterHunter === 'night') toNight(G);
  else if (G.afterHunter === 'day') toDay(G);
  else if (G.phase === 'day') { voteCleanup(G); maybeEndDay(G); }
}

/* ---------- deaths & win ---------- */
function kill(G, p, cause) {
  if (!p.alive) return;
  p.alive = false;
  if (p.role === R.HUNT) G.pendingHunter.push(p.id);
  if (p.role === R.LEAD) G.log.push('مات القائد: بقي ' + alive(G).filter(function (x) { return x.team === 'evil'; }).length + ' من الأشرار أحياء.');
  if (p.role === R.BOSS) {
    var heir = byRole(G, R.HEIR);
    if (heir && heir.alive) { heir.role = R.BOSS; heir.wasHeir = true; addInfo(G, heir, 'مات الزعيم. أنت الزعيم الآن! من الليلة القادمة تختار من يُقتل.'); }
  }
}
function checkWin(G) {
  var al = alive(G), boss = al.filter(function (p) { return p.role === R.BOSS; })[0];
  var ev = al.filter(function (p) { return p.team === 'evil'; }).length, gd = al.length - ev;
  if (!boss) { G.winner = 'good'; G.phase = 'over'; G.log.push('مات الزعيم. فاز الطيبون!'); return true; }
  if (al.length <= 2 || gd === 0) { G.winner = 'evil'; G.phase = 'over'; G.log.push('بقي لاعبان فقط والزعيم حيّ. فاز الأشرار!'); return true; }
  return false;
}


/* first-night information, given as soon as the night starts */
function firstNightInfo(G) {
    var gr = byRole(G, R.GRAN); if (gr) { var gs = G.players.filter(function (p) { return p.team === 'good' && p.id !== gr.id; }); var g = gs[rnd(gs.length)]; if (g) addInfo(G, gr, g.name + ' طيب، وشخصيته: ' + g.role + '.'); }
    var ow = byRole(G, R.OLD);
    if (ow) {
      // 20% chance to show an evil player, otherwise a good one (keeps the game longer)
      var others = G.players.filter(function (p) { return p.id !== ow.id; });
      var evs = others.filter(function (p) { return p.team === 'evil'; }), gds = others.filter(function (p) { return p.team === 'good'; });
      var from = (evs.length && (Math.random() < 0.2 || !gds.length)) ? evs : gds;
      var o = from[rnd(from.length)]; addInfo(G, ow, 'شخصية ' + o.name + ': ' + shownRole(G, o) + '.');
    }
    var ch = byRole(G, R.CHEF); if (ch) { var n = G.players.length, pairs = 0; for (var i = 0; i < n; i++) if (G.players[i].team === 'evil' && G.players[(i + 1) % n].team === 'evil') pairs++; if (n === 2) pairs = Math.min(pairs, 1); addInfo(G, ch, 'عدد أزواج الأشرار الجالسين متجاورين: ' + pairs + '.'); }
  }

/* ---------- night resolution ---------- */
function resolveNight(G) {
  var A = G.acts, N = G.night, deaths = [], visits = {}, jailed = {};
  function tgt(role) { var p = byRole(G, role); if (!p || !p.alive || jailed[p.id] && role !== R.JAIL) return null; var t = A[p.id] || []; return { p: p, t: t.map(function (id) { return find(G, id); }) }; }
  function visit(by, t) { if (t) (visits[t.id] = visits[t.id] || []).push(by.name); }
  // 1. jailer
  var j = tgt(R.JAIL); if (j && j.t[0]) { jailed[j.t[0].id] = 1; visit(j.p, j.t[0]); addInfo(G, j.t[0], 'تمّ سجنك الليلة، فلم تعمل قدرتك.'); }
  function on(role) { var x = tgt(role); if (x) x.t.forEach(function (t) { if (role !== R.MEDIC && role !== R.RAVEN) visit(x.p, t); }); return x; }
  // 2. silencer (mirror reflects)
  var s = on(R.SIL); if (s && s.t[0]) { var st = s.t[0]; if (st.role === R.MIRROR) st = s.p; G.silenced[st.id] = 1; addInfo(G, st, 'تمّ إسكاتك: لا تتكلم ولا ترشّح ولا تصوّت اليوم.'); }
  // 3. protections
  var d = on(R.DOC), prot = {}; if (d && d.t[0]) { prot[d.t[0].id] = 1; G.lastDoc[d.p.id] = d.t[0].id; } else if (d) G.lastDoc[d.p.id] = null;
  var bg = on(R.BG), guard = bg && bg.t[0] ? { by: bg.p, t: bg.t[0] } : null;
  var law = on(R.LAW); G.lawyerProt = law && law.t[0] ? law.t[0].id : null;
  var raven = on(R.RAVEN);
  // 4. boss kill
  var b = on(R.BOSS);
  if (b && b.t[0] && N >= 2) {
    var T = b.t[0], victim = T;
    if (T.role === R.MIRROR) victim = b.p;
    if (prot[victim.id]) victim = null;
    else if (guard && guard.t.id === victim.id && guard.by.alive && guard.by.id !== victim.id) victim = prot[guard.by.id] ? null : guard.by;
    else if (victim.role === R.SOLD && !G.soldierUsed[victim.id]) { G.soldierUsed[victim.id] = 1; addInfo(G, victim, 'حاول أحدهم قتلك ونجوت!'); victim = null; }
    if (victim) deaths.push(victim);
  }
  // 5. medic
  var m = on(R.MEDIC), revived = null;
  if (m && m.t[0]) { G.used[m.p.id].medic = 1; if (m.t[0].team === 'good' && !m.t[0].alive) revived = m.t[0]; }
  // 6. information
  var det = on(R.DET); if (det && det.t[0]) addInfo(G, det.p, det.t[0].name + (seemsGood(det.t[0]) ? ' طيب.' : ' شرير!'));
  var se = on(R.SEAM); if (se && se.t.length === 2) { G.used[se.p.id].seam = 1; var same = seemsGood(se.t[0]) === seemsGood(se.t[1]); addInfo(G, se.p, se.t[0].name + ' و' + se.t[1].name + (same ? ' من الفريق نفسه.' : ' من فريقين مختلفين.')); }
  var ng = byRole(G, R.NGUARD);
  if (ng && ng.alive && !jailed[ng.id]) { var woke = G.players.filter(function (p) { return p.alive && (A[p.id] || []).length && p.role !== R.RAVEN; }).length; addInfo(G, ng, 'استيقظ ' + woke + ' لاعبين الليلة لاستخدام قدراتهم.'); }
  var w = byRole(G, R.WATCH), wt = w && A[w.id] && find(G, A[w.id][0]);
  if (w && w.alive && !jailed[w.id] && wt) { var vs = (visits[wt.id] || []).filter(function (n) { return n !== w.name; }); addInfo(G, w, vs.length ? 'زار ' + wt.name + ' الليلة: ' + vs.join('، ') + '.' : 'لم يزر أحد ' + wt.name + ' الليلة.'); }
  // 7. apply
  var names = [];
  deaths.forEach(function (p) { if (p.alive) { kill(G, p, 'night'); names.push(p.name); } });
  if (raven && raven.t[0] && deaths.indexOf(raven.p) >= 0) addInfo(G, raven.p, 'شخصية ' + raven.t[0].name + ': ' + shownRole(G, raven.t[0]) + '.');
  if (revived) { revived.alive = true; }
  toDay(G);
  G.log = [names.length ? 'صباح النهار ' + G.day + ': مات في الليل ' + names.join('، ') + '.' : 'صباح النهار ' + G.day + ': لم يمت أحد الليلة.'];
  if (revived) G.log.push('عاد ' + revived.name + ' إلى الحياة!');
  deaths.forEach(function (p) { if (p.role === R.LEAD) G.log.push('مات القائد: بقي ' + alive(G).filter(function (x) { return x.team === 'evil'; }).length + ' من الأشرار أحياء.'); });
  if (checkWin(G)) return;
  if (G.pendingHunter.length) G.afterHunter = null; // day continues; hunter chooses during day
}


/* ---------- bots: one move for a bot, or null ---------- */
function botMove(G, p, rng) {
  rng = rng || Math.random;
  function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
  var spec = actionSpec(G, p);
  if (spec && spec.kind === 'hunter') { var hp = spec.pool.filter(function (id) { return p.team === 'good' ? true : find(G, id).team === 'good'; }); return { kind: 'hunter', t: hp.length ? [pick(hp)] : [] }; }
  if (!p.alive) return null;
  if (G.phase === 'night' && !G.nightDone[p.id]) {
    var pool = spec.pool.slice();
    if (p.team === 'evil' && (p.role === R.BOSS || p.role === R.SIL)) { var g = pool.filter(function (id) { return find(G, id).team === 'good'; }); if (g.length) pool = g; }
    var t = [];
    if (spec.n && !(spec.optional && rng() < 0.4)) { pool = pool.slice(); while (t.length < spec.n && pool.length) t.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]); }
    return { kind: 'night', t: t };
  }
  if (G.phase === 'day' && G.today) {
    var o = openNom(G);
    if (o) { if (!G.silenced[p.id] && o.votes[p.id] === undefined) { var tg = find(G, o.target); var yes = p.team === 'evil' ? tg.team === 'good' && rng() < 0.7 : rng() < 0.5; return { kind: 'vote', yes: yes }; } return null; }
    if (!G.silenced[p.id] && !G.today.nominators[p.id] && rng() < 0.12) {
      var c = alive(G).filter(function (x) { return x.id !== p.id && !G.today.nominees[x.id] && (p.team === 'good' || x.team === 'good'); });
      if (c.length) return { kind: 'nominate', t: [pick(c).id] };
    }
    if (!G.today.end[p.id]) return { kind: 'endday' };
  }
  return null;
}

/* ---------- views ---------- */
function publicState(G) {
  var T = G.today, ov = G.phase === 'over';
  return {
    t: 'state', v: G.v, phase: G.phase, night: G.night, day: G.day, hostId: G.hostId,
    players: G.players.map(function (p) { return { id: p.id, name: p.name, alive: p.alive, seat: p.seat || 0, bot: p.bot || undefined, role: ov ? p.role : undefined, team: ov ? p.team : undefined }; }),
    log: G.log.slice(-8),
    noms: T && G.phase === 'day' ? T.noms.map(function (o) { return { by: o.by, target: o.target, open: o.open, yes: o.yes, votes: o.open ? Object.keys(o.votes).length : undefined, yesBy: o.open ? undefined : Object.keys(o.votes).filter(function (k) { return o.votes[k]; }) }; }) : [],
    voters: G.phase === 'day' ? voters(G).length : 0,
    need: Math.ceil(alive(G).length / 2),
    endCount: G.phase === 'day' ? alive(G).filter(function (p) { return T.end[p.id]; }).length : 0,
    aliveCount: alive(G).length,
    leader: G.phase === 'day' && leader(G) ? leader(G).target : null,
    hunter: G.pendingHunter[0] || null,
    winner: G.winner
  };
}
function privateView(G, p) {
  if (!p.role) return { id: p.id, lobby: true };
  var v = { role: p.role, seat: p.seat, team: p.team, alive: p.alive, info: (G.info[p.id] || []).slice(-15) };
  if (p.team === 'evil') v.evil = G.players.filter(function (x) { return x.team === 'evil'; }).map(function (x) { return { s: x.seat, n: x.name, r: x.role }; });
  if (p.role === R.BOSS) v.bluffs = G.bluffs;
  if (p.role === R.DEC) v.fake = G.fake;
  if (p.role === R.SPY) v.all = G.players.map(function (x) { return { s: x.seat, n: x.name, r: x.role }; });
  var spec = actionSpec(G, p); if (spec) v.spec = spec;
  if (G.phase === 'night') v.done = !!G.nightDone[p.id];
  if (G.phase === 'day' && G.today) {
    v.silenced = !!G.silenced[p.id];
    var o = openNom(G);
    v.voted = o ? o.votes[p.id] !== undefined : false;
    v.canNominate = p.alive && !v.silenced && !G.today.nominators[p.id];
    v.cop = p.role === R.COP && p.alive && !G.used[p.id].cop;
    v.judge = p.role === R.JUDGE && p.alive && !G.used[p.id].judge && !G.today.judged;
    v.ended = !!G.today.end[p.id];
  }
  return v;
}

root.CTEngine = { GOOD: GOOD, EVIL: EVIL, R: R, ABIL: ABIL, isEvilRole: isEvilRole, evilCount: evilCount,
  create: create, addPlayer: addPlayer, removePlayer: removePlayer, start: start, act: act, find: find,
  publicState: publicState, privateView: privateView, actionSpec: actionSpec, botMove: botMove };
})(typeof window !== 'undefined' ? window : globalThis);
