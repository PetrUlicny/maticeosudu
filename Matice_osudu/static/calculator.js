// =========================================================
// 1. ZÁKLADNÍ NASTAVENÍ A MATEMATICKÉ FUNKCE
// =========================================================
const reduceNumber = norm;

function norm(x) {
  while (x > 22) {
    let sum = 0, temp = x;
    while (temp > 0) { sum += temp % 10; temp = Math.floor(temp / 10); }
    x = sum;
  }
  return x || 0;
}

function buildNodes(dob) {
  const [day, month, year] = dob.split('.').map(Number);
  const D = norm(day), M = norm(month), Y = norm(year), S = norm(D + M + Y);
  return { W: D, NW: norm(D + M), N: M, NE: norm(M + Y), E: Y, SE: norm(Y + S), S, SW: norm(D + S) };
}

function edgeSubperiods(A, B) {
  let L = [A, B];
  for (let iter = 0; iter < 3; iter++) {
    const L2 = [];
    for (let k = 0; k < L.length - 1; k++) {
      L2.push(L[k]); L2.push(norm(L[k] + L[k + 1]));
    }
    L2.push(L[L.length - 1]);
    L = L2;
  }
  return L.slice(0, 8);
}

function getAgeInYears(dob, atDate = new Date()) {
  const [day, month, year] = dob.split('.').map(Number);
  const birthDate = new Date(year, month - 1, day);
  let ageYears = atDate.getFullYear() - birthDate.getFullYear();
  if (atDate.getMonth() < birthDate.getMonth() || (atDate.getMonth() === birthDate.getMonth() && atDate.getDate() < birthDate.getDate())) ageYears--;
  const lastBirthday = new Date(birthDate.getFullYear() + ageYears, birthDate.getMonth(), birthDate.getDate());
  return ageYears + Math.floor((atDate - lastBirthday) / (1000 * 60 * 60 * 24)) / 365.25;
}

function energyAtAge(nodes, ageYears) {
  const age80 = ((ageYears % 80) + 80) % 80;
  const s = Math.floor(age80 / 10), t = age80 - 10 * s;
  const sectorEdges = [['W', 'NW'], ['NW', 'N'], ['N', 'NE'], ['NE', 'E'], ['E', 'SE'], ['SE', 'S'], ['S', 'SW'], ['SW', 'W']];
  const SEQ = edgeSubperiods(nodes[sectorEdges[s][0]], nodes[sectorEdges[s][1]]);

  // Návrat k původním přesným hranicím!
  const B = [0, 1, 2.5, 3.5, 5, 6, 7.5, 8.5, 10];
  for (let k = 0; k < B.length - 1; k++) { if (t >= B[k] && t < B[k + 1]) return SEQ[k]; }
  return SEQ[0];
}

function getAgeSubperiod(ageYears) {
  const age80 = ((ageYears % 80) + 80) % 80;
  const sector = age80 < 30 ? (age80 < 10 ? 6 : (age80 < 20 ? 7 : 0)) : Math.floor(age80 / 10) - 2;
  const ageLabels = [20, 30, 40, 50, 60, 70, 0, 10];
  const baseAge = ageLabels[sector], t = age80 - baseAge;
  const subperiodBounds = [0, 1, 2.5, 3.5, 5, 6, 7.5, 8.5, 10];
  let sIdx = 0;
  for (let i = 0; i < subperiodBounds.length - 1; i++) {
    if (t >= subperiodBounds[i] && t < subperiodBounds[i + 1]) { sIdx = i; break; }
  }

  const fmt = a => a % 1 === 0 ? a.toString() : a.toFixed(1).replace('.', ',');

  // Chytré formátování textu
  if (sIdx === 0) {
    return `${baseAge} let`; // Hlavní rohy (20, 30...)
  } else if (sIdx === 4) {
    return `${baseAge + 5} let`; // Přesné středy (25, 35...)
  } else {
    let s = (baseAge + subperiodBounds[sIdx]) % 80;
    let e = (baseAge + subperiodBounds[sIdx + 1]) % 80;
    return `${fmt(s)}-${fmt(e)} let`; // Všechna ostatní rozmezí (27,5-28,5)
  }
}

function threeEnergiesAtDate(dob, atDate = new Date()) {
  const nodes = buildNodes(dob), ageYears = getAgeInYears(dob, atDate);
  const age80 = ((ageYears % 80) + 80) % 80;
  const E3 = energyAtAge(nodes, age80), E1 = energyAtAge(nodes, (age80 + 40) % 80);
  return { E1, E2: norm(E3 + E1), E3, agePeriod: getAgeSubperiod(ageYears), nodes };
}

function calculateMatrix(date) {
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(date)) throw new Error('Nesprávný formát data. Použijte DD.MM.RRRR');
  const [day, month, year] = date.split('.').map(Number);

  const A = norm(day), B = month, C = norm(year);
  const D = norm(A + B + C), E = norm(A + B + C + D);

  const A1 = norm(A + E), B1 = norm(B + E), C1 = norm(C + E), D1 = norm(D + E);
  const A2 = norm(A + A1), B2 = norm(B + B1), C2 = norm(C + C1), D2 = norm(D1 + D);

  const L = norm(D1 + C1), R = norm(D1 + L), M = norm(L + C1);
  const F = norm(A + B), P = norm(C + B), Y = norm(C + D), X = norm(A + D);

  const E1 = norm(F + P + X + Y), E2 = norm(E + E1);
  const F1 = norm(F + E1), F2 = norm(F + F1), P1 = norm(P + E1), P2 = norm(P + P1);
  const Y1 = norm(Y + E1), Y2 = norm(Y + Y1), X1 = norm(X + E1), X2 = norm(X + X1);
  const E4 = norm(B1 + E), E5 = norm(A1 + E);

  const sahasrara = [A, B, norm(A + B)], ajna = [A2, B2, norm(B2 + A2)], vishuddha = [A1, B1, norm(A1 + B1)];
  const anahata = [E5, E4, norm(E4 + E5)], manipura = [E, E, norm(E + E)], svadhisthana = [C1, D1, norm(C1 + D1)], muladhara = [C, D, norm(D + C)];
  const sumIdx = idx => norm(sahasrara[idx] + ajna[idx] + vishuddha[idx] + anahata[idx] + manipura[idx] + svadhisthana[idx] + muladhara[idx]);

  const nebo = norm(B + D), zemlya = norm(A + C);
  const M_line = norm(F + Y), Zh_line = norm(P + X);

  return {
    A, B, C, D, E, A1, A2, B1, B2, C1, C2, D1, D2, L, R, M, F, P, Y, X,
    E1, E2, F1, F2, P1, P2, Y1, Y2, X1, X2, E4, E5,
    nebo, zemlya, M_line, Zh_line, total: norm(norm(nebo + zemlya) + norm(M_line + Zh_line)),
    chakras: { sahasrara, ajna, vishuddha, anahata, manipura, svadhisthana, muladhara },
    totalEnergies: [sumIdx(0), sumIdx(1), sumIdx(2)]
  };
}

// =========================================================
// 2. VYKRESLOVÁNÍ SVG GRAFIKY (MATICE A DIAGRAMY)
// =========================================================
function createMatrixSVG(res, periodData) {
  let svg = `<svg viewBox="40 40 920 920" xmlns="http://www.w3.org/2000/svg">`;
  const cx = 500, cy = 500;

  const R_OCT = 360;
  const r_outer_circles = 34;
  const R_MAIN = R_OCT - r_outer_circles;

  const line = (p1, p2, col) => `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${col}" stroke-width="1.5" />`;
  const circle = (p) => `
    <circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${p.fill}" stroke="#4E2358" stroke-width="2" />
    <text x="${p.x}" y="${p.y}" fill="${p.text}" font-size="${p.r * 0.9}" font-family="Arial" font-weight="bold" text-anchor="middle" dominant-baseline="central">${p.val}</text>
  `;

  const getP = (ang, factor, val, r = 18, fill = '#fff', text = '#000') => ({
    x: cx + Math.cos(ang * Math.PI / 180) * R_MAIN * factor, y: cy + Math.sin(ang * Math.PI / 180) * R_MAIN * factor, r, val, fill, text
  });

  const pos = {
    A: getP(180, 1.02, res.A, 30, '#8a46a3', '#fff'), A2: getP(180, 0.85, res.A2, 25, '#526df8', '#fff'), A1: getP(180, 0.71, res.A1, 20, '#45cfe1', '#fff'), E5: getP(180, 0.35, res.E5, 18, '#afde61', '#fff'),
    C: getP(0, 1.02, res.C, 30, '#ef4141', '#fff'), C2: getP(0, 0.85, res.C2, 25, '#fff', '#000'), C1: getP(0, 0.71, res.C1, 20, '#ffae34', '#fff'), E2: getP(0, 0.34, res.E2, 20),
    B: getP(270, 1.02, res.B, 30, '#8a46a3', '#fff'), B2: getP(270, 0.85, res.B2, 25, '#526df8', '#fff'), B1: getP(270, 0.71, res.B1, 20, '#45cfe1', '#fff'), E4: getP(270, 0.35, res.E4, 18, '#afde61', '#fff'),
    D: getP(90, 1.02, res.D, 30, '#ef4141', '#fff'), D2: getP(90, 0.85, res.D2, 25, '#fff', '#000'), D1: getP(90, 0.71, res.D1, 20, '#ffae34', '#fff'), E1: getP(0, 0.2, res.E1, 25),
    E: getP(0, 0, res.E, 40, '#ffed47'),

    F: getP(225, 1.0, res.F, 28), F2: getP(225, 0.843, res.F2, 22), F1: getP(225, 0.72, res.F1, 18),
    P: getP(315, 1.0, res.P, 28), P2: getP(315, 0.843, res.P2, 22), P1: getP(315, 0.72, res.P1, 18),
    X: getP(135, 1.0, res.X, 28), X2: getP(135, 0.843, res.X2, 22), X1: getP(135, 0.72, res.X1, 18),
    Y: getP(45, 1.0, res.Y, 28), Y2: getP(45, 0.843, res.Y2, 22), Y1: getP(45, 0.72, res.Y1, 18)
  };

  pos.L = { x: (pos.D1.x + pos.C1.x) / 2, y: (pos.D1.y + pos.C1.y) / 2, r: 18, val: res.L, fill: '#fff', text: '#000' };
  pos.Heart = { x: (pos.D1.x + pos.L.x) / 2, y: (pos.D1.y + pos.L.y) / 2, r: 18, val: res.R, fill: '#fff', text: '#000' };
  pos.Money = { x: (pos.L.x + pos.C1.x) / 2, y: (pos.L.y + pos.C1.y) / 2, r: 18, val: res.M, fill: '#fff', text: '#000' };

  const lineColor = '#4E2358';

  const bgLines = [
    [pos.A, pos.C, lineColor], [pos.B, pos.D, lineColor], [pos.F, pos.P, lineColor], [pos.X, pos.Y, lineColor],
    [pos.A, pos.D, lineColor], [pos.B, pos.C, lineColor], [pos.F, pos.X, lineColor], [pos.P, pos.Y, lineColor],
    [pos.A, pos.B, lineColor], [pos.C, pos.D, lineColor],
    [pos.E, pos.A, lineColor], [pos.E, pos.B, lineColor], [pos.E, pos.C, lineColor], [pos.E, pos.D, lineColor],
    [pos.F, pos.E, '#0059b3'], [pos.P, pos.E, '#f91212'], [pos.X, pos.E, '#f91212'], [pos.Y, pos.E, '#0059b3'],
  ];
  bgLines.forEach(l => { svg += line(l[0], l[1], l[2]); });

  svg += `<line x1="${pos.D1.x}" y1="${pos.D1.y}" x2="${pos.C1.x}" y2="${pos.C1.y}" stroke="${lineColor}" stroke-width="1.5" stroke-dasharray="6,6" />`;

  let midF_x = (pos.E.x + pos.F.x) / 1.9;
  let midF_y = (pos.E.y + pos.F.y) / 2;
  svg += `<text x="${midF_x}" y="${midF_y}" transform="rotate(45, ${midF_x}, ${midF_y})" dy="-1" fill="#0059b3" font-size="14" text-anchor="middle">male generation line</text>`;

  let midP_x = (pos.E.x + pos.P.x) / 2.1;
  let midP_y = (pos.E.y + pos.P.y) / 2;
  svg += `<text x="${midP_x}" y="${midP_y}" transform="rotate(-45, ${midP_x}, ${midP_y})" dy="-1" fill="#f91212" font-size="14" text-anchor="middle">female generation line</text>`;

  if (periodData) {
    const nodes = periodData.nodes;
    const ageLabels = [20, 30, 40, 50, 60, 70, 0, 10];
    const nodeOrder = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    let octPoints = [];
    for (let i = 0; i < 8; i++) {
      let ang = -90 + (i * 45);
      octPoints.push(`${cx + Math.cos(ang * Math.PI / 180) * R_OCT},${cy + Math.sin(ang * Math.PI / 180) * R_OCT}`);
    }
    svg += `<polygon points="${octPoints.join(' ')}" fill="none" stroke="${lineColor}" stroke-width="2" />`;

    for (let i = 0; i < 8; i++) {
      let r1 = (-90 + (i * 45)) * Math.PI / 180;
      let r2 = (-90 + ((i + 1) * 45)) * Math.PI / 180;

      let X1 = cx + Math.cos(r1) * R_OCT;
      let Y1 = cy + Math.sin(r1) * R_OCT;
      let X2 = cx + Math.cos(r2) * R_OCT;
      let Y2 = cy + Math.sin(r2) * R_OCT;

      let cxX = (X1 - cx) / R_OCT, cyY = (Y1 - cy) / R_OCT;
      svg += `<text x="${X1 + cxX * 45}" y="${Y1 + cyY * 45}" fill="#FFFFFF" font-size="20" font-weight="bold" text-anchor="middle" dominant-baseline="central">${ageLabels[i]} let</text>`;
      const subperiods = edgeSubperiods(nodes[nodeOrder[i]], nodes[nodeOrder[(i + 1) % 8]]);
      // Zde také vracíme správné hranice
      const subBounds = [0, 1, 2.5, 3.5, 5, 6, 7.5, 8.5, 10];

      let dx = X2 - X1, dy = Y2 - Y1;
      let len = Math.sqrt(dx * dx + dy * dy);
      let nx = dy / len, ny = -dx / len;

      let margin = 45;
      let offsetRatio = margin / len;
      let safeRatio = 1 - (2 * offsetRatio);

      for (let k = 1; k <= 7; k++) {
        let linearF = k / 8;
        let safeLinearF = offsetRatio + (linearF * safeRatio);

        let px = X1 + dx * safeLinearF;
        let py = Y1 + dy * safeLinearF;

        // Kroužky energií (vnější strana)
        let outX = px + nx * 22;
        let outY = py + ny * 22;
        svg += `<text x="${outX}" y="${outY}" fill="var(--text-muted)" font-size="14" font-family="'Montserrat', sans-serif" text-anchor="middle" dominant-baseline="central">${subperiods[k]}</text>`;

        // Vnitřní texty (věk) - odsazení posunuto mírně dál (28), aby se dlouhé texty s pomlčkou nedotýkaly čáry
        let inX = px - nx * 28; 
        let inY = py - ny * 28;

        let formatNum = num => num % 1 === 0 ? num.toString() : num.toFixed(1).replace('.', ',');
        
        // Přesné hranice podle tvé vzorové matice (končí na 4 a na 9)
        const starts = [0, 1, 2.5, 3.5, 5, 6, 7.5, 8.5];
        const ends   = [0, 2.5, 3.5, 4, 5, 7.5, 8.5, 9]; 

        if (k === 4) {
            // STŘEDOVÝ VĚK (např. 25 let): Hlavní barva, tučné a trochu větší písmo
            let exactAge = (ageLabels[i] + 5) % 80;
            let ageText = `${formatNum(exactAge)} let`;
            
            svg += `<text x="${inX}" y="${inY}" fill="var(--text-main)" font-family="'Montserrat', sans-serif" font-size="11" font-weight="bold" text-anchor="middle" z-index=5 dominant-baseline="central">${ageText}</text>`;
        } else {
            // MEZIVĚKY (např. 23,5-24): Tlumená barva a menší písmo
            let startAge = (ageLabels[i] + starts[k]) % 80;
            let endAge = (ageLabels[i] + ends[k]) % 80;
            
            let rangeText = `${formatNum(startAge)}-${formatNum(endAge)}`;
            
            svg += `<text x="${inX}" y="${inY}" fill="var(--text-muted)" font-family="'Montserrat', sans-serif" font-size="9" text-anchor="middle" dominant-baseline="central">${rangeText}</text>`;
        }
        
        // Malé dělící čárky přímo na lince
        svg += `<line x1="${px - nx*5}" y1="${py - ny*5}" x2="${px + nx*5}" y2="${py + ny*5}" stroke="${lineColor}" stroke-width="1.5" />`; 
      }
    }
  }

  for (let key in pos) svg += circle(pos[key]);

  svg += `<text x="${pos.Heart.x + 5}" y="${pos.Heart.y - 55}" font-size="20" text-anchor="middle" dominant-baseline="central">❤️</text>`;
  svg += `<text x="${pos.Money.x - 50}" y="${pos.Money.y - 0}" fill="#008000" font-weight="bold" font-size="22" text-anchor="middle" dominant-baseline="central">$</text>`;

  return svg + `</svg>`;
}

function createSmallCirclesSVG(values) {
  let svg = `<svg viewBox="0 0 230 70" width="100%" xmlns="http://www.w3.org/2000/svg">`;
  values.forEach((val, i) => {
    svg += `<circle cx="${40 + i * 75}" cy="35" r="22" fill="#fff" stroke="#4E2358" stroke-width="2"/>`;
    svg += `<text x="${40 + i * 75}" y="35" fill="#000" font-size="16"   font-weight="bold" text-anchor="middle" dominant-baseline="central">${val}</text>`;
    if (i < values.length - 1) svg += `<line x1="${40 + i * 75 + 22}" y1="35" x2="${40 + (i + 1) * 75 - 22}" y2="35" stroke="#4E2358" stroke-width="2"/>`;
  });
  return svg + `</svg>`;
}

function createConnectionSVG(lbl1, lbl2, val1, val2) {
  return `
  <svg viewBox="0 0 200 120" width="100%" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="30" fill="#FFFFFF" font-size="14" font-weight="bold" dominant-baseline="central">${lbl1}</text>
    <text x="10" y="90" fill="#FFFFFF" font-size="14" font-weight="bold" dominant-baseline="central">${lbl2}</text>
    <line x1="80" y1="30" x2="150" y2="60" stroke="#4E2358" stroke-width="2"/>
    <line x1="80" y1="90" x2="150" y2="60" stroke="#4E2358" stroke-width="2"/>
    <circle cx="80" cy="30" r="18" fill="#fff" stroke="#4E2358" stroke-width="2"/>
    <text x="80" y="30" fill="#000" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="central">${val1}</text>
    <circle cx="80" cy="90" r="18" fill="#fff" stroke="#4E2358" stroke-width="2"/>
    <text x="80" y="90" fill="#000" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="central">${val2}</text>
    <circle cx="150" cy="60" r="22" fill="#fff" stroke="#4E2358" stroke-width="2"/>
    <text x="150" y="60" fill="#000" font-size="16" font-weight="bold" text-anchor="middle" dominant-baseline="central">${norm(val1 + val2)}</text>
  </svg>`;
}

function createSimpleCircleSVG(val) {
  return `
  <svg viewBox="0 0 80 80" style="width: 80px; height: 80px; display: block; margin: 0 auto;" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="28" fill="#fff" stroke="#4E2358" stroke-width="2"/>
    <text x="40" y="40" fill="#000" font-size="20" font-weight="bold" text-anchor="middle" dominant-baseline="central">${val}</text>
  </svg>`;
}

// =========================================================
// 3. DATABÁZE TEXTŮ A LOGIKA VÝPISU
// =========================================================

// Databáze všech textů rozdělená do 3 kategorií přesně podle dodaného Word dokumentu
const textDatabase = {
  osobni: {
    1: "Jste tvůrce a iniciátor. Máte silnou mysl, rychle chápete souvislosti a umíte věci nejen vymyslet, ale také rozpohybovat. Potřebujete vlastní směr, rozhodnutí a možnost tvořit. Vaše síla je v tom, že dokážete své nápady proměnit v realitu.\n\nV plusu jste sebevědomí, inteligentní a plní nápadů. Umíte začít nové věci, najít řešení a přirozeně vést. Máte cit pro lidi i situace a Vaše slovo má váhu.\n\nV mínusu se síla mění v ego, pýchu a potřebu mít vše pod kontrolou. Nebo naopak přichází pochybnosti, vnitřní kritika a strach začít. Můžete také neustále něco rozjíždět, ale nedokončovat.",
    2: "Jste intuitivní a vnímavý člověk. Umíte číst mezi řádky, vnímat atmosféru a rychle poznat, co se skutečně děje. Máte cit pro lidi, emoce a detaily, které ostatní přehlížejí. Vaše síla je v klidu, pozorování a schopnosti najít správná slova ve správný čas.\n\nV plusu umíte uklidnit napětí, spojovat lidi a hledat řešení. Dokážete druhým naslouchat, dobře jim rozumět a být pro ně oporou. Působíte klidně a přirozeně, bez potřeby na sebe upozorňovat.\n\nV mínusu můžete být příliš pasivní a ustupovat i tam, kde je potřeba říct svůj názor. Potlačené emoce se pak hromadí a mohou vyústit v chlad, ironii nebo výbuch. Můžete se také příliš přizpůsobovat ostatním, ztrácet vlastní hranice a pochybovat o své hodnotě.",
    3: "Jste energie hojnosti, krásy a tvoření. Umíte vytvářet příjemné prostředí, pečovat o druhé a dávat věcem prostor růst. Máte silný vztah ke kráse, komfortu a vlastní hodnotě. Když víte, co si zasloužíte, dokážete přitahovat nejen příležitosti, ale i materiální hojnost.\n\nV plusu působíte přirozeně přitažlivě, žensky a sebevědomě. Umíte si užívat život, rozpoznat hodnotu a přijímat to dobré, co k Vám přichází. Máte talent pro podnikání, krásu, služby, práci s lidmi nebo tvorbu příjemného prostoru. Ve vztazích umíte milovat a pečovat, aniž byste ztrácela sama sebe.\n\nV mínusu může být Vaše sebehodnota závislá na obdivu, vzhledu nebo pozornosti druhých. Můžete mít potřebu všechno kontrolovat – partnera, děti, domácnost i práci – a z péče se pak stává tlak. Nebo se můžete příliš upnout na peníze, věci a status a zapomenout na to, co Vám přináší skutečné naplnění.",
    4: "Jste silná, stabilní a rozhodná osobnost. Potřebujete mít věci pod kontrolou, umíte organizovat, plánovat a vytvářet řád. Dokážete převzít odpovědnost, vést lidi i projekty a vytvořit kolem sebe pocit bezpečí. Vaším tématem je zdravá autorita – umět svou sílu držet, ale nemuset ji neustále dokazovat.\n\nV plusu působíte jako přirozená autorita, na kterou je spoleh. Umíte rozhodovat, budovat a proměnit chaos v systém. Máte talent pro vedení, podnikání, organizaci a strategické myšlení. Dokážete být silná a zároveň respektující, což přirozeně přitahuje kvalitní lidi i stabilní vztahy.\n\nV mínusu se síla může změnit v kontrolu, perfekcionismus a tvrdost. Můžete mít potřebu řídit všechno kolem sebe, těžko delegovat a být na sebe příliš náročná. Ve vztazích pak může vznikat boj o moc nebo přitahování pasivnějších partnerů. Vaší lekcí je pochopit, že skutečná síla není v neustálé kontrole, ale také v důvěře a schopnosti některé věci pustit.",
    5: "Jste člověk hodnot, pravidel a hlubšího smyslu. Potřebujete, aby věci měly řád a opíraly se o něco pevného. Máte vztah ke vzdělání, tradicím a ověřeným principům. Vaše slovo má váhu a přirozeně přebíráte odpovědnost za to, co předáváte druhým.\n\nV plusu jste přirozený mentor a průvodce. Umíte učit, vysvětlovat a předávat zkušenosti srozumitelně a důvěryhodně. Máte talent pro vzdělávání, právo, poradenství, management nebo jiné oblasti, kde jsou důležité znalosti, pravidla a důvěra. Dokážete být oporou druhým a ukazovat jim směr bez potřeby cokoliv vnucovat.\n\nV mínusu se z pevných hodnot může stát rigidita, moralizování a přesvědčení, že existuje jen jedna správná cesta. Můžete mít strach z nového, chyb nebo odchýlení od pravidel. Hrozí také, že budete hromadit vědomosti, ale nebudete je skutečně žít – „vím tolik, ale nežiju“.",
    6: "Jste člověk vztahů, emocí a krásy. Potřebujete kontakt, harmonii a příjemné prostředí, ve kterém můžete naplno prožívat život. Máte cit pro lidi, estetiku a atmosféru a přirozeně dokážete druhé spojovat. Vaším tématem je také umět si vybrat a neztratit se v množství možností.\n\nV plusu jste charismatičtí, společenští a přirozeně přitažliví. Umíte navazovat kontakty, vytvářet příjemnou atmosféru a být vřelí a pozorní. Máte cit pro krásu, styl a komfort. Ve vztazích dokážete dávat i přijímat a vytvářet skutečnou partnerskou harmonii.\n\nV mínusu můžete být příliš závislí na názoru a hodnocení druhých. Můžete se bát samoty, vstupovat do vztahů bez skutečného výběru nebo si nasazovat „růžové brýle“. Hrozí také přílišné hodnocení podle vzhledu a zaměňování krásy za skutečnou hodnotu.",
    7: "Jste člověk pohybu, vůle a vítězství. Potřebujete dynamiku, směr a pocit, že se věci posouvají. Umíte si stanovit cíl, převzít zodpovědnost a jít za výsledkem. Když máte jasný směr, dokážete strhnout i lidi kolem sebe.\n\nV plusu jste aktivní, odvážní a výkonní. Umíte plánovat, strategicky přemýšlet a dotahovat věci do konce. Jste nezávislí, umíte se motivovat a přirozeně motivujete i ostatní. Pohyb, cestování a změna Vás dobíjejí a pomáhají Vám udržovat energii.\n\nV mínusu se Vaše síla může změnit v tlak, agresi, netrpělivost a potřebu mít vše podle sebe. Můžete se přetěžovat, jet dlouho na výkon a následně spadnout do vyčerpání nebo apatie. Hrozí také rozptýlenost – začnete mnoho věcí najednou, ale žádnou nedokončíte. Potřebujete jednu jasnou osu, jinak se Vaše síla rozpadá do chaosu.",
    8: "Jste člověk pravdy, férovosti a vnitřní rovnováhy. Máte silný cit pro spravedlnost, logiku a správné nastavení věcí. Umíte vidět pod povrch, rozpoznat souvislosti a pochopit, proč se věci dějí. Potřebujete řád, pravidla a jasné hranice.\n\nV plusu působíte klidně, rozvážně a spravedlivě. Umíte oddělit emoce od faktů, vidět více stran a najít férové řešení. Lidé Vám důvěřují tam, kde je potřeba rozhodovat, analyzovat nebo napravovat nesrovnalosti. Máte talent pro právo, finance, řízení, strategie nebo práci s pravidly.\n\nV mínusu se z Vašeho smyslu pro spravedlnost může stát potřeba soudit, obviňovat a dokazovat, kdo má pravdu. Můžete být podezíraví, příliš tvrdí a brát si křivdy dlouho k srdci. Potřeba mít vše pod kontrolou Vám může brát lehkost a vést k frustraci, zklamání nebo uzavřenosti.",
    9: "Jste člověk hloubky, moudrosti a vnitřní samostatnosti. Potřebujete prostor, klid a čas, abyste mohli přemýšlet a opřít se sami o sebe. Máte potřebu věcem skutečně rozumět, vidět souvislosti a jít pod povrch. Přirozeně působíte jako člověk, který nepotřebuje být součástí davu.\n\nV plusu jste klidní, zralí a moudří. Lidé Vás vyhledávají pro radu, protože umíte naslouchat, chápat souvislosti a nabídnout promyšlený pohled. Máte talent pro analýzu, poradenství, výzkum nebo samostatnou práci. Dokážete být soucitní a zároveň si držet zdravé hranice.\n\nV mínusu se Vaše samostatnost může změnit v uzavřenost, odstup a nedůvěru. Můžete se cítit nadřazeně, protože máte pocit, že vidíte věci lépe než ostatní. Hrozí také život „v hlavě“ – příliš mnoho přemýšlení a studia na úkor vztahů, radosti a péče o sebe. Můžete hromadit vědomosti, ale zapomínat je sdílet.",
    10: "Jste člověk změny, příležitostí a správného načasování. V životě často přicházejí nečekané obraty a šance, které je potřeba umět zachytit. Jste součástí proudu a daří se Vám, když se mu dokážete přizpůsobit místo snahy mít vše pod kontrolou. Příležitosti k Vám často přicházejí přes lidi a kontakty.\n\nV plusu jste flexibilní, otevření a pozitivní. Umíte rychle reagovat na změny, učit se a být ve správný čas na správném místě. Dobře fungujete v týmu, dokážete využít příležitosti a přirozeně podporujete druhé. Umíte také přijímat pomoc, nabídky a dary bez pocitu, že si je musíte zasloužit.\n\nV mínusu můžete mít strach, že Vám něco uteče, a snažit se využít každou příležitost. To vede k chaosu, přetížení a vyčerpání. Druhým extrémem je pasivita a čekání, že vše vyřeší osud. Můžete také střídat období nečinnosti s nárazovým výkonem nebo mít mnoho kontaktů, ale málo skutečné hloubky.",
    11: "Jste člověk s velkou vnitřní silou, energií a vůlí. Potřebujete svou energii využívat, tvořit, jednat a posouvat věci dopředu. Máte silný temperament a dokážete zabrat ve chvíli, kdy je potřeba. Vaším darem je síla, která se může stát oporou pro Vás i Vaše okolí.\n\nV plusu jste odolní, pracovití a vytrvalí. Umíte převzít zodpovědnost, zvládat náročné situace a motivovat ostatní. Jen tak se nevzdáváte a po neúspěchu dokážete znovu vstát. Máte talent pro sport, výkon, práci pod tlakem a situace, kde je potřeba energie a disciplína.\n\nV mínusu se Vaše síla může změnit v agresi, netrpělivost a podráždění. Můžete tlačit na druhé, aby fungovali Vaším tempem, a přetěžovat sebe i své tělo. Hrozí workoholismus, vyčerpání a následný emoční výbuch. Potřebujete se naučit svou energii nejen vydávat, ale také dávkovat a včas ubrat.",
    12: "Jste člověk hluboké empatie, vnímavosti a pochopení. Dokážete vidět pod povrch, vnímat emoce druhých a být jim oporou ve chvílích, kdy ji potřebují. Máte schopnost podívat se na situace z jiné perspektivy a díky zkušenostem postupně dozrávat.\n\nV plusu jste soucitní, trpěliví a umíte druhým naslouchat. Lidé se Vám přirozeně otevírají, protože vedle Vás cítí bezpečí. Máte psychologickou hloubku, cit pro souvislosti a také kreativitu. Umíte pomáhat druhým, aniž byste při tom ztráceli sami sebe.\n\nV mínusu se můžete dostávat do role oběti a přebírat na sebe problémy druhých. Můžete zapomínat na vlastní potřeby, vyčerpat se a ztrácet radost. Hrozí také silná citová závislost na jednom člověku nebo naopak odkládání reality a „zamrznutí“, když je toho příliš. Potřebujete pomáhat druhým, ale zároveň si držet vlastní hranice.",
    13: "Jste člověk transformace, změny a nových začátků. Dokážete poznat, kdy něco dosloužilo, a máte sílu to ukončit a začít znovu. Změny Vás provázejí životem a často Vás vedou k tomu, abyste opouštěli staré vzorce, vztahy, návyky nebo iluze. Krize pro Vás mohou být impulzem k růstu.\n\nV plusu jste odolní a umíte zachovat klid i v náročných situacích. Dokážete se rychle přizpůsobit, uzavřít minulost a vytvořit prostor pro nové. Máte odvahu čelit pravdě a přirozený talent pro změnu, obnovu, krizové situace nebo restrukturalizaci.\n\nV mínusu se potřeba změny může změnit v destrukci a chaos. Můžete bořit věci dřív, než máte připravený nový základ, jednat impulzivně nebo vyhledávat přílišné extrémy a riziko. Hrozí také dlouhé ulpívání na starých bolestech, konfliktech a neuzavřených situacích. Když se změna neděje uvnitř, může se chaos projevit i navenek – například hromaděním věcí a nepořádkem.",
    14: "Jste člověk rovnováhy, harmonie a přirozeného vkusu. Umíte spojovat protiklady, hledat správnou míru a vytvářet klid tam, kde je chaos. Potřebujete žít bez extrémů a máte cit pro estetiku, kulturu, umění, cestování i to, co je čisté a harmonické.\n\nV plusu působíte klidně, vyrovnaně a harmonicky. Umíte dobře dávkovat práci, odpočinek, emoce i komunikaci. Dokážete spojovat lidi, přizpůsobit se různým prostředím a přitom zůstat sami sebou. Máte talent na jazyky, cestování, mezinárodní prostředí, estetiku nebo oblasti spojené se zdravím a péčí o tělo.\n\nV mínusu se citlivost může změnit v uzavřenost, podezíravost a izolaci. Když ztratíte vnitřní rovnováhu, můžete hledat úlevu v přejídání, závislostech nebo jiných nezdravých návycích. Můžete také příliš lpět na minulosti, pochybovat o vlastním talentu nebo se bát rizika natolik, že si začnete zbytečně omezovat život.",
    15: "Jste člověk silného magnetismu, vášně a vlivu. Máte výraznou životní energii, chuť žít naplno a schopnost přitahovat pozornost, lidi i příležitosti. Přirozeně Vás zajímají témata jako peníze, moc, vztahy, sexualita nebo psychologie. Vaším tématem je naučit se svou sílu používat vědomě.\n\nV plusu jste charismatičtí, sebevědomí a přesvědčiví. Umíte ovlivňovat lidi i situace, vyjednávat, pracovat s hodnotou a přitahovat zdroje. Máte talent pro obchod, podnikání a práci s lidmi. Dokážete si užívat peníze, krásu a životní komfort, aniž by Vás ovládaly. Dobře rozumíte lidské povaze a umíte vidět i to, co druzí skrývají.\n\nV mínusu se Vaše síla může změnit v posedlost penězi, kontrolou, pozorností nebo vztahy. Může se objevit manipulace, nátlak, chamtivost, závislosti nebo potřeba neustálého vzrušení. Své schopnosti číst lidi můžete využívat k získání výhody místo skutečného pochopení. Patnáctka Vás neustále staví před otázku, zda svou moc používáte vědomě, nebo Vás ovládá její stín.",
    16: "Jste člověk pravdy, změny a osvobození od toho, co už nefunguje. Dokážete rychle poznat lež, přetvářku nebo nefunkční systém a máte sílu ho změnit. V životě můžete procházet výraznými přeměnami, které Vás vedou k větší pravdivosti a vnitřní stabilitě.\n\nV plusu umíte zvládat velké změny a učit se z náročných zkušeností. Dokážete přestavovat systémy, rozhodovat pod tlakem a vést druhé obdobím změny. Máte talent vysvětlovat složité věci a předávat zkušenosti. Umíte pustit to, co už dosloužilo, a vytvořit prostor pro něco pevnějšího.\n\nV mínusu se nahromaděné napětí může projevit výbuchy, agresí a potřebou všechno zničit najednou. Můžete přecházet mezi apatií a vyhledáváním extrémů či dramatu. Hrozí také přílišné lpění na vztazích, majetku nebo postavení – nebo naopak jejich impulzivní opouštění. Vaším tématem je pochopit, že skutečná stabilita nevychází z toho, co držíte kolem sebe, ale z Vás samotných.",
    17: "Jste člověk talentu, inspirace a přirozeného světla. Máte silnou představivost, cit pro krásu a schopnost přinášet druhým naději, nové nápady a inspiraci. Vaše energie vynikne především tehdy, když jste sami sebou – autenticita k Vám přitahuje správné lidi i příležitosti.\n\nV plusu jste charismatičtí, kreativní a inspirativní. Dokážete povzbudit druhé, vidět krásu tam, kde ji ostatní přehlížejí, a své nápady proměnit ve skutečné výsledky. Máte cit pro estetiku, intuici a tvorbu. Když svůj talent rozvíjíte systematicky, můžete dosáhnout výrazného uznání a úspěchu.\n\nV mínusu můžete pochybovat o vlastní hodnotě a svůj talent schovávat ze strachu z odmítnutí. Druhým extrémem je potřeba být výjimeční, získávat obdiv a stavět ego nad skutečný talent. Můžete být také roztěkaní – mnoho nápadů, ale málo dokončených věcí. Talent potřebuje disciplínu, soustředění a pravidelnou práci, aby se proměnil ve skutečnou kvalitu.",
    18: "Jste člověk hloubky, intuice a silného vnitřního světa. Máte cit pro atmosféru, emoce a skryté souvislosti. Vaše představivost je výrazná a můžete mít silné sny, intuici nebo potřebu poznávat psychiku, spiritualitu a vše, co není na první pohled vidět. Vaše síla roste, když svému vnitřnímu světu rozumíte a umíte s ním pracovat.\n\nV plusu jste vnímaví, kreativní a intuitivní. Dokážete rychle vycítit, co se děje, i bez slov, a své pocity proměnit v tvorbu, nápady nebo pomoc druhým. Máte cit pro psaní, estetiku, atmosféru a práci s lidmi. Když máte čisté myšlení a důvěřujete své intuici, dokážete své vnitřní nastavení proměňovat i ve skutečné výsledky.\n\nV mínusu Vás mohou ovládat strachy, pochybnosti a negativní představy. Citlivost se pak mění v nejistotu, přehnané obavy nebo zastavení v akci. Můžete se také stáhnout do izolace, manipulovat s druhými nebo využívat svou schopnost vnímat lidi proti nim. Potřebujete si hlídat, čemu věnujete svou pozornost a co ve svém vnitřním světě živíte.",
    19: "Jste člověk světla, radosti a přirozené životní síly. Potřebujete tvořit, být aktivní, vidět výsledky a být v kontaktu se světem. Máte v sobě otevřenost, velkorysost a přirozenou potřebu růst. Když jste sami sebou, Vaše energie je vidět a přirozeně přitahuje lidi i příležitosti.\n\nV plusu jste pozitivní, energičtí a štědří. Umíte povzbudit druhé, rozsvítit atmosféru a přirozeně vést. Máte silný vztah k blízkým a potřebu vytvářet jim bezpečí a pohodlí. Pokud svou energii využíváte naplno a profesionálně, můžete dosahovat výrazných pracovních i finančních úspěchů.\n\nV mínusu můžete při nedostatku realizace ztrácet energii, radost a chuť do života. Býváte na sebe příliš přísní a máte pocit, že nejste dost dobří. Ve vztazích můžete dávat příliš mnoho, následně chtít kontrolu nebo očekávat stejné množství zpět. Stínem je také pýcha a potřeba obdivu – když svou hodnotu začnete hledat v uznání druhých, Vaše přirozené světlo slábne.",
    20: "Jste člověk rodu, hlubokého vhledu a probuzení. Máte schopnost vnímat rodinné vzorce, souvislosti a témata, která se mezi generacemi opakují. Silná intuice Vám může pomáhat chápat lidi i situace do větší hloubky. Vaše energie má v sobě potenciál spojovat, uzdravovat a přinášet do věcí nový pohled.\n\nV plusu dokážete spojovat lidi, obnovovat vztahy a přinášet smíření. Umíte vidět souvislosti, pojmenovat to, co druzí přehlížejí, a být druhým průvodcem. Máte cit pro práci s lidmi, psychikou, rodinnými tématy nebo minulostí. Dokážete být respektovanou autoritou, která pomáhá probouzet, nikoli soudit.\n\nV mínusu se Váš vhled může změnit v potřebu soudit, řídit druhé a dokazovat, co je správně. Můžete být příliš kontrolující vůči rodině, přebírat její problémy nebo se zaplétat do dlouhodobých konfliktů a sporů. Stínem je také využívání svých schopností pro vlastní prospěch bez ohledu na hodnoty a čistý záměr.",
    21: "Jste člověk širokého rozhledu, nadhledu a schopnosti spojovat světy. Přirozeně vidíte věci v širších souvislostech a dokážete chápat různé perspektivy. Přitahuje Vás cestování, jazyky, nové kultury a prostředí, která přesahují známý svět. Umíte uzavírat cykly, propojovat lidi a dotahovat věci do celku.\n\nV plusu jste diplomatičtí, přizpůsobiví a dokážete harmonizovat prostředí. Umíte spojovat lidi, hledat řešení mezi různými pohledy a zachovat si přitom vlastní identitu. Daří se Vám v mezinárodním prostředí, velkých projektech nebo všude tam, kde je potřeba propojovat různé lidi a kultury. Máte také dar předávat myšlenky tak, aby v nich druzí sami našli smysl.\n\nV mínusu můžete mít velké plány, ale chybí Vám trpělivost, disciplína nebo schopnost dotáhnout je do reality. Můžete přehlížet to, co už máte, a soustředit se pouze na to, co ještě chybí. Místo spojování pak vznikají konflikty, chlad nebo uzavřenost vůči okolí. Pokud se příliš zaměříte na materiální stránku života, můžete ztratit širší smysl, který je pro tuto energii zásadní.",
    22: "Jste člověk svobody, spontaneity a otevřenosti životu. Potřebujete prostor, pohyb a možnost jít vlastní cestou. Máte kreativní mysl, smysl pro humor a odvahu opouštět staré, když už Vám neslouží. Umíte se přizpůsobit, komunikovat s různými lidmi a vidět možnosti tam, kde ostatní vidí jen omezení.\n\nV plusu jste lehcí, flexibilní a odvážní. Umíte začínat znovu, improvizovat a rychle reagovat na změny. Jste přátelští, otevření a dokážete druhým dodat nadhled i chuť žít. Máte dar osvobozovat sebe i ostatní od přesvědčení a pravidel, která už nedávají smysl.\n\nV mínusu se touha po svobodě může změnit v chaos, nezodpovědnost a útěk před závazky. Můžete odmítat pravidla jen proto, že Vás omezují, a přehlížet důsledky svého jednání. Opačným extrémem je strach udělat krok a přílišné upnutí na vztah, jistotu nebo materiální bezpečí. Potřebujete najít rovnováhu mezi svobodou a odpovědností – jinak se z volnosti snadno stane chaos a z něj nové omezení."
  },
  komunikace: {
    3: "Máte přirozený šarm a autoritu. Umíte zaujmout, inspirovat, radit a vést. Lidé Vašemu názoru naslouchají. Vaše síla je v srdečné komunikaci s respektem. Nemusíte tlačit ani dokazovat, že máte pravdu.",
    4: "Komunikujete jasně, věcně a sebejistě. Umíte říct věci přímo, nastavit hranice a přirozeně vést. Lidé Vaše slovo respektují. Vaší silou je klidná autorita a schopnost být spravedliví a lidští. Dávejte si pozor, aby se pevnost nezměnila v rozkazování, kontrolu nebo netrpělivost.",
    5: "Komunikujete sebejistě, přesvědčivě a s autoritou. Umíte argumentovat, předávat informace a vést druhé. Vaše síla je ve schopnosti mluvit srozumitelně a logicky. Dávejte si pozor, aby se autorita nezměnila ve vševědoucnost a poučování. Když ke svému slovu přidáte lidskost a pochopení, lidé Vás budou následovat přirozeně.",
    6: "Komunikujete přirozeně, společensky a s lehkostí. Umíte navazovat kontakty, propojovat lidi a vytvářet příjemnou atmosféru. Vaší silou je otevřenost a schopnost budovat vztahy. Dávejte si pozor, aby Vaše spokojenost nezávisela na reakcích druhých. Když si držíte vlastní hranice, působíte přívětivě, sebejistě a přirozeně přitahujete správné lidi.",
    7: "Komunikujete přímo, rychle a věcně. Umíte rozhodovat, zadávat úkoly a dát věcem tempo. V týmu přirozeně motivujete druhé a posouváte věci dopředu. Dávejte si pozor, aby se Vaše přímost nezměnila v tlak. Když vedete z klidu místo z nervozity, lidé Vás následují. Pomáhá také nebát se mluvit o emocích, nejen o výsledcích.",
    8: "Komunikujete věcně, přesně a s nadhledem. Umíte klást správné otázky, dojít k podstatě a nabídnout objektivní názor. Lidé se na Vás obracejí, když potřebují rozhodnutí nebo srovnat situaci. Dávejte si pozor na moralizování a rychlé soudy. Když nejprve nasloucháte a snažíte se pochopit druhé, Vaše spravedlnost působí jako moudrost, ne jako trest.",
    9: "Komunikujete klidně, zdrženlivě a s rozmyslem. Nejlépe Vám vyhovuje komunikace jeden na jednoho, kde máte prostor se otevřít. Vaše slova mají váhu, protože nemluvíte zbytečně. Dávejte si pozor, aby Vaše zdrženlivost nepůsobila jako chlad nebo odmítnutí. Když si držíte hranice, ale dovolíte si být vidět, přirozeně působíte jako člověk, za kterým ostatní chodí pro radu a nadhled.",
    10: "Komunikujete otevřeně, přátelsky a přirozeně. Umíte navazovat kontakty, propojovat lidi a vytvářet vztahy, přes které k Vám často přicházejí nové příležitosti. Nebojte se být vidět, ale zároveň zůstávejte sami sebou. Když komunikujete autenticky a bez potřeby hrát roli, lidé Vám přirozeně důvěřují.",
    11: "Komunikujete energicky, přesvědčivě a s přirozenou silou. Umíte spojovat lidi, zvednout atmosféru a strhnout ostatní k akci. Vaše energie je nakažlivá. Dávejte si pozor, aby se síla nezměnila v tvrdost nebo konflikty. Když prosazujete svůj názor klidně, s argumenty a respektem, lidé Vás následují dobrovolně.",
    12: "Komunikujete přirozeně, lidsky a s empatií. Umíte naslouchat, poradit a být druhým oporou bez pocitu nadřazenosti. Lidé se Vám svěřují, protože cítí pochopení a zkušenost. Dávejte si však pozor, aby se komunikace nestala jednostranným zachraňováním. Umět říct své potřeby a nastavit hranice dává Vaší komunikaci ještě větší hloubku.",
    13: "Komunikujete hluboce, intenzivně a přesvědčivě. Umíte navázat kontakt s různými lidmi a Vaše slova mají sílu, protože vycházejí ze zkušenosti. Dokážete druhé oslovit a otevřít v nich nový pohled. Dávejte si pozor, aby se Vaše přímost nezměnila v tlak. Pravdu umíte říct i bez agrese a dejte druhým prostor, aby si svou změnu našli sami.",
    14: "Komunikujete jemně, kultivovaně a s respektem. Umíte být diplomatičtí, vnímat druhé a hledat v lidech to dobré. Přirozeně přinášíte do komunikace klid a rovnováhu. Dávejte si pozor, abyste se kvůli citlivosti nestahovali ze světa. Vaše síla může být i v nepřímém vyjádření skrze tvorbu, estetiku, text nebo umění.",
    16: "Komunikujete přímo, přesně a přesvědčivě. Umíte pojmenovat problém, vysvětlit potřebu změny a nabídnout řešení. Vidíte slabá místa a nebojíte se pravdy. Dávejte si pozor, abyste kvůli přímosti neničili vztahy. Když dokážete říct pravdu s respektem a dát druhým čas, stáváte se silným průvodcem změnou.",
    18: "Komunikujete jemně, tajemně a s velkou hloubkou. Často Vám více vyhovují menší skupiny nebo rozhovory jeden na jednoho. Umíte naslouchat a když promluvíte, Vaše slova mají váhu a atmosféru. Dávejte si pozor, abyste se příliš nestahovali do ústraní. Když dokážete otevřeně vyjádřit své pocity, Vaše komunikace může silně působit na druhé.",
    20: "Komunikujete přesvědčivě, moudře a s hlubokým vhledem. Umíte říct lidem to, co potřebují slyšet, a vést je bez nátlaku. Vaší silou je klidná autorita, smířlivost a schopnost spojovat, ne soudit. Dávejte si pozor, aby se Váš vhled nezměnil v moralizování nebo potřebu řídit život druhých. Když respektujete jejich vlastní cestu, lidé Vám důvěřují.",
    22: "Komunikujete otevřeně, přátelsky a bez předsudků. Umíte najít společnou řeč s různými lidmi a přinášet do komunikace lehkost, humor a nadhled. Dokážete druhé povzbudit a dát jim pocit svobody. Dávejte si pozor, aby lehkost nepůsobila povrchně nebo nezodpovědně. Když spojíte spontánnost se spolehlivostí, Vaše komunikace působí přirozeně a osvěžujícím způsobem."
  },
  obdobi: {
    1: "Čeká Vás období učení, nových kontaktů a seberealizace. Je vhodný čas na vzdělávání, kurzy, nové zkušenosti a rozšiřování profesních dovedností. Úspěch může přicházet skrze komunikaci, nové lidi, kreativitu a odvahu ukázat své schopnosti. Důležité je věřit si, být aktivní a využít svůj potenciál.\n\nV plusu přináší nové začátky, osobní i profesní růst, užitečné kontakty, úspěchy a finanční stabilitu.\n\nV mínusu se může objevit pasivita, nejistota, problémy v komunikaci, konflikty nebo nedůvěryhodné informace. Dávejte pozor také na dokumenty, manipulaci a vlastní pochybnosti o svých schopnostech.",
    2: "Čeká Vás období intuice, tajemství a vnitřního naslouchání. Méně vše kontrolujte a více důvěřujte svému vnitřnímu hlasu a znamením kolem Vás. Prospěje Vám klid, péče o sebe, příroda i rozvoj intuice.\n\nV plusu přináší harmonii, nové poznání, důležité informace a hlubší vztahy, zejména s rodinou a ženami.\n\nV mínusu se mohou objevit tajemství, nedůvěra, konflikty, falešné informace nebo odtržení od vlastní intuice.",
    3: "Čeká Vás období růstu, hojnosti a sklizně výsledků předchozího úsilí. Důležité je hledat rovnováhu mezi prací, rodinou a péčí o sebe. Dopřejte si čas na odpočinek, vztahy, koníčky a vlastní rozvoj.\n\nV plusu přináší kariérní i finanční růst, harmonické vztahy, nové projekty, kreativitu a příjemné životní změny.\n\nV mínusu se mohou objevit problémy ve vztazích, žárlivost, samota, finanční nejistota nebo nespokojenost v rodinném životě.",
    4: "Čeká Vás období stability, odpovědnosti a budování pevného zázemí. Může přinést důležitého muže do života, kariérní postup, vlastní podnikání nebo významné životní rozhodnutí. Důležité je řešit nedořešené vztahy s muži a zároveň si zachovat vlastní rovnováhu.\n\nV plusu přináší finanční stabilitu, úspěch v práci, autoritu, podporu důležitého muže a nové příležitosti.\n\nV mínusu se mohou objevit konflikty, problémy s úřady, špatná rozhodnutí, finanční ztráty nebo přílišná kontrola a pasivita.",
    5: "Čeká Vás období zaměřené na rodinu, stabilitu a osobní růst. Důležité je pečovat o blízké, ale zároveň respektovat jejich samostatnost a žít podle vlastních hodnot. Prospěje Vám také řád, rutina, vzdělávání a předávání zkušeností.\n\nV plusu přináší harmonické vztahy, manželství, rodinné události, nové znalosti a podporu mentora či důležitého člověka.\n\nV mínusu se mohou objevit konflikty v rodině, problémy s dokumenty, nedůvěra, spory nebo manipulace ze strany druhých.",
    6: "Čeká Vás období vztahů, lásky, harmonie a důležitých rozhodnutí. Zaměřte se na své vztahy, vnitřní rovnováhu a to, co skutečně chcete. Prospěje Vám také péče o sebe, kreativita a otevřená komunikace.\n\nV plusu přináší nové známosti, zamilovanost, harmonické vztahy, svatbu, nové pracovní příležitosti a kreativní realizaci.\n\nV mínusu se mohou objevit konflikty, zklamání ve vztazích, závislost na názorech druhých, promarněné příležitosti nebo špatná rozhodnutí.",
    7: "Čeká Vás období pohybu, nových příležitostí a rychlého rozvoje. Nebojte se cestování, změn, nových projektů ani pracovních výzev. Důležité je mít jasný cíl, plán a nebát se spolupráce s druhými.\n\nV plusu přináší kariérní růst, úspěšné projekty, nové kontakty, cestování, stěhování a zajímavé příležitosti.\n\nV mínusu se mohou objevit zpoždění, stagnace, pracovní problémy, neúspěchy, konflikty nebo komplikace na cestách.",
    8: "Čeká Vás klidnější období, které může přinést výsledky předchozí práce. Zaměřte se na své vztahy, minulost, osobní rozvoj a pořádek ve věcech i dokumentech. Důležitá je také férovost, zodpovědnost a vyrovnání závazků.\n\nV plusu přináší úspěšné zkoušky, vyřešení úředních či právních záležitostí, kariérní uznání, finanční stabilitu a pevné vztahy.\n\nV mínusu se mohou objevit právní spory, finanční problémy, podvody, nespravedlnost nebo komplikace s úřady a dokumenty.",
    9: "Čeká Vás období ztišení, sebepoznání a hledání vlastního směru. Dopřejte si čas pro sebe, naslouchejte své intuici a přehodnoťte, co Vám v životě dává smysl. Prospěje Vám vzdělávání, kreativita, příroda i práce na vztazích.\n\nV plusu přináší osobní a duchovní růst, nové pochopení, uzdravení starých křivd a hlubší vztahy.\n\nV mínusu se může objevit samota, odcizení, úzkost, problémy ve vztazích nebo unáhlená rozhodnutí v práci.",
    10: "Čeká Vás období změn, příležitostí a příznivého vývoje. Buďte otevření novým možnostem, lidem, cestování a nechte věci více plynout. Důležité je nezůstávat v pasivitě a nebát se být vidět.\n\nV plusu přináší štěstí, finanční zisky, kariérní růst, nové příležitosti, cestování a osudová setkání.\n\nV mínusu se mohou objevit nečekané komplikace, finanční ztráty, stres, podvody nebo nestabilita v práci a vztazích.",
    11: "Čeká Vás období růstu, úspěchu a velkého množství energie. Můžete výrazně posílit svou kariéru, podnikání i vliv na druhé. Důležité je ale umět svou sílu správně rozložit a nepřetěžovat se.\n\nV plusu přináší úspěch, uznání, finanční růst, sebevědomí a nové pracovní příležitosti.\n\nV mínusu hrozí vyčerpání, stres, zdravotní problémy, konflikty, finanční ztráty nebo ztráta kontroly nad situací.",
    12: "Čeká Vás náročnější období změn, zkoušek a přehodnocování. Některé situace nebude možné ovlivnit a bude důležité přijmout je, naslouchat sobě a dívat se na věci z jiného úhlu. Učte se také pouštět to, co už Vám neslouží, a pečovat o sebe i své hranice.\n\nV plusu přináší vnitřní růst, uzdravení, nové pohledy, odpočinek a postupné řešení složitých situací.\n\nV mínusu se mohou objevit stagnace, ztráty, závislost na druhých, vyčerpání, rozchody nebo pocit, že nemáte svůj život pod kontrolou.",
    13: "Čeká Vás období zásadních změn a životních obratů. Něco starého může skončit, aby vznikl prostor pro nové. Důležité je změny přijímat, zbavit se toho, co Vám už neslouží, a umět se rychle přizpůsobit.\n\nV plusu přináší nový začátek, ukončení nefunkčních vztahů, změny v práci, stěhování nebo překonání starých problémů.\n\nV mínusu se mohou objevit ztráty, zdravotní komplikace, rozchody, stagnace nebo náhlé životní změny.",
    14: "Čeká Vás období klidu, sebepoznání a hledání vnitřní rovnováhy. Prospěje Vám trpělivost, kreativita, péče o tělo i duši a schopnost přijímat věci takové, jaké jsou. Zaměřte se na kvalitu, dokončování rozdělaných věcí a střídmost.\n\nV plusu přináší stabilitu, postupný růst, harmonické vztahy, spolupráci a klidný vývoj.\n\nV mínusu se mohou objevit podrážděnost, spěch, konflikty, nestabilita, finanční problémy nebo sklony k nezdravým návykům.",
    15: "Čeká Vás období silných změn, příležitostí a důležitých životních zkoušek. Mohou přijít velké možnosti v práci, financích i vztazích. Důležité je jednat čestně, pracovat na sobě a nenechat se ovládat strachem, závislostmi nebo manipulací.\n\nV plusu přináší úspěch, finanční růst, kariérní postup, osvobození od závislostí a silné vztahy.\n\nV mínusu se mohou objevit manipulace, nátlak, neetické jednání, konflikty, finanční problémy nebo nezdravé vztahy.",
    16: "Čeká Vás období zásadních změn a přehodnocení životních hodnot. Něco, čeho se držíte, může skončit, aby vznikl prostor pro nový začátek. Důležité je přijmout změny, vystoupit z komfortní zóny a nebát se začít znovu.\n\nV plusu přináší nové projekty, reorganizaci života, osobní růst, změnu hodnot a nové příležitosti.\n\nV mínusu se mohou objevit náhlé ztráty, konflikty, rozpad vztahů, finanční problémy nebo nečekané životní zvraty.",
    17: "Čeká Vás období kreativity, sebevědomí a zviditelnění. Je vhodný čas rozvíjet své talenty, ukázat světu své schopnosti a nebát se být více mezi lidmi. Váš koníček se může proměnit v práci či zdroj příjmu a přinést Vám uznání, nové příležitosti i finanční růst.\n\nV plusu přináší kreativní a duchovní růst, cestování, nové vztahy, úspěch, naplnění přání a příznivé životní změny.\n\nV mínusu se mohou objevit nejistota, pasivita, zklamání, nenaplněné plány, problémy ve vztazích či přátelství a nedostatek motivace.",
    18: "Čeká Vás období zaměřené na osobní život, emoce a hlubší sebepoznání. Vaše citlivost a intuice se zesilují, proto je důležité naslouchat sobě, pečovat o své vztahy a věnovat pozornost také domovu a rodině. Důležité může být i vyjasnění vztahů s matkou a dalšími ženami ve Vašem okolí. Myslete vědomě na to, čemu věnujete pozornost, protože Vaše myšlenky mohou výrazně ovlivňovat prožívání tohoto období.\n\nV plusu přináší harmonické vztahy, kreativitu, nové poznání, rozvoj intuice, vnitřní růst a příjemné změny v osobním životě.\n\nV mínusu se mohou objevit nejistota, strachy, iluze, pomluvy, manipulace, zrada, problémy ve vztazích nebo odtržení od vlastní intuice.",
    19: "Čeká Vás období radosti, hojnosti, úspěchu a příjemných životních změn. Dopřejte si více lehkosti, času s rodinou a radosti z obyčejných věcí. Důležité je nepřehánět kontrolu, umět děkovat za to, co máte, a pracovat s pocitem viny. Prospěje Vám také kreativita a otevřenost novým příležitostem.\n\nV plusu přináší harmonické vztahy, rodinné štěstí, kreativitu, uznání, úspěch v práci i podnikání, finanční stabilitu a naplnění dlouho očekávaných cílů.\n\nV mínusu se mohou objevit egoismus, pýcha, nespokojenost, konflikty v rodině, ochlazení vztahů, finanční problémy, stagnace nebo problémy v práci a podnikání.",
    20: "Čeká Vás období zaměřené na rodinu, minulost a důležitá životní rozhodnutí. Mohou se otevřít staré křivdy a nevyřešené vztahy s rodiči či dalšími členy rodiny. Je vhodný čas minulost přijmout, odpustit a lépe poznat své rodinné kořeny. Pokud se cítíte dobře ve svém životě, můžete vstoupit do nové etapy i v práci a společenském postavení.\n\nV plusu přináší harmonii v rodině, důležitá rozhodnutí, nové příležitosti, úspěšné projekty, finanční růst a pracovní seberealizaci.\n\nV mínusu se mohou objevit rodinné konflikty, právní či pracovní problémy, finanční potíže, stagnace, rozchody nebo návrat ke starým vzorcům.",
    21: "Čeká Vás období pohybu, cestování, nových zkušeností a rozšiřování obzorů. Je vhodný čas na cestování, práci se zahraničím, nové projekty, kontakty a posun na další životní úroveň. Aktivita, otevřenost a nové zkušenosti Vám mohou přinést úspěch, uznání i finanční růst. Důležité je také udržovat rovnováhu a být obezřetní ve finančních záležitostech.\n\nV plusu přináší cestování, zahraniční příležitosti, nové kontakty, úspěch, seberealizaci, finanční pohodu a harmonii v životě.\n\nV mínusu se mohou objevit stagnace, chaos, problémy s dokumenty, komplikace na cestách, potíže v zahraničí, konflikty nebo ztráta pracovního či společenského postavení.",
    22: "Čeká Vás dynamické období plné změn, pohybu a nových začátků. Budete vedeni k větší aktivitě, otevřenosti a ochotě vystoupit ze zajetých kolejí. Cestování, nové kontakty a zkušenosti mohou přinést zajímavé příležitosti, vztahy i prostor pro seberealizaci. Důležité je neulpívat na materiálních věcech, respektovat svobodu druhých a nebát se začít něco úplně nového.\n\nV plusu přináší nové životní etapy, lásku, zajímavá setkání, cestování, podnikatelské příležitosti, nové dovednosti a pocit svobody.\n\nV mínusu se mohou objevit unáhlená rozhodnutí, zbytečné riskování, finanční ztráty, konflikty, rozchody, závislosti nebo problémy způsobené neopatrností."
  }
};

// Funkce vyhledá text v JSONu podle sekce. Pokud neexistuje (např. chybějící střed), napíše fallback hlášku
function getTextForEnergy(value, category) {
  if (textDatabase[category] && textDatabase[category][value]) {
    return textDatabase[category][value] + "\n\nVíce o této energii a jejích projevech najdete v plném rozboru.";
  }
  return "Více o této energii a jejích projevech najdete v plném rozboru.";
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match]));
}

function renderEnergyHTML(raw) {
  if (!raw) return '';
  // PŘIDÁNO "V plusu" a "V mínusu", aby je kód automaticky ztučnil tak, jak klientka chce
  const hi = ['V plusu', 'V mínusu', 'Skutečná síla', 'Hlavním úkolem', 'Vaším darem', 'V negativu', 'V negativním projevu', 'V pozitivu', 'V pozitivním projevu', 'Smysl této energie', 'Je to jen', 'To je jen'];

  const toHTML = (txt, idx) => {
    let safe = escapeHtml(txt).replace(/\n/g, '<br>');
    hi.forEach(p => { safe = safe.replace(new RegExp(`^\\s*${p}\\b|\\b${p}\\b`, 'g'), `<span>${p}</span>`); });
    const tipMatch = txt.match(/^(Mal[ýá]\s+tip|Mal[á]\s+rada)\s*:+\s*/i);
    if (tipMatch) return `<div class="tip"><strong>${escapeHtml(tipMatch[1])}:</strong> ${escapeHtml(txt.slice(tipMatch[0].length)).replace(/\n/g, '<br>')}</div>`;
    if (/^(Více o této energii|To je|Je to|V pln[éí]m rozboru)/i.test(txt)) return `<div class="note muted">${safe}</div>`;
    return `<p>${safe}</p>`;
  };
  return `<div class="energy-text">${raw.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map(toHTML).join('')}</div>`;
}

// =========================================================
// 4. UŽIVATELSKÉ ROZHRANÍ (UI) A INICIALIZACE
// =========================================================
document.getElementById('birthDate').addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g, '').substring(0, 8);
  if (v.length >= 4) v = `${v.slice(0, 2)}.${v.slice(2, 4)}.${v.slice(4)}`;
  else if (v.length >= 2) v = `${v.slice(0, 2)}.${v.slice(2)}`;
  e.target.value = v;
});

function displayResults(result, elementId) {
  const periodData = threeEnergiesAtDate(document.getElementById('birthDate').value);
  // Nové napojení textů pro sekci období
  const eis = [periodData.E1, periodData.E2, periodData.E3].map(val => getTextForEnergy(val, 'obdobi'));

  const chakraRows = [
    { cls: 'row-sahasrara', name: 'Sahasrára', sub: 'Mise', data: result.chakras.sahasrara },
    { cls: 'row-ajna', name: 'Ádžna', sub: 'Osud, egregory', data: result.chakras.ajna },
    { cls: 'row-vishuddha', name: 'Višuddha', sub: 'Sebevnímání', data: result.chakras.vishuddha },
    { cls: 'row-anahata', name: 'Anáhata', sub: 'Vztahy, svět', data: result.chakras.anahata },
    { cls: 'row-manipura', name: 'Manipura', sub: 'Status', data: result.chakras.manipura },
    { cls: 'row-svadhi', name: 'Svádhišthána', sub: 'Láska a radost', data: result.chakras.svadhisthana },
    { cls: 'row-muladhara', name: 'Muládhára', sub: 'Tělo, hmota', data: result.chakras.muladhara }
  ];

  document.getElementById(elementId).innerHTML = `
    <div class="canvas-card">
      ${createMatrixSVG(result, periodData)}
    </div> 
    
    <div class="energies-section"> 
      <!-- Osobní vlastnosti a Střed matice dynamicky generované -->
      ${[
      { val: result.A, title: 'Vaše první energie', cat: 'osobni', cls: '' },
      { val: result.B, title: 'Vaše druhá energie', cat: 'osobni', cls: '' },
      { val: result.E, title: 'Jak komunikujete', cat: 'komunikace', cls: 'full-width' }
    ].map(item => `
        <div class="energy-card ${item.cls}"> 
          <div class="energy-card-header"> 
            <div class="energy-number">${item.val}</div> 
            <h2><span>${item.title}</span></h2> 
          </div> 
          <div class="energy-card-body">${renderEnergyHTML(getTextForEnergy(item.val, item.cat))}</div> 
        </div>
      `).join('')}
      <div class="cta-inline"> 
        <p>Poznáváte se v tom? Toto je jen zlomek Vašeho kódu.</p> 
        <a href="#rozbory" class="btn-cta-inline">Chci plný rozbor &nbsp;→</a> 
      </div> 
    </div> 
    
    <div class="period-card"> 
      <h3>Současné období · ${periodData.agePeriod}</h3>
      <div class="period-numbers"> 
        <div class="period-num"><span class="num">${periodData.E1}</span><span class="lbl">Energie 1</span></div> 
        <div class="period-num"><span class="num">${periodData.E2}</span><span class="lbl">Energie 2</span></div> 
        <div class="period-num"><span class="num">${periodData.E3}</span><span class="lbl">Výsledná</span></div> 
      </div> 
      <div class="period-interpretations"> 
        ${[periodData.E1, periodData.E2, periodData.E3].map((val, idx) => `
          <div class="period-interp-item"> 
            <div class="period-interp-num">Energie ${val}</div> 
            <div class="period-interp-text">${renderEnergyHTML(eis[idx])}</div> 
          </div>
        `).join('')}
      </div> 
    </div> 

    <div style="height: 30px; width: 100%;"></div>
    
    <div class="diagrams-card" style="margin-bottom: 30px; padding: 2rem; background: rgba(0,0,0,0.2); border-radius: 12px; color: #fff;">

      <div style="display: flex; justify-content: space-around; flex-wrap: wrap; margin-bottom: 3rem; gap: 2rem;">
        <div style="text-align: center;">
          <h4 style="margin-bottom: 15px; font-size: 1.1rem;">Mužská rodová linie:</h4>
          ${createSmallCirclesSVG([result.F, result.Y, result.M_line])}
        </div>
        <div style="text-align: center;">
          <h4 style="margin-bottom: 15px; font-size: 1.1rem;">Ženská rodová linie:</h4>
          ${createSmallCirclesSVG([result.P, result.X, result.Zh_line])}
        </div>
      </div>

      <div style="display: flex; justify-content: space-around; flex-wrap: wrap; margin-bottom: 3rem; gap: 2rem;">
        <div style="max-width: 250px;">
          <h4 style="margin-bottom: 10px; font-size: 1.1rem;">Osobní určení (Hledání duše)</h4>
          <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 15px; line-height: 1.4;">Mix mužského a ženského. Budování vztahů. Dovednosti.</p>
          <div style="display: flex; justify-content: center;">
            ${createConnectionSVG('Nebe', 'Země', result.nebo, result.zemlya)}
          </div>
        </div>
        
        <div style="max-width: 250px;">
          <h4 style="margin-bottom: 10px; font-size: 1.1rem;">Socializace</h4>
          <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 15px; line-height: 1.4;">Sociální a rodinné systémy. Výsledek a přijetí veřejností.</p>
          <div style="display: flex; justify-content: center;">
            ${createConnectionSVG('M', 'Ž', result.M_line, result.Zh_line)}
          </div>
        </div>
      </div>

      <div style="text-align: center; max-width: 400px; margin: 0 auto; padding-bottom: 0;">
        <h4 style="margin-bottom: 10px; font-size: 1.1rem;">Duchovní určení</h4>
        <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 15px; line-height: 1.4;">Duchovní zkouška. Kdo jsem pro Boha? Mám v sobě něco duchovního?</p>
        <div style="display: flex; justify-content: center; align-items: center; height: 80px;">
          ${createSimpleCircleSVG(result.total)}
        </div>
      </div>
    </div>
    
<div class="table-card"> 
      <div class="chakra-grid">
        <div class="chakra-row chakra-header">
          <div class="c-col">Čakra</div>
          <div class="c-col">Fyzika</div>
          <div class="c-col">Energie</div>
          <div class="c-col">Emoce</div>
        </div>
        ${chakraRows.map(r => `
          <div class="chakra-row">
            <div class="c-col">
              <div class="chakra-label">${r.name}</div>
              <div class="chakra-sublabel">${r.sub}</div>
            </div>
            <div class="c-col">${r.data[0]}</div>
            <div class="c-col">${r.data[1]}</div>
            <div class="c-col">${r.data[2]}</div>
          </div>
        `).join('')}
        <div class="chakra-row total-row">
          <div class="c-col">
            <div class="chakra-label">Celkem</div>
            <div class="chakra-sublabel">Celkové pole</div>
          </div>
          <div class="c-col">${result.totalEnergies[0]}</div>
          <div class="c-col">${result.totalEnergies[1]}</div>
          <div class="c-col">${result.totalEnergies[2]}</div>
        </div>
      </div>
    </div>
  `;
}

function calculateSingle() {
  try {
    const result = calculateMatrix(document.getElementById('birthDate').value);
    displayResults(result, 'singleResults');
  } catch (error) {
    alert('Chyba: ' + error.message);
  }
}


// TESTOVACÍ BLOK KÓDU // 
/*
window.onload = function() {
  document.getElementById('birthDate').value = "02.02.2006"; 
  calculateSingle();
};
*/
