#!/usr/bin/env python3
"""Build the planning page (plan.html) for an edit.

Usage: make_plan_page.py <project_dir> [--title "My edit"]

Reads <project_dir>/transcript.json (cut timing) and, if present, plan.json (to pre-fill).
Writes <project_dir>/plan.html — self-contained; the user picks colors/fonts, then for every
script line a scene type + highlight word + free-text idea, and clicks "Export plan.json".
"""
import argparse
import html
import json
import os
import re

SANS = ["Inter", "Manrope", "DM Sans", "Creato Display"]  # Creato Display has no č/ć
SCRIPT = ["Cormorant Garamond", "Playfair Display", "EB Garamond", "Instrument Serif"]
TYPES = [("captions", "Captions"), ("ui", "Captions + UI"), ("halfscreen", "Half screen"), ("fullscreen", "Full screen")]


def split_lines(words, max_words=14, gap=0.55):
    lines, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        end_sent = re.search(r"[.!?…]$", w["w"]) is not None or (w["w"].endswith(",") and len(cur) >= 6)
        big_gap = nxt is not None and nxt["start"] - w["end"] > gap
        if end_sent or big_gap or len(cur) >= max_words or nxt is None:
            lines.append(cur)
            cur = []
    return [
        {"id": f"L{i + 1:02d}", "text": " ".join(x["w"] for x in l), "start": l[0]["start"], "end": l[-1]["end"]}
        for i, l in enumerate(lines)
    ]


PAGE = r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Edit Plan</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&family=Manrope:wght@400;600&family=DM+Sans:wght@400;600&family=Cormorant+Garamond:ital,wght@1,600;1,700&family=Playfair+Display:ital,wght@1,700&family=EB+Garamond:ital,wght@1,600&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet">
<style>
@font-face{font-family:'Creato Display';src:url('../../fonts/CreatoDisplay-Medium.otf');font-weight:500}
@font-face{font-family:'Creato Display';src:url('../../fonts/CreatoDisplay-Regular.otf');font-weight:400}
:root{--bg:#F1EEE9;--card:#fff;--ink:#1d1d1f;--mute:#77736c;--line:#e3ded6;--acc:#F19A3E}
@media (prefers-color-scheme:dark){:root{--bg:#121214;--card:#1c1c20;--ink:#f1f1f1;--mute:#9a9aa2;--line:#2c2c33}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 Inter,system-ui,sans-serif}
header{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);padding:14px 24px;display:flex;gap:16px;align-items:center;justify-content:space-between}
h1{font-size:18px;margin:0;font-weight:800;letter-spacing:-.01em}h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--mute);margin:0 0 12px}
main{max-width:1180px;margin:0 auto;padding:24px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;margin-bottom:20px}
.style-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:16px;align-items:end}
label{display:block;font-size:12px;color:var(--mute);margin-bottom:6px;font-weight:600}
select,input[type=text],textarea{width:100%;padding:9px 10px;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--ink);font:inherit}
input[type=color]{width:100%;height:40px;border:1px solid var(--line);border-radius:10px;background:transparent;padding:3px}
.swatches{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}.swatches button{width:22px;height:22px;border-radius:50%;border:1px solid rgba(0,0,0,.15);cursor:pointer}
.preview{margin-top:18px;border-radius:14px;background:linear-gradient(180deg,#3a3a3a,#141414);padding:34px 20px;text-align:center}
.preview .s{color:var(--sans-color);font-weight:500;font-size:22px;text-shadow:0 2px 8px rgba(0,0,0,.35)}
.preview .x{font-style:italic;font-weight:700;font-size:46px;line-height:.9;display:block;text-shadow:0 0 22px var(--glow)}
.row{display:grid;grid-template-columns:70px minmax(0,1fr) 170px 150px minmax(0,1.3fr);gap:12px;padding:14px 0;border-top:1px solid var(--line);align-items:start}
.row:first-of-type{border-top:0}.t{font-variant-numeric:tabular-nums;color:var(--mute);font-size:12px;padding-top:9px}
.txt{padding-top:8px;font-weight:500}textarea{min-height:64px;resize:vertical}
.legend{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;font-size:13px;color:var(--mute);margin-top:4px}
.legend b{color:var(--ink)}
.btn{background:var(--ink);color:var(--bg);border:0;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer}
.btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line)}
.tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;margin-top:6px}
.tag.captions{background:#e8e5df;color:#555}.tag.ui{background:#dfe8ff;color:#2a4fb8}.tag.halfscreen{background:#efe1ff;color:#6a2fb0}.tag.fullscreen{background:#ffe5d6;color:#b04b12}
@media (max-width:860px){.row{grid-template-columns:1fr}.t{padding:0}header{flex-wrap:wrap}}
#toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:10px 16px;border-radius:10px;opacity:0;transition:.2s}
</style></head><body>
<header><h1>__TITLE__ <span style="color:var(--mute);font-weight:500">· edit plan</span></h1>
<div style="display:flex;gap:8px"><button class="btn ghost" id="copy">Copy JSON</button><button class="btn" id="export">Export plan.json</button></div></header>
<main>
<section class="card"><h2>1 · Look of the edit</h2>
<div class="style-grid">
 <div><label>Accent color</label><input type="color" id="accent"><div class="swatches" id="sw"></div></div>
 <div><label>Sans font (main words)</label><select id="sansFont">__SANS__</select></div>
 <div><label>Script font (special words)</label><select id="scriptFont">__SCRIPT__</select></div>
 <div><label>Sans color</label><input type="color" id="sansColor"></div>
 <div><label>Script color</label><input type="color" id="scriptColor"></div>
 <div><label>Look of the edit</label><select id="bg"><option value="mix">Mix — Claude picks per scene</option><option value="paper">Mostly paper + cast shadow</option><option value="white">Mostly clean white</option><option value="dark">Mostly dark</option></select></div>
</div>
<div class="preview" id="pv"><span class="s">What's the</span><span class="x" id="pvx">30,000ft</span><span class="s">view on this</span></div>
</section>
<section class="card"><h2>2 · Scene types</h2><div class="legend">
<div><b>Captions</b> — just me talking with text on screen.</div>
<div><b>Captions + UI</b> — text + a small animation in the lower half (I get darkened + blurred).</div>
<div><b>Half screen</b> — animation on the top half, me on the bottom half.</div>
<div><b>Full screen</b> — the animation takes over the whole screen.</div></div></section>
<section class="card"><h2>3 · Script & plan</h2><div id="rows"></div></section>
</main><div id="toast"></div>
<script>
const LINES=__LINES__;const PREV=__PREV__;const KEY='plan:'+__SLUG__;
const TYPES=__TYPES__;
const LOOKS=[['auto','Auto (Claude)'],['paper','Paper + shadow'],['white','Clean white'],['grey','Light grey'],['dark','Dark'],['accent','Accent colour']];
const presets=['#F19A3E','#E2B04A','#5FB7A0','#3E6FD8','#8E6BE8','#C8483B','#6D8B74','#5C7A99'];
const $=id=>document.getElementById(id);
let saved=null;try{saved=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
const base=saved||PREV||{};const st=Object.assign({accent:'#F19A3E',sansFont:'Inter',scriptFont:'Cormorant Garamond',sansColor:'#F3F3F3',scriptColor:'#F19A3E',bg:'mix'},base.style||{});
for(const k of Object.keys(st)){if($(k))$(k).value=st[k]}
$('sw').innerHTML=presets.map(c=>`<button style="background:${c}" data-c="${c}" title="${c}"></button>`).join('');
$('sw').onclick=e=>{const c=e.target.dataset.c;if(!c)return;$('accent').value=c;$('scriptColor').value=c;upd()};
const byId={};(base.lines||[]).forEach(l=>byId[l.id]=l);
const fmt=s=>{const m=Math.floor(s/60);return m+':'+(s%60).toFixed(1).padStart(4,'0')};
$('rows').innerHTML=LINES.map(l=>{const p=byId[l.id]||{};const ty=p.type||'captions';
return `<div class="row" data-id="${l.id}"><div class="t">${l.id}<br>${fmt(l.start)}</div><div class="txt">${l.text.replace(/</g,'&lt;')}<br><span class="tag ${ty}">${TYPES.find(t=>t[0]==ty)[1]}</span></div>
<div><label>Scene type</label><select class="ty">${TYPES.map(t=>`<option value="${t[0]}"${t[0]==ty?' selected':''}>${t[1]}</option>`).join('')}</select><label style="margin-top:10px">Background</label><select class="bgl">${LOOKS.map(t=>`<option value="${t[0]}"${t[0]==(p.bg||'auto')?' selected':''}>${t[1]}</option>`).join('')}</select></div>
<div><label>Highlight word(s)</label><input type="text" class="hl" placeholder="e.g. three mistakes" value="${(p.highlight||[]).join(', ').replace(/"/g,'&quot;')}"></div>
<div><label>What happens on screen</label><textarea class="nt" placeholder="Describe the animation / UI / zoom…">${(p.notes||'').replace(/</g,'&lt;')}</textarea></div></div>`}).join('');
function collect(){const style={};for(const k of Object.keys(st))style[k]=$(k).value;
const lines=LINES.map(l=>{const r=document.querySelector(`.row[data-id="${l.id}"]`);return Object.assign({},l,{type:r.querySelector('.ty').value,highlight:r.querySelector('.hl').value.split(',').map(s=>s.trim()).filter(Boolean),notes:r.querySelector('.nt').value.trim(),bg:r.querySelector('.bgl').value})});
return {style,lines}}
function upd(){const s=collect().style;document.documentElement.style.setProperty('--sans-color',s.sansColor);const x=$('pvx');x.style.color=s.scriptColor;x.style.fontFamily=`'${s.scriptFont=='Adobe Garamond'?'Cormorant Garamond':s.scriptFont}',serif`;document.documentElement.style.setProperty('--glow',s.scriptColor+'66');document.querySelectorAll('.preview .s').forEach(e=>e.style.fontFamily=`'${s.sansFont}',sans-serif`);
document.querySelectorAll('.row').forEach(r=>{const t=r.querySelector('.ty').value,tag=r.querySelector('.tag');tag.className='tag '+t;tag.textContent=TYPES.find(x=>x[0]==t)[1]});
try{localStorage.setItem(KEY,JSON.stringify(collect()))}catch(e){}}
document.addEventListener('input',upd);document.addEventListener('change',upd);upd();
const toast=m=>{const t=$('toast');t.textContent=m;t.style.opacity=1;setTimeout(()=>t.style.opacity=0,1800)};
$('export').onclick=()=>{const b=new Blob([JSON.stringify(collect(),null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='plan.json';a.click();toast('plan.json downloaded — move it into the project folder (or tell Claude it is in Downloads)')};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(JSON.stringify(collect(),null,1));toast('Copied — paste it to Claude')}catch(e){toast('Copy failed, use Export')}};
</script></body></html>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--title", default=None)
    args = ap.parse_args()
    P = args.project
    tr = json.load(open(os.path.join(P, "transcript.json")))
    lines = split_lines(tr["words"])
    prev_path = os.path.join(P, "plan.json")
    prev = json.load(open(prev_path)) if os.path.exists(prev_path) else None
    slug = os.path.basename(os.path.abspath(P))
    opts = lambda xs: "".join(f'<option value="{html.escape(x)}">{html.escape(x)}</option>' for x in xs)
    page = (
        PAGE.replace("__TITLE__", html.escape(args.title or slug))
        .replace("__SANS__", opts(SANS))
        .replace("__SCRIPT__", opts(SCRIPT))
        .replace("__LINES__", json.dumps(lines, ensure_ascii=False))
        .replace("__PREV__", json.dumps(prev, ensure_ascii=False))
        .replace("__SLUG__", json.dumps(slug))
        .replace("__TYPES__", json.dumps(TYPES))
    )
    out = os.path.join(P, "plan.html")
    open(out, "w").write(page)
    json.dump(lines, open(os.path.join(P, "lines.json"), "w"), ensure_ascii=False, indent=1)
    print(f"{out}  ({len(lines)} lines)")


if __name__ == "__main__":
    main()
