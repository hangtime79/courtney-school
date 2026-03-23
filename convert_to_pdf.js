const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const htmlPath = path.join(__dirname, 'assets', 'battle_of_the_table_iPAD.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    // 1. Helper to sync character designs across all pages
    function syncSVG(sourceSelector, targetSelector) {
      const source = document.querySelector(sourceSelector);
      const targets = document.querySelectorAll(targetSelector);
      if (!source) return;
      targets.forEach(target => {
        const newSvg = source.cloneNode(true);
        const targetWidth = target.getAttribute('width');
        const targetHeight = target.getAttribute('height');
        const targetClass = target.getAttribute('class');
        if (targetWidth) newSvg.setAttribute('width', targetWidth);
        if (targetHeight) newSvg.setAttribute('height', targetHeight);
        if (targetClass) newSvg.setAttribute('class', targetClass);
        target.replaceWith(newSvg);
      });
    }

    // Apply consistency
    // NOBLE SERVIETTE: now at #p4 (Step 2)
    syncSVG('#p4 svg.ag', '#p1 .char-mini:nth-child(2) svg');
    syncSVG('#p4 svg.ag', '#p2 .ccard:nth-child(2) .ccard-art svg');
    
    // SIR FORKSWORTH: Title version (#p1) is source
    syncSVG('#p1 .char-mini:nth-child(1) svg', '#p2 .ccard:nth-child(1) .ccard-art svg');
    syncSVG('#p1 .char-mini:nth-child(1) svg', '#p6 .art-col svg');
    
    // SHADOW BLADE: Step 3 version (#p5) is source
    syncSVG('#p5 svg.as', '#p1 .char-mini:nth-child(4) svg');
    syncSVG('#p5 svg.as', '#p2 .ccard:nth-child(3) .ccard-art svg');
    
    // LADY SPOON: Step 5 version (#p7) is source
    syncSVG('#p7 svg.ab', '#p1 .char-mini:nth-child(5) svg');
    syncSVG('#p7 svg.ab', '#p2 .ccard:nth-child(4) .ccard-art svg');
    
    // THE BATTLEGROUND PLATE: now at #p3 (Step 1)
    syncSVG('#p3 svg', '#p1 .char-mini:nth-child(3) svg');

    // 2. Fix the Summary Diagram on Page 8
    const p8 = document.getElementById('p8');
    if (p8) {
      const svg = p8.querySelector('svg');
      if (svg) {
        // A. Center Fork Tines
        const tines = svg.querySelectorAll('rect[x="110"], rect[x="122"], rect[x="134"]');
        tines.forEach(t => {
          const currentX = parseInt(t.getAttribute('x'));
          t.setAttribute('x', (currentX + 4).toString());
        });

        // B. Center Plate (shift from 300 to 280)
        const plateElements = svg.querySelectorAll('circle[cx="300"], text[x="300"]');
        plateElements.forEach(el => {
          el.setAttribute(el.tagName === 'circle' ? 'cx' : 'x', '280');
        });

        // C. Position Top Character Labels
        const topLabels = [
          { text: 'STEED', x: 55 },
          { text: 'KNIGHT', x: 130 },
          { text: 'VILLAIN', x: 408 },
          { text: 'DAMSEL', x: 502 }
        ];
        topLabels.forEach(l => {
          const el = Array.from(svg.querySelectorAll('text')).find(t => t.textContent.includes(l.text));
          if (el) {
            el.setAttribute('x', l.x);
            el.setAttribute('y', '27');
          }
        });

        // D. Create Bottom Labels and Boxes
        const labelData = [
          { name: 'NAPKIN', sub: '(far left)', x: 55, y1: 153, y2: 164, boxX: 25, boxY: 142, boxW: 60, boxH: 26, fill: '#f5e6c8', stroke: '#6d4c41' },
          { name: 'FORK', sub: '(left)', x: 130, y1: 153, y2: 164, boxX: 105, boxY: 142, boxW: 50, boxH: 26, fill: '#d4a017', stroke: '#0a0a0a' },
          { name: 'PLATE', sub: '(centre)', x: 280, y1: 153, y2: 164, boxX: 235, boxY: 142, boxW: 90, boxH: 26, fill: '#fff8f0', stroke: '#0a0a0a' },
          { name: 'KNIFE', sub: '(right, blade in)', x: 408, y1: 153, y2: 164, boxX: 360, boxY: 142, boxW: 96, boxH: 26, fill: '#c8c8c8', stroke: '#c0392b' },
          { name: 'SPOON', sub: '(far right)', x: 502, y1: 153, y2: 164, boxX: 475, boxY: 142, boxW: 54, boxH: 26, fill: '#fce4ec', stroke: '#e91e8c' }
        ];

        const textElements = Array.from(svg.querySelectorAll('text'));
        const boxes = [];

        labelData.forEach(l => {
          let t1, t2;
          
          if (l.name === 'PLATE') {
            const combinedText = textElements.find(el => el.textContent.includes('PLATE (centre)') || el.textContent.includes('PLATE(centre)'));
            if (combinedText) {
              t1 = combinedText;
              t1.textContent = 'PLATE';
              t2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
              const attrs = t1.attributes;
              for (let i = 0; i < attrs.length; i++) {
                t2.setAttribute(attrs[i].name, attrs[i].value);
              }
              t2.textContent = '(centre)';
              t2.style.fontWeight = '400';
              t2.style.fontSize = '8px';
              svg.appendChild(t2);
            }
          }

          if (!t1) t1 = textElements.find(el => el.textContent.trim() === l.name);
          if (!t2) t2 = textElements.find(el => el.textContent.includes(l.sub));

          if (t1) {
            t1.setAttribute('x', l.x);
            t1.setAttribute('y', l.y1);
            t1.setAttribute('text-anchor', 'middle');
            t1.style.fontWeight = '800';
            t1.style.fontSize = '10px';
          }
          if (t2) {
            t2.setAttribute('x', l.x);
            t2.setAttribute('y', l.y2);
            t2.setAttribute('text-anchor', 'middle');
            t2.style.fontSize = '8px';
          }

          const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          rect.setAttribute('x', l.boxX);
          rect.setAttribute('y', l.boxY);
          rect.setAttribute('width', l.boxW);
          rect.setAttribute('height', l.boxH);
          rect.setAttribute('rx', '4');
          rect.setAttribute('fill', l.fill);
          rect.setAttribute('stroke', l.stroke);
          rect.setAttribute('stroke-width', '1.5');
          boxes.push(rect);
        });

        // FINAL LAYERING: Move boxes and text to the absolute top
        boxes.forEach(box => svg.appendChild(box));
        const allText = Array.from(svg.querySelectorAll('text'));
        allText.forEach(text => svg.appendChild(text));
      }

      // E. Two-Column Steps Layout
      if (!p8.querySelector('.print-p8-container')) {
        const children = Array.from(p8.children);
        const title = children[0];
        const settingBox = children[2];
        const chkTitle = children[3];
        const chk = children[4];
        const congrats = children[5];

        if (chkTitle) chkTitle.textContent = "⚔️ YOUR PLACE SETTING STEPS ⚔️";
        
        const topSection = document.createElement('div');
        topSection.style.width = '100%';
        topSection.style.textAlign = 'center';
        topSection.style.marginBottom = '10px';
        
        settingBox.style.width = '90%';
        settingBox.style.margin = '0 auto';
        if (svg) {
          svg.setAttribute('height', '320');
          svg.style.maxWidth = '100%';
        }
        topSection.appendChild(settingBox);

        const bottomSection = document.createElement('div');
        bottomSection.style.display = 'flex';
        bottomSection.style.gap = '20px';
        bottomSection.style.width = '100%';

        const leftCol = document.createElement('div');
        leftCol.style.flex = '1';
        leftCol.style.display = 'flex';
        leftCol.style.flexDirection = 'column';
        leftCol.style.gap = '8px';

        const rightCol = document.createElement('div');
        rightCol.style.flex = '1';
        rightCol.style.display = 'flex';
        rightCol.style.flexDirection = 'column';
        rightCol.style.gap = '8px';

        const steps = Array.from(chk.children);
        steps.forEach((step, index) => {
          step.style.fontSize = '0.9rem';
          step.style.padding = '6px 10px';
          step.style.minHeight = 'auto';
          if (index < 3) leftCol.appendChild(step);
          else rightCol.appendChild(step);
        });

        bottomSection.appendChild(leftCol);
        bottomSection.appendChild(rightCol);

        p8.innerHTML = '';
        p8.style.justifyContent = 'flex-start';
        p8.appendChild(title);
        p8.appendChild(topSection);
        p8.appendChild(chkTitle);
        p8.appendChild(bottomSection);
        if (congrats) {
          congrats.style.display = 'block';
          p8.appendChild(congrats);
        }
      }
    }

    // Ensure checklist is "checked" for the final guide
    document.querySelectorAll('.ci').forEach(el => el.classList.add('done'));
  });

  const printCss = `
    @media print {
      @page { size: A4 landscape; margin: 0; }
      html, body { 
        overflow: visible !important; 
        height: auto !important; 
        background: white !important; 
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .title-rays { display: none !important; }
      .stage { position: static !important; display: block !important; }
      .pages { display: block !important; overflow: visible !important; }
      .page {
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        position: relative !important;
        page-break-after: always;
        height: 100vh;
        width: 100vw;
        padding: 30px 50px !important;
        box-sizing: border-box;
        overflow: hidden !important;
        background: #fdf6e3 !important;
      }
      .nav, .scroll-hint, .dots, body::before { display: none !important; }
      .panel { box-shadow: 4px 4px 0 #0a0a0a !important; border: 3px solid #0a0a0a !important; width: 100% !important; }
      .title-box { 
        background-color: #0a0a0a !important; 
        box-shadow: 6px 6px 0 #d4a017 !important; 
        border: 4px solid #d4a017 !important; 
      }
      .art-col svg { max-height: 260px !important; width: auto !important; }
      .pt { font-size: 1.8rem !important; margin-bottom: 10px !important; }
    }
  `;

  await page.addStyleTag({ content: printCss });

  await page.pdf({
    path: path.join(__dirname, 'assets', 'battle_of_the_table_A4_Landscape.pdf'),
    format: 'A4',
    landscape: true,
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });

  await browser.close();
  console.log('PDF regenerated with Step 1/2 Swap.');
})();
