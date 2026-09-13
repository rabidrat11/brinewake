/**
 * The interface stylesheet.
 *
 * Brinewake's UI is meant to read as the inside of a small research
 * submarine: dark glass panels in brass surrounds, cream lettering, and
 * instruments that look machined rather than drawn. Nothing here is a default
 * browser control.
 *
 * The whole sheet is injected at boot so there is no CSS file to load and the
 * palette can be derived from the same constants the 3D world uses.
 */

export const UI_CSS = /* css */ `
:root {
  --ink:        #061a22;
  --ink-2:      #0a2530;
  --glass:      rgba(8, 30, 38, 0.88);
  --glass-2:    rgba(10, 38, 48, 0.72);
  --brass:      #c9a86a;
  --brass-dim:  #7d6438;
  --brass-lit:  #f0d79c;
  --cream:      #f2e7cd;
  --cream-dim:  #a9bdb9;
  --jade:       #4fb0a4;
  --jade-lit:   #8ff0dc;
  --coral:      #e8896f;
  --warn:       #f0b45c;
  --bad:        #e2634f;
  --good:       #7fd8a2;
  --shadow:     0 12px 40px rgba(0, 0, 0, 0.55);
  --panel-r:    3px;
  --font-ui:    "Avenir Next", "Segoe UI", system-ui, -apple-system, sans-serif;
  --font-display: Georgia, "Iowan Old Style", "Palatino Linotype", serif;
  --font-num:   "SF Mono", "JetBrains Mono", ui-monospace, monospace;
}

* { box-sizing: border-box; }

html, body {
  margin: 0; height: 100%; overflow: hidden;
  background: #04121a; color: var(--cream);
  font-family: var(--font-ui);
  -webkit-font-smoothing: antialiased;
}

#game, #ui { position: fixed; inset: 0; }
#game canvas { display: block; width: 100%; height: 100%; }
#ui { pointer-events: none; z-index: 10; }
#ui > * { pointer-events: auto; }

.bw-canvas { position: absolute; inset: 0; }

/* ---------------------------------------------------------------- HUD */

.hud {
  position: absolute; inset: 0; pointer-events: none;
  font-family: var(--font-ui);
  opacity: 1; transition: opacity .35s ease;
}
.hud.hidden { opacity: 0; }

.hud-left {
  position: absolute; left: 26px; bottom: 26px;
  display: flex; flex-direction: column; gap: 10px; align-items: flex-start;
}
.hud-right {
  position: absolute; right: 26px; bottom: 26px;
  display: flex; flex-direction: column; gap: 10px; align-items: flex-end;
}
.hud-top {
  position: absolute; left: 50%; top: 22px; transform: translateX(-50%);
  display: flex; gap: 14px; align-items: center;
}

/* Instrument dial */
.dial { position: relative; width: 118px; height: 118px; }
.dial svg { display: block; overflow: visible; }
.dial .dial-value {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 1px;
}
.dial .dial-num {
  font-family: var(--font-display); font-size: 27px; line-height: 1;
  color: var(--cream); letter-spacing: -0.5px;
  text-shadow: 0 2px 10px rgba(0,0,0,.7);
}
.dial .dial-unit {
  font-size: 9px; letter-spacing: .22em; text-transform: uppercase;
  color: var(--cream-dim);
}

/* Small readouts */
.gauge {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 12px 7px 10px;
  background: var(--glass); border: 1px solid rgba(201,168,106,.28);
  border-radius: var(--panel-r); backdrop-filter: blur(7px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 4px 18px rgba(0,0,0,.35);
  min-width: 168px;
}
.gauge-icon { width: 15px; height: 15px; flex: 0 0 auto; color: var(--brass); }
.gauge-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.gauge-head {
  display: flex; justify-content: space-between; align-items: baseline;
  font-size: 9px; letter-spacing: .2em; text-transform: uppercase;
  color: var(--cream-dim);
}
.gauge-head b {
  font-family: var(--font-num); font-size: 11px; letter-spacing: 0;
  color: var(--cream); font-weight: 500;
}
.gauge-bar {
  height: 4px; background: rgba(0,0,0,.45); border-radius: 2px; overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0,0,0,.6);
}
.gauge-fill {
  height: 100%; width: 50%; border-radius: 2px;
  background: linear-gradient(90deg, var(--jade), var(--jade-lit));
  transition: width .18s ease-out, background .3s ease;
}
.gauge.warn .gauge-fill { background: linear-gradient(90deg, #b8792c, var(--warn)); }
.gauge.bad  .gauge-fill { background: linear-gradient(90deg, #a83c2c, var(--bad)); }
.gauge.bad  { animation: pulse-bad 1.4s ease-in-out infinite; }
@keyframes pulse-bad {
  0%,100% { border-color: rgba(226,99,79,.35); }
  50%     { border-color: rgba(226,99,79,.85); }
}

/* Tool chip */
.toolchip {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 14px; background: var(--glass);
  border: 1px solid rgba(201,168,106,.34); border-radius: var(--panel-r);
  backdrop-filter: blur(7px); box-shadow: var(--shadow);
}
.toolchip .tc-key {
  font-family: var(--font-num); font-size: 10px; color: var(--ink);
  background: var(--brass); border-radius: 2px; padding: 2px 5px; font-weight: 700;
}
.toolchip .tc-name {
  font-family: var(--font-display); font-size: 15px; color: var(--cream);
}
.toolchip .tc-sub { font-size: 10px; color: var(--cream-dim); letter-spacing: .1em; }
.toolchip.cooling { opacity: .55; }

/* Reticle and target */
.reticle {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
  width: 26px; height: 26px; pointer-events: none;
  opacity: .62; transition: opacity .2s, transform .2s;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,.8));
}
.reticle.active { opacity: 1; transform: translate(-50%,-50%) scale(1.18); }
.target-label {
  position: absolute; left: 50%; top: calc(50% + 26px); transform: translateX(-50%);
  font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
  color: var(--cream); text-shadow: 0 2px 8px #000;
  padding: 3px 9px; background: rgba(6,26,34,.6); border-radius: 2px;
  border: 1px solid rgba(201,168,106,.2);
}
.target-progress {
  position: absolute; left: 50%; top: calc(50% + 48px); transform: translateX(-50%);
  width: 120px; height: 3px; background: rgba(0,0,0,.5); border-radius: 2px; overflow: hidden;
}
.target-progress > div {
  height: 100%; background: var(--jade-lit); width: 0%;
  box-shadow: 0 0 10px var(--jade-lit);
}

/* Depth ribbon */
.depth-ribbon {
  position: absolute; right: 26px; top: 50%; transform: translateY(-50%);
  width: 54px; height: 44vh; min-height: 240px;
  background: linear-gradient(180deg, rgba(8,30,38,.02), rgba(8,30,38,.42));
  border-right: 1px solid rgba(201,168,106,.18);
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 6px 0; pointer-events: none;
}
.depth-ribbon .tick {
  display: flex; align-items: center; justify-content: flex-end; gap: 5px;
  font-family: var(--font-num); font-size: 9px; color: var(--cream-dim);
  padding-right: 6px;
}
.depth-ribbon .tick i { width: 8px; height: 1px; background: rgba(201,168,106,.4); display: block; }
.depth-marker {
  position: absolute; right: 0; width: 100%; height: 0;
  border-top: 1px solid var(--brass-lit);
  box-shadow: 0 0 8px rgba(240,215,156,.6);
}
.depth-marker span {
  position: absolute; right: 60px; top: -9px; white-space: nowrap;
  font-family: var(--font-display); font-size: 15px; color: var(--cream);
  text-shadow: 0 2px 8px #000;
}
.depth-crush {
  position: absolute; right: 0; width: 100%; height: 0;
  border-top: 1px dashed rgba(226,99,79,.7);
}

/* Toasts */
.toasts {
  position: absolute; left: 50%; bottom: 118px; transform: translateX(-50%);
  display: flex; flex-direction: column-reverse; gap: 6px; align-items: center;
  pointer-events: none;
}
.toast {
  padding: 8px 16px; background: var(--glass);
  border: 1px solid rgba(201,168,106,.3); border-left: 2px solid var(--brass);
  border-radius: var(--panel-r); font-size: 13px; color: var(--cream);
  backdrop-filter: blur(7px); box-shadow: var(--shadow);
  animation: toast-in .3s cubic-bezier(.2,.9,.3,1.2);
}
.toast.good { border-left-color: var(--good); }
.toast.warn { border-left-color: var(--warn); }
.toast.bad  { border-left-color: var(--bad); }
.toast.leaving { animation: toast-out .3s ease forwards; }
@keyframes toast-in  { from { opacity:0; transform: translateY(10px) scale(.96);} to {opacity:1;} }
@keyframes toast-out { to { opacity:0; transform: translateY(-6px);} }

/* Discovery card */
.discovery {
  position: absolute; left: 50%; top: 24%; transform: translate(-50%,-50%);
  min-width: 340px; max-width: 460px; text-align: center;
  padding: 22px 30px 24px;
  background: linear-gradient(180deg, rgba(12,42,52,.94), rgba(6,24,32,.94));
  border: 1px solid rgba(201,168,106,.4); border-radius: var(--panel-r);
  box-shadow: var(--shadow), 0 0 60px rgba(79,176,164,.14);
  animation: disc-in .55s cubic-bezier(.16,1,.3,1);
}
.discovery.leaving { animation: disc-out .5s ease forwards; }
.discovery .d-kicker {
  font-size: 9px; letter-spacing: .34em; text-transform: uppercase;
  color: var(--brass); margin-bottom: 8px;
}
.discovery .d-name {
  font-family: var(--font-display); font-size: 27px; line-height: 1.15; color: var(--cream);
}
.discovery .d-sub {
  font-family: var(--font-display); font-style: italic; font-size: 13px;
  color: var(--cream-dim); margin-top: 5px;
}
.discovery .d-rule {
  width: 46px; height: 1px; background: var(--brass); margin: 14px auto 0; opacity: .7;
}
@keyframes disc-in  { from { opacity:0; transform: translate(-50%,-50%) scale(.94);} }
@keyframes disc-out { to   { opacity:0; transform: translate(-50%,-58%) scale(.98);} }

/* Fishing fight */
.fight {
  position: absolute; left: 50%; bottom: 150px; transform: translateX(-50%);
  width: 320px; padding: 12px 16px 14px;
  background: var(--glass); border: 1px solid rgba(201,168,106,.34);
  border-radius: var(--panel-r); backdrop-filter: blur(7px); box-shadow: var(--shadow);
}
.fight-name {
  font-family: var(--font-display); font-size: 15px; text-align: center; margin-bottom: 9px;
}
.fight-bar { height: 9px; background: rgba(0,0,0,.5); border-radius: 2px; overflow: hidden; position: relative; }
.fight-bar > i {
  position: absolute; inset: 0 auto 0 0; display: block;
  background: linear-gradient(90deg, var(--good), var(--warn) 62%, var(--bad));
}
.fight-bar .safe {
  position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,.35);
}
.fight-labels {
  display: flex; justify-content: space-between; margin-top: 6px;
  font-size: 9px; letter-spacing: .18em; text-transform: uppercase; color: var(--cream-dim);
}
.fight-line { height: 4px; background: rgba(0,0,0,.5); border-radius: 2px; margin-top: 9px; overflow: hidden; }
.fight-line > i { display: block; height: 100%; background: var(--jade-lit); }
.fight-strike {
  text-align: center; margin-top: 9px; font-family: var(--font-display);
  font-size: 19px; color: var(--brass-lit); animation: strike 0.34s ease-in-out infinite alternate;
}
@keyframes strike { from { opacity:.55; transform: scale(.97);} to {opacity:1; transform: scale(1.04);} }

/* ------------------------------------------------------------- screens */

.screen {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at 50% 40%, rgba(4,18,26,.72), rgba(2,8,12,.93));
  backdrop-filter: blur(3px);
  animation: fade-in .22s ease;
}
.screen.leaving { animation: fade-out .18s ease forwards; }
@keyframes fade-in  { from { opacity: 0; } }
@keyframes fade-out { to   { opacity: 0; } }

.panel {
  width: min(1100px, 92vw); height: min(760px, 88vh);
  display: flex; flex-direction: column;
  background: linear-gradient(180deg, rgba(11,38,48,.97), rgba(6,22,29,.97));
  border: 1px solid rgba(201,168,106,.34); border-radius: 4px;
  box-shadow: var(--shadow), inset 0 1px 0 rgba(255,255,255,.05);
  overflow: hidden;
  animation: panel-in .28s cubic-bezier(.16,1,.3,1);
}
@keyframes panel-in { from { opacity:0; transform: translateY(14px) scale(.99);} }

.panel-head {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 22px 14px; border-bottom: 1px solid rgba(201,168,106,.2);
  background: linear-gradient(180deg, rgba(201,168,106,.07), transparent);
}
.panel-title {
  font-family: var(--font-display); font-size: 21px; letter-spacing: .01em;
}
.panel-sub { font-size: 11px; color: var(--cream-dim); letter-spacing: .1em; text-transform: uppercase; }
.panel-head .spacer { flex: 1; }

.tabs { display: flex; gap: 2px; }
.tab {
  padding: 7px 15px; font-size: 11px; letter-spacing: .14em; text-transform: uppercase;
  color: var(--cream-dim); background: transparent; border: 1px solid transparent;
  border-radius: 2px; cursor: pointer; transition: all .16s;
  font-family: var(--font-ui);
}
.tab:hover { color: var(--cream); background: rgba(201,168,106,.09); }
.tab.on {
  color: var(--ink); background: var(--brass); border-color: var(--brass-lit);
  font-weight: 600;
}

.panel-body { flex: 1; display: flex; min-height: 0; }
.panel-list {
  width: 340px; flex: 0 0 auto; overflow-y: auto; padding: 10px;
  border-right: 1px solid rgba(201,168,106,.16);
}
.panel-detail { flex: 1; overflow-y: auto; padding: 24px 28px; min-width: 0; }
.panel-foot {
  display: flex; align-items: center; gap: 12px; padding: 12px 22px;
  border-top: 1px solid rgba(201,168,106,.2); font-size: 11px; color: var(--cream-dim);
}
.panel-foot .spacer { flex: 1; }

/* Rows */
.row {
  display: flex; align-items: center; gap: 11px; padding: 9px 11px;
  border: 1px solid transparent; border-radius: 2px; cursor: pointer;
  transition: background .12s, border-color .12s;
}
.row:hover { background: rgba(201,168,106,.08); }
.row.on { background: rgba(79,176,164,.14); border-color: rgba(79,176,164,.4); }
.row.locked { opacity: .42; cursor: default; }
.row-swatch {
  width: 26px; height: 26px; border-radius: 2px; flex: 0 0 auto;
  border: 1px solid rgba(255,255,255,.12);
}
.row-main { flex: 1; min-width: 0; }
.row-name { font-size: 13px; color: var(--cream); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-sub  { font-size: 10px; color: var(--cream-dim); letter-spacing: .06em; }
.row-num  { font-family: var(--font-num); font-size: 12px; color: var(--brass-lit); }

.rarity-common    { color: #9fb6bd; }
.rarity-uncommon  { color: #7fd0a6; }
.rarity-rare      { color: #68b6f0; }
.rarity-exotic    { color: #c79af5; }
.rarity-legendary { color: #f3c56b; }
.rarity-mythic    { color: #f58fb6; }

/* Detail typography */
.detail-title { font-family: var(--font-display); font-size: 27px; line-height: 1.1; }
.detail-latin { font-family: var(--font-display); font-style: italic; color: var(--cream-dim); font-size: 13px; margin-top: 3px; }
.detail-body  { font-size: 13.5px; line-height: 1.62; color: #dfe9e6; margin-top: 16px; max-width: 62ch; }
.detail-note  {
  font-size: 12.5px; line-height: 1.6; color: var(--cream-dim); margin-top: 14px;
  padding-left: 13px; border-left: 2px solid rgba(201,168,106,.4); font-style: italic;
  max-width: 60ch;
}
.detail-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px,1fr)); gap: 12px 22px; margin-top: 20px; }
.stat-k { font-size: 9px; letter-spacing: .2em; text-transform: uppercase; color: var(--cream-dim); }
.stat-v { font-family: var(--font-num); font-size: 14px; color: var(--cream); margin-top: 2px; }

/* Buttons */
.btn {
  font-family: var(--font-ui); font-size: 12px; letter-spacing: .1em; text-transform: uppercase;
  padding: 9px 18px; border-radius: 2px; cursor: pointer; transition: all .15s;
  background: rgba(201,168,106,.1); border: 1px solid rgba(201,168,106,.42); color: var(--cream);
}
.btn:hover { background: rgba(201,168,106,.22); border-color: var(--brass); }
.btn.primary { background: var(--brass); border-color: var(--brass-lit); color: var(--ink); font-weight: 600; }
.btn.primary:hover { background: var(--brass-lit); }
.btn.danger { border-color: rgba(226,99,79,.5); color: var(--bad); }
.btn.danger:hover { background: rgba(226,99,79,.16); }
.btn:disabled { opacity: .35; cursor: default; }
.btn.small { padding: 5px 11px; font-size: 10px; }

/* Model viewport inside panels */
.model-view {
  width: 100%; height: 250px; border: 1px solid rgba(201,168,106,.2); border-radius: 2px;
  background: radial-gradient(ellipse at 50% 45%, rgba(16,52,64,.85), rgba(4,14,20,.95));
  position: relative; overflow: hidden;
}
.model-view canvas { position: absolute; inset: 0; width: 100% !important; height: 100% !important; }

/* Map */
.mapwrap { position: relative; flex: 1; overflow: hidden; }
.mapwrap canvas { display: block; width: 100%; height: 100%; cursor: crosshair; }
.map-legend {
  position: absolute; left: 14px; bottom: 14px; display: flex; flex-direction: column; gap: 5px;
  padding: 10px 13px; background: var(--glass); border: 1px solid rgba(201,168,106,.24);
  border-radius: 2px; font-size: 10px; letter-spacing: .08em;
}
.map-legend i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 7px; }

/* Dialogue */
.dialogue {
  position: absolute; left: 50%; bottom: 60px; transform: translateX(-50%);
  width: min(760px, 88vw);
  background: linear-gradient(180deg, rgba(11,38,48,.96), rgba(6,22,29,.96));
  border: 1px solid rgba(201,168,106,.4); border-radius: 3px;
  box-shadow: var(--shadow); overflow: hidden;
  animation: panel-in .26s cubic-bezier(.16,1,.3,1);
}
.dlg-head { display: flex; align-items: baseline; gap: 12px; padding: 14px 22px 0; }
.dlg-name { font-family: var(--font-display); font-size: 19px; }
.dlg-role { font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: var(--brass); }
.dlg-text { padding: 12px 22px 16px; font-size: 14.5px; line-height: 1.65; color: #e6efec; }
.dlg-choices { display: flex; flex-direction: column; border-top: 1px solid rgba(201,168,106,.18); }
.dlg-choice {
  padding: 11px 22px; font-size: 13px; color: var(--cream-dim); cursor: pointer;
  border-left: 2px solid transparent; transition: all .13s;
}
.dlg-choice:hover { background: rgba(201,168,106,.1); color: var(--cream); border-left-color: var(--brass); }

/* Market and shop lists */
.shop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px,1fr)); gap: 10px; }
.shop-card {
  padding: 13px 15px; background: rgba(255,255,255,.028);
  border: 1px solid rgba(201,168,106,.2); border-radius: 2px; cursor: pointer;
  transition: all .15s;
}
.shop-card:hover { border-color: rgba(201,168,106,.55); background: rgba(201,168,106,.07); }
.shop-card.owned { opacity: .5; }
.shop-name { font-family: var(--font-display); font-size: 15px; }
.shop-price { font-family: var(--font-num); font-size: 13px; color: var(--brass-lit); margin-top: 3px; }
.shop-desc { font-size: 11.5px; line-height: 1.5; color: var(--cream-dim); margin-top: 7px; }

/* Progress rings and misc */
.pill {
  display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px;
  border: 1px solid rgba(201,168,106,.3); border-radius: 10px;
  font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--cream-dim);
}
.money {
  font-family: var(--font-num); font-size: 14px; color: var(--brass-lit);
}
.empty {
  padding: 40px; text-align: center; color: var(--cream-dim); font-size: 13px;
  font-family: var(--font-display); font-style: italic;
}

/* Title screen */
.title-screen {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  justify-content: center; padding-left: 9vw;
  background: linear-gradient(90deg, rgba(3,14,20,.92) 0%, rgba(3,14,20,.55) 38%, transparent 70%);
}
.title-name {
  font-family: var(--font-display); font-size: clamp(52px, 8vw, 104px);
  line-height: .92; letter-spacing: -0.02em; color: var(--cream);
  text-shadow: 0 8px 50px rgba(0,0,0,.7);
}
.title-tag {
  font-family: var(--font-display); font-style: italic;
  font-size: clamp(15px, 1.7vw, 21px); color: var(--brass-lit); margin-top: 14px;
}
.title-menu { margin-top: 42px; display: flex; flex-direction: column; gap: 3px; align-items: flex-start; }
.title-item {
  font-family: var(--font-ui); font-size: 15px; letter-spacing: .14em; text-transform: uppercase;
  color: var(--cream-dim); padding: 9px 2px; cursor: pointer; transition: all .16s;
  border-bottom: 1px solid transparent;
}
.title-item:hover { color: var(--cream); letter-spacing: .2em; border-bottom-color: var(--brass); }
.title-foot {
  position: absolute; left: 9vw; bottom: 34px; font-size: 11px; color: rgba(169,189,185,.55);
}

/* Loading */
.loading {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 20px; background: #04121a; z-index: 50;
}
.loading .lname { font-family: var(--font-display); font-size: 34px; color: var(--cream); }
.loading .lbar { width: 240px; height: 2px; background: rgba(201,168,106,.2); overflow: hidden; }
.loading .lbar i { display: block; height: 100%; background: var(--brass); width: 0%; transition: width .3s; }
.loading .lstep { font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: var(--cream-dim); }

/* Scrollbars */
::-webkit-scrollbar { width: 9px; height: 9px; }
::-webkit-scrollbar-track { background: rgba(0,0,0,.24); }
::-webkit-scrollbar-thumb { background: rgba(201,168,106,.3); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(201,168,106,.5); }

/* Debug overlay */
.debug {
  position: absolute; left: 12px; top: 12px; padding: 10px 13px;
  background: rgba(0,0,0,.72); border: 1px solid rgba(255,255,255,.12); border-radius: 2px;
  font-family: var(--font-num); font-size: 11px; line-height: 1.6; color: #b8f0d8;
  white-space: pre; pointer-events: none; max-height: 80vh; overflow: hidden;
}
.debug b { color: var(--brass-lit); font-weight: 500; }

/* Accessibility helpers */
.reduce-motion * { animation-duration: .001s !important; transition-duration: .001s !important; }
.ui-scale-sm { font-size: 13px; }
.ui-scale-lg { font-size: 17px; }
`;

let injected = false;

export function injectStyles(): void {
  if (injected) return;
  const el = document.createElement('style');
  el.id = 'brinewake-style';
  el.textContent = UI_CSS;
  document.head.appendChild(el);
  injected = true;
}
