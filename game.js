(() => {
  'use strict';

  const THREE = window.THREE;
  const mount = document.getElementById('game');
  const loading = document.getElementById('loading');
  const isTouch = navigator.maxTouchPoints > 0 || matchMedia('(pointer:coarse)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ENERGY_TO_EVOLVE = 8;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (err) {
    loading.innerHTML = '<strong>WebGL is needed to play.</strong><span>Try opening this page in Safari or Chrome.</span>';
    return;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7fc6ef);
  scene.fog = new THREE.Fog(0x8dc9e8, 25, 70);

  const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.1, 130);
  camera.position.set(0, 7.5, 14);

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isTouch ? 1.35 : 1.8));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  mount.appendChild(renderer.domElement);

  const ui = {
    formName: document.getElementById('formName'),
    hearts: document.getElementById('hearts'),
    energyBar: document.getElementById('energyBar'),
    energyText: document.getElementById('energyText'),
    objectiveTitle: document.getElementById('objectiveTitle'),
    objectiveText: document.getElementById('objectiveText'),
    bossHud: document.getElementById('bossHud'),
    bossHealth: document.getElementById('bossHealth'),
    toast: document.getElementById('toast'),
    evolveBanner: document.getElementById('evolveBanner'),
    specialBtn: document.getElementById('specialBtn'),
    restartBtn: document.getElementById('restartBtn'),
    joystick: document.getElementById('joystick'),
    joystickKnob: document.getElementById('joystickKnob'),
    attackBtn: document.getElementById('attackBtn'),
    dashBtn: document.getElementById('dashBtn')
  };

  const hemi = new THREE.HemisphereLight(0xe8f8ff, 0x345b3a, 2.45);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3d6, isTouch ? 3.0 : 3.4);
  sun.position.set(-12, 20, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isTouch ? 1024 : 1536, isTouch ? 1024 : 1536);
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -22;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  scene.add(sun);

  const root = new THREE.Group();
  scene.add(root);

  const rand = mulberry32(7741);
  function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function standard(color, opts = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.82, metalness: opts.metalness ?? 0, flatShading: opts.flat ?? true, transparent: !!opts.transparent, opacity: opts.opacity ?? 1, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0 });
  }
  function basic(color, opacity = 1) {
    return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1, side: THREE.DoubleSide });
  }
  function addMesh(geo, mat, parent = root, cast = true, receive = true) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = receive;
    parent.add(m);
    return m;
  }

  const mats = {
    grass: standard(0x57a64a),
    grass2: standard(0x70bd50),
    soil: standard(0x79573c),
    rock: standard(0x6c7880),
    rockDark: standard(0x424b53),
    path: standard(0xb6a17b),
    pathDark: standard(0x927a58),
    wood: standard(0x70452d),
    leaves: standard(0x2f8b50),
    leavesLight: standard(0x52ad55),
    ruin: standard(0x6a7476),
    ruinDark: standard(0x41494f),
    gold: standard(0xc08d35, { roughness: 0.55, metalness: 0.15 }),
    redGlow: standard(0xff2149, { emissive: 0xff0d38, emissiveIntensity: 3, roughness: 0.35, flat: false })
  };

  buildWorld();

  function buildWorld() {
    const water = addMesh(new THREE.CircleGeometry(75, 72), standard(0x1d90c9, { roughness: 0.35, flat: false }), root, false, false);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -2.15;

    const island = addMesh(new THREE.CylinderGeometry(25, 21, 3.4, 48, 2), mats.soil);
    island.position.y = -1.55;
    const cap = addMesh(new THREE.CylinderGeometry(24.65, 24.9, 0.55, 48), mats.grass2);
    cap.position.y = 0;

    for (let i = 0; i < 18; i++) {
      const z = 11 - i * 1.75;
      const x = Math.sin(i * 0.82) * 0.55;
      const stone = addMesh(new THREE.BoxGeometry(2.25 + rand() * 0.5, 0.16, 1.18 + rand() * 0.35), i % 3 === 0 ? mats.pathDark : mats.path);
      stone.position.set(x, 0.33 + rand() * 0.05, z);
      stone.rotation.y = (rand() - 0.5) * 0.22;
      stone.rotation.z = (rand() - 0.5) * 0.03;
    }

    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + rand() * 0.16;
      const r = 20.2 + rand() * 3.1;
      const rock = addMesh(new THREE.DodecahedronGeometry(0.45 + rand() * 0.75, 0), i % 2 ? mats.rock : mats.rockDark);
      rock.position.set(Math.cos(a) * r, 0.25 + rand() * 0.15, Math.sin(a) * r);
      rock.scale.set(1.1, 0.65 + rand() * 0.85, 1);
      rock.rotation.set(rand(), rand() * Math.PI, rand());
    }

    addPalm(-12, 6, 1.15, -0.16);
    addPalm(13, 2, 1.05, 0.12);
    addPalm(-15, -9, 0.9, 0.08);
    addPalm(15, -12, 0.82, -0.18);

    for (let i = 0; i < 42; i++) {
      const a = rand() * Math.PI * 2;
      const r = 5 + rand() * 17;
      if (Math.abs(Math.cos(a) * r) < 3.2 && Math.sin(a) * r < 13 && Math.sin(a) * r > -20) continue;
      const bush = addMesh(new THREE.IcosahedronGeometry(0.24 + rand() * 0.5, 0), rand() > .4 ? mats.leaves : mats.leavesLight, root, false, true);
      bush.position.set(Math.cos(a) * r, 0.42, Math.sin(a) * r);
      bush.scale.y = 0.55 + rand() * 0.5;
    }

    const flowerMat = basic(0xfff7d8);
    for (let i = 0; i < 36; i++) {
      const x = (rand() - .5) * 30;
      const z = (rand() - .5) * 27;
      if (Math.hypot(x, z) > 19 || Math.abs(x) < 2.7) continue;
      const f = addMesh(new THREE.SphereGeometry(0.08, 5, 4), flowerMat, root, false, false);
      f.position.set(x, 0.5, z);
    }

    buildGate();
    buildBridge(-8.5, 8.6);
    buildBridge(10.5, 7.2);
    buildBackgroundIslands();
  }

  function addPalm(x, z, s = 1, lean = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0.1, z);
    g.scale.setScalar(s);
    root.add(g);
    const trunk = addMesh(new THREE.CylinderGeometry(.22, .38, 4.8, 7), mats.wood, g);
    trunk.position.y = 2.35;
    trunk.rotation.z = lean;
    const crown = new THREE.Group();
    crown.position.set(lean * -4.1, 4.65, 0);
    g.add(crown);
    for (let i = 0; i < 7; i++) {
      const leaf = addMesh(new THREE.ConeGeometry(.52, 3.2, 5), i % 2 ? mats.leaves : mats.leavesLight, crown, false, true);
      leaf.rotation.z = Math.PI / 2.3;
      leaf.rotation.y = i / 7 * Math.PI * 2;
      leaf.position.set(Math.cos(i / 7 * Math.PI * 2) * 1.2, -.05, Math.sin(i / 7 * Math.PI * 2) * 1.2);
    }
  }

  function buildBridge(x, z) {
    for (let i = -2; i <= 2; i++) {
      const post = addMesh(new THREE.BoxGeometry(.28, 1.6, .28), mats.wood);
      post.position.set(x + i * 1.4, .8, z);
      const rail = addMesh(new THREE.BoxGeometry(1.25, .16, .16), mats.wood);
      rail.position.set(x + i * 1.4 + .7, 1.25, z);
    }
    const lamp = addMesh(new THREE.BoxGeometry(.5, .65, .5), standard(0xffb246, { emissive: 0xff7621, emissiveIntensity: 2.2, roughness: .4 }), root, false, false);
    lamp.position.set(x - 3.2, 1.95, z);
  }

  function buildBackgroundIslands() {
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      const x = -22 + i * 14;
      const z = -42 - (i % 2) * 5;
      g.position.set(x, 3 + (i % 2) * 2, z);
      root.add(g);
      addMesh(new THREE.CylinderGeometry(5.5, 2.7, 7.5, 9), mats.rockDark, g, false, true);
      const top = addMesh(new THREE.CylinderGeometry(5.4, 5.5, .6, 9), mats.grass, g, false, true);
      top.position.y = 4;
      for (let j = 0; j < 3; j++) {
        const ruin = addMesh(new THREE.BoxGeometry(.8, 3 + rand() * 2, .8), mats.ruin, g, false, true);
        ruin.position.set((rand() - .5) * 6, 5.5, (rand() - .5) * 4);
      }
    }
  }

  const gate = new THREE.Group();
  const portal = new THREE.Group();
  let portalPower = 0.18;

  function buildGate() {
    gate.position.set(0, 0, -21.5);
    root.add(gate);
    const left = addMesh(new THREE.BoxGeometry(3.4, 7.8, 3.1), mats.ruinDark, gate);
    left.position.set(-5.0, 3.7, 0);
    const right = addMesh(new THREE.BoxGeometry(3.4, 7.8, 3.1), mats.ruinDark, gate);
    right.position.set(5.0, 3.7, 0);
    const top = addMesh(new THREE.BoxGeometry(12.8, 2.0, 3.1), mats.ruinDark, gate);
    top.position.set(0, 7.4, 0);
    for (let i = 0; i < 8; i++) {
      const block = addMesh(new THREE.BoxGeometry(1.1, .95, 3.2), mats.ruin, gate);
      block.position.set(-4.5 + i * 1.3, 8.7 + (i % 2) * .15, 0);
    }
    for (const x of [-3.6, 3.6]) {
      const horn = addMesh(new THREE.ConeGeometry(.72, 3.3, 7), mats.ruinDark, gate);
      horn.position.set(x, 9.9, .1);
      horn.rotation.z = x < 0 ? -.45 : .45;
    }

    const eyeMat = standard(0xff203f, { emissive: 0xff0735, emissiveIntensity: 3.7, roughness: .3, flat: false });
    for (const x of [-1.5, 1.5]) {
      const eye = addMesh(new THREE.SphereGeometry(.43, 12, 8), eyeMat, gate, false, false);
      eye.scale.set(1.6, .65, .45);
      eye.position.set(x, 6.9, 1.62);
    }
    const teeth = new THREE.Group();
    teeth.position.set(0, 5.45, 1.55);
    gate.add(teeth);
    for (let i = 0; i < 6; i++) {
      const tooth = addMesh(new THREE.ConeGeometry(.3, .8, 4), eyeMat, teeth, false, false);
      tooth.position.x = (i - 2.5) * .7;
      tooth.rotation.z = Math.PI;
    }

    portal.position.set(0, 3.65, 1.62);
    gate.add(portal);
    addMesh(new THREE.CircleGeometry(3.35, 40), basic(0x601128, .82), portal, false, false);
    const core = addMesh(new THREE.CircleGeometry(2.85, 40), basic(0xff163f, .36), portal, false, false);
    core.position.z = .02;
    for (let r = 0; r < 4; r++) {
      const ring = addMesh(new THREE.TorusGeometry(0.8 + r * .55, .09 + r * .015, 7, 38), basic(r % 2 ? 0xff6c78 : 0xb40834, .88), portal, false, false);
      ring.position.z = .08 + r * .01;
      ring.scale.y = .68 + r * .06;
      ring.userData.spin = (r % 2 ? -1 : 1) * (.45 + r * .2);
    }

    for (let i = 0; i < 5; i++) {
      const step = addMesh(new THREE.BoxGeometry(9 - i * .7, .35, 1.2), mats.pathDark);
      step.position.set(0, .15 + i * .28, -16.5 - i * 1.0);
    }

    for (const x of [-7.3, 7.3]) addTorch(x, -19.4);
  }

  function addTorch(x, z) {
    const stand = addMesh(new THREE.BoxGeometry(.65, 1.4, .65), mats.ruinDark);
    stand.position.set(x, .7, z);
    const flame = addMesh(new THREE.ConeGeometry(.28, .85, 7), standard(0xff8729, { emissive: 0xff5b13, emissiveIntensity: 4, roughness: .2 }), root, false, false);
    flame.position.set(x, 1.75, z);
    flame.userData.flame = true;
  }

  let atlasTexture = null;
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load('assets/characters.svg', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    atlasTexture = tex;
    startGame();
  }, undefined, () => {
    atlasTexture = makeFallbackAtlas();
    startGame();
  });

  function makeFallbackAtlas() {
    const c = document.createElement('canvas');
    c.width = 768; c.height = 384;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    const labels = [['DOOM', 128, 0], ['SHADOW', 384, 1], ['GHASTLY', 640, 2]];
    labels.forEach(([name, x, type]) => {
      g.save(); g.translate(x, 192);
      g.fillStyle = type === 2 ? '#282534' : '#111522';
      g.beginPath(); g.arc(0, 0, type === 1 ? 105 : 80, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ff244c';
      g.beginPath(); g.ellipse(-28, -20, 13, 8, 0, 0, Math.PI * 2); g.ellipse(28, -20, 13, 8, 0, 0, Math.PI * 2); g.fill();
      g.font = 'bold 24px sans-serif'; g.textAlign = 'center'; g.fillText(name, 0, 130);
      g.restore();
    });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  function atlasSlice(column) {
    const t = atlasTexture.clone();
    t.needsUpdate = true;
    t.repeat.set(1 / 3, 1);
    t.offset.set(column / 3, 0);
    t.minFilter = THREE.LinearFilter;
    return t;
  }

  let doomTex, shadowTex, ghastlyTex;
  let player;
  let playerSprite;
  let playerGlow;
  let hp = 120;
  let maxHp = 120;
  let energy = 0;
  let evolved = false;
  let gameOver = false;
  let won = false;
  let boss = null;
  let bossSpawned = false;
  let attackCooldown = 0;
  let dashCooldown = 0;
  let dashTimer = 0;
  let burstCooldown = 0;
  let invulnerable = 0;
  let lastFacing = new THREE.Vector3(0, 0, -1);
  let playerBob = 0;
  let elapsed = 0;

  const enemies = [];
  const projectiles = [];
  const hostileProjectiles = [];
  const pickups = [];
  const particles = [];
  const MAX_PARTICLES = isTouch ? 85 : 140;

  function startGame() {
    doomTex = atlasSlice(0);
    shadowTex = atlasSlice(1);
    ghastlyTex = atlasSlice(2);
    createPlayer();
    spawnInitialEnemies();
    updateHUD();
    requestAnimationFrame(() => loading.classList.add('ready'));
    setTimeout(() => loading.remove(), 700);
    showToast("DOOM'S ADVENTURE!", 1000);
    clock.start();
    animate();
  }

  function makeSprite(texture, scaleX, scaleY, opacity = 1) {
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, alphaTest: .035, depthWrite: false, opacity });
    const s = new THREE.Sprite(mat);
    s.scale.set(scaleX, scaleY, 1);
    return s;
  }

  function createPlayer() {
    player = new THREE.Group();
    player.position.set(0, .32, 10.8);
    scene.add(player);

    playerGlow = addMesh(new THREE.RingGeometry(.45, 1.12, 24), basic(0xff1b43, .16), player, false, false);
    playerGlow.rotation.x = -Math.PI / 2;
    playerGlow.position.y = -.22;

    playerSprite = makeSprite(doomTex, 2.65, 3.1);
    playerSprite.position.y = 1.28;
    player.add(playerSprite);

    for (const x of [-.72, .72]) {
      const orb = addMesh(new THREE.SphereGeometry(.15, 10, 8), standard(0xff3154, { emissive: 0xff0a35, emissiveIntensity: 4.5, roughness: .25, flat: false }), player, false, false);
      orb.position.set(x, 1.32, .18);
      orb.userData.playerOrb = x;
    }
  }

  function spawnInitialEnemies() {
    const spots = [
      [-5.8, 5.4], [5.4, 3.4], [-6.5, -1.5], [5.8, -3.7],
      [-4.4, -8.4], [5.0, -10.2], [-6.3, -13.4], [5.5, -14.8]
    ];
    spots.forEach((s, i) => spawnGhastly(s[0], s[1], false, i * .6));
  }

  function spawnGhastly(x, z, isBoss = false, phase = 0) {
    const g = new THREE.Group();
    g.position.set(x, isBoss ? 1.1 : .75, z);
    scene.add(g);
    const sprite = makeSprite(ghastlyTex, isBoss ? 5.5 : 2.55, isBoss ? 6.9 : 3.5);
    sprite.position.y = isBoss ? 2.6 : 1.45;
    g.add(sprite);

    const aura = addMesh(new THREE.RingGeometry(isBoss ? .9 : .42, isBoss ? 2.0 : .95, 28), basic(0xff163f, isBoss ? .32 : .18), g, false, false);
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = -.55;

    const bar = new THREE.Group();
    bar.position.y = isBoss ? 6.2 : 3.25;
    g.add(bar);
    addMesh(new THREE.PlaneGeometry(isBoss ? 2.8 : 1.45, .18), basic(0x17191f, .94), bar, false, false);
    const fill = addMesh(new THREE.PlaneGeometry(isBoss ? 2.65 : 1.34, .11), basic(0xff294f, 1), bar, false, false);
    fill.position.z = .01;
    fill.userData.fullWidth = isBoss ? 2.65 : 1.34;

    g.userData = {
      isEnemy: true,
      boss: isBoss,
      hp: isBoss ? 24 : 2,
      maxHp: isBoss ? 24 : 2,
      speed: isBoss ? 1.2 : 1.15 + rand() * .38,
      sprite, aura, bar, fill,
      phase,
      hitTimer: 0,
      attackTimer: 1 + rand() * 1.5,
      contactTimer: 0
    };
    enemies.push(g);
    return g;
  }

  function updateEnemyBar(e) {
    const ratio = Math.max(0, e.userData.hp / e.userData.maxHp);
    e.userData.fill.scale.x = ratio;
    e.userData.fill.position.x = -(e.userData.fill.userData.fullWidth * (1 - ratio)) / 2;
    e.userData.bar.visible = ratio < .999 && !e.userData.boss;
    if (e.userData.boss) ui.bossHealth.style.width = `${ratio * 100}%`;
  }

  function spawnBoss() {
    if (bossSpawned) return;
    bossSpawned = true;
    portalPower = 1;
    boss = spawnGhastly(0, -17.4, true, 0);
    boss.scale.setScalar(.12);
    ui.bossHud.classList.remove('hidden');
    ui.objectiveTitle.textContent = 'Defeat the Ancient Ghastly';
    ui.objectiveText.textContent = 'Use Shadow Burst when the Ghastly gets close!';
    showToast('THE ANCIENT GHASTLY!', 1550);
    sfx('boss');
  }

  const keyState = new Set();
  const actionState = { attackHeld: false, dash: false, burst: false };
  let joyX = 0, joyY = 0, joystickPointer = null;

  addEventListener('keydown', (e) => {
    ensureAudio();
    keyState.add(e.code);
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') actionState.dash = true;
    if (e.code === 'KeyE') actionState.burst = true;
    if (e.code === 'KeyR' && gameOver) restart();
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  }, { passive: false });
  addEventListener('keyup', (e) => keyState.delete(e.code));

  ui.attackBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); ensureAudio(); actionState.attackHeld = true; ui.attackBtn.classList.add('pressed'); });
  const releaseAttack = () => { actionState.attackHeld = false; ui.attackBtn.classList.remove('pressed'); };
  ['pointerup','pointercancel','pointerleave'].forEach(ev => ui.attackBtn.addEventListener(ev, releaseAttack));
  ui.dashBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); ensureAudio(); actionState.dash = true; ui.dashBtn.classList.add('pressed'); });
  ['pointerup','pointercancel','pointerleave'].forEach(ev => ui.dashBtn.addEventListener(ev, () => ui.dashBtn.classList.remove('pressed')));
  ui.specialBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); ensureAudio(); actionState.burst = true; ui.specialBtn.classList.add('pressed'); });
  ['pointerup','pointercancel','pointerleave'].forEach(ev => ui.specialBtn.addEventListener(ev, () => ui.specialBtn.classList.remove('pressed')));
  ui.restartBtn.addEventListener('pointerdown', restart);

  ui.joystick.addEventListener('pointerdown', (e) => {
    e.preventDefault(); ensureAudio(); joystickPointer = e.pointerId; ui.joystick.setPointerCapture?.(e.pointerId); updateJoystick(e);
  });
  ui.joystick.addEventListener('pointermove', (e) => { if (e.pointerId === joystickPointer) { e.preventDefault(); updateJoystick(e); } });
  const endJoy = (e) => { if (joystickPointer === null || e.pointerId === joystickPointer) { joystickPointer = null; joyX = joyY = 0; ui.joystickKnob.style.transform = 'translate(0px,0px)'; } };
  ui.joystick.addEventListener('pointerup', endJoy);
  ui.joystick.addEventListener('pointercancel', endJoy);

  function updateJoystick(e) {
    const r = ui.joystick.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const max = r.width * .31;
    const len = Math.hypot(dx, dy);
    if (len > max) { dx *= max / len; dy *= max / len; }
    joyX = dx / max;
    joyY = dy / max;
    ui.joystickKnob.style.transform = `translate(${dx}px,${dy}px)`;
  }

  function inputVector() {
    let x = joyX;
    let z = joyY;
    if (keyState.has('KeyD') || keyState.has('ArrowRight')) x += 1;
    if (keyState.has('KeyA') || keyState.has('ArrowLeft')) x -= 1;
    if (keyState.has('KeyS') || keyState.has('ArrowDown')) z += 1;
    if (keyState.has('KeyW') || keyState.has('ArrowUp')) z -= 1;
    const v = new THREE.Vector3(x, 0, z);
    if (v.lengthSq() > 1) v.normalize();
    return v;
  }

  function findTarget(maxRange = 15) {
    let best = null, bestD = maxRange;
    for (const e of enemies) {
      if (!e.parent || e.userData.hp <= 0) continue;
      const d = horizontalDistance(player.position, e.position);
      if (d < bestD) { best = e; bestD = d; }
    }
    return best;
  }

  function shoot() {
    if (attackCooldown > 0 || gameOver) return;
    attackCooldown = evolved ? .19 : .28;
    const target = findTarget(16);
    const dir = target ? target.position.clone().sub(player.position) : lastFacing.clone();
    dir.y = 0;
    if (dir.lengthSq() < .01) dir.set(0, 0, -1);
    dir.normalize();

    const mat = new THREE.MeshBasicMaterial({ color: 0xff3156 });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(evolved ? .27 : .22, 12, 9), mat);
    orb.position.copy(player.position).add(new THREE.Vector3(0, evolved ? 1.65 : 1.3, 0)).addScaledVector(dir, .85);
    orb.userData = { vel: dir.multiplyScalar(evolved ? 16 : 13.5), life: 1.4, damage: evolved ? 2 : 1, friendly: true };
    scene.add(orb); projectiles.push(orb);
    burstFX(orb.position, 0xff1747, evolved ? 7 : 5, 2.4);
    sfx('orb');
  }

  function dash() {
    if (dashCooldown > 0 || gameOver) return;
    dashTimer = .22;
    dashCooldown = .78;
    invulnerable = Math.max(invulnerable, .28);
    burstFX(player.position, 0xff6177, 12, 4.5);
    sfx('dash');
  }

  function shadowBurst() {
    if (!evolved || burstCooldown > 0 || gameOver) return;
    burstCooldown = 3.0;
    burstFX(player.position.clone().add(new THREE.Vector3(0, .8, 0)), 0xff153f, isTouch ? 35 : 52, 8.5);
    for (const e of [...enemies]) {
      if (horizontalDistance(player.position, e.position) < 6.3) damageEnemy(e, 5);
    }
    sfx('burst');
  }

  function bossShot(e) {
    const dir = player.position.clone().sub(e.position); dir.y = 0; dir.normalize();
    const orb = new THREE.Mesh(new THREE.SphereGeometry(.35, 12, 8), new THREE.MeshBasicMaterial({ color: 0xb040ff }));
    orb.position.copy(e.position).add(new THREE.Vector3(0, 2.1, 0));
    orb.userData = { vel: dir.multiplyScalar(7.2), life: 3, damage: 14 };
    scene.add(orb); hostileProjectiles.push(orb);
    burstFX(orb.position, 0xb040ff, 8, 3);
  }

  function damageEnemy(e, amount) {
    if (!e.parent || e.userData.hp <= 0) return;
    e.userData.hp -= amount;
    e.userData.hitTimer = .14;
    updateEnemyBar(e);
    burstFX(e.position.clone().add(new THREE.Vector3(0, e.userData.boss ? 2.4 : 1.3, 0)), 0xff2850, e.userData.boss ? 15 : 8, e.userData.boss ? 5 : 3.5);
    sfx('hit');
    if (e.userData.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    const isBoss = e.userData.boss;
    const pos = e.position.clone();
    scene.remove(e);
    const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1);
    if (isBoss) winGame(); else dropEnergy(pos);
  }

  function dropEnergy(pos) {
    const g = new THREE.Group(); g.position.copy(pos); g.position.y = .6; scene.add(g);
    addMesh(new THREE.OctahedronGeometry(.3, 0), standard(0xff2f59, { emissive: 0xff0b38, emissiveIntensity: 4, roughness: .25, flat: false }), g, false, false);
    const ring = addMesh(new THREE.TorusGeometry(.45, .04, 6, 20), basic(0xff6680, .75), g, false, false);
    ring.rotation.x = Math.PI / 2;
    g.userData = { t: rand() * 5 };
    pickups.push(g);
  }

  function collectEnergy(p) {
    scene.remove(p);
    const i = pickups.indexOf(p); if (i >= 0) pickups.splice(i, 1);
    energy = Math.min(ENERGY_TO_EVOLVE, energy + 1);
    updateHUD();
    burstFX(player.position.clone().add(new THREE.Vector3(0, .8, 0)), 0xff1948, 16, 5);
    sfx('pickup');
    if (energy >= ENERGY_TO_EVOLVE && !evolved) evolve();
  }

  function evolve() {
    evolved = true;
    maxHp = 160;
    hp = Math.min(maxHp, hp + 70);
    playerSprite.material.map = shadowTex;
    playerSprite.scale.set(3.8, 4.9, 1);
    playerSprite.position.y = 1.95;
    playerGlow.scale.setScalar(1.45);
    player.children.filter(c => c.userData.playerOrb).forEach((o) => {
      o.scale.setScalar(1.75);
      o.position.set(o.userData.playerOrb * 1.4, 2.45, .2);
    });
    ui.formName.textContent = 'SHADOW STALKER';
    ui.specialBtn.classList.remove('hidden');
    ui.objectiveTitle.textContent = 'The Shadow Gate is open!';
    ui.objectiveText.textContent = 'Face the Ancient Ghastly beyond the ruins.';
    updateHUD();
    ui.evolveBanner.classList.remove('hidden');
    setTimeout(() => ui.evolveBanner.classList.add('hidden'), 1900);
    portalPower = .75;
    for (let n = 0; n < 4; n++) setTimeout(() => burstFX(player.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xff153f, isTouch ? 28 : 40, 8), n * 150);
    sfx('evolve');
    setTimeout(spawnBoss, 1500);
  }

  function damagePlayer(amount) {
    if (gameOver || invulnerable > 0) return;
    hp = Math.max(0, hp - amount);
    invulnerable = .75;
    burstFX(player.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xffffff, 12, 4);
    updateHUD();
    sfx('hurt');
    if (hp <= 0) loseGame();
  }

  function winGame() {
    won = true; gameOver = true; portalPower = 1.6;
    ui.bossHud.classList.add('hidden');
    ui.objectiveTitle.textContent = 'Island saved!';
    ui.objectiveText.textContent = 'Doom and Shadow Stalker defeated the Ghastlies.';
    showToast('ISLAND SAVED!\n✨ GREAT JOB! ✨', 5000);
    ui.restartBtn.classList.remove('hidden');
    for (let i = 0; i < 8; i++) setTimeout(() => burstFX(new THREE.Vector3((rand() - .5) * 14, 2 + rand() * 3, -10 + (rand() - .5) * 12), i % 2 ? 0xff244f : 0xffc14d, 24, 8), i * 130);
    sfx('win');
  }

  function loseGame() {
    gameOver = true;
    showToast('DOOM NEEDS A REST!\nTry again?', 5000);
    ui.restartBtn.classList.remove('hidden');
  }

  function restart() { location.reload(); }

  function updateHUD() {
    const hearts = 6;
    const filled = Math.ceil((hp / maxHp) * hearts);
    ui.hearts.innerHTML = '';
    for (let i = 0; i < hearts; i++) {
      const h = document.createElement('span'); h.className = 'heart' + (i < filled ? ' full' : ''); ui.hearts.appendChild(h);
    }
    const ratio = Math.min(1, energy / ENERGY_TO_EVOLVE);
    ui.energyBar.style.width = `${ratio * 100}%`;
    ui.energyText.textContent = `${energy} / ${ENERGY_TO_EVOLVE}`;
  }

  function showToast(text, ms = 1200) {
    ui.toast.textContent = text;
    ui.toast.classList.remove('hidden');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => ui.toast.classList.add('hidden'), ms);
  }

  function burstFX(pos, color, count = 12, speed = 4) {
    const room = Math.max(0, MAX_PARTICLES - particles.length);
    count = Math.min(count, room);
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(.035 + rand() * .06, 5, 4), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 }));
      p.position.copy(pos).add(new THREE.Vector3((rand() - .5) * .7, rand() * .7, (rand() - .5) * .7));
      const v = new THREE.Vector3(rand() - .5, rand() * .9 + .1, rand() - .5).normalize().multiplyScalar(speed * (.45 + rand() * .8));
      p.userData = { v, life: .38 + rand() * .42 };
      scene.add(p); particles.push(p);
    }
  }

  const clock = new THREE.Clock(false);
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), .034);
    elapsed += dt;

    if (!gameOver && player) updateGame(dt);
    updateFX(dt);
    animateWorld(dt);
    updateCamera(dt);
    renderer.render(scene, camera);
  }

  function updateGame(dt) {
    attackCooldown = Math.max(0, attackCooldown - dt);
    dashCooldown = Math.max(0, dashCooldown - dt);
    dashTimer = Math.max(0, dashTimer - dt);
    burstCooldown = Math.max(0, burstCooldown - dt);
    invulnerable = Math.max(0, invulnerable - dt);

    if (actionState.dash) { dash(); actionState.dash = false; }
    if (actionState.burst) { shadowBurst(); actionState.burst = false; }
    if (actionState.attackHeld || keyState.has('Space')) shoot();

    const move = inputVector();
    if (move.lengthSq() > .001) {
      lastFacing.copy(move).normalize();
      const speed = (evolved ? 6.1 : 5.4) * (dashTimer > 0 ? 2.25 : 1);
      player.position.addScaledVector(move, speed * dt);
      clampPlayer();
      playerBob += dt * (dashTimer > 0 ? 20 : 11);
    } else {
      playerBob += dt * 3.1;
    }
    const bob = Math.sin(playerBob) * (move.lengthSq() > .01 ? .07 : .035);
    playerSprite.position.y = (evolved ? 1.95 : 1.28) + bob;
    playerGlow.material.opacity = (evolved ? .24 : .14) + Math.sin(elapsed * 5) * .04;
    player.visible = invulnerable <= 0 || Math.floor(invulnerable * 16) % 2 === 0;
    for (const c of player.children) if (c.userData.playerOrb) {
      const base = evolved ? 1.75 : 1;
      c.scale.setScalar(base * (1 + Math.sin(elapsed * 8 + c.userData.playerOrb) * .08));
    }

    updateProjectiles(dt);
    updateEnemies(dt);
    updatePickups(dt);
  }

  function clampPlayer() {
    const r = Math.hypot(player.position.x, player.position.z);
    if (r > 22.4) { player.position.x *= 22.4 / r; player.position.z *= 22.4 / r; }
    player.position.z = THREE.MathUtils.clamp(player.position.z, -18.7, 18.7);
  }

  function updateProjectiles(dt) {
    for (const p of [...projectiles]) {
      p.position.addScaledVector(p.userData.vel, dt);
      p.userData.life -= dt;
      p.scale.setScalar(1 + Math.sin(elapsed * 18) * .15);
      let removed = false;
      for (const e of [...enemies]) {
        if (!e.parent) continue;
        const r = e.userData.boss ? 2.1 : .9;
        if (horizontalDistance(p.position, e.position) < r) {
          damageEnemy(e, p.userData.damage);
          removeFrom(p, projectiles); removed = true; break;
        }
      }
      if (!removed && p.userData.life <= 0) removeFrom(p, projectiles);
    }
    for (const p of [...hostileProjectiles]) {
      p.position.addScaledVector(p.userData.vel, dt);
      p.userData.life -= dt;
      p.scale.setScalar(1 + Math.sin(elapsed * 15) * .13);
      if (horizontalDistance(p.position, player.position) < .82) {
        damagePlayer(p.userData.damage); removeFrom(p, hostileProjectiles); continue;
      }
      if (p.userData.life <= 0) removeFrom(p, hostileProjectiles);
    }
  }

  function updateEnemies(dt) {
    for (const e of [...enemies]) {
      if (!e.parent) continue;
      const ud = e.userData;
      ud.hitTimer = Math.max(0, ud.hitTimer - dt);
      ud.contactTimer = Math.max(0, ud.contactTimer - dt);
      ud.attackTimer -= dt;

      if (ud.boss && e.scale.x < .995) {
        const s = THREE.MathUtils.lerp(e.scale.x, 1, 1 - Math.pow(.0001, dt));
        e.scale.setScalar(s);
      }

      const toPlayer = player.position.clone().sub(e.position); toPlayer.y = 0;
      const d = toPlayer.length();
      if (d > (ud.boss ? 2.5 : 1.05)) {
        toPlayer.normalize();
        const orbit = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).multiplyScalar(Math.sin(elapsed * .9 + ud.phase) * .34);
        const vel = toPlayer.add(orbit).normalize();
        e.position.addScaledVector(vel, ud.speed * dt * (ud.boss ? .85 : 1));
      } else if (ud.contactTimer <= 0) {
        damagePlayer(ud.boss ? 18 : 10); ud.contactTimer = .85;
      }

      if (ud.boss && ud.attackTimer <= 0 && d > 4) {
        bossShot(e); ud.attackTimer = 2.0 + rand() * .8;
      }

      const floatBase = ud.boss ? 1.1 : .72;
      e.position.y = floatBase + Math.sin(elapsed * 2.2 + ud.phase) * (ud.boss ? .2 : .27);
      ud.sprite.material.opacity = ud.hitTimer > 0 ? .58 : 1;
      ud.aura.rotation.z += dt * (ud.boss ? 1.3 : .65);
      ud.aura.material.opacity = (ud.boss ? .28 : .15) + Math.sin(elapsed * 4 + ud.phase) * .05;
      ud.bar.quaternion.copy(camera.quaternion);
    }
  }

  function updatePickups(dt) {
    for (const p of [...pickups]) {
      p.userData.t += dt;
      p.rotation.y += dt * 2.6;
      p.position.y = .7 + Math.sin(p.userData.t * 5) * .14;
      const d = horizontalDistance(p.position, player.position);
      if (d < 3.4 && d > .65) {
        const dir = player.position.clone().sub(p.position); dir.y = 0; dir.normalize();
        p.position.addScaledVector(dir, dt * (5.5 + (3.4 - d) * 2));
      }
      if (d < .85) collectEnergy(p);
    }
  }

  function updateFX(dt) {
    for (const p of [...particles]) {
      p.position.addScaledVector(p.userData.v, dt);
      p.userData.v.y -= 3.8 * dt;
      p.userData.life -= dt;
      p.material.opacity = Math.max(0, p.userData.life * 2);
      if (p.userData.life <= 0) removeFrom(p, particles);
    }
  }

  function animateWorld(dt) {
    for (const child of portal.children) {
      if (child.userData.spin) child.rotation.z += dt * child.userData.spin * (.35 + portalPower);
    }
    portal.scale.setScalar(.92 + Math.sin(elapsed * 2.4) * .025 * portalPower);
    portal.children.forEach((c, i) => { if (c.material && c.material.opacity !== undefined && i < 2) c.material.opacity = .18 + portalPower * .36 + Math.sin(elapsed * 3 + i) * .05; });
    root.traverse((o) => { if (o.userData.flame) { o.scale.y = .86 + Math.sin(elapsed * 9 + o.id) * .16; o.rotation.y += dt * .8; } });
  }

  function updateCamera(dt) {
    if (!player) return;
    const desired = player.position.clone().add(new THREE.Vector3(0, evolved ? 7.0 : 6.5, 10.6));
    const look = player.position.clone().add(new THREE.Vector3(0, evolved ? 1.5 : 1.0, -3.2));
    const smooth = 1 - Math.pow(.0012, dt);
    camera.position.lerp(desired, smooth);
    camera.lookAt(look);
  }

  function removeFrom(obj, arr) {
    scene.remove(obj);
    const i = arr.indexOf(obj); if (i >= 0) arr.splice(i, 1);
    if (obj.geometry) obj.geometry.dispose?.();
    if (obj.material && !Array.isArray(obj.material)) obj.material.dispose?.();
  }
  function horizontalDistance(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }

  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx?.state === 'suspended') audioCtx.resume().catch(() => {});
  }
  function sfx(type) {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const presets = {
      orb: [260, 520, .055, 'sine'], hit: [120, 70, .06, 'square'], pickup: [520, 850, .11, 'sine'],
      dash: [180, 90, .09, 'triangle'], burst: [120, 420, .22, 'sawtooth'], hurt: [130, 70, .12, 'sawtooth'],
      evolve: [180, 760, .55, 'triangle'], boss: [90, 45, .45, 'sawtooth'], win: [420, 900, .65, 'sine']
    };
    const p = presets[type] || presets.orb;
    o.type = p[3]; o.frequency.setValueAtTime(p[0], now); o.frequency.exponentialRampToValueAtTime(Math.max(30, p[1]), now + p[2]);
    g.gain.setValueAtTime(type === 'hit' ? .035 : .055, now); g.gain.exponentialRampToValueAtTime(.0001, now + p[2]);
    o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + p[2]);
  }

  function resize() {
    const w = innerWidth, h = innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isTouch ? 1.35 : 1.8));
    renderer.setSize(w, h, false);
  }
  addEventListener('resize', resize);
  window.visualViewport?.addEventListener('resize', resize);
  document.addEventListener('contextmenu', (e) => e.preventDefault());
})();