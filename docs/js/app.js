/**
 * Gemstone Explorer — Main Application Controller
 * Wires data, crystal renderer, spectra renderer, photon engine & experiment renderer.
 */

function formatCellParams(uc) {
  if (!uc) return '—';
  const { a, b, c, alpha, beta, gamma } = uc;
  let s = `${a.toFixed(2)}`;
  if (b !== a) s += ` × ${b.toFixed(2)}`;
  if (c !== a && c !== b) s += ` × ${c.toFixed(2)}`;
  s += ' Å';
  if (alpha !== 90 || beta !== 90 || gamma !== 90) {
    const angles = [];
    if (alpha !== 90) angles.push(`α=${alpha}°`);
    if (beta !== 90) angles.push(`β=${beta}°`);
    if (gamma !== 90) angles.push(`γ=${gamma}°`);
    s += ' (' + angles.join(', ') + ')';
  }
  return s;
}

function propVal(val) {
  return (val === null || val === undefined) ? '—' : String(val);
}

function getLaueSymmetry(crystalSystem) {
  const sys = (crystalSystem || '').toLowerCase();
  if (sys.includes('cubic')) return { fold: 4, laueClass: 'm3̄m', label: 'Cubic → up to 4-fold symmetry' };
  if (sys.includes('tetragonal')) return { fold: 4, laueClass: '4/mmm', label: 'Tetragonal → 4-fold symmetry' };
  if (sys.includes('hexagonal')) return { fold: 6, laueClass: '6/mmm', label: 'Hexagonal → 6-fold symmetry' };
  if (sys.includes('trigonal')) return { fold: 3, laueClass: '3̄m', label: 'Trigonal → 3-fold symmetry' };
  if (sys.includes('orthorhombic')) return { fold: 2, laueClass: 'mmm', label: 'Orthorhombic → 2-fold symmetry' };
  if (sys.includes('monoclinic')) return { fold: 2, laueClass: '2/m', label: 'Monoclinic → 2-fold symmetry' };
  if (sys.includes('triclinic')) return { fold: 1, laueClass: '1̄', label: 'Triclinic → inversion only' };
  return { fold: 1, laueClass: '?', label: 'Unknown' };
}

class GemstoneExplorer {
  constructor() {
    this.gems = window.GEMSTONES || {};
    this.gemIds = Object.keys(this.gems);
    this.crystalRenderer = null;
    this.spectraRenderer = null;
    this.photonEngine = null;
    this.experimentRenderer = null;
    this.activeGem = null;
    this.activeTab = 'properties';
    this.gridSize = 4;
    this.gridGems = [];
    this.burstSize = 30;
    this.reflectionMode = 'integrated';
    this.transmissionMode = 'integrated';
    this.reflectionRenderer = null;
    this.transmissionRenderer = null;
    this.continuous = false;
    this.continuousRate = 5;
    this._imageCache = {};
    // Map app gem IDs to local polished images (chopped from gemstonepics.png)
    this._polishedImageMap = {
      quartz: 'rose_quartz',
      amethyst: 'amethyst',
      emerald: 'emerald',
      aquamarine: 'aquamarine',
      almandine: 'garnet',
      pyrope: 'garnet',
      spessartine: 'garnet',
      peridot: 'peridot',
      zircon: 'zircon',
      lazurite: 'lapis_lazuli'
    };
  }

  init() {
    this.crystalRenderer = new window.CrystalRenderer(document.getElementById('crystal-canvas'));
    this.spectraRenderer = new window.SpectraRenderer(document.getElementById('spectra-canvas'));

    this.photonEngine = new window.PhotonEngine();
    this.experimentRenderer = new window.ExperimentRenderer(document.getElementById('experiment-canvas'));
    this.experimentRenderer.setEngine(this.photonEngine);

    this.reflectionRenderer = new window.ScreenRenderer(document.getElementById('reflection-screen-canvas'));
    this.transmissionRenderer = new window.ScreenRenderer(document.getElementById('transmission-screen-canvas'));

    const nmrCanvas = document.getElementById('nmr-canvas');
    if (nmrCanvas && window.NMRRenderer) {
      this.nmrRenderer = new window.NMRRenderer(nmrCanvas);
      this.nmrRenderer.setAllGems(this.gems);
      this.nmrRenderer.bindEvents();
    }

    const vibCanvas = document.getElementById('vibrational-canvas');
    if (vibCanvas && window.VibrationalRenderer) {
      this.vibRenderer = new window.VibrationalRenderer(vibCanvas);
      this.vibRenderer.setAllGems(this.gems);
      this.vibRenderer.bindEvents();
    }

    const fpCanvas = document.getElementById('fingerprint-canvas');
    if (fpCanvas && window.StructuralFingerprintRenderer) {
      this.fingerprintRenderer = new window.StructuralFingerprintRenderer(fpCanvas);
    }

    this.experimentRenderer.onFrame = () => {
      if (this.continuous && this.photonEngine) {
        this.photonEngine.emitBurst(this.continuousRate);
      }
    };

    this._initGridGems();
    this.buildGemList();
    this.buildGridPicker();
    this.bindEvents();
    this.selectGem('quartz');
  }

  _initGridGems() {
    const n = this.gridSize * this.gridSize;
    this.gridGems = [];
    for (let i = 0; i < n; i++) {
      this.gridGems[i] = this.gemIds[i % this.gemIds.length];
    }
    this._applyGrid();
  }

  _applyGrid() {
    this.photonEngine.setGrid(this.gridGems, this.gridSize, this.gridSize);
  }

  // ── Tab switching ─────────────────────────────────────────

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
      btn.setAttribute('aria-selected', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });

    document.querySelector('.app').classList.toggle('experiment-mode', tabId === 'experiment');

    if (tabId === 'experiment') {
      this.crystalRenderer.stopAnimation();
      this.experimentRenderer.resize();
      this.experimentRenderer.start();
    } else if (tabId === 'nmr') {
      this.crystalRenderer.stopAnimation();
      this.experimentRenderer.stop();
      if (this.nmrRenderer && this.activeGem) {
        this._updateNMR();
      }
      if (this.vibRenderer) this.vibRenderer.render();
    } else {
      this.experimentRenderer.stop();
      if (this.activeGem) {
        this.crystalRenderer.startAnimation();
      }
    }
  }

  // ── Gem list ──────────────────────────────────────────────

  buildGemList() {
    const container = document.getElementById('gem-list');
    if (!container) return;
    container.innerHTML = '';
    for (const [id, gem] of Object.entries(this.gems)) {
      const ri = gem.properties && gem.properties.ri && Array.isArray(gem.properties.ri)
        ? gem.properties.ri[0].toFixed(3) : '—';
      const imgName = this._polishedImageMap[id];
      const imgSrc = imgName ? 'assets/gems/' + imgName + '.png' : null;
      const swatch = imgSrc
        ? `<img class="gem-swatch-img" src="${imgSrc}" alt="${propVal(gem.name)}">`
        : `<div class="gem-swatch" style="background: ${gem.color || '#888'}"></div>`;
      const card = document.createElement('div');
      card.className = 'gem-card';
      card.dataset.id = id;
      card.innerHTML = `
        ${swatch}
        <div class="gem-card-info">
          <div class="gem-card-name">${propVal(gem.name)}</div>
          <div class="gem-card-formula">${propVal(gem.formula)}</div>
        </div>
        <div class="gem-card-ri">RI: ${ri}</div>
      `;
      container.appendChild(card);
    }
  }

  selectGem(id) {
    const gem = this.gems[id];
    if (!gem) return;

    document.querySelectorAll('.gem-card').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });

    this.crystalRenderer.setStructure(gem);
    if (this.activeTab === 'properties') {
      this.crystalRenderer.startAnimation();
    }

    this.spectraRenderer.setData(gem);
    this.spectraRenderer.render();
    if (this.fingerprintRenderer) {
      this.fingerprintRenderer.setGem(gem);
      this.fingerprintRenderer.render();
    }
    this.updateProperties(gem);
    this.updateImages(gem);
    this.activeGem = id;

    if (this.nmrRenderer) {
      this.nmrRenderer.setGem(gem);
      if (this.activeTab === 'nmr') this._updateNMR();
    }
    if (this.vibRenderer) {
      this.vibRenderer.setGem(gem);
      if (this.activeTab === 'nmr') this.vibRenderer.render();
    }

    const activeCard = document.querySelector(`.gem-card[data-id="${id}"]`);
    if (activeCard) activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Image loading ──────────────────────────────────────────

  async _fetchWikiThumbnail(article) {
    const key = 'wiki:' + article;
    if (this._imageCache[key]) return this._imageCache[key];
    try {
      const resp = await fetch(
        'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(article)
      );
      if (!resp.ok) return null;
      const data = await resp.json();
      const src = data.thumbnail && data.thumbnail.source;
      if (!src) return null;
      const url = src.replace(/\/\d+px-/, '/600px-');
      const result = {
        url: url,
        title: data.title || article,
        pageUrl: (data.content_urls && data.content_urls.desktop && data.content_urls.desktop.page)
          || ('https://en.wikipedia.org/wiki/' + article)
      };
      this._imageCache[key] = result;
      return result;
    } catch (e) {
      console.warn('Wiki thumbnail fetch failed for', article, e);
      return null;
    }
  }

  async _fetchCommonsImage(searchTerm) {
    const key = 'commons:' + searchTerm;
    if (this._imageCache[key]) return this._imageCache[key];
    try {
      const params = new URLSearchParams({
        action: 'query',
        generator: 'search',
        gsrsearch: searchTerm,
        gsrnamespace: '6',
        gsrlimit: '3',
        prop: 'imageinfo',
        iiprop: 'url|extmetadata',
        iiurlwidth: '600',
        format: 'json',
        origin: '*'
      });
      const resp = await fetch('https://commons.wikimedia.org/w/api.php?' + params.toString());
      if (!resp.ok) return null;
      const data = await resp.json();
      const pages = data.query && data.query.pages;
      if (!pages) return null;
      const sorted = Object.values(pages).sort(function(a, b) {
        return (a.index || 0) - (b.index || 0);
      });
      for (var i = 0; i < sorted.length; i++) {
        var page = sorted[i];
        var info = page.imageinfo && page.imageinfo[0];
        if (!info || !info.thumburl) continue;
        var result = {
          url: info.thumburl,
          title: (page.title || '').replace('File:', '') || searchTerm,
          pageUrl: info.descriptionurl || ('https://commons.wikimedia.org/wiki/' + page.title)
        };
        this._imageCache[key] = result;
        return result;
      }
      return null;
    } catch (e) {
      console.warn('Commons image fetch failed for', searchTerm, e);
      return null;
    }
  }

  _replaceImg(wrapId, url) {
    var wrap = document.getElementById(wrapId);
    if (!wrap) return null;
    var old = wrap.querySelector('.gem-image');
    if (old) old.remove();
    var img = document.createElement('img');
    img.className = 'gem-image';
    img.alt = wrapId === 'img-raw-wrap' ? 'Raw specimen' : 'Polished specimen';
    img.loading = 'lazy';
    // no crossOrigin — Wikimedia serves images fine without CORS preflight
    wrap.appendChild(img);
    return img;
  }

  async updateImages(gem) {
    var polishedPlaceholder = document.getElementById('img-polished-placeholder');
    var polishedCaption = document.getElementById('img-polished-caption');

    if (!polishedPlaceholder) return;

    var polishedImg = this._replaceImg('img-polished-wrap');

    polishedPlaceholder.classList.remove('hidden');
    polishedPlaceholder.querySelector('.placeholder-text').textContent = 'Loading…';

    var gemColor = gem.color || '#888';
    polishedPlaceholder.querySelector('.placeholder-icon').style.color = gemColor;

    polishedCaption.textContent = (gem.images && gem.images.polishedCaption) || '';

    var localName = this._polishedImageMap[gem.id];
    var localUrl = localName ? 'assets/gems/' + localName + '.png' : null;

    function loadImg(imgEl, placeholderEl, url) {
      if (!url) {
        placeholderEl.querySelector('.placeholder-text').textContent = 'Not available';
        return;
      }
      imgEl.onload = function() {
        imgEl.classList.add('loaded');
        placeholderEl.classList.add('hidden');
      };
      imgEl.onerror = function() {
        placeholderEl.querySelector('.placeholder-text').textContent = 'Failed to load';
      };
      imgEl.src = url;
    }

    if (localUrl) {
      loadImg(polishedImg, polishedPlaceholder, localUrl);
      return;
    }

    var imgs = gem.images;
    if (!imgs || !imgs.polishedSearch) {
      polishedPlaceholder.querySelector('.placeholder-text').textContent = 'No image';
      return;
    }

    try {
      var result = await this._fetchCommonsImage(imgs.polishedSearch);
      loadImg(polishedImg, polishedPlaceholder, result && result.url ? result.url : null);
    } catch (e) {
      console.error('Image loading failed:', e);
      polishedPlaceholder.querySelector('.placeholder-text').textContent = 'Error';
    }
  }

  // ── Properties ────────────────────────────────────────────

  updateProperties(gem) {
    const p = gem.properties || {};
    const chrom = gem.chromophore || {};
    const spec = gem.spectra || {};
    const fluor = gem.fluorescence || {};

    const setHTML = (elId, html) => {
      const el = document.getElementById(elId);
      if (el) el.innerHTML = html;
    };

    const riStr = p.ri && Array.isArray(p.ri) && p.ri.length >= 2
      ? p.ri[0] + '–' + p.ri[1] : propVal(p.ri);
    const piezoBadge = p.piezoelectric
      ? '<span class="prop-badge badge-green">Yes</span>'
      : '<span class="prop-badge badge-red">No</span>';
    const pyroBadge = p.pyroelectric
      ? '<span class="prop-badge badge-green">Yes</span>'
      : '<span class="prop-badge badge-red">No</span>';

    setHTML('props-chemical', `
      <div class="prop-row"><span class="prop-label">Formula</span><span class="prop-val">${propVal(gem.formula)}</span></div>
      <div class="prop-row"><span class="prop-label">Category</span><span class="prop-val">${propVal(gem.category)}</span></div>
      <div class="prop-row"><span class="prop-label">Crystal System</span><span class="prop-val">${propVal(gem.crystalSystem)}</span></div>
      <div class="prop-row"><span class="prop-label">Space Group</span><span class="prop-val">${propVal(gem.spaceGroup)}</span></div>
      <div class="prop-row"><span class="prop-label">Unit Cell</span><span class="prop-val">${formatCellParams(gem.unitCell)}</span></div>
      <div class="prop-row"><span class="prop-label">Hardness</span><span class="prop-val">${propVal(p.hardness)}${p.hardness != null ? ' (Mohs)' : ''}</span></div>
      <div class="prop-row"><span class="prop-label">Specific Gravity</span><span class="prop-val">${propVal(p.sg)}</span></div>
    `);

    setHTML('props-optical', `
      <div class="prop-row"><span class="prop-label">Refractive Index</span><span class="prop-val">${riStr}</span></div>
      <div class="prop-row"><span class="prop-label">Birefringence</span><span class="prop-val">${propVal(p.birefringence)}</span></div>
      <div class="prop-row"><span class="prop-label">Dispersion</span><span class="prop-val">${propVal(p.dispersion)}</span></div>
      <div class="prop-row"><span class="prop-label">Optical Character</span><span class="prop-val">${propVal(p.opticalChar)}</span></div>
      <div class="prop-row"><span class="prop-label">Luster</span><span class="prop-val">${propVal(p.luster)}</span></div>
    `);

    setHTML('props-electrical', `
      <div class="prop-row"><span class="prop-label">Band Gap</span><span class="prop-val">${p.bandGap != null ? p.bandGap + ' eV' : '—'}</span></div>
      <div class="prop-row"><span class="prop-label">Resistivity</span><span class="prop-val">${propVal(p.resistivity)}</span></div>
      <div class="prop-row"><span class="prop-label">Dielectric</span><span class="prop-val">${propVal(p.dielectric)}</span></div>
      <div class="prop-row"><span class="prop-label">Piezoelectric</span><span class="prop-val">${piezoBadge}</span></div>
      <div class="prop-row"><span class="prop-label">Pyroelectric</span><span class="prop-val">${pyroBadge}</span></div>
    `);

    setHTML('props-spectral', `
      <div class="prop-row"><span class="prop-label">Chromophore Ion</span><span class="prop-val">${propVal(chrom.ion)}</span></div>
      <div class="prop-row"><span class="prop-label">Color Mechanism</span><span class="prop-val">${propVal(chrom.mechanism)}</span></div>
      <div class="prop-row"><span class="prop-label">Spectra Source</span><span class="prop-val">${propVal(spec.source)}</span></div>
      <div class="prop-row"><span class="prop-label">Sample</span><span class="prop-val">${propVal(spec.label)}</span></div>
    `);

    setHTML('props-fluorescence', `
      <div class="prop-row"><span class="prop-label">UV Response</span><span class="prop-val">${propVal(fluor.response)}</span></div>
      <div class="prop-row"><span class="prop-label">Emission</span><span class="prop-val">${fluor.emission || 'None'}</span></div>
      <div class="prop-row"><span class="prop-label">Color</span><span class="prop-val">${fluor.color || 'None'}</span></div>
    `);

    const th = gem.thermal || {};
    setHTML('props-thermal', `
      <div class="prop-row"><span class="prop-label">Specific Heat</span><span class="prop-val">${th.specificHeat ? th.specificHeat + ' J/(kg·K)' : '—'}</span></div>
      <div class="prop-row"><span class="prop-label">Thermal Conductivity</span><span class="prop-val">${th.thermalConductivity ? th.thermalConductivity + ' W/(m·K)' : '—'}</span></div>
      <div class="prop-row"><span class="prop-label">Thermo-optic dn/dT</span><span class="prop-val">${th.thermoOpticCoeff ? (th.thermoOpticCoeff > 0 ? '+' : '') + (th.thermoOpticCoeff * 1e6).toFixed(1) + '×10⁻⁶ /K' : '—'}</span></div>
      <div class="prop-row"><span class="prop-label">Linear Expansion α</span><span class="prop-val">${th.linearExpansion ? (th.linearExpansion * 1e6).toFixed(1) + '×10⁻⁶ /K' : '—'}</span></div>
      <div class="prop-row"><span class="prop-label">Debye Temperature</span><span class="prop-val">${th.debyeTemp ? th.debyeTemp + ' K' : '—'}</span></div>
    `);

    const rr = gem.radiation || {};
    const xrfStr = rr.xrfLines ? rr.xrfLines.map(l => `${l.label} (${l.energy} keV)`).join(', ') : '—';
    const rlStr = rr.radioluminescence && rr.radioluminescence.emission
      ? `${rr.radioluminescence.emission} nm (yield ${rr.radioluminescence.yield})`
      : 'None';
    setHTML('props-radiation', `
      <div class="prop-row"><span class="prop-label">Effective Z</span><span class="prop-val">${rr.effectiveZ || '—'}</span></div>
      <div class="prop-row"><span class="prop-label">μ/ρ X-ray (50 keV)</span><span class="prop-val">${rr.massAttenXray ? rr.massAttenXray + ' cm²/g' : '—'}</span></div>
      <div class="prop-row"><span class="prop-label">μ/ρ Gamma (1 MeV)</span><span class="prop-val">${rr.massAttenGamma ? rr.massAttenGamma + ' cm²/g' : '—'}</span></div>
      <div class="prop-row"><span class="prop-label">THz Absorption</span><span class="prop-val">${rr.thzAbsorption ? rr.thzAbsorption + ' cm⁻¹' : '—'}</span></div>
      <div class="prop-row"><span class="prop-label">Color Center Yield</span><span class="prop-val">${rr.colorCenterYield != null ? rr.colorCenterYield : '—'}</span></div>
      <div class="prop-row"><span class="prop-label">Radioluminescence</span><span class="prop-val">${rlStr}</span></div>
      <div class="prop-row"><span class="prop-label">Radiation Hardness</span><span class="prop-val">${rr.radiationHardness ? rr.radiationHardness + '/10' : '—'}</span></div>
      <div class="prop-row"><span class="prop-label">XRF Lines</span><span class="prop-val">${xrfStr}</span></div>
    `);
  }

  // ── Grid picker ───────────────────────────────────────────

  buildGridPicker() {
    const picker = document.getElementById('gem-grid-picker');
    if (!picker) return;
    picker.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
    picker.innerHTML = '';
    const n = this.gridSize * this.gridSize;
    for (let i = 0; i < n; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.idx = i;
      this._updateCellDisplay(cell, i);
      picker.appendChild(cell);
    }
  }

  _updateCellDisplay(cell, idx) {
    const gemId = this.gridGems[idx];
    const gem = this.gems[gemId];
    if (gem) {
      cell.style.background = gem.color || '#333';
      cell.textContent = gem.name || gemId;
      cell.classList.add('assigned');
      const rgb = window.GemUtils.hexToRgb(gem.color || '#888888');
      const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
      cell.style.color = lum > 0.5 ? '#0d1117' : '#e6edf3';
    } else {
      cell.style.background = 'var(--bg-tertiary)';
      cell.textContent = '—';
      cell.classList.remove('assigned');
      cell.style.color = '';
    }
  }

  // ── Stats update ──────────────────────────────────────────

  updateStats() {
    if (!this.photonEngine) return;
    const stats = this.photonEngine.getStats ? this.photonEngine.getStats() : this._computeStats();
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('stat-active', stats.active);
    set('stat-transmitted', stats.transmitted);
    set('stat-reflected', stats.reflected);
    set('stat-absorbed', stats.absorbed);
    set('stat-blocked', stats.blocked);
  }

  _computeStats() {
    const engine = this.photonEngine;
    const photons = engine.photons || [];
    const completed = engine.completedPaths || [];
    let active = 0, transmitted = 0, reflected = 0, absorbed = 0, blocked = 0;
    for (const p of photons) {
      if (p.state === 'traveling') active++;
      else if (p.state === 'transmitted') transmitted++;
      else if (p.state === 'reflected') reflected++;
      else if (p.state === 'absorbed') absorbed++;
      else if (p.state === 'blocked') blocked++;
    }
    for (const p of completed) {
      if (p.state === 'transmitted') transmitted++;
      else if (p.state === 'reflected') reflected++;
      else if (p.state === 'absorbed') absorbed++;
      else if (p.state === 'blocked') blocked++;
    }
    return { active, transmitted, reflected, absorbed, blocked };
  }

  // ── Cell stats grid ────────────────────────────────────────

  _updateCellStats() {
    const container = document.getElementById('cell-stats-grid');
    if (!container || !this.photonEngine || !this.photonEngine.getCellStats) return;
    const stats = this.photonEngine.getCellStats();
    if (!stats || !stats.cells || stats.cells.length === 0) return;

    const GEMS = window.GEMSTONES || {};
    const GU = window.GemUtils;
    const cols = stats.cols, rows = stats.rows;

    // Rebuild cell elements when grid size changes
    if (container.querySelectorAll('.cell-stat').length !== stats.cells.length) {
      container.innerHTML = '';
      for (let i = 0; i < stats.cells.length; i++) {
        const div = document.createElement('div');
        div.className = 'cell-stat';
        div.dataset.idx = i;
        div.innerHTML = '<canvas class="cell-spectra-canvas"></canvas>';
        container.appendChild(div);
      }
    }

    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // Draw spectra charts in every cell
    const cellEls = container.querySelectorAll('.cell-stat');
    for (let i = 0; i < stats.cells.length; i++) {
      const cs = stats.cells[i];
      const gem = cs.gemId ? GEMS[cs.gemId] : null;
      const canvas = cellEls[i].querySelector('canvas');
      if (canvas) this._drawCellSpectra(canvas, cs, gem, GU, i);
    }
  }

  _drawCellSpectra(canvas, cs, gem, GU, cellIdx) {
    const w = canvas.parentElement.clientWidth - 2;
    const h = Math.max(canvas.parentElement.clientHeight - 2, 60);
    const dpr = window.devicePixelRatio || 1;
    if (w < 10 || h < 10) return;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const name = gem ? gem.name : '—';
    const tPct = (cs.transmittance * 100).toFixed(1);
    const rPct = (cs.reflectance * 100).toFixed(1);
    const aPct = cs.total > 0 ? ((cs.absorbed / cs.total) * 100).toFixed(1) : '0.0';

    // Color patches: T, R, A (absorption)
    const patchW = 18, patchH = 12, patchY = 3;
    const patchGap = 3;
    const px0 = w - (patchW + patchGap) * 3 + patchGap;

    ctx.fillStyle = cs.colorT || '#222';
    ctx.fillRect(px0, patchY, patchW, patchH);
    ctx.strokeStyle = '#3fb950'; ctx.lineWidth = 1;
    ctx.strokeRect(px0, patchY, patchW, patchH);

    ctx.fillStyle = cs.colorR || '#222';
    ctx.fillRect(px0 + patchW + patchGap, patchY, patchW, patchH);
    ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 1;
    ctx.strokeRect(px0 + patchW + patchGap, patchY, patchW, patchH);

    ctx.fillStyle = cs.colorA || '#222';
    ctx.fillRect(px0 + (patchW + patchGap) * 2, patchY, patchW, patchH);
    ctx.strokeStyle = '#f85149'; ctx.lineWidth = 1;
    ctx.strokeRect(px0 + (patchW + patchGap) * 2, patchY, patchW, patchH);

    ctx.font = '7px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#7d8590';
    ctx.fillText('T', px0 + patchW / 2, patchY + patchH + 1);
    ctx.fillText('R', px0 + patchW + patchGap + patchW / 2, patchY + patchH + 1);
    ctx.fillText('A', px0 + (patchW + patchGap) * 2 + patchW / 2, patchY + patchH + 1);

    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 9px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    ctx.fillText(name, 3, 3);
    ctx.font = '8px monospace'; ctx.fillStyle = '#7d8590';
    ctx.fillText(`T:${tPct}% R:${rPct}% A:${aPct}% n=${cs.total}`, 3, 14);

    // Temperature readout in cell stats
    const temps = this.photonEngine && this.photonEngine.getCellTemperatures
      ? this.photonEngine.getCellTemperatures() : null;
    if (temps && cellIdx != null && temps[cellIdx] && temps[cellIdx].gemId) {
      const ct = temps[cellIdx];
      const tempC = (ct.temperature - 273.15).toFixed(1);
      const dRI = ct.riShift ? (ct.riShift > 0 ? '+' : '') + (ct.riShift * 1e6).toFixed(1) + '×10⁻⁶' : '0';
      ctx.font = '7px monospace';
      const dT = ct.deltaT;
      ctx.fillStyle = dT > 50 ? '#ff6644' : dT > 10 ? '#d29922' : '#7d8590';
      ctx.fillText(`${tempC}°C  Δn=${dRI}`, 3, 23);
    }

    const chartX = 28, chartY = 32, chartW = w - 32, chartH = h - 40;
    if (chartW < 20 || chartH < 20) return;

    // Display range capped at 1000 nm
    const origBinMin = cs.spectraBinMin || 200;
    const origBinMax = cs.spectraBinMax || 2000;
    const dispMin = origBinMin;
    const dispMax = Math.min(origBinMax, 1000);
    const dispRange = dispMax - dispMin;

    // Visible spectrum background
    for (let px = 0; px < chartW; px++) {
      const wl = dispMin + (px / chartW) * dispRange;
      if (wl < 380 || wl > 780) continue;
      const [r, g, b] = GU ? GU.wavelengthToRGB(wl) : [0, 0, 0];
      ctx.fillStyle = `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},0.08)`;
      ctx.fillRect(chartX + px, chartY, 1, chartH);
    }

    // Reference absorption spectrum (clipped to dispMax)
    if (gem && gem.spectra && gem.spectra.data && gem.spectra.data.length > 1) {
      const data = gem.spectra.data;
      let maxAbs = 0;
      for (const [wl, a] of data) if (wl <= dispMax && a > maxAbs) maxAbs = a;
      if (maxAbs > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        let first = true;
        for (const [wl, a] of data) {
          if (wl > dispMax) break;
          const px = chartX + ((wl - dispMin) / dispRange) * chartW;
          const py = chartY + chartH - (a / maxAbs) * chartH;
          if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '7px monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        ctx.fillText('Abs', chartX + chartW - 2, chartY + 2);
      }
    }

    const specT = cs.spectraT;
    const specR = cs.spectraR;
    const specI = cs.spectraI;
    const bins = cs.spectraBins || 400;

    if (specT && specT.length > 0 && specI && specI.length > 0) {
      const maxBinIdx = Math.min(bins, Math.ceil(bins * dispRange / (origBinMax - origBinMin)));
      const binW = chartW / maxBinIdx;
      const total = Math.max(cs.total || 1, 1);

      const avgT = [], avgR = [], avgA = [], errT = [], errR = [], errA = [];
      let yMax = 0;
      for (let j = 0; j < maxBinIdx; j++) {
        const aT = specT[j] / total;
        const aR = specR[j] / total;
        const aI = specI[j] / total;
        const aA = Math.max(0, aI - aT - aR);
        const eT = Math.sqrt(Math.max(specT[j], 0)) / total;
        const eR = Math.sqrt(Math.max(specR[j], 0)) / total;
        const eA = Math.sqrt(Math.max(specT[j] + specR[j] + (specI[j] || 0), 0)) / total;
        avgT.push(aT); avgR.push(aR); avgA.push(aA);
        errT.push(eT); errR.push(eR); errA.push(eA);
        yMax = Math.max(yMax, aT + eT, aR + eR, aA + eA);
      }
      yMax = yMax > 0 ? yMax * 1.15 : 1;

      const cy = v => chartY + chartH - Math.min(Math.max(0, v / yMax), 1) * chartH;

      // ── Transmitted error band (±1σ) ──
      ctx.beginPath();
      for (let j = 0; j < maxBinIdx; j++) {
        const bx = chartX + (j + 0.5) * binW;
        if (j === 0) ctx.moveTo(bx, cy(avgT[j] + errT[j]));
        else ctx.lineTo(bx, cy(avgT[j] + errT[j]));
      }
      for (let j = maxBinIdx - 1; j >= 0; j--) {
        const bx = chartX + (j + 0.5) * binW;
        ctx.lineTo(bx, cy(Math.max(0, avgT[j] - errT[j])));
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(63, 185, 80, 0.2)';
      ctx.fill();

      // ── Reflected error band (±1σ) ──
      ctx.beginPath();
      for (let j = 0; j < maxBinIdx; j++) {
        const bx = chartX + (j + 0.5) * binW;
        if (j === 0) ctx.moveTo(bx, cy(avgR[j] + errR[j]));
        else ctx.lineTo(bx, cy(avgR[j] + errR[j]));
      }
      for (let j = maxBinIdx - 1; j >= 0; j--) {
        const bx = chartX + (j + 0.5) * binW;
        ctx.lineTo(bx, cy(Math.max(0, avgR[j] - errR[j])));
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(88, 166, 255, 0.15)';
      ctx.fill();

      // ── Absorption error band (±1σ) ──
      ctx.beginPath();
      for (let j = 0; j < maxBinIdx; j++) {
        const bx = chartX + (j + 0.5) * binW;
        if (j === 0) ctx.moveTo(bx, cy(avgA[j] + errA[j]));
        else ctx.lineTo(bx, cy(avgA[j] + errA[j]));
      }
      for (let j = maxBinIdx - 1; j >= 0; j--) {
        const bx = chartX + (j + 0.5) * binW;
        ctx.lineTo(bx, cy(Math.max(0, avgA[j] - errA[j])));
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(248, 81, 73, 0.12)';
      ctx.fill();

      // ── Transmitted line ──
      ctx.beginPath();
      ctx.strokeStyle = '#3fb950';
      ctx.lineWidth = 1.5;
      for (let j = 0; j < maxBinIdx; j++) {
        const bx = chartX + (j + 0.5) * binW;
        if (j === 0) ctx.moveTo(bx, cy(avgT[j])); else ctx.lineTo(bx, cy(avgT[j]));
      }
      ctx.stroke();

      // ── Reflected line ──
      ctx.beginPath();
      ctx.strokeStyle = '#58a6ff';
      ctx.lineWidth = 1.5;
      for (let j = 0; j < maxBinIdx; j++) {
        const bx = chartX + (j + 0.5) * binW;
        if (j === 0) ctx.moveTo(bx, cy(avgR[j])); else ctx.lineTo(bx, cy(avgR[j]));
      }
      ctx.stroke();

      // ── Estimated absorption line (incident − transmitted − reflected) ──
      ctx.beginPath();
      ctx.strokeStyle = '#f85149';
      ctx.lineWidth = 1.5;
      for (let j = 0; j < maxBinIdx; j++) {
        const bx = chartX + (j + 0.5) * binW;
        if (j === 0) ctx.moveTo(bx, cy(avgA[j])); else ctx.lineTo(bx, cy(avgA[j]));
      }
      ctx.stroke();

      // Y-axis scale label
      ctx.fillStyle = '#484f58'; ctx.font = '7px monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(yMax.toFixed(3), chartX + 1, chartY + 1);
    }

    // Axes
    ctx.strokeStyle = '#30363d'; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY); ctx.lineTo(chartX, chartY + chartH);
    ctx.lineTo(chartX + chartW, chartY + chartH);
    ctx.stroke();

    // X axis ticks (400, 600, 800, 1000 nm)
    ctx.fillStyle = '#484f58'; ctx.font = '7px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let wl = 400; wl <= dispMax; wl += 200) {
      const px = chartX + ((wl - dispMin) / dispRange) * chartW;
      if (px > chartX && px < chartX + chartW) {
        ctx.fillText(wl, px, chartY + chartH + 2);
        ctx.strokeStyle = '#1c2129'; ctx.lineWidth = 0.5; ctx.beginPath();
        ctx.moveTo(px, chartY); ctx.lineTo(px, chartY + chartH);
        ctx.stroke();
      }
    }

    // Legend
    const ly = h - 7;
    ctx.font = '7px monospace'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#3fb950'; ctx.textAlign = 'left';
    ctx.fillText('— T', chartX, ly);
    ctx.fillStyle = '#58a6ff';
    ctx.fillText('— R', chartX + 22, ly);
    ctx.fillStyle = '#f85149';
    ctx.fillText('— A (est)', chartX + 44, ly);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('— Abs (ref)', chartX + 90, ly);
  }

  // ── SPD preview ────────────────────────────────────────────

  _renderSPDPreview(sourceId) {
    const container = document.getElementById('spd-preview');
    if (!container) return;
    const GU = window.GemUtils;
    const src = GU && GU.lightSources ? GU.lightSources[sourceId] : null;
    if (!src || !src.spd) { container.innerHTML = ''; return; }

    const spd = src.spd;
    const w = container.clientWidth || 200;
    const h = container.clientHeight || 24;

    let canvas = container.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      container.innerHTML = '';
      container.appendChild(canvas);
    }
    canvas.width = w * 2;
    canvas.height = h * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const wlMin = spd[0][0];
    const wlMax = spd[spd.length - 1][0];

    for (let px = 0; px < w; px++) {
      const wl = wlMin + (px / w) * (wlMax - wlMin);
      const power = GU.interpolateSpectra(spd, wl);
      const [r, g, b] = GU.wavelengthToRGB(wl);
      const barH = power * h * 0.9;
      ctx.fillStyle = `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${0.3 + power * 0.7})`;
      ctx.fillRect(px, h - barH, 1, barH);
    }
  }

  // ── Screen panel updates ───────────────────────────────────

  _updateScreenPanels() {
    if (!this.photonEngine) return;
    const eng = this.photonEngine;
    const isUran = eng.config.lightMode === 'uraninite';

    const rPat = this.reflectionMode === 'last'
      ? (eng.getLastReflectionPattern ? eng.getLastReflectionPattern() : null)
      : (eng.getReflectionPattern ? eng.getReflectionPattern() : null);
    const tPat = this.transmissionMode === 'last'
      ? (eng.getLastTransmissionPattern ? eng.getLastTransmissionPattern() : null)
      : (eng.getTransmissionPattern ? eng.getTransmissionPattern() : null);

    const rSuffix = this.reflectionMode === 'last' ? ' (Last Burst)' : ' (Integrated)';
    const tSuffix = this.transmissionMode === 'last' ? ' (Last Burst)' : ' (Integrated)';
    const rLabel = (isUran ? 'Backscatter Shield' : 'Reflection') + rSuffix;
    const tLabel = (isUran ? 'Barite Detector' : 'Transmission') + tSuffix;

    if (this.reflectionRenderer) {
      this.reflectionRenderer.bariteMode = isUran;
      this.reflectionRenderer.setPattern(rPat, rLabel);
      this.reflectionRenderer.render();
    }
    if (this.transmissionRenderer) {
      this.transmissionRenderer.bariteMode = isUran;
      this.transmissionRenderer.setPattern(tPat, tLabel);
      this.transmissionRenderer.render();
    }
  }

  _updateXRDSymmetryInfo() {
    const infoEl = document.getElementById('xrd-symmetry-info');
    if (!infoEl) return;
    const eng = this.photonEngine;
    const xrdActive = eng.config.xrdMode || (eng.config.lightMode === 'uraninite' && eng.config.uraniniteXRD);
    if (!eng || !xrdActive) {
      infoEl.style.display = 'none';
      if (this.transmissionRenderer) this.transmissionRenderer.symmetryFold = 0;
      return;
    }

    infoEl.style.display = '';
    const layout = eng._layout;
    if (!layout || !layout.windows || layout.windows.length === 0) return;

    let bi = 0, bd = Infinity;
    for (let i = 0; i < layout.windows.length; i++) {
      const w = layout.windows[i];
      if (!w.gemId) continue;
      const cx = (w.xMin + w.xMax) / 2, cy = (w.yMin + w.yMax) / 2;
      if (cx*cx + cy*cy < bd) { bd = cx*cx + cy*cy; bi = i; }
    }
    const gemId = layout.windows[bi] && layout.windows[bi].gemId;
    const gem = gemId ? this.gems[gemId] : null;
    if (!gem) { infoEl.innerHTML = ''; return; }

    const sym = getLaueSymmetry(gem.crystalSystem);
    infoEl.innerHTML = `
      <div class="prop-row"><span class="prop-label">Crystal</span><span class="prop-val">${gem.name}</span></div>
      <div class="prop-row"><span class="prop-label">System</span><span class="prop-val">${gem.crystalSystem || '—'}</span></div>
      <div class="prop-row"><span class="prop-label">Space Group</span><span class="prop-val">${gem.spaceGroup || '—'}</span></div>
      <div class="prop-row"><span class="prop-label">Laue Class</span><span class="prop-val">${sym.laueClass}</span></div>
      <div class="prop-row"><span class="prop-label">Expected Pattern</span><span class="prop-val" style="color:#58a6ff">${sym.label}</span></div>
    `;

    if (this.transmissionRenderer) this.transmissionRenderer.symmetryFold = sym.fold;
    if (this.reflectionRenderer) this.reflectionRenderer.symmetryFold = sym.fold;

    const isLaue = eng.config.xrdLaue || (eng.config.lightMode === 'uraninite' && eng.config.uraniniteXRD);
    const rings = isLaue ? null : this._computeXRDRings(gem);
    if (this.transmissionRenderer) this.transmissionRenderer.rings = rings;
  }

  _computeXRDRings(gem) {
    if (!gem || !gem.unitCell || !gem.atoms) return null;
    const eng = this.photonEngine;
    if (!eng || !eng._xrdDSpacing) return null;

    const energy = eng.config.xrayEnergy;
    const isLaue = eng.config.xrdLaue;
    const lambda = 12.398 / energy;
    const lambdaMax = isLaue ? 12.398 / (energy * 0.4) : lambda;
    const D = eng.config.transmissionScreenZ - eng.config.gridZ;
    const layout = eng._layout;
    const halfW = layout ? (layout.screenHalfW || 20) : 20;
    const maxHKL = 6;
    const reflections = [];

    for (let h = 0; h <= maxHKL; h++) {
      for (let k = -maxHKL; k <= maxHKL; k++) {
        for (let l = -maxHKL; l <= maxHKL; l++) {
          if (h === 0 && k <= 0) continue;
          if (h === 0 && k === 0 && l <= 0) continue;
          const d = eng._xrdDSpacing(h, k, l, gem.unitCell);
          if (d < 0.5 || d > 25) continue;
          const sinCheck = lambdaMax / (2 * d);
          if (sinCheck >= 1) continue;
          const sinTheta = Math.min(lambda / (2 * d), 0.999);
          const F2 = eng._xrdStructureFactor2(h, k, l, gem.atoms);
          if (F2 < 1) continue;
          const twoTheta = 2 * Math.asin(sinTheta);
          const normR = (D * Math.tan(twoTheta)) / halfW;
          reflections.push({ h, k, l, d, F2, twoTheta: twoTheta * 180 / Math.PI, normR });
        }
      }
    }

    reflections.sort((a, b) => b.d - a.d);
    const groups = [];
    for (const r of reflections) {
      const g = groups.find(g => Math.abs(g.d - r.d) < 0.03);
      if (g) {
        g.F2 += r.F2;
        if (g.hkls.length < 3) g.hkls.push([r.h, r.k, r.l]);
      } else {
        groups.push({ d: r.d, normR: r.normR, twoTheta: r.twoTheta, F2: r.F2, hkls: [[r.h, r.k, r.l]] });
      }
    }

    let maxF2 = 0;
    for (const g of groups) if (g.F2 > maxF2) maxF2 = g.F2;
    const threshold = maxF2 * 0.05;
    const visible = groups.filter(g => g.F2 > threshold && g.normR > 0.02 && g.normR < 1.2);
    visible.sort((a, b) => a.normR - b.normR);

    return visible.slice(0, 15).map(g => {
      const hkl = g.hkls[0];
      const hklStr = `(${hkl[0]}${hkl[1]}${hkl[2]})`;
      return {
        normRadius: g.normR,
        label: `${hklStr} ${g.d.toFixed(2)}Å`,
        twoTheta: g.twoTheta,
        strong: g.F2 > maxF2 * 0.3,
      };
    });
  }

  _updateNMR() {
    if (!this.nmrRenderer) return;
    const gem = this.activeGem ? this.gems[this.activeGem] : null;
    if (gem) this.nmrRenderer.setGem(gem);

    const nuclei = this.nmrRenderer.getAvailableNuclei();
    const btnsContainer = document.getElementById('nmr-nuclei-btns');
    if (btnsContainer) {
      btnsContainer.innerHTML = '';
      for (const nuc of nuclei) {
        const btn = document.createElement('button');
        btn.className = 'panel-btn' + (nuc === this.nmrRenderer.nucleus ? ' active' : '');
        btn.textContent = this.nmrRenderer._nucleusLabel(nuc);
        btn.addEventListener('click', () => {
          this.nmrRenderer.setNucleus(nuc);
          btnsContainer.querySelectorAll('.panel-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._updateNMRInfo();
          this.nmrRenderer.render();
        });
        btnsContainer.appendChild(btn);
      }
      if (nuclei.length > 0 && !nuclei.includes(this.nmrRenderer.nucleus)) {
        this.nmrRenderer.setNucleus(nuclei[0]);
        btnsContainer.querySelector('.panel-btn')?.classList.add('active');
      }
    }

    this._updateNMRInfo();
    this.nmrRenderer.render();
  }

  _updateNMRInfo() {
    const el = document.getElementById('nmr-nucleus-info');
    if (!el || !this.nmrRenderer) return;
    const nuc = this.nmrRenderer._getNucleusData();
    if (!nuc) { el.innerHTML = '<span style="color:#7d8590">No data</span>'; return; }
    const label = this.nmrRenderer._nucleusLabel(this.nmrRenderer.nucleus);
    const freq = (nuc.frequency * this.nmrRenderer.fieldStrength / 9.4).toFixed(1);
    const spin = nuc.spin || '1/2';
    const abund = nuc.naturalAbundance != null ? nuc.naturalAbundance + '%' : '—';
    const isQ = this.nmrRenderer._parseSpin(spin) > 0.5;
    el.innerHTML = `
      <div class="prop-row"><span class="prop-label">Nucleus</span><span class="prop-val">${label}</span></div>
      <div class="prop-row"><span class="prop-label">Spin</span><span class="prop-val">I = ${spin}${isQ ? ' (quadrupolar)' : ''}</span></div>
      <div class="prop-row"><span class="prop-label">Abundance</span><span class="prop-val">${abund}</span></div>
      <div class="prop-row"><span class="prop-label">Frequency</span><span class="prop-val">${freq} MHz</span></div>
      <div class="prop-row"><span class="prop-label"># Peaks</span><span class="prop-val">${nuc.peaks ? nuc.peaks.length : 0}</span></div>
    `;
  }

  // ── Filtering ─────────────────────────────────────────────

  filterGems(query) {
    const q = (query || '').trim().toLowerCase();
    document.querySelectorAll('.gem-card').forEach(card => {
      const id = card.dataset.id;
      const gem = this.gems[id];
      if (!gem) return;
      const name = (gem.name || '').toLowerCase();
      const formula = (gem.formula || '').toLowerCase();
      const formulaPlain = (gem.formulaPlain || '').toLowerCase();
      const match = !q || name.includes(q) || formula.includes(q) || formulaPlain.includes(q);
      card.style.display = match ? '' : 'none';
    });
  }

  // ── Uraninite preset ─────────────────────────────────────

  _applyUraninitePreset() {
    const $ = id => document.getElementById(id);

    // Save current settings to restore later
    this._preUraninite = {
      gridSize: this.gridSize,
      gridGems: [...this.gridGems],
      gemThickness: this.photonEngine.config.gemThickness,
      occluderThickness: this.photonEngine.config.occluderThickness,
      burstSize: this.burstSize,
      continuousRate: this.continuousRate,
      sourceZ: this.photonEngine.config.sourceZ,
    };

    // Grid: 4×4 with diverse gems
    this.gridSize = 4;
    $('ctrl-grid-size').value = 4;
    $('val-grid-size').textContent = '4 × 4';
    this._initGridGems();
    this.buildGridPicker();

    // Gem thickness: 8mm — thick exaggerates absorption differences
    this.photonEngine.setGemThickness(8);
    $('ctrl-gem-thick').value = 8;
    $('val-gem-thick').textContent = '8 mm';

    // Occluder: 6mm — thick for high contrast between cells
    this.photonEngine.setOccluderThickness(6);
    $('ctrl-occluder').value = 6;
    $('val-occluder').textContent = '6.0 mm';

    // Source distance: 50 (Z=0) — far for geometric spread
    this.photonEngine.setSourceZ(0);
    $('ctrl-source-dist').value = 50;
    $('val-source-dist').textContent = '50 (Z=0)';

    // Collimation: 0% — natural wide emission
    this.photonEngine.setUraniniteCollimation(0);
    $('ctrl-collimation').value = 0;
    $('val-collimation').textContent = '0% (natural)';

    // XRD crystallography: off — want shadow mode not diffraction
    this.photonEngine.setUraniniteXRD(false);
    $('ctrl-uraninite-xrd').checked = false;

    // Physical modulation: on
    this.photonEngine.setPhysicalModulation(true);
    const pmChk = $('ctrl-phys-mod');
    if (pmChk) pmChk.checked = true;

    // Backscatter shield: on
    this.photonEngine.setBackscatterShield(true);
    const bsChk = $('ctrl-backscatter-shield');
    if (bsChk) bsChk.checked = true;

    // Barite: 5mm
    this.photonEngine.setBariteThickness(5);
    $('ctrl-barite-thick').value = 5;
    $('val-barite-thick').textContent = '5 mm';

    // Burst size: 100
    this.burstSize = 100;
    $('ctrl-burst').value = 100;
    $('val-burst').textContent = '100';

    // Beam rate: 200
    this.continuousRate = 200;
    $('ctrl-beam-rate').value = 200;
    $('val-beam-rate').textContent = '200';

    // Hebrew letter: Alef (א) — starts from beginning, fills all 16 cells
    this.photonEngine.setHebrewLetter('א');
    const hebrewSel = $('ctrl-hebrew-letter');
    if (hebrewSel) hebrewSel.value = 'א';

    // Carving depth: 100%
    this.photonEngine.setHebrewDepth(1.0);
    $('ctrl-hebrew-depth').value = 100;
    $('val-hebrew-depth').textContent = '100%';

    // Letter boldness: 85%
    this.photonEngine.setHebrewBold(0.85);
    $('ctrl-hebrew-bold').value = 85;
    $('val-hebrew-bold').textContent = '85%';

    // Letter size: 85%
    this.photonEngine.setHebrewSize(0.85);
    $('ctrl-hebrew-size').value = 85;
    $('val-hebrew-size').textContent = '85%';

    // Magnetic field: 10T down
    this.photonEngine.setMagneticField(true, 10, 'down');
    $('ctrl-mag-enable').checked = true;
    $('ctrl-mag-strength').value = 10;
    $('val-mag-strength').textContent = '10.0 T';

    // Ambient temperature: 200°C
    this.photonEngine.setAmbientTemp(473.15);
    $('ctrl-ambient-temp').value = 200;
    $('val-ambient-temp').textContent = '200°C';

    // Radioactive source: ²⁴¹Am for radiation damage
    this.photonEngine.setRadioSource(true, 'Am241', 1e8, 0.05);
    $('ctrl-radio-enable').checked = true;
    $('ctrl-radio-isotope').value = 'Am241';
    $('ctrl-radio-activity').value = 8;
    $('val-radio-activity').textContent = '10⁸ Bq';
    $('ctrl-radio-distance').value = 0.05;
    $('val-radio-distance').textContent = '5 cm';

    this.photonEngine.reset();
  }

  _restorePreUraniniteSettings() {
    const $ = id => document.getElementById(id);
    const prev = this._preUraninite;

    this.photonEngine.setSourceZ(0);
    this.photonEngine.setUraniniteXRD(false);
    this.photonEngine.setHebrewLetter(null);
    this.photonEngine.setBackscatterShield(false);
    this.photonEngine.setPhysicalModulation(false);
    const pmChk2 = $('ctrl-phys-mod');
    if (pmChk2) pmChk2.checked = false;
    const hebrewSel2 = $('ctrl-hebrew-letter');
    if (hebrewSel2) hebrewSel2.value = '';
    const bsCheck = $('ctrl-backscatter-shield');
    if (bsCheck) bsCheck.checked = false;

    // Reset magnetic field
    this.photonEngine.setMagneticField(false, 1, 'down');
    $('ctrl-mag-enable').checked = false;
    $('ctrl-mag-strength').value = 1;
    $('val-mag-strength').textContent = '1.0 T';

    // Reset temperature
    this.photonEngine.setAmbientTemp(293.15);
    $('ctrl-ambient-temp').value = 20;
    $('val-ambient-temp').textContent = '20°C';

    // Reset radioactive source
    this.photonEngine.setRadioSource(false, 'Cs137', 1e6, 0.1);
    $('ctrl-radio-enable').checked = false;
    $('ctrl-radio-isotope').value = 'Cs137';
    $('ctrl-radio-activity').value = 6;
    $('val-radio-activity').textContent = '10⁶ Bq';
    $('ctrl-radio-distance').value = 0.1;
    $('val-radio-distance').textContent = '10 cm';

    // Reset carving params
    $('ctrl-hebrew-depth').value = 70;
    $('val-hebrew-depth').textContent = '70%';
    $('ctrl-hebrew-bold').value = 50;
    $('val-hebrew-bold').textContent = '50%';
    $('ctrl-hebrew-size').value = 66;
    $('val-hebrew-size').textContent = '66%';

    // Reset source distance slider
    $('ctrl-source-dist').value = 50;
    $('val-source-dist').textContent = '50 (Z=0)';
    $('ctrl-collimation').value = 0;
    $('val-collimation').textContent = '0% (natural)';

    if (!prev) return;

    // Restore grid size
    this.gridSize = prev.gridSize;
    $('ctrl-grid-size').value = prev.gridSize;
    $('val-grid-size').textContent = `${prev.gridSize} × ${prev.gridSize}`;
    this.gridGems = prev.gridGems;
    this._applyGrid();
    this.buildGridPicker();

    // Restore gem thickness
    this.photonEngine.setGemThickness(prev.gemThickness);
    $('ctrl-gem-thick').value = prev.gemThickness;
    const gt = prev.gemThickness;
    $('val-gem-thick').textContent = gt < 0.1 ? (gt*1000).toFixed(0)+' μm' : gt < 1 ? (gt*1000).toFixed(0)+' μm' : gt.toFixed(gt<2?1:0)+' mm';

    // Restore occluder
    this.photonEngine.setOccluderThickness(prev.occluderThickness);
    $('ctrl-occluder').value = prev.occluderThickness;
    const ot = prev.occluderThickness;
    $('val-occluder').textContent = ot < 0.1 ? (ot*1000).toFixed(0)+' μm' : ot.toFixed(1)+' mm';

    // Restore burst and beam rate
    this.burstSize = prev.burstSize;
    $('ctrl-burst').value = prev.burstSize;
    $('val-burst').textContent = prev.burstSize;

    this.continuousRate = prev.continuousRate;
    $('ctrl-beam-rate').value = prev.continuousRate;
    $('val-beam-rate').textContent = prev.continuousRate;

    // Reset source distance slider
    $('ctrl-source-dist').value = 50;
    $('val-source-dist').textContent = '50 (Z=0)';

    this._preUraninite = null;
    this.photonEngine.reset();
  }

  // ── Event binding ─────────────────────────────────────────

  bindEvents() {
    const $ = id => document.getElementById(id);

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Search
    const searchInput = $('search-input');
    if (searchInput) searchInput.addEventListener('input', e => this.filterGems(e.target.value));

    // Gem cards
    const gemList = $('gem-list');
    if (gemList) gemList.addEventListener('click', e => {
      const card = e.target.closest('.gem-card');
      if (card && card.dataset.id) this.selectGem(card.dataset.id);
    });

    // Crystal controls
    $('btn-reset-crystal')?.addEventListener('click', () => this.crystalRenderer?.resetView());

    const btnAutoRotate = $('btn-auto-rotate');
    if (btnAutoRotate) {
      btnAutoRotate.classList.add('active');
      btnAutoRotate.addEventListener('click', () => {
        if (this.crystalRenderer) {
          this.crystalRenderer.autoRotate = !this.crystalRenderer.autoRotate;
          btnAutoRotate.classList.toggle('active', this.crystalRenderer.autoRotate);
        }
      });
    }

    // Spectra controls
    $('btn-reset-spectra')?.addEventListener('click', () => {
      this.spectraRenderer?.resetRange();
      this.spectraRenderer?.render();
    });

    const btnCursor = $('btn-toggle-cursor');
    if (btnCursor) {
      btnCursor.classList.add('active');
      btnCursor.addEventListener('click', () => {
        if (this.spectraRenderer) {
          this.spectraRenderer.cursorEnabled = !this.spectraRenderer.cursorEnabled;
          this.spectraRenderer.showCursor(this.spectraRenderer.cursorEnabled);
          btnCursor.classList.toggle('active', this.spectraRenderer.cursorEnabled);
          this.spectraRenderer.render();
        }
      });
    }

    // Experiment controls
    $('btn-emit')?.addEventListener('click', () => {
      this.photonEngine.emitBurst(this.burstSize);
    });

    const btnContinuous = $('btn-continuous');
    if (btnContinuous) {
      btnContinuous.addEventListener('click', () => {
        this.continuous = !this.continuous;
        btnContinuous.classList.toggle('active', this.continuous);
        btnContinuous.textContent = this.continuous ? 'Stop Beam' : 'Continuous';
      });
    }

    $('btn-reset-experiment')?.addEventListener('click', () => {
      this.photonEngine.reset();
    });

    // Light mode buttons
    document.querySelectorAll('[data-lightmode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.lightmode;
        document.querySelectorAll('[data-lightmode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.photonEngine.setLightMode(mode);
        const wlControl = $('wavelength-control');
        const srcControl = $('source-select-control');
        const xrayControl = $('xray-energy-control');
        const gammaControl = $('gamma-energy-control');
        const thzControl = $('thz-freq-control');
        if (wlControl) wlControl.style.display = mode === 'mono' ? '' : 'none';
        if (srcControl) srcControl.style.display = mode === 'white' ? '' : 'none';
        if (xrayControl) xrayControl.style.display = mode === 'xray' ? '' : 'none';
        const xrdControl = $('xrd-mode-control');
        if (xrdControl) xrdControl.style.display = mode === 'xray' ? '' : 'none';
        if (gammaControl) gammaControl.style.display = mode === 'gamma' ? '' : 'none';
        if (thzControl) thzControl.style.display = mode === 'thz' ? '' : 'none';
        const bariteControl = $('barite-control');
        if (bariteControl) bariteControl.style.display = mode === 'uraninite' ? '' : 'none';
        const uranDistControl = $('uraninite-distance-control');
        if (uranDistControl) uranDistControl.style.display = mode === 'uraninite' ? '' : 'none';
        const uranColControl = $('uraninite-collimation-control');
        if (uranColControl) uranColControl.style.display = mode === 'uraninite' ? '' : 'none';
        if (mode === 'uraninite') {
          this._applyUraninitePreset();
        } else {
          this._restorePreUraniniteSettings();
        }
      });
    });

    // Light source selector
    const srcSelect = $('ctrl-light-source');
    if (srcSelect) {
      srcSelect.addEventListener('change', () => {
        this.photonEngine.setLightSource(srcSelect.value);
        this._renderSPDPreview(srcSelect.value);
      });
      this._renderSPDPreview('sun');
    }

    // BB shot
    $('btn-fire-bb')?.addEventListener('click', () => {
      this.photonEngine.fireBBAll();
    });

    // Thermal controls
    const thermalEnable = $('ctrl-thermal-enable');
    if (thermalEnable) {
      thermalEnable.addEventListener('change', () => {
        this.photonEngine.setThermalEnabled(thermalEnable.checked);
      });
    }

    const ambientSlider = $('ctrl-ambient-temp');
    if (ambientSlider) ambientSlider.addEventListener('input', () => {
      const tc = parseInt(ambientSlider.value);
      $('val-ambient-temp').textContent = tc + '°C';
      this.photonEngine.setAmbientTemp(tc + 273.15);
    });

    const scaleSlider = $('ctrl-photon-scale');
    if (scaleSlider) scaleSlider.addEventListener('input', () => {
      const exp = parseFloat(scaleSlider.value);
      const superscripts = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '.': '·' };
      const expStr = String(exp).split('').map(c => superscripts[c] || c).join('');
      $('val-photon-scale').textContent = '10' + expStr;
      this.photonEngine.setPhotonEnergyScale(Math.pow(10, exp));
    });

    // X-ray / Gamma / THz energy controls
    const xraySlider = $('ctrl-xray-energy');
    if (xraySlider) xraySlider.addEventListener('input', () => {
      const v = parseInt(xraySlider.value);
      $('val-xray-energy').textContent = v + ' keV';
      this.photonEngine.setXrayEnergy(v);
    });
    const gammaSlider = $('ctrl-gamma-energy');
    if (gammaSlider) gammaSlider.addEventListener('input', () => {
      const v = parseInt(gammaSlider.value);
      $('val-gamma-energy').textContent = v >= 1000 ? (v/1000).toFixed(2) + ' MeV' : v + ' keV';
      this.photonEngine.setGammaEnergy(v);
    });
    const thzSlider = $('ctrl-thz-freq');
    if (thzSlider) thzSlider.addEventListener('input', () => {
      const v = parseFloat(thzSlider.value);
      $('val-thz-freq').textContent = v.toFixed(1) + ' THz';
      this.photonEngine.setThzFrequency(v);
    });

    // Collimation slider (uraninite mode)
    const collSlider = $('ctrl-collimation');
    if (collSlider) collSlider.addEventListener('input', () => {
      const v = parseInt(collSlider.value);
      const labels = v === 0 ? '0% (natural)' : v === 100 ? '100% (collimated)' : `${v}%`;
      $('val-collimation').textContent = labels;
      this.photonEngine.setUraniniteCollimation(v / 100);
    });

    // Hebrew letter occluder
    const hebrewSelect = $('ctrl-hebrew-letter');
    if (hebrewSelect) hebrewSelect.addEventListener('change', () => {
      this.photonEngine.setHebrewLetter(hebrewSelect.value || null);
      this.photonEngine.reset();
    });

    const hebrewDepthSlider = $('ctrl-hebrew-depth');
    if (hebrewDepthSlider) hebrewDepthSlider.addEventListener('input', () => {
      const v = parseInt(hebrewDepthSlider.value);
      $('val-hebrew-depth').textContent = v + '%';
      this.photonEngine.setHebrewDepth(v / 100);
    });

    const hebrewBoldSlider = $('ctrl-hebrew-bold');
    if (hebrewBoldSlider) hebrewBoldSlider.addEventListener('input', () => {
      const v = parseInt(hebrewBoldSlider.value);
      $('val-hebrew-bold').textContent = v + '%';
      this.photonEngine.setHebrewBold(v / 100);
      this.photonEngine.reset();
    });

    const hebrewSizeSlider = $('ctrl-hebrew-size');
    if (hebrewSizeSlider) hebrewSizeSlider.addEventListener('input', () => {
      const v = parseInt(hebrewSizeSlider.value);
      $('val-hebrew-size').textContent = v + '%';
      this.photonEngine.setHebrewSize(v / 100);
      this.photonEngine.reset();
    });

    // Physical modulation checkbox
    const physModCheck = $('ctrl-phys-mod');
    if (physModCheck) physModCheck.addEventListener('change', () => {
      this.photonEngine.setPhysicalModulation(physModCheck.checked);
    });

    // Backscatter shield checkbox
    const bsShieldCheck = $('ctrl-backscatter-shield');
    if (bsShieldCheck) bsShieldCheck.addEventListener('change', () => {
      this.photonEngine.setBackscatterShield(bsShieldCheck.checked);
    });

    // Uraninite crystallography checkbox
    const uranXrdCheck = $('ctrl-uraninite-xrd');
    if (uranXrdCheck) uranXrdCheck.addEventListener('change', () => {
      this.photonEngine.setUraniniteXRD(uranXrdCheck.checked);
      this.photonEngine.reset();
    });

    // Source distance slider (uraninite mode)
    const sourceDistSlider = $('ctrl-source-dist');
    if (sourceDistSlider) sourceDistSlider.addEventListener('input', () => {
      const dist = parseInt(sourceDistSlider.value);
      const sourceZ = 50 - dist;
      $('val-source-dist').textContent = `${dist} (Z=${sourceZ})`;
      this.photonEngine.setSourceZ(sourceZ);
      this.photonEngine.reset();
    });

    // Barite thickness slider
    const bariteSlider = $('ctrl-barite-thick');
    if (bariteSlider) bariteSlider.addEventListener('input', () => {
      const v = parseInt(bariteSlider.value);
      $('val-barite-thick').textContent = v === 0 ? 'Off' : v + ' mm';
      this.photonEngine.setBariteThickness(v);
    });

    const xrdEnable = $('ctrl-xrd-mode');
    if (xrdEnable) xrdEnable.addEventListener('change', () => {
      this.photonEngine.setXRDMode(xrdEnable.checked);
      this.photonEngine.reset();
    });
    const xrdLaue = $('ctrl-xrd-laue');
    if (xrdLaue) xrdLaue.addEventListener('change', () => {
      this.photonEngine.setXRDLaue(xrdLaue.checked);
      this.photonEngine.reset();
    });
    document.querySelectorAll('.preset-btn[data-xray-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = parseFloat(btn.dataset.xrayPreset);
        const xs = $('ctrl-xray-energy');
        if (xs) { xs.value = v; $('val-xray-energy').textContent = v + ' keV'; }
        this.photonEngine.setXrayEnergy(v);
      });
    });

    // Radioactive source controls
    const radioEnable = $('ctrl-radio-enable');
    const radioIsotope = $('ctrl-radio-isotope');
    const radioActivity = $('ctrl-radio-activity');
    const radioDistance = $('ctrl-radio-distance');
    const updateRadio = () => {
      const enabled = radioEnable ? radioEnable.checked : false;
      const isotope = radioIsotope ? radioIsotope.value : 'Cs137';
      const actExp = radioActivity ? parseFloat(radioActivity.value) : 6;
      const activity = Math.pow(10, actExp);
      const distance = radioDistance ? parseFloat(radioDistance.value) : 0.1;
      if (radioActivity) {
        const sup = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','.':'·' };
        const expStr = String(actExp).split('').map(c => sup[c] || c).join('');
        $('val-radio-activity').textContent = '10' + expStr + ' Bq';
      }
      if (radioDistance) $('val-radio-distance').textContent = (distance * 100).toFixed(0) + ' cm';
      this.photonEngine.setRadioSource(enabled, isotope, activity, distance);
    };
    radioEnable?.addEventListener('change', updateRadio);
    radioIsotope?.addEventListener('change', updateRadio);
    radioActivity?.addEventListener('input', updateRadio);
    radioDistance?.addEventListener('input', updateRadio);

    // Magnetic field controls
    const magEnable = $('ctrl-mag-enable');
    const magStrength = $('ctrl-mag-strength');
    const magDir = $('ctrl-mag-dir');
    const updateMag = () => {
      const enabled = magEnable ? magEnable.checked : false;
      const strength = magStrength ? parseFloat(magStrength.value) : 1.0;
      const direction = magDir ? magDir.value : 'down';
      if (magStrength) $('val-mag-strength').textContent = strength.toFixed(1) + ' T';
      this.photonEngine.setMagneticField(enabled, strength, direction);
    };
    magEnable?.addEventListener('change', updateMag);
    magStrength?.addEventListener('input', updateMag);
    magDir?.addEventListener('change', updateMag);

    // Wavelength slider
    const wlSlider = $('ctrl-wavelength');
    if (wlSlider) wlSlider.addEventListener('input', () => {
      const wl = parseInt(wlSlider.value);
      let band = '';
      if (wl < 380) band = ' (UV)';
      else if (wl <= 780) band = '';
      else if (wl <= 1400) band = ' (NIR)';
      else band = ' (FIR)';
      $('val-wavelength').textContent = wl + ' nm' + band;
      this.photonEngine.setWavelength(wl);
    });

    // Burst size
    const burstSlider = $('ctrl-burst');
    if (burstSlider) burstSlider.addEventListener('input', () => {
      this.burstSize = parseInt(burstSlider.value);
      $('val-burst').textContent = this.burstSize;
    });

    // Beam rate
    const beamSlider = $('ctrl-beam-rate');
    if (beamSlider) beamSlider.addEventListener('input', () => {
      this.continuousRate = parseInt(beamSlider.value);
      $('val-beam-rate').textContent = this.continuousRate;
    });

    // Grid size
    const gridSlider = $('ctrl-grid-size');
    if (gridSlider) gridSlider.addEventListener('input', () => {
      this.gridSize = parseInt(gridSlider.value);
      $('val-grid-size').textContent = `${this.gridSize} × ${this.gridSize}`;
      this._initGridGems();
      this.buildGridPicker();
    });

    // Occluder thickness
    const occSlider = $('ctrl-occluder');
    if (occSlider) occSlider.addEventListener('input', () => {
      const v = parseFloat(occSlider.value);
      $('val-occluder').textContent = v < 0.1 ? (v * 1000).toFixed(0) + ' μm' : v.toFixed(1) + ' mm';
      this.photonEngine.setOccluderThickness(v);
    });

    // Gem thickness
    const gemThickSlider = $('ctrl-gem-thick');
    const updateThicknessDisplay = (v) => {
      if (v < 0.1) $('val-gem-thick').textContent = (v * 1000).toFixed(0) + ' μm';
      else if (v < 1) $('val-gem-thick').textContent = (v * 1000).toFixed(0) + ' μm';
      else $('val-gem-thick').textContent = v.toFixed(v < 2 ? 1 : 0) + ' mm';
    };
    if (gemThickSlider) gemThickSlider.addEventListener('input', () => {
      const v = parseFloat(gemThickSlider.value);
      updateThicknessDisplay(v);
      this.photonEngine.setGemThickness(v);
    });

    // Thickness presets
    document.querySelectorAll('.preset-btn[data-thick]').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = parseFloat(btn.dataset.thick);
        if (gemThickSlider) gemThickSlider.value = v;
        updateThicknessDisplay(v);
        this.photonEngine.setGemThickness(v);
      });
    });

    // Grid picker: assign selected gem to cell
    const picker = $('gem-grid-picker');
    if (picker) picker.addEventListener('click', e => {
      const cell = e.target.closest('.grid-cell');
      if (!cell || !this.activeGem) return;
      const idx = parseInt(cell.dataset.idx);
      this.gridGems[idx] = this.activeGem;
      this._updateCellDisplay(cell, idx);
      this._applyGrid();
      this.photonEngine.reset();
    });

    // NMR controls
    const nmrField = $('ctrl-nmr-field');
    if (nmrField) nmrField.addEventListener('input', () => {
      const v = parseFloat(nmrField.value);
      $('val-nmr-field').textContent = v.toFixed(1) + ' T';
      if (this.nmrRenderer) { this.nmrRenderer.fieldStrength = v; this._updateNMRInfo(); this.nmrRenderer.render(); }
    });
    const nmrMas = $('ctrl-nmr-mas');
    if (nmrMas) nmrMas.addEventListener('input', () => {
      const v = parseInt(nmrMas.value);
      $('val-nmr-mas').textContent = v + ' kHz';
      if (this.nmrRenderer) { this.nmrRenderer.masFrequency = v; this.nmrRenderer.render(); }
    });
    const nmrBroad = $('ctrl-nmr-broad');
    if (nmrBroad) nmrBroad.addEventListener('input', () => {
      const v = parseFloat(nmrBroad.value);
      $('val-nmr-broad').textContent = v.toFixed(1) + '×';
      if (this.nmrRenderer) { this.nmrRenderer.lineBoost = v; this.nmrRenderer.render(); }
    });
    const nmrSB = $('ctrl-nmr-sidebands');
    if (nmrSB) nmrSB.addEventListener('change', () => {
      if (this.nmrRenderer) { this.nmrRenderer.showSidebands = nmrSB.checked; this.nmrRenderer.render(); }
    });
    const nmrAssign = $('ctrl-nmr-assign');
    if (nmrAssign) nmrAssign.addEventListener('change', () => {
      if (this.nmrRenderer) { this.nmrRenderer.showAssignments = nmrAssign.checked; this.nmrRenderer.render(); }
      if (this.vibRenderer) { this.vibRenderer.showAssignments = nmrAssign.checked; this.vibRenderer.render(); }
    });
    const nmrOverlay = $('ctrl-nmr-overlay');
    if (nmrOverlay) nmrOverlay.addEventListener('change', () => {
      if (this.nmrRenderer) {
        this.nmrRenderer.overlayAll = nmrOverlay.checked;
        this._updateNMR();
      }
      if (this.vibRenderer) {
        this.vibRenderer.overlayAll = nmrOverlay.checked;
        this.vibRenderer.render();
      }
    });

    const btnVibIR = $('btn-vib-ir');
    const btnVibRaman = $('btn-vib-raman');
    if (btnVibIR) btnVibIR.addEventListener('click', () => {
      btnVibIR.classList.add('active'); btnVibRaman?.classList.remove('active');
      if (this.vibRenderer) { this.vibRenderer.setMode('ir'); this.vibRenderer.render(); }
    });
    if (btnVibRaman) btnVibRaman.addEventListener('click', () => {
      btnVibRaman.classList.add('active'); btnVibIR?.classList.remove('active');
      if (this.vibRenderer) { this.vibRenderer.setMode('raman'); this.vibRenderer.render(); }
    });
    document.querySelectorAll('.preset-btn[data-nmr-field]').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = parseFloat(btn.dataset.nmrField);
        if (nmrField) { nmrField.value = v; $('val-nmr-field').textContent = v.toFixed(1) + ' T'; }
        if (this.nmrRenderer) { this.nmrRenderer.fieldStrength = v; this._updateNMRInfo(); this.nmrRenderer.render(); }
      });
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (this.activeTab === 'properties') {
        this.spectraRenderer?.resize();
        this.spectraRenderer?.render();
        this.fingerprintRenderer?.render();
      } else if (this.activeTab === 'nmr') {
        this.nmrRenderer?.render();
        this.vibRenderer?.render();
      } else {
        this.experimentRenderer?.resize();
      }
    });

    // Screen mode toggles
    document.querySelectorAll('[data-screen][data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.dataset.screen;
        const mode = btn.dataset.mode;
        if (screen === 'reflection') this.reflectionMode = mode;
        else this.transmissionMode = mode;
        document.querySelectorAll(`[data-screen="${screen}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Stats + screen + cell stats update interval
    setInterval(() => {
      if (this.activeTab === 'experiment') {
        this.updateStats();
        this._updateScreenPanels();
        this._updateCellStats();
        this._updateThermalStats();
        this._updateRadiationStats();
        this._updateXRDSymmetryInfo();
      }
    }, 200);
  }

  _updateRadiationStats() {
    if (!this.photonEngine || !this.photonEngine.getCellRadiation) return;
    const rads = this.photonEngine.getCellRadiation();
    if (!rads || rads.length === 0) return;

    let maxDoseRate = 0, totalDose = 0, maxCC = 0, maxDmg = 0, nGems = 0;
    for (const r of rads) {
      if (!r.gemId) continue;
      nGems++;
      if (r.doseRate > maxDoseRate) maxDoseRate = r.doseRate;
      totalDose += r.dose;
      if (r.colorCenterDensity > maxCC) maxCC = r.colorCenterDensity;
      if (r.damageLevel > maxDmg) maxDmg = r.damageLevel;
    }

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    if (nGems > 0) {
      set('stat-dose-rate', maxDoseRate > 1 ? maxDoseRate.toFixed(1) + ' Gy/s'
        : maxDoseRate > 0.001 ? (maxDoseRate * 1000).toFixed(1) + ' mGy/s' : '0');
      const avgDose = totalDose / nGems;
      set('stat-total-dose', avgDose > 1 ? avgDose.toFixed(2) + ' Gy'
        : avgDose > 0.001 ? (avgDose * 1000).toFixed(2) + ' mGy' : '0');
      set('stat-color-centers', (maxCC * 100).toFixed(1) + '%');
      set('stat-damage', (maxDmg * 100).toFixed(2) + '%');
    }
  }

  _updateThermalStats() {
    if (!this.photonEngine || !this.photonEngine.getCellTemperatures) return;
    const temps = this.photonEngine.getCellTemperatures();
    if (!temps || temps.length === 0) return;

    let peakT = -Infinity, sumRI = 0, sumBG = 0, nGems = 0;
    for (const t of temps) {
      if (!t.gemId) continue;
      nGems++;
      if (t.temperature > peakT) peakT = t.temperature;
      sumRI += Math.abs(t.riShift || 0);
      sumBG += t.bandGapShift || 0;
    }

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    if (nGems > 0) {
      set('stat-peak-temp', (peakT - 273.15).toFixed(1) + '°C');
      const avgRI = sumRI / nGems;
      set('stat-avg-ri-shift', avgRI > 1e-8 ? (avgRI > 1e-4 ? avgRI.toExponential(2) : (avgRI * 1e6).toFixed(2) + '×10⁻⁶') : '0');
      const avgBG = sumBG / nGems;
      set('stat-bandgap-shift', avgBG !== 0 ? (avgBG > 0 ? '+' : '') + avgBG.toFixed(4) + ' eV' : '0 eV');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new GemstoneExplorer();
  app.init();
  window._app = app;
});
