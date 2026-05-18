const DEFAULT_LANGS = ["en","ro","fr","es","de","it","ja"];
let DATA = null;
const state = { q: "", langs: new Set() };

const $ = (id) => document.getElementById(id);
const chips = $("chips"), grid = $("grid"), meta = $("meta"), q = $("q");

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderChips() {
  chips.innerHTML = "";
  const allOn = state.langs.size === DATA.languages.length;
  const toggle = document.createElement("button");
  toggle.className = "chip toggle-all";
  toggle.textContent = allOn ? "Show fewer" : "Show all";
  toggle.onclick = () => {
    state.langs = allOn ? new Set(DEFAULT_LANGS) : new Set(DATA.languages.map((l) => l.code));
    render();
  };
  chips.appendChild(toggle);
  for (const lang of DATA.languages) {
    const b = document.createElement("button");
    const on = state.langs.has(lang.code);
    b.className = "chip" + (on ? " on" : "");
    b.innerHTML = '<span style="margin-right:4px">' + lang.flag + "</span>" + lang.name;
    b.onclick = () => {
      if (state.langs.has(lang.code)) state.langs.delete(lang.code);
      else state.langs.add(lang.code);
      if (state.langs.size === 0) state.langs = new Set(DATA.languages.map((l) => l.code));
      render();
    };
    chips.appendChild(b);
  }
}

function filteredAnimals() {
  const qv = state.q.trim().toLowerCase();
  if (!qv) return DATA.animals;
  return DATA.animals.filter((a) => {
    if (a.nameEn.toLowerCase().includes(qv)) return true;
    const row = DATA.sounds[a.id] || {};
    for (const c of Object.keys(row)) {
      const s = row[c];
      if (!s) continue;
      if (s.text.toLowerCase().includes(qv) || s.ipa.toLowerCase().includes(qv)) return true;
    }
    return false;
  });
}

function render() {
  renderChips();
  const langs = DATA.languages.filter((l) => state.langs.has(l.code));
  const anims = filteredAnimals();
  meta.textContent = anims.length + " animals · " + langs.length + " languages";
  grid.style.gridTemplateColumns = "minmax(180px,220px) repeat(" + langs.length + ",minmax(140px,1fr))";
  let html = '<div class="hcell animal-h">Animal</div>';
  for (const l of langs) {
    html += '<div class="hcell"><span class="flag">' + l.flag + '</span><span class="name">' + l.name + "</span></div>";
  }
  if (anims.length === 0) {
    html += '<div style="grid-column:1/-1;padding:48px;text-align:center;color:var(--muted)">No animals match "' + escapeHtml(state.q) + '".</div>';
  } else {
    for (const a of anims) {
      html += '<div class="rhead"><span class="emoji">' + a.emoji + "</span><span>" + a.nameEn + "</span></div>";
      for (const l of langs) {
        const s = (DATA.sounds[a.id] || {})[l.code];
        if (!s) { html += '<div class="cell empty">—</div>'; continue; }
        html += '<div class="cell" tabindex="0"><span class="txt">' + escapeHtml(s.text) + "</span>"
              + '<span class="tip"><span class="lbl">' + l.name + ' · IPA</span><span class="ipa">' + escapeHtml(s.ipa) + "</span></span></div>";
      }
    }
  }
  grid.innerHTML = html;
}

q.addEventListener("input", (e) => { state.q = e.target.value; render(); });

fetch("./data.json")
  .then((r) => r.json())
  .then((d) => {
    DATA = d;
    state.langs = new Set(DATA.languages.map((l) => l.code));
    render();
  });
