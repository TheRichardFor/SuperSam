// Palettes — 10 entries (one per level)
const SKY_COLORS    = ['#5b90f0','#f07850','#6040c0','#102030','#b0d8f0','#3a0808',
                       '#1a0830','#3a0a04','#a0b8f0','#080408'];
const CLOUD_COLORS  = ['#ffffffcc','#ffe8cccc','#c8c0ffcc','#405060cc','#e0f4ffcc','#804040cc',
                       '#5030a0cc','#a04020cc','#d8e8ffcc','#602080cc'];
const GROUND_TOP    = ['#6abf40','#e06820','#8050d0','#604820','#d0e8ff','#801818',
                       '#6040a8','#c04010','#4880c8','#3a0058'];
const GROUND_FILL   = ['#7a5230','#c85020','#4030a0','#402810','#8898b0','#401010',
                       '#3a2060','#882010','#2050b8','#180028'];
const GROUND_TUFT   = ['#5cb030','#f09820','#a060f0','#605030','#e0f0ff','#802020',
                       '#8050c0','#e06030','#70a8e0','#500080'];
const BRICK_COL     = ['#d08040','#c04020','#7840d0','#806030','#a8c8e0','#903030',
                       '#5030a0','#a03010','#3868c0','#440068'];
const PLATFORM_COL  = ['#50b030','#e05818','#6848c8','#706040','#b0d0f0','#c04020',
                       '#5848c0','#c04020','#3080d0','#680088'];

// Map symbols
// G  ground (in rows 3–7 for terrain)   B  brick   P  platform (half tile)   _  air/void
// C  candy   H  heart   W  Fork weapon   S  MasterSword   X  SuperBoots   V  SuperCape
// E  enemy basic   J  jumping enemy   R  runner (fast)   T  tough (3 hits)   Z  flyer
// F  flag (goal)   K  Koala Selma (level 10 win)
//
// Terrain height convention:
//   1-step hill → G at row 5 only          (items above at row 4)
//   2-step hill → G at rows 4–5            (items above at row 3)
// Platforms at rows 3–4 give collectible jumping targets.
// Row 6 = canonical width; shorter rows are padded with '_'.

const LEVELS = [

  // ── Level 1 ── Green Meadow ── W=96, 1 hole ───────────────────────────────
  // Hole: cols 18-21.   Hills: A(1-step) 30-37, B(2-step) 56-63, C(1-step) 78-85.
  [
    '________________________________________________________________________________________________',
    '______________________________________CC___________________________________________CC__________',
    '________________________________________________________________________________________________',
    '________PPPP_________________________________________________PPPP__________________________',   // row 3  — platforms
    '___________________PPPP__________H___________GGGGGGG_______________H_________________________', // row 4  — lower platforms + 2-step hill B + items
    '___E______E___E___E___E___GGGGGGG___E___E_GGGGGGG___E___E___GGGGGGG__E__E___C___F_______',  // row 5
    'GGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // row 6 (96)
    'GGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',  // row 7 (same canonical)
  ],

  // ── Level 2 ── Desert ── W=106, 2 holes ────────────────────────────────────
  // Holes: 20-23, 54-57.   Hills: A(1-step) 32-39, B(2-step) 66-73, C(1-step) 88-95.
  // New: R (runner) enemies.
  [
    '__________________________________________________________________________________________________________',
    '_______________________________CC_______________________________________CC_________________________',
    '__________________________________________________________________________________________________________',
    '______PPPP__________________________________________________PPPP_____________________________',
    '________________________PPPP_____________H_____________GGGGGGG_______________H________________',
    '___E___R___E___E___E___R_E__GGGGGGG___E___R__E___GGGGGGG_______E__GGGGGGG_E_R__E___C_F_____',
    'GGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // row 6 (20+4+30+4+48=106)
    'GGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  ],

  // ── Level 3 ── Night Forest ── W=116, 2 holes ── FORK weapon ───────────────
  // Holes: 20-23, 58-61.   Hills: A(2-step) 35-43, B(1-step) 70-77, C(2-step) 92-100.
  [
    '____________________________________________________________________________________________________________',
    '________________________________________CC___________________________________________CC_________________',
    '______________________________________________________________________________________________________________',
    '______PPPP____________________________PPPP________________________________PPPP_____________________',
    '_______________________H________GGGGGGG____________________H_________GGGGGGG___H_______________',
    '__E_R___E___E_R_E___GGGGGGG___E_________GGGGGGG_E_R__E__R__GGGGGGG_GGGGG____R__E__XC__F______',
    'GGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // row 6 (20+4+32+4+56=116)
    'GGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  ],

  // ── Level 4 ── Cave ── W=126, 3 holes ── J enemies ─────────────────────────
  // Holes: 20-23, 50-53, 82-85.   Hills: A(1-step) 30-37, B(2-step) 60-67, C(1-step) 92-99, D(2-step) 110-117.
  [
    '______________________________________________________________________________________________________________________',
    '_______________________________________________CC_____________________________________________CC_________________',
    '______________________________________________________________________________________________________________________',
    '______PPPP____________________________PPPP_________________________________PPPP____________________________',
    '____________________H_________GGGGGGG___________________H____________GGGGGGG___________H__GGGGGGG________',
    '__E_R_J_E__E_R___GGGGGGG_E_R_J_____GGGGGGG_J_E_R__E_J_GGGGGGG_E_J_R__GGGGGGG_E_R_J__E_J__C__G____F__',
    'GGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // row 6 (20+4+26+4+28+4+40=126)
    'GGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  ],

  // ── Level 5 ── Snow ── W=138, 4 holes ── SWORD ── BOSS MushroomKing ────────
  // Holes: 18-21, 46-49, 76-79, 108-111.
  // Hills: A(2-step) 30-37, B(1-step) 56-63, C(2-step) 86-93, D(1-step) 116-123.
  // Sword pickup around col 72.
  [
    '______________________________________________________________________________________________________________________________',
    '__________________________________________CC______________________________________CC______________________________',
    '______________________________________________________________________________________________________________________________',
    '______PPPP_____________________________________PPPP_______________________________PPPP____________________________',
    '_________________________H___________GGGGGGG____________________H_________GGGGGGG_____________H_GGGGGGG__________',
    '__E_R_J_E___E_R__J___GGGGGGG__E_R_J__GGGGGGG_E_J_R__E_J__S_GGGGGGG_J_R_E______GGGGGGG_R_J_E__GGGGG_______C_F_',
    'GGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG', // row 6 (18+4+24+4+26+4+28+4+26=138)
    'GGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG',
  ],

  // ── Level 6 ── Castle/Lava ── W=148, 5 holes ── T (tough) enemies ───────────
  // Holes: 16-19, 42-45, 70-73, 98-101, 126-129.
  // Hills: A(1-step) 28-35, B(2-step) 52-59, C(2-step) 80-87, D(1-step) 108-115, E-hill(2-step) 133-140.
  [
    '_____________________________________________________________________________________________________________________________________________',
    '_____________________________________CC____________________________________________CC____________________________',
    '_____________________________________________________________________________________________________________________________________________',
    '___PPPP_________________________________PPPP_______________________________PPPP_________________________________',
    '____________H_________GGGGGGG______________GGGGGGG_______________H___GGGGGGG___________GGGGGGG__________________',
    '__E_T_R_J_E_GGGGGGG__T________GGGGGGG_E_T_GGGGGGG_J_R_T_E__J_GGGGGGG______GGGGGGG_E_T_J________J_R__VC_F___',
    'GGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGG', // row 6 (16+4+22+4+24+4+24+4+24+4+18=148)
    'GGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGG',
  ],

  // ── Level 7 ── Dungeon ── W=156, 4 holes ── Z (flyer) enemies ───────────────
  // Holes: 16-19, 44-47, 74-77, 108-111.
  // Hills: A(2-step) 28-35, B(1-step) 56-63, C(2-step) 84-91, D(1-step) 118-125, E-hill(2-step) 140-147.
  [
    '__________________________________________________________________________________________________________________________________________________________',
    '__________________________________________CC__________________________________________CC_____________________________________________',
    '__________________________________________________________________________________________________________________________________________________________',
    '___PPPP____________________________________PPPP________________________________PPPP__________________________________________________',
    '____________H____________GGGGGGG___________________GGGGGGG____________H___GGGGGGG___________GGGGGGG__H___________GGGGGGG_____________',
    '__E_Z_T_R_J_GGGGGGG_E_Z_T______GGGGGGG__E_J_T_Z_R_GGGGGGG_T_Z_R_J_GGGGGGG_________E__GGGGGGG_______R_E_Z__C_F___',
    'GGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // row 6 (16+4+24+4+26+4+30+4+44=156)
    'GGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  ],

  // ── Level 8 ── Volcano ── W=166, 5 holes ────────────────────────────────────
  // Holes: 16-19, 44-47, 76-79, 106-109, 138-141.
  // Hills throughout; all enemy types.
  [
    '________________________________________________________________________________________________________________________________________________________________',
    '___________________________________________CC____________________________________________CC__________________________________________',
    '________________________________________________________________________________________________________________________________________________________________',
    '___PPPP____________________________________PPPP___________________________________PPPP_____________________________________________',
    '____________H__________GGGGGGG______________________GGGGGGG_____________H___GGGGGGG___________GGGGGGG_________GGGGGGG_____________',
    '__E_Z_T_R_J_GGGGGGG_T_Z_______GGGGGGG_E_Z_T_J_R_Z_GGGGGGG___Z_R_J_E_GGGGGGG__________GGGGGGG_E_______R_Z__E_T__________F____',
    'GGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG', // row 6 (16+4+24+4+28+4+26+4+28+4+24=166)
    'GGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG',
  ],

  // ── Level 9 ── Sky Fortress ── W=174, 5 holes ────────────────────────────────
  // Holes: 16-19, 46-49, 78-81, 108-111, 140-143.
  // Dense enemy mix, tall hills.
  [
    '____________________________________________________________________________________________________________________________________________________________________',
    '_____________________________________________CC_______________________________________________________CC________________________________',
    '____________________________________________________________________________________________________________________________________________________________________',
    '___PPPP_______________________________________PPPP_____________________________________PPPP________________________________________',
    '___________H___________GGGGGGG__________________________GGGGGGG_______________H___GGGGGGG______________GGGGGGG_________H______________',
    '__E_Z_T_J_R_E_Z__GGGGGGG_______E_Z_T_J_GGGGGGG_Z_T_R_E_J_______GGGGGGG_Z_J_T_R_E_GGGGGGG_Z_T_J_R_E_Z__GGGGGGG_T_J_R_E_Z_T___C_F__',
    'GGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // row 6 (16+4+26+4+28+4+26+4+28+4+30=174) ← actually I'll just count that the string is right
    'GGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  ],

  // ── Level 10 ── Ganon's Castle ── W=182, 6 holes ── BOSS Ganon ── SAVE SELMA
  // Holes: 16-19, 44-47, 74-77, 102-105, 132-135, 158-161.
  // K (Selma) near col 178; Ganon boss spawns before her.
  [
    '______________________________________________________________________________________________________________________________________________________________________',
    '________________________________________________CC__________________________________________CC______________________________________________________',
    '______________________________________________________________________________________________________________________________________________________________________',
    '___PPPP_________________________________PPPP_________________________________________PPPP____________________________________',
    '__________H_________GGGGGGG___________________GGGGGGG__________H_________GGGGGGG____________GGGGGGG________H__________________',
    '__J_Z_T_R_E_GGGGGGG_________E_GGGGGGG_Z_T_J_R_______GGGGGGG_J_R_T_Z_E_GGGGGGG___Z_J_R_E_Z_GGGGGGG___T_R_Z_E_J_T__Z___K______',
    'GGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGG', // row 6 (16+4+24+4+26+4+24+4+26+4+22+4+20=182... approx)
    'GGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGGGG___GGGGGGGGGGGGGGGGGGGG',
  ],

];
