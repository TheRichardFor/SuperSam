const AC = new (window.AudioContext || window.webkitAudioContext)();

// ── SFX ──────────────────────────────────────────────────────────────────────
function playTone(freq, type, dur, vol = 0.3, start = AC.currentTime) {
  const osc = AC.createOscillator();
  const g   = AC.createGain();
  osc.connect(g); g.connect(AC.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.start(start); osc.stop(start + dur + 0.05);
}

function sfxJump()     { playTone(300,'square',0.05,0.2); playTone(500,'square',0.1,0.2,AC.currentTime+0.05); }
function sfxCoin()     { playTone(880,'sine',0.08,0.3); playTone(1100,'sine',0.12,0.3,AC.currentTime+0.08); }
function sfxHeart()    { [660,880,1100,880].forEach((f,i)=>playTone(f,'sine',0.1,0.35,AC.currentTime+i*0.08)); }
function sfxForkGet()  { [440,550,660].forEach((f,i)=>playTone(f,'square',0.1,0.25,AC.currentTime+i*0.09)); }
function sfxSwordGet() { [330,440,550,880].forEach((f,i)=>playTone(f,'sine',0.12,0.35,AC.currentTime+i*0.07)); }
function sfxForkThrow(){ playTone(320,'sawtooth',0.04,0.35); playTone(220,'sawtooth',0.07,0.3,AC.currentTime+0.03); }
function sfxStomp()    { playTone(150,'square',0.1,0.4); }
function sfxDie()      { [400,300,200,100].forEach((f,i)=>playTone(f,'sawtooth',0.1,0.3,AC.currentTime+i*0.07)); }

// Sad melody that plays on every life-lost event (~2 s total)
function sfxDieSad() {
  const t = AC.currentTime;
  // Crash
  [400,300,200,100].forEach((f,i) => playTone(f,'sawtooth',0.1,0.30, t+i*0.07));
  // Mournful descending phrase — C minor, starts 0.36 s after crash
  const seq = [[523,0.18],[466,0.18],[415,0.18],[392,0.22],[349,0.22],[311,0.28],[294,0.60]];
  seq.reduce((t2,[f,d]) => { playTone(f,'triangle',d*0.84,0.11,t2); return t2+d; }, t+0.36);
  // Low bass groan for weight
  playTone(147,'triangle',1.3,0.08, t+0.55);
}
function sfxLevel()    { [523,659,784,1047].forEach((f,i)=>playTone(f,'sine',0.15,0.4,AC.currentTime+i*0.13)); }
function sfxLevelComplete() {
  const seq = [[523,0.12],[659,0.12],[784,0.12],[1047,0.55],[880,0.14],[1047,0.9]];
  seq.reduce((t,[f,d])=>{ playTone(f,'sine',d*0.9,0.45,t); return t+d*0.82; }, AC.currentTime);
}
function sfxCountdown() { playTone(660,'square',0.06,0.25); }
function sfxGo()        { [784,988,1175].forEach((f,i)=>playTone(f,'sine',0.18,0.35,AC.currentTime+i*0.07)); }
function sfxBump()      { playTone(180,'square',0.07,0.3); }
function sfxClick()     { playTone(600,'sine',0.05,0.15); }
function sfxCrash()     {
  playTone(220,'sawtooth',0.06,0.5);
  playTone(160,'sawtooth',0.08,0.4,AC.currentTime+0.02);
  playTone(110,'square',0.1,0.3,AC.currentTime+0.05);
}

// ── Victory fanfare (~6 s) ────────────────────────────────────────────────────
function sfxVictory() {
  const t = AC.currentTime + 0.05;

  // ① Opening impact chord
  [[131,1.0,0.12],[262,0.9,0.09],[330,0.8,0.08],[392,0.8,0.08],[523,0.7,0.07]].forEach(([f,d,v])=>{
    playTone(f,'sine',d,v,t);
  });

  // ② Sparkling rising arpeggio (t+0.22 … t+1.1)
  [523,587,659,784,880,988,1047].forEach((f,i)=>{
    playTone(f,'triangle',0.26,0.13, t+0.22+i*0.13);
  });

  // ③ Victory melody — bright C major (t+1.1)
  const mel = [
    [784,0.30],[659,0.25],[523,0.20],[587,0.20],[659,0.30],[784,0.30],
    [880,0.25],[784,0.30],[698,0.20],[659,0.20],[784,0.25],[659,0.30],[523,0.70],
  ];
  mel.reduce((t2,[f,d])=>{ playTone(f,'sine',d*0.86,0.13,t2); return t2+d; }, t+1.1);

  // ③b Parallel-thirds harmony (t+1.1)
  const harm = [
    [659,0.30],[523,0.25],[440,0.20],[494,0.20],[523,0.30],[659,0.30],
    [698,0.25],[659,0.30],[587,0.20],[523,0.20],[659,0.25],[523,0.30],[440,0.70],
  ];
  harm.reduce((t2,[f,d])=>{ playTone(f,'sine',d*0.84,0.065,t2); return t2+d; }, t+1.1);

  // ④ Triumphant final chord — C major across 4 octaves (t+4.65)
  [[131,1.4,0.10],[262,1.3,0.09],[330,1.3,0.08],[392,1.2,0.08],
   [523,1.2,0.07],[659,1.0,0.06],[784,0.9,0.05]].forEach(([f,d,v])=>{
    playTone(f,'sine',d,v,t+4.65);
  });

  // ⑤ Sparkle top notes (t+5.0)
  [1047,1319,1047,1568,1047].forEach((f,i)=>{
    playTone(f,'sine',0.35,0.07, t+5.0+i*0.18);
  });
}

// ── BGM engine ───────────────────────────────────────────────────────────────
// Each voice: { notes:[[freq,dur],...], wave, vol, vib }
// All voices in a track share the same total duration (they loop in sync).
// vib = vibrato depth in cents (0 = off).
// ADSR: fast attack, slight decay, sustained body, soft release on every note.

let bgmNodes = [];
let _bgmBus  = null;

function _getBgmBus() {
  if (!_bgmBus) {
    _bgmBus = AC.createGain();
    _bgmBus.gain.value = 1;
    _bgmBus.connect(AC.destination);
  }
  return _bgmBus;
}

function stopBGM() {
  bgmNodes.forEach(clearTimeout);
  bgmNodes = [];
  if (_bgmBus) {
    _bgmBus.gain.setValueAtTime(0, AC.currentTime); // cut all playing BGM notes instantly
    _bgmBus.disconnect();
    _bgmBus = null;
  }
}

function _note(freq, dur, vol, wave, t, vib) {
  const osc = AC.createOscillator();
  const g   = AC.createGain();
  osc.connect(g); g.connect(_getBgmBus());
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, t);

  if (vib > 0) {
    const lfo  = AC.createOscillator();
    const lfoG = AC.createGain();
    lfo.frequency.value = 5.5;
    lfoG.gain.value = vib;
    lfo.connect(lfoG); lfoG.connect(osc.detune);
    lfo.start(t + 0.08); lfo.stop(t + dur + 0.02);
  }

  const att = 0.008;
  const rel = Math.min(dur * 0.28, 0.12);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol,        t + att);
  g.gain.setValueAtTime(vol * 0.72,          t + att + 0.06);
  g.gain.setValueAtTime(vol * 0.65,          t + dur - rel);
  g.gain.linearRampToValueAtTime(0.0001,     t + dur);
  osc.start(t); osc.stop(t + dur + 0.04);
}

function loopBGM(voices) {
  stopBGM();
  const total = voices[0].notes.reduce((s, [, d]) => s + d, 0);

  function play(delay) {
    const t0 = AC.currentTime + delay;
    voices.forEach(({ notes, wave, vol, vib = 0 }) => {
      let t = t0;
      notes.forEach(([freq, dur]) => {
        if (freq > 0) _note(freq, dur, vol, wave, t, vib);
        t += dur;
      });
    });
    // Re-arm 80 ms before the current loop ends → seamless looping
    const msLeft = Math.max(50, (t0 + total - AC.currentTime - 0.08) * 1000);
    bgmNodes.push(setTimeout(() => play(0.08), msLeft));
  }
  play(0);
}

// ── Menu BGM — Heroic march, C major, 8 s loop ───────────────────────────────
// Q = 0.5 s (120 BPM), 4 bars of 4/4
const MENU_BGM = [
  { wave: 'triangle', vol: 0.09, vib: 18, notes: [
    // Melody — ascending hero fanfare then descending resolution
    [392,0.5],[440,0.5],[494,0.5],[523,0.5],   // G4 A4 B4 C5
    [587,0.5],[523,0.5],[494,0.5],[392,0.5],   // D5 C5 B4 G4
    [440,0.5],[440,0.5],[349,0.5],[392,0.5],   // A4 A4 F4 G4
    [523,1.5],[0,0.5],                          // C5(H.) rest
  ]},
  { wave: 'triangle', vol: 0.055, vib: 0, notes: [
    // Parallel sixths below melody
    [262,0.5],[294,0.5],[330,0.5],[349,0.5],
    [392,0.5],[349,0.5],[330,0.5],[262,0.5],
    [294,0.5],[294,0.5],[220,0.5],[262,0.5],
    [349,1.5],[0,0.5],
  ]},
  { wave: 'triangle', vol: 0.065, vib: 0, notes: [
    // Bass: C3 — G3 — F3 — C3
    [131,2.0],[196,2.0],[175,2.0],[131,2.0],
  ]},
];

// ── Level BGMs — each an 8 s seamlessly-looping multi-voice track ────────────
const LEVEL_BGMS = [

  // 0 — Green Meadow · C major · cheerful running melody
  [{ wave:'triangle', vol:0.09, vib:16, notes:[
    [523,0.25],[587,0.25],[659,0.5],[784,0.5],[659,0.25],[587,0.25], // C5 D5 E5 G5 E5 D5
    [698,0.5],[659,0.5],[587,0.5],[523,0.5],                         // F5 E5 D5 C5
    [784,0.25],[880,0.25],[784,0.5],[659,0.5],[523,0.5],             // G5 A5 G5 E5 C5
    [587,0.5],[659,0.5],[523,1.0],                                   // D5 E5 C5(H)
  ]},{ wave:'triangle', vol:0.06, vib:0, notes:[
    // Bass: C3 G3 · A3 F3 · C3 G3 · F3 G3
    [131,1.0],[196,1.0],[220,1.0],[175,1.0],
    [131,1.0],[196,1.0],[175,1.0],[196,1.0],
  ]}],

  // 1 — Desert · A harmonic minor · exotic, slower feel
  [{ wave:'triangle', vol:0.09, vib:14, notes:[
    [440,0.5],[415,0.5],[440,0.5],[523,0.5],  // A4 G#4 A4 C5
    [330,0.5],[349,0.5],[440,0.5],[330,0.5],  // E4 F4 A4 E4
    [294,0.5],[330,0.5],[415,1.0],            // D4 E4 G#4(H)
    [440,1.5],[0,0.5],                         // A4(H.) rest
  ]},{ wave:'triangle', vol:0.06, vib:0, notes:[
    [220,2.0],[165,2.0],[196,2.0],[220,2.0],  // A3 E3 G3 A3
  ]}],

  // 2 — Night Forest · A natural minor · mysterious, spacious
  [{ wave:'triangle', vol:0.08, vib:12, notes:[
    [440,0.75],[0,0.25],[392,0.5],[440,0.5],  // A4(D.Q) rest G4 A4
    [523,0.5],[494,0.5],[440,1.0],            // C5 B4 A4(H)
    [392,0.5],[349,0.5],[330,0.5],[294,0.5],  // G4 F4 E4 D4
    [330,1.0],[0,1.0],                         // E4(H) rest(H)
  ]},{ wave:'triangle', vol:0.055, vib:0, notes:[
    [220,2.0],[196,2.0],[165,2.0],[220,2.0],  // A3 G3 E3 A3
  ]}],

  // 3 — Cave · D minor · tense, dripping sparse
  [{ wave:'triangle', vol:0.08, vib:0, notes:[
    [294,0.5],[0,0.25],[294,0.25],[330,0.5],[0,0.5],   // D4 · D4 E4 ·
    [349,0.5],[0,0.25],[349,0.25],[392,1.0],            // F4 · F4 G4(H)
    [440,0.5],[0,0.5],[466,0.5],[0,0.5],                // A4 · Bb4 ·
    [392,0.5],[349,0.5],[294,1.0],                       // G4 F4 D4(H)
  ]},{ wave:'triangle', vol:0.06, vib:0, notes:[
    [147,2.0],[175,2.0],[196,2.0],[147,2.0],            // D3 F3 G3 D3
  ]}],

  // 4 — Snow · E major · bell-like, high, crisp
  [{ wave:'sine', vol:0.10, vib:10, notes:[
    [659,0.5],[740,0.5],[831,0.5],[880,0.5],            // E5 F#5 G#5 A5
    [988,0.5],[880,0.5],[831,0.5],[659,0.5],            // B5 A5 G#5 E5
    [831,0.25],[659,0.25],[831,0.5],[988,1.0],          // G#5 E5 G#5 B5(H)
    [659,1.5],[0,0.5],                                   // E5(H.) rest
  ]},{ wave:'triangle', vol:0.055, vib:0, notes:[
    [165,2.0],[196,2.0],[220,2.0],[165,2.0],            // E3 G3 A3 E3
  ]}],

  // 5 — Lava Castle · D minor march · driving, aggressive
  [{ wave:'square', vol:0.07, vib:0, notes:[
    [294,0.25],[294,0.25],[294,0.5],[440,0.5],[494,0.5], // D4 D4 D4 A4 B4
    [440,0.5],[392,0.5],[294,0.5],[0,0.5],               // A4 G4 D4 rest
    [330,0.25],[330,0.25],[330,0.5],[392,0.5],[440,0.5], // E4 E4 E4 G4 A4
    [392,0.5],[349,0.5],[294,0.5],[0,0.5],               // G4 F4 D4 rest
  ]},{ wave:'triangle', vol:0.07, vib:0, notes:[
    [147,0.5],[196,0.5],[147,0.5],[196,0.5],[220,0.5],[196,0.5],[147,0.5],[0,0.5],
    [110,0.5],[165,0.5],[110,0.5],[165,0.5],[175,0.5],[165,0.5],[110,0.5],[0,0.5],
  ]}],

  // 6 — Dungeon · A minor · pulsing low, eerie
  [{ wave:'triangle', vol:0.08, vib:0, notes:[
    [220,0.5],[0,0.25],[220,0.25],[247,0.5],[220,0.5],  // A3 · A3 B3 A3
    [196,0.5],[0,0.5],[175,0.5],[196,0.5],              // G3 · F3 G3
    [220,0.5],[0,0.25],[220,0.25],[262,0.5],[247,0.5],  // A3 · A3 C4 B3
    [220,1.0],[0,1.0],                                   // A3(H) rest(H)
  ]},{ wave:'triangle', vol:0.055, vib:0, notes:[
    [110,1.0],[131,1.0],[110,1.0],[131,1.0],
    [98,1.0],[110,1.0],[98,1.0],[110,1.0],
  ]}],

  // 7 — Volcano · E minor · relentless, intense
  [{ wave:'square', vol:0.07, vib:0, notes:[
    [330,0.25],[330,0.25],[392,0.5],[330,0.5],[294,0.25],[330,0.25], // Em motif
    [330,0.5],[294,0.5],[262,0.5],[247,0.5],                          // descend
    [262,0.25],[262,0.25],[330,0.5],[392,0.5],[294,0.5],              // climb
    [330,1.0],[0,1.0],                                                 // hold + rest
  ]},{ wave:'triangle', vol:0.07, vib:0, notes:[
    [82,0.5],[98,0.5],[82,0.5],[110,0.5],[82,0.5],[98,0.5],[82,0.5],[98,0.5],
    [98,0.5],[110,0.5],[98,0.5],[82,0.5],[98,0.5],[110,0.5],[98,0.5],[82,0.5],
  ]}],

  // 8 — Sky Fortress · C major · bright triumphant fanfare
  [{ wave:'triangle', vol:0.09, vib:20, notes:[
    [784,0.25],[880,0.25],[988,0.5],[1047,0.5],[880,0.25],[784,0.25], // G5 A5 B5 C6 A5 G5
    [988,0.5],[880,0.5],[784,0.5],[659,0.5],                           // B5 A5 G5 E5
    [784,0.25],[880,0.25],[784,0.5],[659,1.0],                         // G5 A5 G5 E5(H)
    [523,1.5],[0,0.5],                                                  // C5(H.) rest
  ]},{ wave:'triangle', vol:0.06, vib:0, notes:[
    [196,2.0],[220,2.0],[196,2.0],[131,2.0],  // G3 A3 G3 C3
  ]}],

  // 9 — Ganon's Castle · B minor · oppressive, dread
  [{ wave:'triangle', vol:0.08, vib:0, notes:[
    [247,0.5],[0,0.25],[247,0.25],[294,0.5],[0,0.5],  // B3 · B3 D4 ·
    [220,0.5],[196,0.5],[175,0.5],[0,0.5],             // A3 G3 F#3 rest
    [196,0.5],[0,0.25],[196,0.25],[247,0.5],[220,0.5], // G3 · G3 B3 A3
    [175,1.5],[0,0.5],                                  // F#3(H.) rest
  ]},{ wave:'triangle', vol:0.065, vib:0, notes:[
    [123,2.0],[110,2.0],[98,2.0],[123,2.0],            // B2 A2 G2 B2
  ]}],
];

// ── Public start functions ────────────────────────────────────────────────────
function startMenuBGM() {
  if (typeof musicEnabled !== 'undefined' && !musicEnabled) return;
  loopBGM(MENU_BGM);
}
function startBGM(lvl) {
  if (typeof musicEnabled !== 'undefined' && !musicEnabled) return;
  loopBGM(LEVEL_BGMS[lvl] || LEVEL_BGMS[0]);
}

// ── Autoplay on first user gesture ───────────────────────────────────────────
let menuMusicArmed = false;
function armMenuMusic() {
  if (menuMusicArmed) return;
  menuMusicArmed = true;
  if (AC.state === 'suspended') AC.resume().then(startMenuBGM);
  else startMenuBGM();
}
document.addEventListener('click',   armMenuMusic, { once: true });
document.addEventListener('keydown', armMenuMusic, { once: true });

// Click sound for every .btn press
document.addEventListener('click', e => { if (e.target.closest('.btn')) sfxClick(); });
