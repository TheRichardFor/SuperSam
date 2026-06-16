// draw.js — all canvas rendering.

// ── Utility ───────────────────────────────────────────────────────────────────
function shadeColor(hex, amt) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, Math.max(0, (n >> 16)       + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (n & 0xff)       + amt));
  return '#' + ((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
}

// Radial glow disc
function bgGlow(cx, cy, r, c1, c2) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
}

// Horizontal atmospheric haze band
function bgBand(y, h, col) {
  const g = ctx.createLinearGradient(0, y - h, 0, y + h * 0.4);
  g.addColorStop(0, 'transparent'); g.addColorStop(0.5, col); g.addColorStop(1, 'transparent');
  ctx.fillStyle = g; ctx.fillRect(0, y - h, W, h * 1.4);
}

// Smooth sine-wave hill (tiles seamlessly with camera scroll)
function bgWave(parallax, y0, amp, freq, phase, c1, c2) {
  const g = ctx.createLinearGradient(0, y0 - amp * 1.9, 0, H);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g;
  const s = camera.x * parallax + (phase || 0);
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W + 1; x += 3) {
    ctx.lineTo(x,
      y0 - Math.sin((x + s) * freq)          * amp
         - Math.sin((x + s) * freq * 1.618 + 1.1) * amp * 0.38
         - Math.sin((x + s) * freq * 0.382)   * amp * 0.55);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
}

// Silhouette pine-tree row
function bgPines(parallax, y0, treeH, spacing, col, seed) {
  const off = -((camera.x * parallax + (seed || 0)) % spacing);
  ctx.fillStyle = col;
  for (let i = -1; i < W / spacing + 2; i++) {
    const tx = off + i * spacing;
    const tw = spacing * 0.55;
    const cx2 = tx + tw / 2;
    if (cx2 + tw < -tw || cx2 - tw > W + tw) continue;
    ctx.beginPath();
    ctx.moveTo(cx2, y0 - treeH); ctx.lineTo(cx2 - tw*.5, y0 - treeH*.55); ctx.lineTo(cx2 + tw*.5, y0 - treeH*.55); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx2, y0 - treeH*.65); ctx.lineTo(cx2 - tw*.45, y0 - treeH*.18); ctx.lineTo(cx2 + tw*.45, y0 - treeH*.18); ctx.closePath(); ctx.fill();
    ctx.fillRect(cx2 - tw*.07, y0 - treeH*.18, tw*.14, treeH*.18);
  }
}

// ── Volumetric cloud ──────────────────────────────────────────────────────────
function drawCloud(cx, cy, cw) {
  // Drop shadow
  ctx.fillStyle = 'rgba(100,120,165,0.11)';
  ctx.beginPath(); ctx.ellipse(cx + 6, cy + cw * 0.25, cw * 0.44, cw * 0.11, 0, 0, Math.PI * 2); ctx.fill();
  // Puff circles with per-puff radial gradient
  const puffs = [
    [0,0,cw*.44], [-cw*.30,cw*.10,cw*.30], [cw*.30,cw*.10,cw*.28],
    [-cw*.14,-cw*.18,cw*.22], [cw*.20,-cw*.14,cw*.18],
  ];
  for (const [dx, dy, r] of puffs) {
    const g = ctx.createRadialGradient(cx+dx-r*.25,cy+dy-r*.32,r*.05, cx+dx,cy+dy,r);
    g.addColorStop(0,   'rgba(255,255,255,0.98)');
    g.addColorStop(0.55,'rgba(228,238,255,0.90)');
    g.addColorStop(1,   'rgba(195,215,238,0.0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx+dx, cy+dy, r, 0, Math.PI*2); ctx.fill();
  }
}

function drawBackground(lv) {
  // ── Sky fill ─────────────────────────────────────────────────────────────────
  let sk;
  if (lv === 0) {
    sk = ctx.createLinearGradient(0,0,0,H);
    sk.addColorStop(0,'#3a82e8'); sk.addColorStop(0.55,'#82c4f8'); sk.addColorStop(1,'#c4e8ff');
  } else if (lv === 1) {
    sk = ctx.createLinearGradient(0,0,0,H);
    sk.addColorStop(0,'#1a0840'); sk.addColorStop(0.3,'#8c2010'); sk.addColorStop(0.7,'#f07030'); sk.addColorStop(1,'#ffa848');
  } else if (lv === 2) {
    sk = ctx.createLinearGradient(0,0,0,H);
    sk.addColorStop(0,'#06000e'); sk.addColorStop(0.5,'#0e0024'); sk.addColorStop(1,'#180034');
  } else if (lv === 3) {
    sk = ctx.createLinearGradient(0,0,0,H);
    sk.addColorStop(0,'#050407'); sk.addColorStop(0.4,'#0c0a10'); sk.addColorStop(1,'#080610');
  } else if (lv === 4) {
    sk = ctx.createLinearGradient(0,0,0,H);
    sk.addColorStop(0,'#80b8e0'); sk.addColorStop(0.45,'#b8d8f4'); sk.addColorStop(1,'#dceefc');
  } else if (lv === 5) {
    sk = ctx.createLinearGradient(0,0,0,H);
    sk.addColorStop(0,'#060000'); sk.addColorStop(0.4,'#1c0400'); sk.addColorStop(0.75,'#380800'); sk.addColorStop(1,'#5a1000');
  } else if (lv === 6) {
    sk = ctx.createLinearGradient(0,0,0,H);
    sk.addColorStop(0,'#030006'); sk.addColorStop(0.5,'#060010'); sk.addColorStop(1,'#04000c');
  } else if (lv === 7) {
    sk = ctx.createLinearGradient(0,0,0,H);
    sk.addColorStop(0,'#0a0000'); sk.addColorStop(0.3,'#3a0600'); sk.addColorStop(0.7,'#cc1400'); sk.addColorStop(1,'#ff4400');
  } else if (lv === 8) {
    sk = ctx.createLinearGradient(0,0,0,H);
    sk.addColorStop(0,'#1040c0'); sk.addColorStop(0.4,'#3570e0'); sk.addColorStop(1,'#6aabf8');
  } else {
    sk = ctx.createLinearGradient(0,0,0,H);
    sk.addColorStop(0,'#030006'); sk.addColorStop(0.4,'#100015'); sk.addColorStop(1,'#1a001e');
  }
  ctx.fillStyle = sk; ctx.fillRect(0,0,W,H);

  // ── Per-level scenery ─────────────────────────────────────────────────────────
  if (lv === 0) {
    // Green Meadow — rolling hills, bright sky
    bgGlow(718,54,90,'rgba(255,248,160,0.30)','rgba(255,240,80,0)');
    bgGlow(718,54,42,'#fff9a0','#ffe020');
    ctx.fillStyle='#ffee44'; ctx.beginPath(); ctx.arc(718,54,36,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,200,0.55)'; ctx.beginPath(); ctx.ellipse(706,42,12,7,-0.5,0,Math.PI*2); ctx.fill();
    bgWave(0.06,358,78,0.0038,0,  '#8ab8ce','#b6d6e8');
    bgWave(0.13,386,55,0.0055,40, '#568848','#74a464');
    bgWave(0.25,408,38,0.0080,80, '#3c6836','#548050');
    for (const c of clouds) drawCloud(c.x-camera.x, c.y, c.w);
    bgBand(H-36,26,'rgba(70,150,55,0.16)');

  } else if (lv === 1) {
    // Desert — sunset dunes
    bgGlow(710,310,130,'rgba(255,140,20,0.38)','rgba(255,80,0,0)');
    bgGlow(710,310,58,'#ffcc40','#ff6810');
    ctx.fillStyle='#ffaa20'; ctx.beginPath(); ctx.arc(710,310,48,0,Math.PI*2); ctx.fill();
    bgWave(0.07,380,44,0.0030,0,  '#8c5a18','#b07828');
    bgWave(0.18,406,34,0.0045,60, '#6e3a08','#8c5010');
    bgBand(H-28,34,'rgba(180,80,20,0.20)');

  } else if (lv === 2) {
    // Night Forest — stars, moon, pines
    ctx.fillStyle='#fff';
    for (let i=0;i<90;i++){
      const sx=(i*97+31)%W, sy=(i*53+17)%(H*0.54);
      const blink=0.35+Math.sin(frameCount*0.07+i*0.8)*0.42;
      ctx.globalAlpha=Math.max(0,blink);
      ctx.fillRect(sx,sy,i%6===0?2:1,i%6===0?2:1);
    }
    ctx.globalAlpha=1;
    bgGlow(680,68,82,'rgba(200,210,255,0.18)','rgba(180,190,240,0)');
    ctx.fillStyle='#d6dcf8'; ctx.beginPath(); ctx.arc(680,68,35,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#06000e'; ctx.beginPath(); ctx.arc(664,58,28,0,Math.PI*2); ctx.fill();
    bgPines(0.08,390,92,48,'#0a1207',0);
    bgPines(0.20,416,70,36,'#060c04',200);
    bgBand(H-18,28,'rgba(28,56,18,0.20)');

  } else if (lv === 3) {
    // Cave — stalactites, mineral veins
    const mw = player ? player.mapWidth : 3600;
    const veins=[60,0.28, 190,0.55, 310,0.35, 460,0.65, 580,0.40, 700,0.70];
    for (let i=0;i<veins.length;i+=2) {
      const vx=veins[i]-(camera.x*0.08)%W, vy=H*veins[i+1];
      bgGlow(vx,vy,26,'rgba(70,35,190,0.16)','rgba(35,15,150,0)');
    }
    for (let i=0;i<34;i++){
      const sx=((i*113+37)%mw)-camera.x;
      if (sx<-20||sx>W+20) continue;
      const sh=18+(i*41)%48;
      const sg=ctx.createLinearGradient(sx,0,sx,sh);
      sg.addColorStop(0,'#2c1e28'); sg.addColorStop(1,'#160e1a');
      ctx.fillStyle=sg;
      ctx.beginPath(); ctx.moveTo(sx-9,0); ctx.lineTo(sx+9,0); ctx.lineTo(sx,sh); ctx.closePath(); ctx.fill();
      const drip=(frameCount*0.015+i*0.7)%1;
      ctx.fillStyle=`rgba(90,55,190,${0.5*drip})`;
      ctx.beginPath(); ctx.arc(sx,sh+drip*28,3-drip*2,0,Math.PI*2); ctx.fill();
    }
    bgBand(H-8,55,'rgba(35,15,110,0.26)');

  } else if (lv === 4) {
    // Snow — icy peaks, snowflakes
    bgGlow(718,54,78,'rgba(200,220,255,0.28)','rgba(180,210,240,0)');
    ctx.fillStyle='#e8f0ff'; ctx.beginPath(); ctx.arc(718,54,33,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(706,42,10,6,-0.4,0,Math.PI*2); ctx.fill();
    bgWave(0.06,346,102,0.0032,0, '#d4eeff','#eaf5ff');
    bgWave(0.14,376,65,0.0048,30,'#b2d2f0','#cce2f6');
    for (let i=0;i<72;i++){
      const sx=((i*73+frameCount*0.38)%(W+44))-22;
      const sy=((i*47+frameCount*(0.5+(i%3)*0.22))%(H+20));
      const sr=1+(i%3)*0.8;
      ctx.fillStyle=`rgba(255,255,255,${0.5+(i%3)*0.18})`;
      ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2); ctx.fill();
    }
    for (const c of clouds) drawCloud(c.x-camera.x, c.y, c.w);
    bgBand(H-28,28,'rgba(195,228,255,0.22)');

  } else if (lv === 5) {
    // Lava Castle — castle silhouettes, ember rain
    ctx.fillStyle='#0c0002';
    const coff=-(camera.x*0.06)%(W*1.4);
    for (let rep=-1;rep<=2;rep++){
      const bx=coff+rep*W*1.4;
      [[bx,160],[bx+180,130],[bx+340,150],[bx+480,110]].forEach(([tx,th])=>{
        ctx.fillStyle='#0c0002';
        ctx.fillRect(tx,H-th,60,th);
        for (let m=0;m<4;m++) ctx.fillRect(tx+m*16,H-th-18,12,18);
        ctx.fillStyle='rgba(255,80,0,0.14)';
        ctx.fillRect(tx+24,H-th*0.6,13,17);
      });
    }
    const lavag=ctx.createLinearGradient(0,H-100,0,H);
    lavag.addColorStop(0,'rgba(255,60,0,0)'); lavag.addColorStop(1,'rgba(255,100,0,0.52)');
    ctx.fillStyle=lavag; ctx.fillRect(0,H-100,W,100);
    for (let i=0;i<20;i++){
      const ex=((i*89+frameCount*0.8)%W);
      const ey=H-80-((frameCount*(0.6+i*0.1)+i*30)%120);
      const ea=Math.max(0,1-(H-80-ey)/120);
      ctx.fillStyle=`rgba(255,${140+i*5},0,${ea*0.65})`;
      ctx.beginPath(); ctx.arc(ex,ey,2.5,0,Math.PI*2); ctx.fill();
    }
    for (const c of clouds) drawCloud(c.x-camera.x, c.y, c.w);

  } else if (lv === 6) {
    // Dungeon — stone arches, torch glows
    const archOff=-(camera.x*0.07)%280;
    ctx.fillStyle='#0a0014';
    for (let i=-1;i<5;i++){
      const ax=archOff+i*280;
      ctx.beginPath();
      ctx.moveTo(ax,H); ctx.lineTo(ax,H-120);
      ctx.arc(ax+60,H-120,60,Math.PI,0);
      ctx.lineTo(ax+120,H); ctx.closePath(); ctx.fill();
      ctx.fillRect(ax-8,H-128,24,14);
      ctx.fillRect(ax+108,H-128,24,14);
    }
    const torchOff=-(camera.x*0.07)%320;
    for (let i=-1;i<4;i++){
      const tx=torchOff+i*320+140;
      bgGlow(tx,H-115,54,'rgba(255,138,18,0.14)','rgba(255,78,0,0)');
    }
    bgBand(H-18,40,'rgba(56,0,112,0.18)');

  } else if (lv === 7) {
    // Volcano — volcanic peaks, lava rivers, embers
    bgWave(0.07,372,100,0.0030,0, '#0e0200','#1c0500');
    bgGlow(718,68,112,'rgba(255,80,0,0.38)','rgba(255,40,0,0)');
    bgGlow(718,68,50,'#ff9020','#ff3000');
    ctx.fillStyle='#ff5500'; ctx.beginPath(); ctx.arc(718,68,40,0,Math.PI*2); ctx.fill();
    const lhg=ctx.createLinearGradient(0,H-120,0,H);
    lhg.addColorStop(0,'rgba(255,80,0,0)'); lhg.addColorStop(1,'rgba(255,120,0,0.68)');
    ctx.fillStyle=lhg; ctx.fillRect(0,H-120,W,120);
    for (let i=0;i<26;i++){
      const ex=((i*79+40)%W);
      const ey=H-((frameCount*(1.0+i*0.12)+i*20)%(H+30));
      const ea=Math.max(0,1-(H-ey)/H);
      ctx.fillStyle=`rgba(255,${100+(i%4)*40},0,${ea*0.62})`;
      ctx.beginPath(); ctx.arc(ex,ey,2+(i%3),0,Math.PI*2); ctx.fill();
    }

  } else if (lv === 8) {
    // Sky Fortress — high altitude, cloud floor below, floating islands
    bgGlow(700,28,120,'rgba(255,252,200,0.42)','rgba(255,240,100,0)');
    ctx.fillStyle='#fff8e0'; ctx.beginPath(); ctx.arc(700,28,38,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,200,0.6)'; ctx.beginPath(); ctx.ellipse(688,16,13,8,-0.4,0,Math.PI*2); ctx.fill();
    const cBase=H*0.48;
    for (let i=-1;i<7;i++){
      const cshift=-(camera.x*0.28)%(W*1.1);
      const cx2=cshift+i*W*1.1/6+(i*67%80);
      const cg2=ctx.createLinearGradient(0,cBase-26,0,cBase+54);
      cg2.addColorStop(0,'rgba(255,255,255,0.88)');
      cg2.addColorStop(0.6,'rgba(218,234,255,0.50)');
      cg2.addColorStop(1,'rgba(180,210,240,0)');
      ctx.fillStyle=cg2;
      ctx.beginPath(); ctx.ellipse(cx2,cBase,100+(i%3)*42,28,0,0,Math.PI*2); ctx.fill();
    }
    const ioff=-(camera.x*0.15)%600;
    for (let i=-1;i<3;i++){
      const ix=ioff+i*600+(i*180%200), iy=H*0.66+(i*28%50);
      ctx.fillStyle='#5a4030'; ctx.beginPath(); ctx.ellipse(ix,iy,70,20,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#724e3c'; ctx.beginPath(); ctx.ellipse(ix,iy-12,65,11,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#4e7a40'; ctx.beginPath(); ctx.ellipse(ix,iy-20,64,8,0,0,Math.PI*2); ctx.fill();
    }

  } else {
    // Ganon's Castle (lv 9) — evil spires, glowing eye, lightning
    ctx.fillStyle='#0c0010';
    const sOff=-(camera.x*0.05)%560;
    for (let rep=-1;rep<=2;rep++){
      const bx=sOff+rep*560;
      [[bx+30,140],[bx+130,180],[bx+240,120],[bx+330,200],[bx+460,150]].forEach(([tx,th])=>{
        ctx.fillStyle='#0c0010';
        ctx.beginPath();
        ctx.moveTo(tx,H); ctx.lineTo(tx,H-th); ctx.lineTo(tx+22,H-th-30); ctx.lineTo(tx+44,H-th); ctx.lineTo(tx+44,H);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle='rgba(180,0,255,0.22)';
        ctx.beginPath(); ctx.arc(tx+22,H-th-10,7,0,Math.PI*2); ctx.fill();
      });
    }
    bgGlow(715,60,76,'rgba(200,0,50,0.26)','rgba(180,0,40,0)');
    ctx.fillStyle='#cc0030'; ctx.beginPath(); ctx.ellipse(715,60,44,34,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff0040'; ctx.beginPath(); ctx.ellipse(715,60,28,20,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffaa00'; ctx.beginPath(); ctx.ellipse(715,60,10,16,0,0,Math.PI*2); ctx.fill();
    if (frameCount%220<3||(frameCount%220>5&&frameCount%220<7)){
      ctx.fillStyle='rgba(255,200,255,0.13)'; ctx.fillRect(0,0,W,H);
    }
    bgBand(H-14,50,'rgba(78,0,138,0.20)');
  }
}

function drawTile(t, lv) {
  const x = t.x - camera.x, y = t.y;
  if (x + t.w < -10 || x > W + 10) return;
  const w = t.w, h = t.h;

  if (t.type === 'ground') {
    // Body — vertical gradient
    const bg = ctx.createLinearGradient(x, y+11, x, y+h);
    bg.addColorStop(0,   GROUND_FILL[lv]);
    bg.addColorStop(0.42, shadeColor(GROUND_FILL[lv],-16));
    bg.addColorStop(1,   shadeColor(GROUND_FILL[lv],-38));
    ctx.fillStyle=bg; ctx.fillRect(x, y+11, w, h-11);

    // Top surface — 2-stop gradient
    const tg = ctx.createLinearGradient(x, y, x, y+14);
    tg.addColorStop(0, GROUND_TOP[lv]);
    tg.addColorStop(1, GROUND_TUFT[lv]);
    ctx.fillStyle=tg; ctx.fillRect(x, y, w, 14);

    // Specular highlight at very top
    ctx.fillStyle='rgba(255,255,255,0.42)'; ctx.fillRect(x, y,   w, 3);
    ctx.fillStyle='rgba(255,255,255,0.14)'; ctx.fillRect(x, y+3, w, 3);

    // Shadow seam between surface and body
    ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(x, y+14, w, 3);

    // Left highlight / right shadow edges
    ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(x,   y+16, 2, h-16);
    ctx.fillStyle='rgba(0,0,0,0.16)';       ctx.fillRect(x+w-2, y+16, 2, h-16);

    // Stratification lines in body
    ctx.fillStyle='rgba(0,0,0,0.06)';
    ctx.fillRect(x, y+Math.floor(h*0.44), w, 1);
    ctx.fillRect(x, y+Math.floor(h*0.72), w, 1);

    // ── Surface detail (level-specific) ──────────────────────────────────────
    ctx.fillStyle = GROUND_TUFT[lv];
    if (lv===3||lv===6) {
      // Cave / Dungeon — stone pebbles
      ctx.beginPath(); ctx.ellipse(x+8, y+5, 5,3.5,0.2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x+28,y+4, 4,2.5,-0.2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.14)';
      ctx.beginPath(); ctx.ellipse(x+7, y+3.5,2.5,1.5,0.2,0,Math.PI*2); ctx.fill();
    } else if (lv===4) {
      // Snow — puffy mounds
      ctx.fillStyle='#eaf6ff';
      ctx.beginPath(); ctx.ellipse(x+9, y+2,9,5.5,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x+29,y+2,7,4.5,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.70)';
      ctx.beginPath(); ctx.ellipse(x+7, y,5,3,0,0,Math.PI*2); ctx.fill();
    } else if (lv===5||lv===7) {
      // Castle / Volcano — jagged rock spikes
      for (let i=0;i<3;i++){
        const tx2=x+6+i*13;
        ctx.beginPath(); ctx.moveTo(tx2,y); ctx.lineTo(tx2+4,y); ctx.lineTo(tx2+2,y-7); ctx.closePath(); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.22)';
        ctx.beginPath(); ctx.moveTo(tx2,y); ctx.lineTo(tx2+2,y-7); ctx.lineTo(tx2+1.5,y-4); ctx.closePath(); ctx.fill();
        ctx.fillStyle=GROUND_TUFT[lv];
      }
    } else if (lv===8||lv===9) {
      // Sky / Ganon — crystalline edge
      ctx.fillStyle='rgba(255,255,255,0.28)'; ctx.fillRect(x+3,y+2,w-6,2);
      ctx.fillStyle=GROUND_TUFT[lv];
      ctx.beginPath(); ctx.moveTo(x+8,y); ctx.lineTo(x+12,y); ctx.lineTo(x+10,y-7); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x+24,y); ctx.lineTo(x+28,y); ctx.lineTo(x+26,y-5); ctx.closePath(); ctx.fill();
    } else {
      // Grass blades
      for (let i=0;i<3;i++){
        const bh=5+((t.x+i*7)%4);
        const bx=x+4+i*13;
        ctx.fillRect(bx,   y-bh+3, 3,bh);
        ctx.fillRect(bx+3, y-bh+5, 2,bh-2);
        ctx.fillStyle='rgba(255,255,255,0.28)';
        ctx.fillRect(bx,y-bh+3,1,bh);
        ctx.fillStyle=GROUND_TUFT[lv];
      }
    }

  } else if (t.type === 'brick') {
    // ── Brick block ──────────────────────────────────────────────────────────
    const bg2 = ctx.createLinearGradient(x, y, x, y+h);
    bg2.addColorStop(0, shadeColor(BRICK_COL[lv],22));
    bg2.addColorStop(1, shadeColor(BRICK_COL[lv],-28));
    ctx.fillStyle=bg2; ctx.fillRect(x, y, w, h);

    // Mortar
    ctx.strokeStyle='rgba(0,0,0,0.32)'; ctx.lineWidth=1.5;
    ctx.strokeRect(x+1,y+1,w-2,h-2);
    ctx.beginPath();
    ctx.moveTo(x,y+h/2); ctx.lineTo(x+w,y+h/2);
    ctx.moveTo(x+w/2,y); ctx.lineTo(x+w/2,y+h/2);
    ctx.moveTo(x,y+h/2); ctx.lineTo(x+w/2,y+h);
    ctx.stroke();

    // Top-left bevel
    ctx.fillStyle='rgba(255,255,255,0.38)';
    ctx.fillRect(x+2,y+2,w-4,5);
    ctx.fillRect(x+2,y+2,4,h-4);

    // Bottom-right bevel shadow
    ctx.fillStyle='rgba(0,0,0,0.24)';
    ctx.fillRect(x+2,y+h-5,w-4,4);
    ctx.fillRect(x+w-5,y+2,4,h-4);

    // Surface crack
    ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(x+w*0.30,y+h*0.20);
    ctx.lineTo(x+w*0.44,y+h*0.48);
    ctx.lineTo(x+w*0.37,y+h*0.72);
    ctx.stroke();

  } else if (t.type === 'platform') {
    // ── Floating platform ────────────────────────────────────────────────────
    const pg = ctx.createLinearGradient(x, y, x+w, y+h);
    pg.addColorStop(0,   shadeColor(PLATFORM_COL[lv],32));
    pg.addColorStop(0.5, PLATFORM_COL[lv]);
    pg.addColorStop(1,   shadeColor(PLATFORM_COL[lv],-32));
    ctx.fillStyle=pg; ctx.fillRect(x, y, w, h);

    // Top sheen
    const sg2=ctx.createLinearGradient(x,y,x,y+8);
    sg2.addColorStop(0,'rgba(255,255,255,0.58)'); sg2.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sg2; ctx.fillRect(x+2,y+1,w-4,8);

    // Edges
    ctx.fillStyle='rgba(255,255,255,0.32)'; ctx.fillRect(x+1,y+1,3,h-2);
    ctx.fillStyle='rgba(0,0,0,0.26)';       ctx.fillRect(x+w-3,y+1,3,h-2);

    // Bottom shadow stripe (3D floating illusion)
    ctx.fillStyle='rgba(0,0,0,0.38)'; ctx.fillRect(x,y+h-4,w,4);
    ctx.fillStyle='rgba(0,0,0,0.48)'; ctx.fillRect(x+w-4,y+h-4,4,4);

    // Top-left specular dot
    ctx.fillStyle='rgba(255,255,255,0.72)'; ctx.fillRect(x+2,y+2,3,3);
  }
}

function drawCandy(c) {
  const x=c.x-camera.x, y=c.y;
  const bob=Math.sin(frameCount*0.09)*3;
  const cy2=y+12+bob;
  // glow aura
  bgGlow(x+12,cy2,18,'rgba(255,100,180,0.22)','rgba(255,80,160,0)');
  // sphere with radial gradient
  const cg=ctx.createRadialGradient(x+8,cy2-5,1, x+12,cy2,11);
  cg.addColorStop(0,'#fff8e0'); cg.addColorStop(0.3,'#ff88cc');
  cg.addColorStop(0.7,'#dd2290'); cg.addColorStop(1,'#aa0066');
  ctx.fillStyle=cg;
  ctx.beginPath(); ctx.arc(x+12,cy2,11,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#880044'; ctx.lineWidth=1.2; ctx.stroke();
  // specular
  ctx.fillStyle='rgba(255,255,255,0.72)';
  ctx.beginPath(); ctx.ellipse(x+8,cy2-4,4,2.5,-0.5,0,Math.PI*2); ctx.fill();
  // stick
  ctx.strokeStyle='#c8a060'; ctx.lineWidth=3; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x+12,cy2+11); ctx.lineTo(x+12,cy2+20); ctx.stroke();
}

function drawHeartPickup(h) {
  const cx = h.x - camera.x + 12;
  const cy = h.y + 12 + Math.sin(frameCount*0.08)*3;
  const pulse = 1.0 + Math.sin(frameCount*0.12)*0.06;
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(pulse, pulse);
  // all coords below are local (0,0 = heart centre)
  bgGlow(0, 0, 22, 'rgba(255,50,80,0.20)', 'rgba(255,0,60,0)');
  ctx.fillStyle = '#ff1144';
  ctx.beginPath(); ctx.arc(-4, -14, 7.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 4, -14, 7.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-10,-10); ctx.lineTo(0,4); ctx.lineTo(10,-10); ctx.fill();
  ctx.fillStyle = '#ff6688';
  ctx.beginPath(); ctx.arc(-3, -15, 3.5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath(); ctx.ellipse(-4, -18, 3.5, 2, -0.5, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawPowerPickup(p) {
  const cx = p.x - camera.x + 12;
  const cy = p.y + 12 + Math.sin(frameCount * 0.07) * 4;
  const pulse = 1 + Math.sin(frameCount * 0.11) * 0.08;
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(pulse, pulse);
  if (p.type === 'cape') {
    bgGlow(0, 0, 26, 'rgba(180,80,255,0.35)', 'rgba(100,0,255,0)');
    // Cape silhouette
    ctx.fillStyle = '#7722bb';
    ctx.beginPath();
    ctx.moveTo(-12,-10); ctx.quadraticCurveTo(-6, 10, 0, 12);
    ctx.quadraticCurveTo( 6, 10, 12,-10);
    ctx.quadraticCurveTo( 0, -3,-12,-10); ctx.fill();
    // Highlight fold
    ctx.fillStyle = '#cc66ff';
    ctx.beginPath();
    ctx.moveTo(-9,-8); ctx.quadraticCurveTo(-4, 8, 0, 9);
    ctx.quadraticCurveTo( 4, 8,  9,-8);
    ctx.quadraticCurveTo( 0,-2, -9,-8); ctx.fill();
    // Collar gem
    ctx.fillStyle = '#ff88ff';
    ctx.beginPath(); ctx.arc(0,-10,3.5,0,Math.PI*2); ctx.fill();
  } else {
    // Super boots
    bgGlow(0, 0, 26, 'rgba(255,210,0,0.35)', 'rgba(200,80,0,0)');
    ctx.fillStyle = '#aa6600';
    ctx.fillRect(-10,-2,20,10); ctx.fillRect(-8, 8,16, 5);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(-9,-1,18, 8);
    ctx.fillStyle = '#fff8aa'; ctx.globalAlpha *= 0.6;
    ctx.fillRect(-7, 0, 6, 3);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawCapeHUD() {
  const fw = 78, fh = 7, fx = W - 102, fy = 50;
  const frac = player.capeFlutter / 240;
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = '#1a0033'; ctx.fillRect(fx, fy, fw, fh);
  const g = ctx.createLinearGradient(fx, fy, fx + fw, fy);
  g.addColorStop(0, '#dd44ff'); g.addColorStop(1, '#7700cc');
  ctx.fillStyle = g; ctx.fillRect(fx, fy, fw * frac, fh);
  ctx.strokeStyle = '#9933cc'; ctx.lineWidth = 1; ctx.strokeRect(fx, fy, fw, fh);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#dd99ff'; ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('CAPE', fx - 4, fy + 3);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

function drawBootsHUD() {
  const fx = W - 102, fy = 62;
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = '#aa6600'; ctx.fillRect(fx, fy, 78, 7);
  const g = ctx.createLinearGradient(fx, fy, fx+78, fy);
  g.addColorStop(0,'#ffdd00'); g.addColorStop(1,'#ff8800');
  ctx.fillStyle = g; ctx.fillRect(fx, fy, 78, 7);
  ctx.strokeStyle = '#cc8800'; ctx.lineWidth = 1; ctx.strokeRect(fx, fy, 78, 7);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffee88'; ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('BOOTS', fx - 4, fy + 3);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

function drawWeaponPickup(m) {
  const x=m.x-camera.x, y=m.y;
  const bob=Math.sin(frameCount*0.07)*3;
  const pulse=0.65+Math.sin(frameCount*0.10)*0.35;
  if (m.type==='sword') {
    // glow
    ctx.globalAlpha=pulse*0.48;
    bgGlow(x+12,y+14+bob,26,'rgba(80,160,255,1)','rgba(40,80,255,0)');
    ctx.globalAlpha=1;
    // blade
    const blg=ctx.createLinearGradient(x+9,y+2,x+15,y+24);
    blg.addColorStop(0,'#e0f0ff'); blg.addColorStop(0.4,'#aad4ff'); blg.addColorStop(1,'#6699cc');
    ctx.fillStyle=blg; ctx.fillRect(x+10,y+2+bob,5,22);
    ctx.fillStyle='rgba(255,255,255,0.88)'; ctx.fillRect(x+10,y+2+bob,2,18);
    // guard
    const gg=ctx.createLinearGradient(x+3,y+20,x+21,y+26);
    gg.addColorStop(0,'#ffd700'); gg.addColorStop(1,'#aa8800');
    ctx.fillStyle=gg; ctx.fillRect(x+3,y+20+bob,19,5);
    // handle
    ctx.fillStyle='#7a3800'; ctx.fillRect(x+10,y+24+bob,5,8);
    // pommel
    const pmg=ctx.createRadialGradient(x+11,y+31+bob,0,x+12,y+32+bob,4);
    pmg.addColorStop(0,'#fff080'); pmg.addColorStop(1,'#aa8800');
    ctx.fillStyle=pmg; ctx.beginPath(); ctx.arc(x+12,y+32+bob,4,0,Math.PI*2); ctx.fill();
    // tip sparkle
    ctx.fillStyle='rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(x+12,y+2+bob,2.5,0,Math.PI*2); ctx.fill();
  } else {
    // fork / MasterFork
    ctx.globalAlpha=pulse*0.44;
    bgGlow(x+12,y+14+bob,22,'rgba(255,220,30,1)','rgba(255,180,0,0)');
    ctx.globalAlpha=1;
    // handle
    const hg=ctx.createLinearGradient(x+10,y+14,x+15,y+28);
    hg.addColorStop(0,'#e8b840'); hg.addColorStop(1,'#a07010');
    ctx.fillStyle=hg; ctx.fillRect(x+10,y+14+bob,5,14);
    // tines with individual gradients
    for (let i=0;i<3;i++){
      const tg2=ctx.createLinearGradient(x+5+i*5,y+2,x+7+i*5,y+16);
      tg2.addColorStop(0,'#fff0a0'); tg2.addColorStop(1,'#cc9900');
      ctx.fillStyle=tg2; ctx.fillRect(x+5+i*5,y+2+bob,3,14);
      ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.fillRect(x+5+i*5,y+2+bob,1,8);
    }
    // crossbar
    const cbg=ctx.createLinearGradient(x+4,y+14,x+20,y+17);
    cbg.addColorStop(0,'#ffd700'); cbg.addColorStop(1,'#aa8800');
    ctx.fillStyle=cbg; ctx.fillRect(x+4,y+14+bob,16,4);
  }
}

function drawEnemyBasic(x, y, e) {
  const ex = e.vx > 0 ? 1 : -1;
  ctx.fillStyle = '#cc3300';
  ctx.beginPath(); ctx.ellipse(x+17, y+22, 17, 15, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ee4411';
  ctx.beginPath(); ctx.ellipse(x+17, y+12, 17, 12, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ff8866';
  ctx.beginPath();
  ctx.ellipse(x+12, y+9, 5, 4, -0.4, 0, Math.PI*2);
  ctx.ellipse(x+22, y+10, 4, 3,  0.3, 0, Math.PI*2);
  ctx.fill();
  if (e.jumper) {
    ctx.fillStyle = '#ffff00';
    ctx.beginPath(); ctx.arc(x+17, y+4, 3, 0, Math.PI*2); ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(x+11+ex*2, y+18, 5, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+23+ex*2, y+18, 5, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(x+12+ex*3, y+18, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+24+ex*3, y+18, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#882200';
  ctx.beginPath(); ctx.ellipse(x+9,  y+34, 8, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+25, y+34, 8, 5, 0, 0, Math.PI*2); ctx.fill();
}

function drawEnemyRunner(x, y, e) {
  // Skinny fast green lizard with animated legs
  const ex = e.vx > 0 ? 1 : -1;
  ctx.fillStyle = '#228822';
  ctx.beginPath(); ctx.ellipse(x+17, y+24, 11, 12, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#33aa33';
  ctx.beginPath(); ctx.ellipse(x+17, y+11, 11, 11, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#44cc44';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(x+9+i*5, y+10); ctx.lineTo(x+11+i*5, y+2); ctx.lineTo(x+13+i*5, y+10); ctx.fill();
  }
  ctx.fillStyle = '#55ee55';
  ctx.fillRect(x+12, y+20, 9, 3); ctx.fillRect(x+12, y+26, 9, 2);
  const legA = Math.sin(frameCount * 0.35) * 6;
  ctx.fillStyle = '#228822';
  ctx.fillRect(x+9, y+33, 5, 10+legA); ctx.fillRect(x+20, y+33, 5, 10-legA);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(x+13+ex*2, y+9, 5, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+22+ex*2, y+9, 5, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ff2200';
  ctx.beginPath(); ctx.arc(x+13+ex*3, y+9, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+22+ex*3, y+9, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#228822'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  const tailDX = e.vx > 0 ? -1 : 1;
  const tailX  = e.vx > 0 ? x : x + e.w;
  ctx.beginPath(); ctx.moveTo(tailX, y+22); ctx.quadraticCurveTo(tailX+tailDX*16, y+28, tailX+tailDX*10, y+36); ctx.stroke();
}

function drawEnemyTough(x, y, e) {
  // Large armored purple/red shell creature (2 hits)
  const ex = e.vx > 0 ? 1 : -1;
  const damaged = e.hp <= 1;
  ctx.fillStyle = damaged ? '#993300' : '#5500aa';
  ctx.beginPath(); ctx.ellipse(x+22, y+22, 20, 18, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = damaged ? '#bb4400' : '#7722cc';
  ctx.beginPath(); ctx.ellipse(x+22, y+22, 13, 11, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffffff22';
  ctx.beginPath(); ctx.ellipse(x+15, y+15, 6, 5, -0.4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = damaged ? '#882200' : '#440088';
  ctx.beginPath(); ctx.ellipse(x+9,  y+38, 9, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+35, y+38, 9, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = damaged ? '#cc5500' : '#6600bb';
  ctx.beginPath(); ctx.ellipse(x+22+ex*8, y+8, 10, 8, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ff4400';
  ctx.beginPath(); ctx.arc(x+20+ex*8, y+7, 3.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+24+ex*8, y+7, 3.5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x+21+ex*8, y+6, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+25+ex*8, y+6, 1.5, 0, Math.PI*2); ctx.fill();
  if (!damaged) {
    ctx.fillStyle = '#aa44ff';
    ctx.beginPath(); ctx.arc(x+22, y-4, 4, 0, Math.PI*2); ctx.fill();
  }
}

function drawEnemyFlyer(x, y, e) {
  // Ghost / bat floating in air
  const t   = frameCount * 0.07;
  const bob = Math.sin(t) * 4;
  const ex  = e.vx > 0 ? 1 : -1;
  const flapA = Math.sin(t * 2.2) * 4;
  ctx.fillStyle = '#6622aa88';
  ctx.beginPath(); ctx.ellipse(x+8,  y+12+bob, 12, 7, -0.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+26, y+12+bob, 12, 7,  0.5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#9944cc88';
  ctx.beginPath(); ctx.ellipse(x+7,  y+10+bob-flapA, 10, 5, -0.6, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+27, y+10+bob-flapA, 10, 5,  0.6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#cc88ff88';
  ctx.beginPath(); ctx.ellipse(x+17, y+15+bob, 13, 15, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#cc88ff44';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.ellipse(x+8+i*8, y+27+bob, 4, 6+Math.sin(t+i)*3, 0, 0, Math.PI*2); ctx.fill();
  }
  ctx.fillStyle = '#ff2244';
  ctx.beginPath(); ctx.arc(x+13+ex*2, y+13+bob, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+22+ex*2, y+13+bob, 4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffaacc';
  ctx.beginPath(); ctx.arc(x+14+ex*2, y+12+bob, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+23+ex*2, y+12+bob, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ff224411';
  ctx.beginPath(); ctx.arc(x+17, y+15+bob, 22, 0, Math.PI*2); ctx.fill();
}

function drawEnemy(e) {
  if (!e.alive) return;
  const x = e.x - camera.x, y = e.y;
  if (x + e.w < -10 || x > W + 10) return;

  if (e.invincible > 0 && Math.floor(e.invincible/5)%2 === 0) ctx.globalAlpha = 0.35;

  if      (e.type === 'R') drawEnemyRunner(x, y, e);
  else if (e.type === 'T') drawEnemyTough(x, y, e);
  else if (e.type === 'Z') drawEnemyFlyer(x, y, e);
  else                     drawEnemyBasic(x, y, e);

  ctx.globalAlpha = 1;
}

function drawProjectile(p) {
  const x = p.x - camera.x, y = p.y;
  if (p.type === 'sword') {
    ctx.fillStyle = '#88bbff';
    ctx.fillRect(x, y+1, p.w, 6);
    ctx.fillStyle = '#ffffff88';
    ctx.fillRect(x+2, y+2, p.w-4, 2);
    ctx.fillStyle = '#4488ff33';
    ctx.beginPath(); ctx.ellipse(x+(p.vx>0?0:p.w), y+4, 14, 7, 0, 0, Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x, y+2, p.w, 4);
    const tipX = p.vx > 0 ? x+p.w : x-4;
    ctx.fillStyle = '#ffaa00';
    for (let i = 0; i < 3; i++) ctx.fillRect(tipX, y+i*3-1, 5, 3);
    ctx.fillStyle = '#ffd70044';
    ctx.beginPath(); ctx.ellipse(x+(p.vx>0?0:p.w), y+4, 10, 5, 0, 0, Math.PI*2); ctx.fill();
  }
}

// ── S shield logo ─────────────────────────────────────────────────────────────
function drawSShield(cx, cy, size) {
  // Red outer diamond
  ctx.fillStyle = '#cc0000';
  ctx.beginPath();
  ctx.moveTo(cx, cy-size);
  ctx.bezierCurveTo(cx+size*0.65,cy-size*0.25, cx+size*0.65,cy+size*0.25, cx,cy+size);
  ctx.bezierCurveTo(cx-size*0.65,cy+size*0.25, cx-size*0.65,cy-size*0.25, cx,cy-size);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = size*0.06; ctx.stroke();
  // Inner blue
  ctx.fillStyle = '#1144dd';
  ctx.beginPath();
  ctx.moveTo(cx, cy-size*0.74);
  ctx.bezierCurveTo(cx+size*0.47,cy-size*0.18, cx+size*0.47,cy+size*0.18, cx,cy+size*0.74);
  ctx.bezierCurveTo(cx-size*0.47,cy+size*0.18, cx-size*0.47,cy-size*0.18, cx,cy-size*0.74);
  ctx.closePath(); ctx.fill();
  // Gold S
  ctx.fillStyle = '#ffd700';
  ctx.shadowColor = '#ff8800'; ctx.shadowBlur = size*0.25;
  ctx.font = `bold ${Math.round(size*0.92)}px Arial Black`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('S', cx, cy+size*0.04);
  ctx.shadowBlur = 0;
}

// ── Hero figure (menu pose: hands on hips, cape flowing) ──────────────────────
// origin at feet-centre; local coords span about ±20x across, -80 up to 0
function drawHeroFigure(cx, cy, scale, capePhase) {
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(scale, scale);
  const cw = Math.sin(capePhase || 0) * 6;

  // Cape
  ctx.fillStyle = '#bb1100';
  ctx.beginPath();
  ctx.moveTo(-5,-48); ctx.bezierCurveTo(-20,-30,-26+cw,-8,-22+cw*1.3,14);
  ctx.lineTo(-16+cw,18); ctx.bezierCurveTo(-10+cw*0.7,8,-6,-16,-4,-40);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ee2200';
  ctx.beginPath();
  ctx.moveTo(-5,-46); ctx.bezierCurveTo(-14,-30,-19+cw*0.7,-10,-15+cw,6);
  ctx.lineTo(-12+cw*0.8,4); ctx.bezierCurveTo(-8+cw*0.5,-10,-5,-30,-4,-42);
  ctx.closePath(); ctx.fill();

  // Boots
  ctx.fillStyle = '#bb1100';
  ctx.beginPath(); ctx.ellipse(-9,0,11,5,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(9,0,11,5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ee3300';
  ctx.beginPath(); ctx.ellipse(-11,-2,6,3,-0.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(7,-2,6,3,-0.3,0,Math.PI*2); ctx.fill();

  // Legs
  ctx.fillStyle = '#2255dd'; ctx.fillRect(-16,-22,11,22); ctx.fillRect(5,-22,11,22);
  ctx.fillStyle = '#4477ff'; ctx.fillRect(-15,-22,3,22); ctx.fillRect(6,-22,3,22);

  // Belt
  ctx.fillStyle = '#ffd700'; ctx.fillRect(-18,-24,36,5);
  ctx.fillStyle = '#cc8800'; ctx.fillRect(-6,-26,12,9);
  ctx.fillStyle = '#ffd700'; ctx.font='bold 7px Arial Black';
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('S',0,-21);

  // Body
  ctx.fillStyle = '#1155ee'; ctx.fillRect(-18,-46,36,24);
  ctx.fillStyle = '#2266ff';
  ctx.beginPath(); ctx.ellipse(-8,-36,8,10,-0.1,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8,-36,8,10,0.1,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#0044cc'; ctx.fillRect(-1,-46,2,24);

  // Chest emblem
  ctx.fillStyle = '#ffd700';
  ctx.beginPath(); ctx.moveTo(0,-46); ctx.lineTo(11,-38); ctx.lineTo(0,-29); ctx.lineTo(-11,-38); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#cc0000'; ctx.font='bold 12px Arial Black';
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('S',0,-37);

  // Arms – hands on hips
  ctx.fillStyle = '#1155ee'; ctx.fillRect(-30,-44,12,22); ctx.fillRect(18,-44,12,22);
  ctx.fillStyle = '#4477ff'; ctx.fillRect(-29,-44,3,22); ctx.fillRect(19,-44,3,22);
  ctx.fillStyle = '#bb1100';
  ctx.beginPath(); ctx.ellipse(-25,-20,8,7,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(25,-20,8,7,0,0,Math.PI*2); ctx.fill();

  // Collar
  ctx.fillStyle = '#ffd700';
  ctx.beginPath(); ctx.moveTo(-13,-46); ctx.lineTo(0,-51); ctx.lineTo(13,-46);
  ctx.lineTo(10,-41); ctx.lineTo(0,-46); ctx.lineTo(-10,-41); ctx.closePath(); ctx.fill();

  // Neck
  ctx.fillStyle = '#ffcc88'; ctx.fillRect(-6,-52,12,8);

  // Head
  ctx.fillStyle = '#ffcc88'; ctx.beginPath(); ctx.ellipse(0,-62,17,14,0,0,Math.PI*2); ctx.fill();

  // Hair
  ctx.fillStyle = '#332200'; ctx.beginPath(); ctx.ellipse(0,-73,16,7,0,0,Math.PI*2); ctx.fill();
  ctx.fillRect(-14,-77,28,7);
  ctx.fillStyle = '#553300';
  ctx.beginPath(); ctx.ellipse(-6,-74,7,4,-0.3,0,Math.PI*2); ctx.fill();

  // Mask
  ctx.fillStyle = '#1155ee';
  ctx.beginPath(); ctx.ellipse(-8,-63,8,5,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8,-63,8,5,0,0,Math.PI*2); ctx.fill();
  ctx.fillRect(-5,-67,10,6);

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-8,-63,5.5,3.5,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8,-63,5.5,3.5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#223399';
  ctx.beginPath(); ctx.arc(-7,-63,3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(9,-63,3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-5,-65,1.2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(11,-65,1.2,0,Math.PI*2); ctx.fill();

  // Nose + smile
  ctx.fillStyle = '#d8a068'; ctx.beginPath(); ctx.ellipse(3,-57,2.5,2,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#cc5520'; ctx.lineWidth=2.2; ctx.lineCap='round';
  ctx.beginPath(); ctx.arc(0,-56,6,0.2,Math.PI-0.2); ctx.stroke();

  ctx.restore();
}

// ── Animated title / start screen ────────────────────────────────────────────
function drawMenuBackground() {
  // 1. Deep space sky
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#000009'); bg.addColorStop(0.5,'#040018'); bg.addColorStop(1,'#0c000f');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

  // 2. Aurora curtains — 4 animated bands
  const aColors=[[40,210,120],[70,140,255],[165,45,235],[30,195,215]];
  for(let bi=0;bi<4;bi++){
    const [r,g,b]=aColors[bi];
    const baseY=H*(0.06+bi*0.055);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W,0);
    for(let x=W;x>=0;x-=3){
      const y=baseY+Math.sin(x*0.009+frameCount*0.011+bi*1.1)*13
                   +Math.sin(x*0.019+frameCount*0.007+bi*0.7)*5;
      ctx.lineTo(x,y);
    }
    ctx.closePath();
    const ag=ctx.createLinearGradient(0,0,0,baseY+14);
    ag.addColorStop(0,`rgba(${r},${g},${b},0)`);
    ag.addColorStop(0.75,`rgba(${r},${g},${b},0.14)`);
    ag.addColorStop(1,`rgba(${r},${g},${b},0.04)`);
    ctx.fillStyle=ag; ctx.fill();
  }

  // 3. Stars
  for(let i=0;i<150;i++){
    const sx=(i*97+31)%W, sy=(i*53+17)%(H*0.86);
    const tw=0.3+Math.sin(frameCount*0.07+i*0.8)*0.4;
    ctx.globalAlpha=Math.max(0.05,tw);
    ctx.fillStyle=i%8===0?'#aaccff':i%5===0?'#ffeeaa':'#ffffff';
    ctx.beginPath(); ctx.arc(sx,sy,i%18===0?2.4:i%6===0?1.5:0.9,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;

  // 4. Moon (upper right)
  const moonX=W*0.88, moonY=H*0.13;
  const moonGlow=ctx.createRadialGradient(moonX,moonY,0,moonX,moonY,50);
  moonGlow.addColorStop(0,'rgba(255,250,220,0.15)'); moonGlow.addColorStop(1,'rgba(255,250,220,0)');
  ctx.fillStyle=moonGlow; ctx.beginPath(); ctx.arc(moonX,moonY,50,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#f8f0d8'; ctx.beginPath(); ctx.arc(moonX,moonY,18,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.arc(moonX-5,moonY-4,4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(moonX+7,moonY+5,3,0,Math.PI*2); ctx.fill();

  // 5. Shooting star (occasional)
  const sPhase=frameCount%500;
  if(sPhase<25){
    const t=sPhase/25;
    ctx.save(); ctx.globalAlpha=Math.sin(t*Math.PI)*0.9;
    ctx.strokeStyle='#ffffff'; ctx.lineWidth=2; ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(W*0.8-t*W*0.38, H*0.06-t*H*0.02);
    ctx.lineTo(W*0.8-t*W*0.38+90, H*0.06-t*H*0.02+22);
    ctx.stroke(); ctx.restore();
  }

  // 6. Nebula glow behind hero (right)
  const nb=ctx.createRadialGradient(W*0.77,H*0.48,0,W*0.77,H*0.48,210);
  nb.addColorStop(0,'rgba(90,30,160,0.22)'); nb.addColorStop(0.6,'rgba(40,10,80,0.08)'); nb.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=nb; ctx.fillRect(0,0,W,H);

  // 7. City silhouette
  ctx.fillStyle='#030010';
  ctx.beginPath(); ctx.moveTo(0,H);
  const blds=[0,130,42,80,88,110,128,55,165,88,198,42,238,72,278,102,300,58,
              336,80,378,105,408,48,448,76,490,98,528,44,566,82,608,108,
              648,62,688,86,728,72,778,104,800,130];
  for(let i=0;i<blds.length;i+=4){
    const bx=blds[i],bh=blds[i+1],nx=blds[i+2]||W;
    ctx.lineTo(bx,H-bh); ctx.lineTo(nx-1,H-bh);
  }
  ctx.lineTo(W,H); ctx.closePath(); ctx.fill();

  // 8. Window lights on city buildings
  for(let i=0;i<50;i++){
    const wx=8+(i*71)%(W-16);
    let bh=50;
    for(let j=0;j<blds.length-4;j+=4){
      if(wx>=blds[j]&&wx<(blds[j+2]||W)){bh=blds[j+1];break;}
    }
    const minWy=H-bh+8, maxWy=H-10;
    if(minWy>=maxWy) continue;
    const wy=minWy+(i*43)%(maxWy-minWy);
    if(Math.sin(frameCount*0.022+i*2.1)>0.15){
      ctx.globalAlpha=0.45+Math.sin(frameCount*0.04+i)*0.2;
      ctx.fillStyle=i%5===0?'#ffee99':'#aaddff';
      ctx.fillRect(wx,wy,3,2);
    }
  }
  ctx.globalAlpha=1;

  // 9. Light rays behind S-shield (left-centre)
  const lx=W*0.34, ly=H*0.24;
  ctx.save(); ctx.translate(lx,ly);
  for(let i=0;i<20;i++){
    const a=(i/20)*Math.PI*2+frameCount*0.004;
    ctx.fillStyle=`rgba(80,130,255,${0.022+Math.sin(frameCount*0.025+i*0.7)*0.011})`;
    ctx.beginPath(); ctx.moveTo(0,0);
    ctx.lineTo(Math.cos(a-0.09)*700,Math.sin(a-0.09)*700);
    ctx.lineTo(Math.cos(a+0.09)*700,Math.sin(a+0.09)*700);
    ctx.closePath(); ctx.fill();
  }
  for(let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2+frameCount*0.003+0.3;
    ctx.fillStyle=`rgba(255,200,60,${0.015+Math.sin(frameCount*0.03+i)*0.008})`;
    ctx.beginPath(); ctx.moveTo(0,0);
    ctx.lineTo(Math.cos(a-0.06)*600,Math.sin(a-0.06)*600);
    ctx.lineTo(Math.cos(a+0.06)*600,Math.sin(a+0.06)*600);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // 10. Floating sparkles drifting up (left side)
  for(let i=0;i<18;i++){
    const sy=H-((frameCount*0.55+i*60)%H)-20;
    const sx=14+(i*113)%(W*0.50-28);
    if(sy<H*0.24) continue;
    ctx.globalAlpha=0.07+Math.sin(frameCount*0.08+i)*0.06;
    ctx.fillStyle=i%3===0?'#ffd700':i%3===1?'#66aaff':'#ff6688';
    ctx.beginPath(); ctx.arc(sx,sy,1.5,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;

  // 11. Hero figure — right side with heroic glow
  const heroX=W*0.77, heroY=H*0.965;
  const hg=ctx.createRadialGradient(heroX,heroY-190,0,heroX,heroY-190,160);
  hg.addColorStop(0,'rgba(100,160,255,0.18)'); hg.addColorStop(0.6,'rgba(60,80,200,0.06)'); hg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=hg; ctx.fillRect(0,0,W,H);
  drawHeroFigure(heroX, heroY, 4.8, frameCount*0.055);

  // 12. S-Shield (left-centre, pulsing)
  const ls=1+Math.sin(frameCount*0.04)*0.028;
  ctx.save(); ctx.translate(lx,ly); ctx.scale(ls,ls);
  drawSShield(0,0,66);
  ctx.restore();

  // 13. "SUPER SAM" 3-D title
  const tx=lx, ty=ly+122;
  ctx.save(); ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  ctx.font='bold 72px Arial Black, Arial';
  ctx.shadowBlur=24; ctx.shadowColor='#2244ee';
  for(let d=6;d>=1;d--){
    ctx.fillStyle=`hsl(235,85%,${6+d*4}%)`;
    ctx.fillText('SUPER SAM',tx+d,ty+d);
  }
  ctx.shadowBlur=0;
  const tg=ctx.createLinearGradient(tx-220,ty-68,tx+220,ty);
  tg.addColorStop(0,'#ffd700'); tg.addColorStop(0.32,'#ffffff');
  tg.addColorStop(0.65,'#ffe050'); tg.addColorStop(1,'#ffaa00');
  ctx.fillStyle=tg; ctx.fillText('SUPER SAM',tx,ty);
  ctx.strokeStyle='#880000'; ctx.lineWidth=2; ctx.strokeText('SUPER SAM',tx,ty);
  ctx.shadowBlur=8; ctx.shadowColor='#4466cc';
  ctx.fillStyle='#88aaff'; ctx.font='bold 15px Arial Black, Arial';
  ctx.fillText('THE HERO OF KOALALAND',tx,ty+30);
  ctx.shadowBlur=0;
  ctx.restore();
}

// ── Player (hero look) ────────────────────────────────────────────────────────
function drawPlayer() {
  const p = player;
  const blink = p.invincible > 0 && Math.floor(p.invincible/6)%2===0;
  if (blink) return;
  const x = p.x - camera.x, y = p.y;

  ctx.save();
  if (p.dir < 0) { ctx.translate(x+p.w, y); ctx.scale(-1,1); }
  else            { ctx.translate(x, y); }

  const gnd   = p.onGround;
  const fr    = p.frame;
  const leg   = gnd ? [0,-3,0,3][fr] : 0;
  const armSw = gnd ? [8,-8,8,-8][fr] : -14;
  const run   = gnd && Math.abs(p.vx) > 0.3;
  const capeW = Math.sin(frameCount*0.18) * (gnd ? (run ? 5 : 1.5) : 10);
  const capeL = gnd ? 38 : 52;

  // ── Cape (drawn first, behind body) ─────────────────────
  ctx.fillStyle='#bb1100';
  ctx.beginPath();
  ctx.moveTo(7,8);
  ctx.bezierCurveTo(-6,18,-13+capeW,28,-11+capeW,capeL);
  ctx.lineTo(-7+capeW*0.8,capeL+6);
  ctx.bezierCurveTo(-3+capeW*0.6,capeL+2,3,capeL-5,5,capeL-12);
  ctx.bezierCurveTo(5,26,5,17,7,12);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle='#ee2200';
  ctx.beginPath();
  ctx.moveTo(6,10);
  ctx.bezierCurveTo(-3,18,-8+capeW*0.6,28,-6+capeW*0.8,capeL-8);
  ctx.lineTo(-3+capeW*0.6,capeL-6);
  ctx.bezierCurveTo(-1+capeW*0.4,26,3,18,5,13);
  ctx.closePath(); ctx.fill();

  // ── Red boots ───────────────────────────────────────────
  ctx.fillStyle='#bb1100';
  ctx.beginPath(); ctx.ellipse(11,55+leg,10,5,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(25,55-leg,10,5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ee3300';
  ctx.beginPath(); ctx.ellipse(9,52+leg,6,3,-0.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(23,52-leg,6,3,-0.3,0,Math.PI*2); ctx.fill();

  // ── Legs ────────────────────────────────────────────────
  ctx.fillStyle='#2255dd';
  ctx.fillRect(6,38,10,17+leg); ctx.fillRect(20,38,10,17-leg);
  ctx.fillStyle='#4477ff';
  ctx.fillRect(7,38,3,17+leg); ctx.fillRect(21,38,3,17-leg);

  // ── Gold belt + S buckle ─────────────────────────────────
  ctx.fillStyle='#ffd700'; ctx.fillRect(4,35,28,5);
  ctx.fillStyle='#cc8800'; ctx.fillRect(13,34,10,7);
  ctx.fillStyle='#ffd700'; ctx.font='bold 7px Arial Black';
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('S',18,37);

  // ── Body / muscle suit ──────────────────────────────────
  ctx.fillStyle='#1155ee'; ctx.fillRect(4,16,28,19);
  ctx.fillStyle='#2266ff';
  ctx.beginPath(); ctx.ellipse(11,24,6,9,-0.12,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(25,24,6,9,0.12,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#0044bb'; ctx.fillRect(17,16,2,19);

  // ── S chest emblem ───────────────────────────────────────
  ctx.fillStyle='#ffd700';
  ctx.beginPath(); ctx.moveTo(18,15); ctx.lineTo(25,22); ctx.lineTo(18,30); ctx.lineTo(11,22); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#cc0000'; ctx.font='bold 9px Arial Black';
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('S',18,22);

  // ── Arms ────────────────────────────────────────────────
  ctx.fillStyle='#1155ee';
  ctx.fillRect(-2,18,8,14+armSw*0.3); ctx.fillRect(30,18,8,14-armSw*0.3);
  ctx.fillStyle='#4477ff';
  ctx.fillRect(-1,18,2.5,14+armSw*0.3); ctx.fillRect(30.5,18,2.5,14-armSw*0.3);
  // Red gloves
  ctx.fillStyle='#bb1100';
  ctx.beginPath(); ctx.ellipse(2,34+armSw*0.3,5.5,5.5,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(34,34-armSw*0.3,5.5,5.5,0,0,Math.PI*2); ctx.fill();

  // ── Gold collar ─────────────────────────────────────────
  ctx.fillStyle='#ffd700';
  ctx.beginPath(); ctx.moveTo(8,16); ctx.lineTo(18,11); ctx.lineTo(28,16);
  ctx.lineTo(26,20); ctx.lineTo(18,16); ctx.lineTo(10,20); ctx.closePath(); ctx.fill();

  // ── Neck ────────────────────────────────────────────────
  ctx.fillStyle='#ffcc88'; ctx.fillRect(14,17,8,6);

  // ── Head ────────────────────────────────────────────────
  ctx.fillStyle='#ffcc88';
  ctx.beginPath(); ctx.ellipse(18,9,15,13,0,0,Math.PI*2); ctx.fill();

  // ── Dark hair ───────────────────────────────────────────
  ctx.fillStyle='#332200';
  ctx.beginPath(); ctx.ellipse(18,-1,15,7,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#553300';
  ctx.beginPath(); ctx.ellipse(11,-2,7,4,-0.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(24,0,5,3,0.3,0,Math.PI*2); ctx.fill();

  // ── Blue domino mask ────────────────────────────────────
  ctx.fillStyle='#1155ee';
  ctx.beginPath(); ctx.ellipse(11,8,7,4.5,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(25,8,7,4.5,0,0,Math.PI*2); ctx.fill();
  ctx.fillRect(14,5,8,5);

  // ── Eyes ────────────────────────────────────────────────
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.ellipse(11,8,5,3.5,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(25,8,5,3.5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#223399';
  ctx.beginPath(); ctx.arc(12,8,2.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(26,8,2.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.arc(13,7,1.2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(27,7,1.2,0,Math.PI*2); ctx.fill();

  // ── Cheeks ──────────────────────────────────────────────
  ctx.fillStyle='rgba(255,150,100,0.3)';
  ctx.beginPath(); ctx.ellipse(7,15,5,3,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(29,15,5,3,0,0,Math.PI*2); ctx.fill();

  // ── Nose + heroic smile ─────────────────────────────────
  ctx.fillStyle='#d8a068';
  ctx.beginPath(); ctx.ellipse(20,13,2.5,2,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#cc5520'; ctx.lineWidth=2.2; ctx.lineCap='round';
  ctx.beginPath(); ctx.arc(18,15,5.5,0.25,Math.PI-0.25); ctx.stroke();

  // ── Weapon ──────────────────────────────────────────────
  if (p.weapon === 'sword') {
    const swing = p.swordSwing || 0;
    const angle = swing > 10 ? -0.9 : swing > 5 ? 0 : swing > 0 ? 0.7 : 0;
    ctx.save(); ctx.translate(36,28); ctx.rotate(angle);
    if (swing > 2 && swing < 14) {
      ctx.strokeStyle='#4488ff44'; ctx.lineWidth=10;
      ctx.beginPath(); ctx.arc(0,0,18,-1.0,0.8); ctx.stroke();
    }
    ctx.fillStyle='#4488ff22'; ctx.beginPath(); ctx.arc(11,0,16,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#88bbff'; ctx.fillRect(0,-3,22,6);
    ctx.fillStyle='#ffffff88'; ctx.fillRect(1,-2,20,2);
    ctx.strokeStyle='#ffd700'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(0,8); ctx.stroke();
    ctx.restore();
  } else if (p.weapon === 'fork') {
    ctx.strokeStyle='#ffd700'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(34,30); ctx.lineTo(52,30); ctx.stroke();
    ctx.lineWidth=2;
    for (let i=-1;i<=1;i++){
      ctx.beginPath(); ctx.moveTo(46,30+i*4); ctx.lineTo(52,30+i*4); ctx.stroke();
    }
    ctx.fillStyle='#ffd70033';
    ctx.beginPath(); ctx.arc(46,30,10,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawFlag() {
  if (!flag) return;
  const x = flag.pole.x - camera.x, y = flag.pole.y;
  if (x < -20 || x > W + 20) return;
  ctx.fillStyle = '#bbb'; ctx.fillRect(x+10, y, 4, flag.pole.h);
  const wave = Math.sin(frameCount*0.1)*3;
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.moveTo(x+14, y+5);
  ctx.quadraticCurveTo(x+30, y+12+wave, x+14, y+25);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#888'; ctx.fillRect(x+4, y+flag.pole.h-4, 16, 6);
}

function drawSelma() {
  if (!selma) return;
  const x = selma.poleX - camera.x, y = selma.poleY;
  if (x < -60 || x > W + 60) return;

  // Cage structure
  ctx.strokeStyle = '#aaa'; ctx.lineWidth = 2;
  ctx.fillStyle = '#33334400';
  ctx.strokeRect(x+2, y+12, 36, 58);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x+11+i*8, y+12); ctx.lineTo(x+11+i*8, y+70); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(x+2, y+30); ctx.lineTo(x+38, y+30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+2, y+50); ctx.lineTo(x+38, y+50); ctx.stroke();
  // Cage top dome
  ctx.strokeStyle = '#aaa';
  ctx.beginPath(); ctx.arc(x+20, y+12, 18, Math.PI, 0); ctx.stroke();

  // Koala inside
  const bob = Math.sin(frameCount*0.05)*2;
  const kx = x+20, ky = y+44+bob;

  // Body
  ctx.fillStyle = '#909090';
  ctx.beginPath(); ctx.ellipse(kx, ky+8, 10, 12, 0, 0, Math.PI*2); ctx.fill();
  // Big round ears
  ctx.fillStyle = '#808080';
  ctx.beginPath(); ctx.ellipse(kx-10, ky-14, 9, 9, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(kx+10, ky-14, 9, 9, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#c8a0a0';
  ctx.beginPath(); ctx.ellipse(kx-10, ky-14, 6, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(kx+10, ky-14, 6, 6, 0, 0, Math.PI*2); ctx.fill();
  // Head
  ctx.fillStyle = '#a8a8a8';
  ctx.beginPath(); ctx.ellipse(kx, ky-4, 12, 12, 0, 0, Math.PI*2); ctx.fill();
  // Eyes (big, pleading)
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(kx-4, ky-5, 5, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(kx+4, ky-5, 5, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#2040a0';
  ctx.beginPath(); ctx.arc(kx-3, ky-5, 3.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(kx+5, ky-5, 3.5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(kx-2, ky-7, 1.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(kx+6, ky-7, 1.3, 0, Math.PI*2); ctx.fill();
  // Nose
  ctx.fillStyle = '#303030';
  ctx.beginPath(); ctx.ellipse(kx, ky+1, 4, 3, 0, 0, Math.PI*2); ctx.fill();
  // Arms reaching out (sad)
  ctx.fillStyle = '#909090';
  ctx.fillRect(kx-18, ky+4, 10, 5); ctx.fillRect(kx+8, ky+4, 10, 5);

  // Selma label
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 9px Arial Black';
  ctx.textAlign = 'center';
  ctx.fillText('SELMA', x+20, y+8);
  ctx.textAlign = 'left';
}

// ── Boss visuals ──────────────────────────────────────────────────────────────
function drawMushroomKing(bx, by, bw, bh, rage) {
  ctx.save();
  ctx.translate(bx, by);
  const s = bw / 48;
  ctx.scale(s, s);

  // Feet
  ctx.fillStyle = '#661100';
  ctx.beginPath(); ctx.ellipse(14, 58, 11, 7, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(34, 58, 11, 7, 0, 0, Math.PI*2); ctx.fill();

  // Body
  ctx.fillStyle = '#cc3300';
  ctx.beginPath(); ctx.ellipse(24, 42, 20, 18, 0, 0, Math.PI*2); ctx.fill();

  // Arms
  ctx.fillStyle = '#ff5522';
  ctx.fillRect(-8, 34, 14, 9); // left arm
  ctx.fillRect(42, 34, 14, 9); // right arm
  ctx.beginPath(); ctx.ellipse(-7, 38, 7, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(55, 38, 7, 6, 0, 0, Math.PI*2); ctx.fill();

  // Giant mushroom cap
  ctx.fillStyle = rage ? '#ff1100' : '#cc4400';
  ctx.beginPath(); ctx.ellipse(24, 19, 30, 23, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(24, 27, 32, 9, 0, 0, Math.PI*2); ctx.fill(); // brim
  // Highlight
  ctx.fillStyle = rage ? '#ff5500' : '#ee6622';
  ctx.beginPath(); ctx.ellipse(16, 12, 10, 8, -0.4, 0, Math.PI*2); ctx.fill();

  // Spots on cap
  ctx.fillStyle = '#ffffffbb';
  ctx.beginPath(); ctx.arc(13, 13, 5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(28, 7,  7, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(38, 16, 4, 0, Math.PI*2); ctx.fill();

  // Crown
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(14, 1, 20, 5);
  ctx.fillRect(12, -6, 5, 8); ctx.fillRect(21, -8, 6, 10); ctx.fillRect(31, -6, 5, 8);
  ctx.fillStyle = '#ff4444';
  ctx.beginPath(); ctx.arc(14, -5, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(24, -7, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(34, -5, 3, 0, Math.PI*2); ctx.fill();

  // Face
  ctx.fillStyle = '#ffcc88';
  ctx.beginPath(); ctx.ellipse(24, 36, 14, 12, 0, 0, Math.PI*2); ctx.fill();
  // Eyes (angry V-shaped brows)
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(16, 33, 6, 7, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(32, 33, 6, 7,  0.3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = rage ? '#ff0000' : '#990000';
  ctx.beginPath(); ctx.arc(17, 34, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(33, 34, 4, 0, Math.PI*2); ctx.fill();
  // Angry brows
  ctx.strokeStyle = '#220000'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(10, 26); ctx.lineTo(22, 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(38, 26); ctx.lineTo(26, 30); ctx.stroke();
  // Grimace mouth
  ctx.beginPath(); ctx.arc(24, 42, 6, 0.3, Math.PI-0.3); ctx.stroke();

  ctx.restore();
}

function drawGanon(bx, by, bw, bh, rage) {
  ctx.save();
  ctx.translate(bx, by);
  const s = bw / 56;
  ctx.scale(s, s);

  // Cape/robe body
  ctx.fillStyle = rage ? '#5a0060' : '#2a0034';
  ctx.beginPath();
  ctx.moveTo(2, 18); ctx.lineTo(54, 18);
  ctx.lineTo(62, 75); ctx.lineTo(-6, 75);
  ctx.closePath(); ctx.fill();
  // Robe inner glow
  ctx.fillStyle = rage ? '#8800aa' : '#500060';
  ctx.beginPath();
  ctx.moveTo(18, 18); ctx.lineTo(38, 18); ctx.lineTo(34, 52); ctx.lineTo(22, 52);
  ctx.closePath(); ctx.fill();

  // Hands
  ctx.fillStyle = '#1a5500';
  ctx.beginPath(); ctx.ellipse(-4, 44, 9, 7, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(60, 44, 9, 7, 0, 0, Math.PI*2); ctx.fill();
  // Claws
  ctx.fillStyle = '#2a8800';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.ellipse(-10+i*3, 50, 2, 5, 0.3+i*0.1, 0, Math.PI*2); ctx.fill();
  }

  // Trident (right hand extended)
  ctx.save(); ctx.translate(62, 8);
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 50); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-6, 14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(6, 14); ctx.stroke();
  ctx.fillStyle = '#ffd700';
  ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-9, -8); ctx.lineTo(-3, 0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(-3, -9); ctx.lineTo(3, -9); ctx.lineTo(3, -1); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(3, -8); ctx.lineTo(9, 0); ctx.fill();
  ctx.restore();

  // Head / dark helmet
  ctx.fillStyle = '#1a5500';
  ctx.beginPath(); ctx.ellipse(28, 12, 22, 18, 0, 0, Math.PI*2); ctx.fill();
  // Helmet
  ctx.fillStyle = rage ? '#cc0000' : '#880000';
  ctx.beginPath();
  ctx.moveTo(6, 12); ctx.lineTo(50, 12);
  ctx.lineTo(48, 2); ctx.lineTo(44, -4); ctx.lineTo(36, -8);
  ctx.lineTo(28, -10); ctx.lineTo(20, -8); ctx.lineTo(12, -4);
  ctx.lineTo(8, 2); ctx.closePath(); ctx.fill();
  // Helmet horns
  ctx.fillStyle = '#cc8800';
  ctx.beginPath(); ctx.moveTo(6, 4); ctx.lineTo(0, -14); ctx.lineTo(12, 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(50, 4); ctx.lineTo(56, -14); ctx.lineTo(44, 2); ctx.fill();

  // Eyes — glowing evil
  const ec = rage ? '#ff2200' : '#ff8800';
  ctx.fillStyle = ec;
  ctx.beginPath(); ctx.ellipse(20, 10, 7, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(36, 10, 7, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffee00';
  ctx.beginPath(); ctx.arc(21, 10, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(37, 10, 3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = ec + '55';
  ctx.beginPath(); ctx.arc(20, 10, 12, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(36, 10, 12, 0, Math.PI*2); ctx.fill();

  // Dark rune on chest
  ctx.strokeStyle = rage ? '#ff44ff' : '#8844aa'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(28, 34, 8, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(28, 26); ctx.lineTo(28, 42);
  ctx.moveTo(20, 34); ctx.lineTo(36, 34);
  ctx.stroke();

  ctx.restore();
}

function drawBoss() {
  if (!boss || !boss.alive) return;
  const bx = boss.x - camera.x, by = boss.y;
  if (bx + boss.w < -20 || bx > W + 20) return;

  const blink = boss.invincible > 0 && Math.floor(boss.invincible/4)%2 === 0;
  if (blink) ctx.globalAlpha = 0.45;

  if (boss.type === 'mushroomking') drawMushroomKing(bx, by, boss.w, boss.h, boss.rage);
  else if (boss.type === 'ganon')   drawGanon(bx, by, boss.w, boss.h, boss.rage);

  if (blink) ctx.globalAlpha = 1;

  // Boss projectiles (fireballs)
  for (const bp of boss.bossProjectiles || []) {
    if (!bp.alive) continue;
    const fx = bp.x - camera.x, fy = bp.y;
    const r = 8 + Math.sin(frameCount*0.3)*2;
    ctx.fillStyle = '#ff000044';
    ctx.beginPath(); ctx.arc(fx, fy, r+6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ff4400';
    ctx.beginPath(); ctx.arc(fx, fy, r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath(); ctx.arc(fx, fy, r*0.5, 0, Math.PI*2); ctx.fill();
  }

  // Health bar
  const bw = 220, bh = 14;
  const barX = (W - bw) / 2, barY = 36;
  ctx.fillStyle = '#000000bb'; ctx.fillRect(barX-6, barY-18, bw+12, bh+24);
  ctx.fillStyle = boss.rage ? '#ff4444' : '#ff8844';
  ctx.font = 'bold 11px Arial Black'; ctx.textAlign = 'center';
  ctx.fillText(boss.type === 'ganon' ? '⚔ GANON ⚔' : '♛ MUSHROOM KING ♛', W/2, barY-4);
  ctx.fillStyle = '#500000'; ctx.fillRect(barX, barY, bw, bh);
  const ratio = Math.max(0, boss.hp / boss.maxHp);
  const hpGrad = ctx.createLinearGradient(barX, 0, barX+bw, 0);
  hpGrad.addColorStop(0, boss.rage ? '#ff0000' : '#ff4400');
  hpGrad.addColorStop(1, boss.rage ? '#ff4444' : '#ffaa00');
  ctx.fillStyle = hpGrad; ctx.fillRect(barX, barY, bw*ratio, bh);
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, bw, bh);
  ctx.textAlign = 'left';
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.min(1, p.life/25);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x - camera.x, p.y, p.size || 5, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

const LEVEL_NAMES = ['Green Meadow','Desert','Night Forest','Cave','Snow Fields',
                     'Lava Castle','Dungeon','Volcano','Sky Fortress',"Ganon's Castle"];

function drawLevelComplete() {
  const t = levelCompleteTimer; // 0–360

  // ── Dark overlay ─────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.60)';
  ctx.fillRect(0,0,W,H);

  // Warm radial glow behind panel
  const rg = ctx.createRadialGradient(W/2,H/2,0, W/2,H/2,340);
  rg.addColorStop(0, `rgba(255,200,0,${0.10+Math.sin(t*0.04)*0.04})`);
  rg.addColorStop(1, 'rgba(255,200,0,0)');
  ctx.fillStyle = rg; ctx.fillRect(0,0,W,H);

  // ── Firework bursts (4 corners, each cycling every 80 frames) ────────────────
  function burst(cx, cy, offset, r, g, b) {
    const age = (t + offset) % 80;
    if (age > 58) return;
    const rad = age * 3.4;
    const a = (1 - age/58).toFixed(2);
    for (let i = 0; i < 14; i++) {
      const ang = (i/14)*Math.PI*2 + offset*0.008;
      ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(ang)*rad*0.22, cy+Math.sin(ang)*rad*0.22);
      ctx.lineTo(cx+Math.cos(ang)*rad,      cy+Math.sin(ang)*rad);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,220,${a})`;
      ctx.beginPath(); ctx.arc(cx+Math.cos(ang)*rad, cy+Math.sin(ang)*rad, 2.5,0,Math.PI*2); ctx.fill();
    }
  }
  burst(W*0.12, H*0.18,   0, 255,215, 50);
  burst(W*0.88, H*0.22,  20,  80,200,255);
  burst(W*0.10, H*0.82,  40, 255,140,200);
  burst(W*0.90, H*0.78,  60, 140,255,140);

  // ── Two orbiting star rings ───────────────────────────────────────────────────
  const starCols = ['#ffd700','#ff88cc','#88ffee','#88ccff','#ffbb55','#ccffaa'];
  [[10,210,0.042,3.5],[7,162,-0.058,2.5]].forEach(([n,R,spd,sz],ring)=>{
    for (let i=0;i<n;i++){
      const a=(i/n)*Math.PI*2+t*spd;
      const sx=W/2+Math.cos(a)*R, sy=H/2-8+Math.sin(a)*(R*0.38);
      const s=sz+Math.sin(t*0.12+i*0.9+ring)*1.4;
      ctx.fillStyle=starCols[(i+ring*4)%starCols.length];
      ctx.beginPath(); ctx.arc(sx,sy,s,0,Math.PI*2); ctx.fill();
    }
  });

  // ── Sliding panel ────────────────────────────────────────────────────────────
  const ease = 1-Math.pow(1-Math.min(1,t/22),3); // cubic ease-out, 22 frames
  const pW=506, pH=228;
  const pX=(W-pW)/2, pY=H/2-120-260*(1-ease);

  // Drop shadow
  ctx.fillStyle='rgba(0,0,0,0.42)';
  ctx.fillRect(pX+7,pY+7,pW,pH);

  // Body gradient
  const pg=ctx.createLinearGradient(pX,pY,pX,pY+pH);
  pg.addColorStop(0,'#16004e'); pg.addColorStop(1,'#08002a');
  ctx.fillStyle=pg; ctx.fillRect(pX,pY,pW,pH);

  // Outer gold border
  ctx.strokeStyle='#ffd700'; ctx.lineWidth=3.5;
  ctx.strokeRect(pX,pY,pW,pH);
  // Inner accent line
  ctx.strokeStyle='rgba(255,215,0,0.22)'; ctx.lineWidth=1;
  ctx.strokeRect(pX+6,pY+6,pW-12,pH-12);

  // Corner sparkle dots
  [[pX+3,pY+3],[pX+pW-3,pY+3],[pX+3,pY+pH-3],[pX+pW-3,pY+pH-3]].forEach(([cx,cy])=>{
    ctx.fillStyle='#ffd700'; ctx.beginPath(); ctx.arc(cx,cy,4,0,Math.PI*2); ctx.fill();
  });

  // ── Text content ─────────────────────────────────────────────────────────────
  ctx.textAlign='center'; ctx.textBaseline='middle';

  // Title (pulsing, instant fade-in)
  const pulse=1+Math.sin(t*0.16)*0.04;
  ctx.save();
  ctx.translate(W/2,pY+50); ctx.scale(pulse,pulse);
  ctx.globalAlpha=Math.min(1,t/12);
  ctx.fillStyle='#ffd700';
  ctx.shadowColor='#ff8800'; ctx.shadowBlur=26;
  ctx.font='bold 42px "Arial Black",Arial';
  ctx.fillText(levelCompleteMsg, 0, 0);
  ctx.shadowBlur=0;
  ctx.restore();
  ctx.globalAlpha=1;

  // Level name subtitle
  ctx.globalAlpha=Math.min(1,Math.max(0,(t-18)/20));
  ctx.fillStyle='#bbbbff';
  ctx.font='italic 17px Arial';
  const sub = levelCompleteMsg==='SELMA SAVED!'
    ? '— The Final Battle —'
    : `— ${LEVEL_NAMES[currentLevel]||'Level '+(currentLevel+1)} —`;
  ctx.fillText(sub, W/2, pY+86);
  ctx.globalAlpha=1;

  // Separator
  ctx.globalAlpha=Math.min(1,Math.max(0,(t-30)/20));
  ctx.strokeStyle='rgba(255,215,0,0.30)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(pX+30,pY+104); ctx.lineTo(pX+pW-30,pY+104); ctx.stroke();
  ctx.globalAlpha=1;

  // Level bonus (count-up animation)
  const bonusTotal = levelCompleteMsg==='SELMA SAVED!' ? 2000 : 500;
  const bonusProg  = Math.min(1, Math.max(0,(t-45)/75));
  const bonusNow   = Math.floor(bonusTotal*bonusProg);
  ctx.globalAlpha = Math.min(1,Math.max(0,(t-45)/22));
  ctx.fillStyle='#88ff88';
  ctx.font='bold 20px "Arial Black",Arial';
  ctx.fillText(`Level Bonus:   +${bonusNow}`, W/2, pY+128);
  ctx.globalAlpha=1;

  // Total score (revealed after bonus)
  ctx.globalAlpha=Math.min(1,Math.max(0,(t-100)/22));
  ctx.fillStyle='#ffff99';
  ctx.font='bold 22px "Arial Black",Arial';
  ctx.fillText(`Total Score:   ${score.toLocaleString()}`, W/2, pY+162);
  ctx.globalAlpha=1;

  // Progress bar + "next in Xs"
  const barAlpha=Math.min(1,Math.max(0,(t-140)/22));
  ctx.globalAlpha=barAlpha;
  const bW=340, bH=9, bX=(W-bW)/2, bY=pY+pH-28;
  ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(bX,bY,bW,bH);
  const fg=ctx.createLinearGradient(bX,bY,bX+bW,bY);
  fg.addColorStop(0,'#ffd700'); fg.addColorStop(1,'#ff8800');
  ctx.fillStyle=fg; ctx.fillRect(bX,bY,bW*(t/480),bH);
  ctx.fillStyle='#9999bb'; ctx.font='13px Arial';
  const secs=Math.max(1,Math.ceil((480-t)/60));
  ctx.fillText(`Next in ${secs}s`, W/2, pY+pH-8);
  ctx.globalAlpha=1;

  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
}

function drawLevelStart() {
  ctx.fillStyle = 'rgba(0,0,0,0.68)';
  ctx.fillRect(0, 0, W, H);

  const t = levelStartTimer;

  // Level name
  ctx.fillStyle = '#ffd700';
  ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 18;
  ctx.font = 'bold 38px Arial Black';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('LEVEL ' + (currentLevel + 1), W/2, H/2 - 58);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ccccff';
  ctx.font = '21px Arial';
  ctx.fillText(LEVEL_NAMES[currentLevel] || '', W/2, H/2 - 20);

  // Countdown number
  const step = Math.min(3, Math.floor(t / 90));
  const frac = (t % 90) / 90;
  const labels = ['3','2','1','GO!'];
  const colours = ['#ff6666','#ffaa44','#ffff44','#55ff99'];

  const sc = step < 3
    ? 1.5 - frac * 0.6      // drops 1.5 → 0.9 each second
    : 0.7 + Math.sin(frac * Math.PI) * 0.9; // GO! pops up

  ctx.save();
  ctx.translate(W/2, H/2 + 46); ctx.scale(sc, sc);
  ctx.fillStyle = colours[step];
  ctx.shadowColor = colours[step]; ctx.shadowBlur = 28;
  ctx.font = 'bold 76px Arial Black';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(labels[step], 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

function draw() {
  if (state === 'menu') { drawMenuBackground(); return; }
  drawBackground(currentLevel);
  for (const t of tiles) drawTile(t, currentLevel);
  if (selma) drawSelma(); else drawFlag();
  for (const c of candies)      { if (c.alive) drawCandy(c); }
  for (const h of heartPickups) { if (h.alive) drawHeartPickup(h); }
  for (const m of forkPickups)  { if (m.alive) drawWeaponPickup(m); }
  for (const p of powerPickups) { if (p.alive) drawPowerPickup(p); }
  for (const e of enemies)      drawEnemy(e);
  for (const p of projectiles)  { if (p.alive) drawProjectile(p); }
  drawBoss();
  drawPlayer();
  drawParticles();
  if (player && player.superCape)  drawCapeHUD();
  if (player && player.superBoots) drawBootsHUD();
  if      (state === 'levelcomplete') drawLevelComplete();
  else if (state === 'levelstart')    drawLevelStart();
}
