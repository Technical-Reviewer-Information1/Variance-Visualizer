(function () {
  'use strict';
  const C = window.Chart, T = window.Tools, $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  function el(n, a, t) { const e = document.createElementNS(NS, n); for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]); if (t != null) e.textContent = t; return e; }

  function stats(v) {
    const n = v.length;
    if (!n) return { n: 0, mean: 0, va: 0, sd: 0 };
    const mean = v.reduce((a, b) => a + b, 0) / n;
    const va = v.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    return { n, mean, va, sd: Math.sqrt(va) };
  }

  /* ---------- STEP1 2クラス比較 ---------- */
  const A = [58, 60, 61, 62, 62, 63, 64, 65, 66, 69];
  const B = [35, 42, 48, 55, 62, 68, 74, 80, 88, 78];
  function dotplot(box, vals, label) {
    const W = 420, H = 160, M = { l: 34, r: 14, t: 14, b: 30 };
    const iw = W - M.l - M.r;
    const lo = 20, hi = 100;
    const X = v => M.l + (v - lo) / (hi - lo) * iw;
    box.innerHTML = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': label });
    svg.style.display = 'block';
    for (let v = lo; v <= hi; v += 20) {
      svg.appendChild(el('line', { x1: X(v), y1: M.t, x2: X(v), y2: H - M.b, stroke: '#ebe8e2' }));
      svg.appendChild(el('text', { x: X(v), y: H - M.b + 15, 'text-anchor': 'middle', 'font-size': 10, fill: '#858a92', 'font-family': 'monospace' }, v));
    }
    svg.appendChild(el('line', { x1: M.l, y1: H - M.b, x2: W - M.r, y2: H - M.b, stroke: '#4a4f57', 'stroke-width': 1.4 }));
    const st = stats(vals);
    svg.appendChild(el('line', { x1: X(st.mean), y1: M.t - 4, x2: X(st.mean), y2: H - M.b, stroke: '#8a5a00', 'stroke-width': 2, 'stroke-dasharray': '5 3' }));
    svg.appendChild(el('text', { x: X(st.mean), y: M.t + 4, 'text-anchor': 'middle', 'font-size': 10, fill: '#8a5a00', 'font-family': 'monospace' }, '平均'));
    const seen = {};
    vals.forEach(v => {
      seen[v] = (seen[v] || 0) + 1;
      svg.appendChild(el('circle', { cx: X(v), cy: H - M.b - 9 - (seen[v] - 1) * 15, r: 6, fill: 'rgba(18,58,107,.65)', stroke: '#fff', 'stroke-width': 1.2 }));
    });
    box.appendChild(svg);
    return st;
  }

  /* ---------- STEP2 ドラッグできる数直線 ---------- */
  const LW = 620, LH = 150, LM = { l: 40, r: 20, t: 20, b: 34 };
  const LIW = LW - LM.l - LM.r;
  const LO = 0, HI = 100;
  let vals = [30, 45, 50, 55, 70];
  let drag = -1;
  const LX = v => LM.l + (v - LO) / (HI - LO) * LIW;
  const LinvX = px => LO + (px - LM.l) / LIW * (HI - LO);
  const clamp = v => Math.max(LO, Math.min(HI, Math.round(v)));

  function drawLine() {
    const box = $('lineBox'); box.innerHTML = '';
    const st = stats(vals);
    const svg = el('svg', { viewBox: `0 0 ${LW} ${LH}`, width: '100%', role: 'application', 'aria-label': '数直線。点をドラッグして値を変えられます' });
    svg.style.display = 'block';
    const baseY = LH - LM.b;
    for (let v = LO; v <= HI; v += 10) {
      svg.appendChild(el('line', { x1: LX(v), y1: baseY - 4, x2: LX(v), y2: baseY + 4, stroke: '#858a92' }));
      if (v % 20 === 0) svg.appendChild(el('text', { x: LX(v), y: baseY + 18, 'text-anchor': 'middle', 'font-size': 10, fill: '#858a92', 'font-family': 'monospace' }, v));
    }
    svg.appendChild(el('line', { x1: LM.l, y1: baseY, x2: LW - LM.r, y2: baseY, stroke: '#4a4f57', 'stroke-width': 1.6 }));
    // 平均線
    svg.appendChild(el('line', { x1: LX(st.mean), y1: LM.t - 6, x2: LX(st.mean), y2: baseY, stroke: '#8a5a00', 'stroke-width': 2, 'stroke-dasharray': '5 3' }));
    svg.appendChild(el('text', { x: LX(st.mean), y: LM.t - 10, 'text-anchor': 'middle', 'font-size': 11, fill: '#8a5a00', 'font-family': 'monospace', 'font-weight': 700 }, '平均 ' + st.mean.toFixed(1)));
    // 偏差の線
    vals.forEach((v, i) => {
      const y = LM.t + 18 + (i % 4) * 16;
      svg.appendChild(el('line', { x1: LX(st.mean), y1: y, x2: LX(v), y2: y,
        stroke: v >= st.mean ? '#123a6b' : '#b3261e', 'stroke-width': 2 }));
    });
    vals.forEach((v, i) => {
      svg.appendChild(el('circle', { cx: LX(v), cy: baseY - 14, r: 9, class: 'dot', 'data-i': i,
        fill: 'rgba(18,58,107,.75)', stroke: '#fff', 'stroke-width': 1.6 }));
      svg.appendChild(el('text', { x: LX(v), y: baseY - 14, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
        'font-size': 9, fill: '#fff', 'font-family': 'monospace', 'pointer-events': 'none' }, v));
    });
    box.appendChild(svg);
    drawSquares(st); drawTable(st); drawSd();
  }

  function drawSquares(st) {
    const box = $('sqBox'); box.innerHTML = '';
    const devs = vals.map(v => v - st.mean);
    const maxAbs = Math.max(...devs.map(Math.abs), st.sd, 1);
    const scale = 62 / maxAbs;                       // 1単位あたりの画素
    const W = Math.max(320, vals.length * 76 + 130), H = 165;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': '偏差の2乗を表す正方形' });
    const baseY = H - 26;
    devs.forEach((d, i) => {
      const s = Math.abs(d) * scale;
      const x = 14 + i * 76;
      svg.appendChild(el('rect', { x: x, y: baseY - s, width: Math.max(1, s), height: Math.max(1, s),
        fill: d >= 0 ? 'rgba(18,58,107,.16)' : 'rgba(179,38,30,.16)',
        stroke: d >= 0 ? '#123a6b' : '#b3261e', 'stroke-width': 1.2 }));
      svg.appendChild(el('text', { x: x + s / 2, y: baseY + 14, 'text-anchor': 'middle', 'font-size': 10,
        fill: '#4a4f57', 'font-family': 'monospace' }, (d >= 0 ? '+' : '') + d.toFixed(1)));
    });
    const ss = st.sd * scale, xs = 14 + vals.length * 76 + 18;
    svg.appendChild(el('rect', { x: xs, y: baseY - ss, width: Math.max(1, ss), height: Math.max(1, ss),
      fill: 'rgba(138,90,0,.10)', stroke: '#8a5a00', 'stroke-width': 3 }));
    svg.appendChild(el('text', { x: xs + ss / 2, y: baseY + 14, 'text-anchor': 'middle', 'font-size': 10,
      fill: '#8a5a00', 'font-family': 'monospace', 'font-weight': 700 }, '平均'));
    svg.setAttribute('viewBox', `0 0 ${xs + Math.max(40, ss) + 20} ${H}`);
    box.appendChild(svg);

    $('vN').textContent = st.n;
    $('vMean').textContent = st.mean.toFixed(1);
    $('vVar').textContent = st.va.toFixed(1);
    $('vSd').textContent = st.sd.toFixed(2);
    const n = $('vNote');
    if (st.sd === 0) { n.className = 'note warn'; n.innerHTML = 'すべて同じ値なので偏差はすべて 0。<strong>分散も標準偏差も 0</strong> です。ちらばりがない状態です。'; }
    else if (st.sd < 8) { n.className = 'note ok'; n.innerHTML = '正方形が小さくそろっています。<strong>データが平均の近くに集まっている</strong>状態です。'; }
    else { n.className = 'note info'; n.innerHTML = '大きな正方形が混じっています。<strong>平均から遠い値ほど、2乗されて分散に強く効きます</strong>。1つ離れた値を作って確かめてください。'; }
  }

  function drawTable(st) {
    const tb = $('devTable').tBodies[0], tf = $('devTable').tFoot;
    tb.innerHTML = '';
    let sd = 0, ss = 0;
    vals.forEach((v, i) => {
      const d = v - st.mean; sd += d; ss += d * d;
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + (i + 1) + '</td><td>' + v + '</td><td style="color:' +
        (d >= 0 ? 'var(--accent)' : 'var(--ng)') + '">' + (d >= 0 ? '+' : '') + d.toFixed(1) + '</td><td>' + (d * d).toFixed(2) + '</td>';
      tb.appendChild(tr);
    });
    tf.innerHTML = '<tr><td colspan="2">合計</td><td>' + (Math.abs(sd) < 1e-9 ? '0.0' : sd.toFixed(1)) +
      '</td><td>' + ss.toFixed(2) + '</td></tr>';
    $('eqNote').innerHTML =
      '平均値 x̄ ＝ (' + vals.join(' + ') + ') ÷ ' + st.n + ' ＝ <strong>' + st.mean.toFixed(1) + '</strong><br>' +
      '分散 ＝ ' + ss.toFixed(2) + ' ÷ ' + st.n + ' ＝ <strong>' + st.va.toFixed(2) + '</strong>（点²）<br>' +
      '標準偏差 ＝ √' + st.va.toFixed(2) + ' ＝ <strong>' + st.sd.toFixed(2) + '</strong>（点）';
  }

  function drawSd() {
    const k = +$('sdRange').value;
    $('sdRangeV').textContent = k;
    const st = stats(vals);
    const lo = st.mean - k * st.sd, hi = st.mean + k * st.sd;
    const inside = vals.filter(v => v >= lo && v <= hi).length;
    C.scatter($('sdChart'), { W: 620, H: 180, points: vals.map((v, i) => [v, 1]),
      xMin: LO, xMax: HI, yMin: 0, yMax: 2, r: 7,
      colors: vals.map(v => (v >= lo && v <= hi) ? 'rgba(31,122,61,.75)' : 'rgba(179,38,30,.8)'),
      xLabel: '値', margin: { t: 14, r: 18, b: 40, l: 30 } });
    const n = $('sdNote');
    n.className = 'note info';
    n.innerHTML = '平均 ' + st.mean.toFixed(1) + ' ± ' + k + '×' + st.sd.toFixed(2) + ' ＝ <span class="mono">' +
      lo.toFixed(1) + ' 〜 ' + hi.toFixed(1) + '</span> の範囲に <strong>' + inside + ' / ' + vals.length +
      ' 個（' + (inside / vals.length * 100).toFixed(0) + '％）</strong>が入っています。' +
      (k === 1 ? '　左右対称な分布ではおよそ7割が ±1標準偏差に入るとされます。' :
       k === 2 ? '　±2標準偏差ではおよそ95％が入るのが目安です。' : '　±3標準偏差からはみ出す値は非常にまれです。');
  }

  /* ---------- 操作 ---------- */
  function pointerX(ev) {
    const svg = $('lineBox').querySelector('svg');
    const rect = svg.getBoundingClientRect();
    const cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - rect.left;
    return cx * (LW / rect.width);
  }
  function onDown(ev) {
    const t = ev.target;
    if (t.classList && t.classList.contains('dot')) { drag = +t.dataset.i; ev.preventDefault(); }
  }
  function onMove(ev) {
    if (drag < 0) return;
    ev.preventDefault();
    vals[drag] = clamp(LinvX(pointerX(ev)));
    drawLine();
  }
  function onUp() { drag = -1; }

  const SETS = {
    tight: [46, 48, 50, 52, 54],
    spread: [10, 30, 50, 70, 90],
    same: [50, 50, 50, 50, 50],
    one: [45, 47, 49, 51, 95]
  };


  /* ---------- STEP4 テストA・Bの比較 ---------- */
  function drawAB() {
    // 平均70・標準偏差10 と 平均70・標準偏差5 の分布を作って見せる
    const mk = (sd, seed) => {
      const out = [];
      for (let i = 0; i < 40; i++) {
        const u = ((Math.sin((i + seed) * 12.9898) * 43758.5453) % 1 + 1) % 1;
        const v = ((Math.sin((i + seed) * 78.233) * 12345.6789) % 1 + 1) % 1;
        const z = Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.cos(2 * Math.PI * v);
        out.push(Math.max(20, Math.min(100, Math.round(70 + z * sd))));
      }
      return out;
    };
    const A = mk(10, 3), B = mk(5, 11);
    const edges = [40, 50, 60, 70, 80, 90, 100];
    const cnt = arr => { const c = new Array(6).fill(0); arr.forEach(v => c[Math.max(0, Math.min(5, Math.floor((v - 40) / 10)))]++); return c; };
    const box = $('abChart');
    box.innerHTML = '<div class="grid c2"><div><div style="font-size:.8rem;color:var(--ink-2);margin-bottom:4px">テストA（標準偏差10点）</div><div id="abA"></div></div>' +
                    '<div><div style="font-size:.8rem;color:var(--ink-2);margin-bottom:4px">テストB（標準偏差5点）</div><div id="abB"></div></div></div>';
    C.hist(document.getElementById('abA'), { W: 420, H: 230, counts: cnt(A), edges, unit: '人' });
    C.hist(document.getElementById('abB'), { W: 420, H: 230, counts: cnt(B), edges, unit: '人' });
  }

  /* ---------- STEP5 偏差値 ---------- */
  function drawHensa() {
    const x = +$('myScore').value, m = +$('avgScore').value, sd = Math.max(1, +$('sdScore').value);
    $('myScoreV').textContent = x; $('avgScoreV').textContent = m; $('sdScoreV').textContent = sd;
    const dev = x - m, z = dev / sd, h = 50 + 10 * z;
    $('devOut').textContent = (dev >= 0 ? '+' : '') + dev;
    $('zOut').textContent = z.toFixed(2);
    $('hensaOut').textContent = h.toFixed(1);
    // 正規分布としたときの上位割合
    const p = (1 - normCdf(z)) * 100;
    $('pctOut').textContent = p.toFixed(1);
    const n = $('hensaNote');
    if (Math.abs(dev) < 1e-9) {
      n.className = 'note info';
      n.innerHTML = 'ちょうど平均点なので偏差値は <strong>50</strong>。標準偏差がいくつでも、平均と同じ点なら偏差値は50です。';
    } else {
      n.className = 'note ' + (h >= 50 ? 'ok' : 'warn');
      n.innerHTML = '平均より <strong>' + Math.abs(dev) + '点</strong>' + (dev > 0 ? '上' : '下') +
        '。それは標準偏差 ' + sd + '点 の <strong>' + Math.abs(z).toFixed(2) + '個分</strong>にあたるので、偏差値は <strong>' +
        h.toFixed(1) + '</strong>。<br>同じ ' + Math.abs(dev) + '点の差でも、<strong>標準偏差が小さいテストほど偏差値は大きく動きます</strong>。' +
        'スライダーで標準偏差を変えて確かめてください。';
    }
    // 分布と自分の位置
    const pts = [], step = 0.5;
    for (let v = m - 4 * sd; v <= m + 4 * sd; v += sd / 8) {
      pts.push([v, Math.exp(-0.5 * ((v - m) / sd) ** 2)]);
    }
    C.scatter($('hensaChart'), { W: 620, H: 220, points: pts, r: 2.6,
      xMin: m - 4 * sd, xMax: m + 4 * sd, yMin: 0, yMax: 1.15,
      colors: pts.map(q => Math.abs(q[0] - x) < sd / 8 ? '#b3261e' : 'rgba(18,58,107,.35)'),
      xLabel: '点数（赤い位置があなたの点）', margin: { t: 14, r: 18, b: 42, l: 34 } });
  }
  function normCdf(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }

  /* ---------- STEP7 自分のデータ ---------- */
  let grid = null, gridHeader = [];
  function refreshCols(rows, header) {
    gridHeader = header;
    const nums = grid ? grid.numericColumns() : [];
    const sel = $('colSel');
    const prev = sel.value;
    sel.innerHTML = header.map((h, j) =>
      '<option value="' + j + '"' + (nums.indexOf(j) < 0 ? ' disabled' : '') + '>' + h +
      (nums.indexOf(j) < 0 ? '（数値でない列）' : '') + '</option>').join('');
    if (prev !== '' && sel.querySelector('option[value="' + prev + '"]:not([disabled])')) sel.value = prev;
    else if (nums.length) sel.value = nums[0];
    calcMine();
  }
  function calcMine() {
    if (!grid) return;
    const j = +$('colSel').value;
    const vals = grid.column(j);
    const n = $('myNote');
    if (vals.length < 2) {
      n.hidden = false; n.className = 'note ng';
      n.textContent = '数値が2つ以上必要です。表に入力するか、ファイルを読み込んでください。';
      ['myStats', 'myDevTable', 'myChart', 'mySquares', 'myTools'].forEach(i => $(i).innerHTML = '');
      $('myEq').innerHTML = '';
      return;
    }
    const st = stats(vals);
    $('myStats').innerHTML =
      '<div class="metric"><div class="k">個数 n</div><div class="v">' + st.n + '</div></div>' +
      '<div class="metric"><div class="k">平均値</div><div class="v">' + st.mean.toFixed(3) + '</div></div>' +
      '<div class="metric"><div class="k">分散</div><div class="v">' + st.va.toFixed(3) + '</div></div>' +
      '<div class="metric"><div class="k">標準偏差</div><div class="v">' + st.sd.toFixed(3) + '</div></div>';
    // 計算表
    let sumDev = 0, sumSq = 0;
    const body = vals.map((v, i) => {
      const d = v - st.mean; sumDev += d; sumSq += d * d;
      return '<tr><td>' + (i + 1) + '</td><td>' + v + '</td><td style="color:' +
        (d >= 0 ? 'var(--accent)' : 'var(--ng)') + '">' + (d >= 0 ? '+' : '') + d.toFixed(3) +
        '</td><td>' + (d * d).toFixed(3) + '</td></tr>';
    }).join('');
    $('myDevTable').innerHTML =
      '<thead><tr><th>#</th><th>値 x</th><th>偏差 x−x̄</th><th>偏差の2乗 (x−x̄)²</th></tr></thead><tbody>' + body +
      '</tbody><tfoot><tr><td colspan="2">合計</td><td>' + (Math.abs(sumDev) < 1e-9 ? '0.000' : sumDev.toFixed(3)) +
      '</td><td>' + sumSq.toFixed(3) + '</td></tr></tfoot>';
    $('myEq').innerHTML =
      '平均値 x̄ ＝ ' + vals.reduce((a, b) => a + b, 0).toFixed(3) + ' ÷ ' + st.n + ' ＝ <strong>' + st.mean.toFixed(3) + '</strong><br>' +
      '偏差の合計 ＝ <strong>' + (Math.abs(sumDev) < 1e-9 ? '0' : sumDev.toFixed(3)) + '</strong>（必ず0になります）<br>' +
      '分散 ＝ 偏差の2乗の合計 ' + sumSq.toFixed(3) + ' ÷ ' + st.n + ' ＝ <strong>' + st.va.toFixed(3) + '</strong><br>' +
      '標準偏差 ＝ √' + st.va.toFixed(3) + ' ＝ <strong>' + st.sd.toFixed(3) + '</strong>';
    // 分布図（±1SD を色分け）
    const lo = st.mean - st.sd, hi = st.mean + st.sd;
    const inside = vals.filter(v => v >= lo && v <= hi).length;
    C.scatter($('myChart'), { W: 420, H: 220, points: vals.map(v => [v, 1]), r: 6,
      xMin: Math.min(...vals) - st.sd, xMax: Math.max(...vals) + st.sd, yMin: 0, yMax: 2,
      colors: vals.map(v => (v >= lo && v <= hi) ? 'rgba(31,122,61,.75)' : 'rgba(179,38,30,.75)'),
      xLabel: '緑＝平均±標準偏差の中', margin: { t: 14, r: 18, b: 40, l: 28 } });
    drawSquaresFor(vals, st, $('mySquares'));
    n.hidden = false; n.className = 'note info';
    n.innerHTML = '列「<strong>' + (gridHeader[j] || '') + '</strong>」の ' + st.n + ' 個。平均 ' + st.mean.toFixed(2) +
      '、標準偏差 <strong>' + st.sd.toFixed(2) + '</strong>。平均±標準偏差（' + lo.toFixed(2) + '〜' + hi.toFixed(2) +
      '）の範囲に <strong>' + inside + ' 個（' + (inside / st.n * 100).toFixed(0) + '％）</strong>が入っています。' +
      (st.sd === 0 ? 'すべて同じ値なので標準偏差は0です。' : '');
    $('myTools').innerHTML = '';
    $('myTools').appendChild(T.saveButton(() => $('myChart').querySelector('svg'), '分布'));
    const sh = document.createElement('button');
    sh.className = 'btn sm ghost'; sh.textContent = 'このデータのURLを作る';
    sh.addEventListener('click', () => T.share({ d: grid.getRaw(), h: grid.getHeader(), j: j }, sh));
    $('myTools').appendChild(sh);
    const pr = document.createElement('button');
    pr.className = 'btn sm ghost'; pr.textContent = '印刷する';
    pr.addEventListener('click', T.printPage);
    $('myTools').appendChild(pr);
  }

  /** 任意のデータで偏差の2乗を正方形として描く */
  function drawSquaresFor(v, st, box) {
    box.innerHTML = '';
    const devs = v.map(x => x - st.mean);
    const show = devs.slice(0, 12);
    const maxAbs = Math.max(...show.map(Math.abs), st.sd, 1e-6);
    const scale = 56 / maxAbs;
    const cw = 46, W = show.length * cw + 90, H = 150;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', '100%');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', '偏差の2乗を表す正方形');
    const baseY = H - 24;
    show.forEach((d, i) => {
      const s = Math.abs(d) * scale, x = 8 + i * cw;
      svg.appendChild(el('rect', { x, y: baseY - s, width: Math.max(1, s), height: Math.max(1, s),
        fill: d >= 0 ? 'rgba(18,58,107,.16)' : 'rgba(179,38,30,.16)',
        stroke: d >= 0 ? '#123a6b' : '#b3261e', 'stroke-width': 1.1 }));
      svg.appendChild(el('text', { x: x + s / 2, y: baseY + 13, 'text-anchor': 'middle', 'font-size': 9,
        fill: '#4a4f57', 'font-family': 'monospace' }, (d >= 0 ? '+' : '') + d.toFixed(1)));
    });
    const ss = st.sd * scale, xs = 8 + show.length * cw + 14;
    svg.appendChild(el('rect', { x: xs, y: baseY - ss, width: Math.max(1, ss), height: Math.max(1, ss),
      fill: 'rgba(138,90,0,.10)', stroke: '#8a5a00', 'stroke-width': 3 }));
    svg.appendChild(el('text', { x: xs + ss / 2, y: baseY + 13, 'text-anchor': 'middle', 'font-size': 9,
      fill: '#8a5a00', 'font-family': 'monospace', 'font-weight': 700 }, '平均'));
    svg.setAttribute('viewBox', '0 0 ' + (xs + Math.max(50, ss) + 16) + ' ' + H);
    box.appendChild(svg);
    if (devs.length > 12) {
      const p = document.createElement('p');
      p.className = 'why'; p.style.marginTop = '6px';
      p.textContent = '（最初の12個のみ表示しています）';
      box.appendChild(p);
    }
  }

  /* ---------- STEP6 クイズ ---------- */
  const QUIZ = [
    { t: 'データ 2, 4, 6, 8, 10 の分散はいくらか。', choices: ['8', '6', '10', '2.83'], a: '8',
      why: '平均は6。偏差は −4,−2,0,2,4。2乗して 16,4,0,4,16 → 合計40 → 40÷5＝8。標準偏差は√8≒2.83です。' },
    { t: '偏差の合計はいくらになるか。', choices: ['必ず0', 'データによる', '必ず正', '平均値と同じ'], a: '必ず0',
      why: '偏差は「平均からのずれ」。プラスのずれとマイナスのずれがちょうど打ち消しあうので、合計は必ず0になります。だから2乗してから平均するのです。' },
    { t: 'すべてのデータに10を足すと、標準偏差はどうなるか。', choices: ['変わらない', '10増える', '10倍になる', '半分になる'], a: '変わらない',
      why: '全部が同じだけ動くので、平均も同じだけ動き、平均からのずれ（偏差）は変わりません。ちらばりの大きさは変わらないので標準偏差も変わりません。' },
    { t: 'すべてのデータを2倍すると、分散はどうなるか。', choices: ['4倍になる', '2倍になる', '変わらない', '半分になる'], a: '4倍になる',
      why: '偏差も2倍になり、それを2乗するので 2²＝4倍です。標準偏差のほうは2倍になります。' },
    { t: '分散が0になるのはどんなときか。', choices: ['すべての値が同じとき', '平均が0のとき', 'データが1つもないとき', '値に負の数があるとき'], a: 'すべての値が同じとき',
      why: '全部同じなら偏差はすべて0。2乗しても0なので分散も0です。分散は2乗の平均なので、負になることはありません。' },
    { t: '平均60点・標準偏差5点のテストで70点。平均60点・標準偏差20点のテストでも70点。よりめずらしいのはどちらか。', choices: ['標準偏差5点のテスト', '標準偏差20点のテスト', '同じ', '判断できない'], a: '標準偏差5点のテスト',
      why: '平均との差10点が、標準偏差の何個分かで考えます。5点のテストでは2個分、20点のテストでは0.5個分。標準偏差5点のほうがはるかにめずらしい成績です。' }
  ];
  let qList = [], qi = 0, qScore = 0;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function startQuiz() { qList = shuffle(QUIZ); qi = 0; qScore = 0; renderQ(); }
  function renderQ() {
    if (qi >= qList.length) {
      $('qText').textContent = qScore + ' / ' + qList.length + ' 問正解';
      $('qChoices').innerHTML = ''; $('qFb').hidden = true; $('qNext').disabled = true;
      $('qProgress').textContent = qList.length + ' / ' + qList.length; return;
    }
    const it = qList[qi];
    $('qProgress').textContent = (qi + 1) + ' / ' + qList.length;
    $('qScore').textContent = qScore;
    $('qText').textContent = it.t;
    const box = $('qChoices'); box.className = 'choice4'; box.innerHTML = '';
    shuffle(it.choices).forEach(c => {
      const b = document.createElement('button');
      b.className = 'btn'; b.textContent = c; b.dataset.c = c;
      b.addEventListener('click', () => answerQ(c));
      box.appendChild(b);
    });
    $('qFb').hidden = true; $('qNext').disabled = true;
    $('qNext').textContent = (qi === qList.length - 1) ? '結果を見る' : '次の問題';
  }
  function answerQ(c) {
    const it = qList[qi], ok = c === it.a, box = $('qChoices');
    box.classList.add('locked');
    [...box.children].forEach(b => {
      if (b.dataset.c === it.a) b.classList.add('correct');
      else if (b.dataset.c === c) b.classList.add('wrong');
    });
    if (ok) qScore++;
    const fb = $('qFb');
    fb.className = 'note ' + (ok ? 'ok' : 'ng');
    fb.innerHTML = (ok ? '正解。' : '正解は <strong>' + it.a + '</strong>。') + it.why;
    fb.hidden = false;
    $('qScore').textContent = qScore; $('qNext').disabled = false;
  }

  function init() {
    const sa = dotplot($('grpA'), A, 'A組の分布'), sb = dotplot($('grpB'), B, 'B組の分布');
    $('aMean').textContent = sa.mean.toFixed(1); $('aVar').textContent = sa.va.toFixed(1); $('aSd').textContent = sa.sd.toFixed(2);
    $('bMean').textContent = sb.mean.toFixed(1); $('bVar').textContent = sb.va.toFixed(1); $('bSd').textContent = sb.sd.toFixed(2);

    const box = $('lineBox');
    box.addEventListener('mousedown', onDown);
    box.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    document.querySelectorAll('[data-set]').forEach(b => b.addEventListener('click', () => { vals = SETS[b.dataset.set].slice(); drawLine(); }));
    $('addDot').addEventListener('click', () => { if (vals.length < 9) { vals.push(50); drawLine(); } });
    $('delDot').addEventListener('click', () => { if (vals.length > 2) { vals.pop(); drawLine(); } });
    $('sdRange').addEventListener('input', drawSd);
    ['myScore', 'avgScore', 'sdScore'].forEach(i => $(i).addEventListener('input', drawHensa));
    $('qNext').addEventListener('click', () => { qi++; renderQ(); });
    $('qReset').addEventListener('click', startQuiz);
    $('colSel').addEventListener('change', calcMine);
    $('calcMine').addEventListener('click', calcMine);

    const shared = T.readShared();
    const initData = (shared && shared.d) ? shared.d :
      [['1番','62'],['2番','58'],['3番','71'],['4番','65'],['5番','80'],['6番','55'],
       ['7番','68'],['8番','74'],['9番','60'],['10番','67']];
    const initHeader = (shared && shared.h) ? shared.h : ['生徒', 'テストの点数'];
    grid = window.DataInput.create($('dataInput'), {
      header: initHeader, data: initData, minRows: 3, onChange: refreshCols
    });
    window.Terms.glossary($('glossBox'), ['偏差', '分散', '標準偏差', '平均値', '代表値', '外れ値', '間隔尺度']);
    drawLine(); startQuiz(); drawAB(); drawHensa();
    refreshCols(grid.getData(), grid.getHeader());
    window.Terms.attach();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
