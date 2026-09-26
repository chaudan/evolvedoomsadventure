(() => {
  'use strict';

  const THREE = window.THREE;
  const mount = document.getElementById('game');
  const loading = document.getElementById('loading');
  const isTouch = navigator.maxTouchPoints > 0 || matchMedia('(pointer:coarse)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOTAL_LEVELS = 50;
  const EVOLVE_LEVEL = 30;

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
    energyLabel: document.getElementById('energyLabel'),
    levelBadge: document.getElementById('levelBadge'),
    chapterName: document.getElementById('chapterName'),
    levelNumber: document.getElementById('levelNumber'),
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
  const adventureLayer = new THREE.Group();
  scene.add(adventureLayer);

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

  function toon(color, opts = {}) {
    return new THREE.MeshToonMaterial({
      color,
      transparent: !!opts.transparent,
      opacity: opts.opacity ?? 1,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 0,
      side: opts.side ?? THREE.FrontSide
    });
  }

  function part(parent, geometry, material, position, scale = [1,1,1], rotation = [0,0,0], cast = true) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(position[0], position[1], position[2]);
    m.scale.set(scale[0], scale[1], scale[2]);
    m.rotation.set(rotation[0], rotation[1], rotation[2]);
    m.castShadow = cast;
    m.receiveShadow = cast;
    parent.add(m);
    return m;
  }

  function makeMagicOrb(parent, x, y, z, radius, color = 0xff244c) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    const core = part(g, new THREE.SphereGeometry(radius, 12, 9), toon(color, { emissive: color, emissiveIntensity: 4 }), [0,0,0], [1,1,1], [0,0,0], false);
    const ringMat = basic(color, .72);
    const r1 = part(g, new THREE.TorusGeometry(radius * 1.35, radius * .11, 6, 20), ringMat, [0,0,0], [1,1,.55], [Math.PI/2,0,0], false);
    const r2 = part(g, new THREE.TorusGeometry(radius * 1.72, radius * .08, 6, 20), basic(color,.48), [0,0,0], [1,.62,1], [0,0,Math.PI/2], false);
    g.userData.core = core;
    g.userData.rings = [r1,r2];
    return g;
  }

  function createDoomModel() {
    const g = new THREE.Group();
    const fur = toon(0x111722);
    const fur2 = toon(0x242b38);
    const dark = toon(0x070a10);
    const red = toon(0xff294f, { emissive: 0xff123c, emissiveIntensity: 2.8 });
    const redDark = toon(0x6b1028, { emissive: 0x3a0012, emissiveIntensity: .8 });

    const body = part(g, new THREE.SphereGeometry(.72, 12, 9), fur, [0,1.05,0], [.78,1.05,.72]);
    const chest = part(g, new THREE.ConeGeometry(.45,.7,7), fur2, [0,.95,-.48], [1,1,.5], [Math.PI/2,0,0]);
    const head = part(g, new THREE.SphereGeometry(.65, 14, 10), fur2, [0,1.95,-.03], [1.02,.92,.88]);
    part(g, new THREE.SphereGeometry(.34,10,8), fur, [0,1.78,-.55], [1.2,.64,.62]);

    const earGeo = new THREE.ConeGeometry(.38,1.35,6);
    const leftEar = part(g, earGeo, fur, [-.48,2.78,0], [1,1,.72], [0,0,-.18]);
    const rightEar = part(g, earGeo, fur, [.48,2.78,0], [1,1,.72], [0,0,.18]);
    part(leftEar, new THREE.ConeGeometry(.21,.92,5), redDark, [0,-.04,-.12], [1,1,.45], [0,0,0], false);
    part(rightEar, new THREE.ConeGeometry(.21,.92,5), redDark, [0,-.04,-.12], [1,1,.45], [0,0,0], false);
    for (const ear of [leftEar,rightEar]) {
      for (let i=0;i<3;i++) part(ear,new THREE.SphereGeometry(.055,6,5),red,[0,.12+i*.22,-.31],[1,.8,.45],[0,0,0],false);
    }

    for (const x of [-.23,.23]) {
      const eye = part(g,new THREE.SphereGeometry(.13,10,7),red,[x,1.98,-.58],[1.35,.58,.45],[0,0,0],false);
      eye.userData.glow = true;
    }
    for (const x of [-.19,0,.19]) {
      part(g,new THREE.ConeGeometry(.055,.34,5),red,[x,2.28,-.57],[1,1,.4],[Math.PI,0,0],false);
    }

    const armL = part(g,new THREE.CapsuleGeometry(.12,.62,4,7),fur,[-.68,1.22,-.02],[1,1,1],[0,0,-.9]);
    const armR = part(g,new THREE.CapsuleGeometry(.12,.62,4,7),fur,[.68,1.22,-.02],[1,1,1],[0,0,.9]);
    const handL = part(g,new THREE.SphereGeometry(.19,8,6),fur2,[-.98,1.18,-.08]);
    const handR = part(g,new THREE.SphereGeometry(.19,8,6),fur2,[.98,1.18,-.08]);
    for (const hand of [handL,handR]) {
      for (let i=-1;i<=1;i++) part(hand,new THREE.ConeGeometry(.045,.22,4),dark,[i*.08,-.02,-.16],[1,1,1],[Math.PI/2,0,0]);
    }

    const legL = part(g,new THREE.CapsuleGeometry(.15,.46,4,7),fur,[-.34,.38,0],[1,1,1],[0,0,-.08]);
    const legR = part(g,new THREE.CapsuleGeometry(.15,.46,4,7),fur,[.34,.38,0],[1,1,1],[0,0,.08]);
    part(g,new THREE.SphereGeometry(.24,8,6),fur2,[-.36,.07,-.13],[1.2,.48,1.45]);
    part(g,new THREE.SphereGeometry(.24,8,6),fur2,[.36,.07,-.13],[1.2,.48,1.45]);

    const tail = new THREE.Group();
    tail.position.set(0,.86,.48); tail.rotation.x=-.6; g.add(tail);
    part(tail,new THREE.ConeGeometry(.28,1.35,7),fur,[0,.45,0],[1,1,.9],[0,0,Math.PI]);
    part(tail,new THREE.ConeGeometry(.18,.72,7),fur2,[0,1.1,0],[1,1,.9],[0,0,Math.PI]);

    const orbL = makeMagicOrb(g,-1.28,1.43,-.08,.21);
    const orbR = makeMagicOrb(g,1.28,1.43,-.08,.21);
    g.userData.magicOrbs=[orbL,orbR];
    g.userData.animated={armL,armR,tail};
    g.userData.baseY=0;
    return g;
  }

  function createShadowStalkerModel() {
    const g = new THREE.Group();
    const fur = toon(0x0c111a);
    const fur2 = toon(0x202735);
    const red = toon(0xff244c, { emissive: 0xff0a37, emissiveIntensity: 3.3 });
    const dark = toon(0x05070b);

    part(g,new THREE.SphereGeometry(1.0,14,10),fur,[0,1.55,0],[1.0,1.25,.88]);
    part(g,new THREE.SphereGeometry(.82,14,10),fur2,[0,2.82,-.08],[1.05,.9,.9]);
    const ruff = new THREE.Group(); ruff.position.set(0,2.2,0); g.add(ruff);
    for(let i=0;i<9;i++){
      const a=(i/9)*Math.PI*2;
      const t=part(ruff,new THREE.ConeGeometry(.23,.72,5),fur2,[Math.cos(a)*.72,Math.sin(a)*.18,Math.sin(a)*.56],[1,1,.7],[Math.PI/2,0,-a]);
      t.rotation.y=a;
    }

    const hornL = new THREE.Group(); hornL.position.set(-.63,3.28,.02); g.add(hornL);
    const hornR = new THREE.Group(); hornR.position.set(.63,3.28,.02); hornR.scale.x=-1; g.add(hornR);
    for(const h of [hornL,hornR]){
      const seg1=part(h,new THREE.ConeGeometry(.28,1.15,6),fur2,[-.12,.38,0],[1,1,.8],[0,0,.52]);
      part(h,new THREE.ConeGeometry(.21,.92,6),fur,[.24,1.0,0],[1,1,.72],[0,0,.9]);
    }
    for(const x of [-.43,-.16,.16,.43]) part(g,new THREE.ConeGeometry(.12,.62,5),red,[x,3.42,-.16],[1,1,.6],[0,0,x*.35],false);

    for(const x of [-.31,.31]) part(g,new THREE.SphereGeometry(.16,10,7),red,[x,2.94,-.77],[1.55,.55,.42],[0,0,0],false);
    const mouthY=2.62;
    for(let i=0;i<7;i++){
      const x=(i-3)*.16;
      const up=part(g,new THREE.ConeGeometry(.06,.26,4),red,[x,mouthY,-.79],[1,1,.6],[Math.PI,0,0],false);
      if(i<6) part(g,new THREE.ConeGeometry(.06,.24,4),red,[x+.08,mouthY-.20,-.79],[1,1,.6],[0,0,0],false);
    }

    const armL=part(g,new THREE.CapsuleGeometry(.24,1.0,4,8),fur,[-1.05,1.85,0],[1,1,1],[0,0,-.78]);
    const armR=part(g,new THREE.CapsuleGeometry(.24,1.0,4,8),fur,[1.05,1.85,0],[1,1,1],[0,0,.78]);
    const handL=part(g,new THREE.SphereGeometry(.35,9,7),fur2,[-1.55,2.28,-.08],[1,1,.9]);
    const handR=part(g,new THREE.SphereGeometry(.35,9,7),fur2,[1.55,2.28,-.08],[1,1,.9]);
    for(const hand of [handL,handR]) for(let i=-1;i<=1;i++) part(hand,new THREE.ConeGeometry(.07,.36,4),dark,[i*.13,.02,-.3],[1,1,1],[Math.PI/2,0,0]);

    part(g,new THREE.CapsuleGeometry(.25,.72,4,8),fur,[-.52,.55,0],[1,1,1],[0,0,-.1]);
    part(g,new THREE.CapsuleGeometry(.25,.72,4,8),fur,[.52,.55,0],[1,1,1],[0,0,.1]);
    part(g,new THREE.SphereGeometry(.36,9,7),fur2,[-.54,.08,-.16],[1.35,.52,1.55]);
    part(g,new THREE.SphereGeometry(.36,9,7),fur2,[.54,.08,-.16],[1.35,.52,1.55]);

    const tail=new THREE.Group(); tail.position.set(0,1.15,.65); tail.rotation.x=-.7; g.add(tail);
    part(tail,new THREE.ConeGeometry(.26,1.75,7),fur,[0,.64,0],[1,1,.9],[0,0,Math.PI]);
    const arrow=part(tail,new THREE.ConeGeometry(.36,.7,3),red,[0,1.55,0],[1,1,.7],[0,0,Math.PI]);
    arrow.rotation.y=Math.PI/2;

    const orbL=makeMagicOrb(g,-1.65,3.75,-.1,.34);
    const orbR=makeMagicOrb(g,1.65,3.75,-.1,.34);
    g.userData.magicOrbs=[orbL,orbR];
    g.userData.animated={armL,armR,tail};
    g.userData.baseY=0;
    return g;
  }

  function createGhastlyModel(type='drifter', scale=1) {
    const g=new THREE.Group();
    g.scale.setScalar(scale);

    const looks={
      drifter:{smoke:0x737982,smoke2:0xaeb3ba,face:0x30343b,eye:0xd9f4ff},
      charger:{smoke:0x666b72,smoke2:0x999fa7,face:0x282c32,eye:0xffcf66},
      brute:{smoke:0x555b63,smoke2:0x858b94,face:0x22262c,eye:0xff9d6b},
      hexer:{smoke:0x686c78,smoke2:0xa5a9b5,face:0x292b35,eye:0xc89aff},
      reaper:{smoke:0x434851,smoke2:0x747b85,face:0x171b20,eye:0x8feaff},
      boss:{smoke:0x3b4048,smoke2:0x858b94,face:0x11151a,eye:0xe3e8ff}
    };
    const look=looks[type]||looks.drifter;
    const smoke=toon(look.smoke);
    const smoke2=toon(look.smoke2);
    const voidMat=toon(look.face);
    const eyeMat=toon(look.eye,{emissive:look.eye,emissiveIntensity:3.2});
    const clawMat=toon(0x4a4f57,{emissive:0x111317,emissiveIntensity:.25});

    part(g,new THREE.SphereGeometry(.62,12,9),smoke2,[0,1.72,0],[1.08,.9,.95]);
    part(g,new THREE.ConeGeometry(.72,1.15,8),smoke,[0,2.05,.08],[1,1,.9],[0,0,Math.PI]);
    part(g,new THREE.SphereGeometry(.47,11,8),voidMat,[0,1.7,-.42],[1,.76,.5]);
    for(const x of [-.2,.2]) part(g,new THREE.SphereGeometry(.12,9,6),eyeMat,[x,1.78,-.76],[1.15,1.65,.45],[0,0,0],false);

    const armL=new THREE.Group(); armL.position.set(-.58,1.25,0); armL.rotation.z=-.8; g.add(armL);
    const armR=new THREE.Group(); armR.position.set(.58,1.25,0); armR.rotation.z=.8; g.add(armR);
    for(const arm of [armL,armR]){
      part(arm,new THREE.CapsuleGeometry(.12,.52,4,7),smoke,[0,.25,0]);
      const hand=part(arm,new THREE.SphereGeometry(.2,8,6),smoke2,[0,.62,-.05]);
      for(let i=-1;i<=1;i++) part(hand,new THREE.ConeGeometry(.04,.25,4),clawMat,[i*.08,.02,-.18],[1,1,1],[Math.PI/2,0,0],false);
    }

    const tail=new THREE.Group(); tail.position.set(0,.95,.08); g.add(tail);
    part(tail,new THREE.ConeGeometry(.5,1.4,8),smoke,[0,-.55,0],[1,1,.9],[0,0,0]);
    part(tail,new THREE.SphereGeometry(.28,8,6),smoke2,[.15,-1.2,.05],[1.2,.65,.8]);
    part(tail,new THREE.ConeGeometry(.22,.75,7),smoke,[.34,-1.55,.05],[1,1,.8],[0,0,-.7]);

    const wisp=part(g,new THREE.ConeGeometry(.18,.62,6),smoke2,[.14,2.78,.05],[1,1,.75],[0,0,-.45]);

    if(type==='charger'){
      for(const x of [-.34,.34]) part(g,new THREE.ConeGeometry(.12,.58,5),smoke2,[x,2.46,-.08],[1,1,.75],[0,0,x<0?-.5:.5]);
      g.scale.x*=.9;
    }
    if(type==='brute'||type==='boss'){
      for(const x of [-.7,.7]) part(g,new THREE.DodecahedronGeometry(.3,0),smoke2,[x,1.5,.02],[1.35,.75,1.0]);
      armL.scale.setScalar(1.18); armR.scale.setScalar(1.18);
    }
    if(type==='hexer'){
      const orb=makeMagicOrb(g,0,1.05,-.58,.16,look.eye);
      orb.userData.isEnemyOrb=true;
      g.userData.magicOrb=orb;
    }
    if(type==='reaper'||type==='boss'){
      for(let i=-2;i<=2;i++){
        part(g,new THREE.ConeGeometry(.09,.5,5),smoke2,[i*.18,2.53-Math.abs(i)*.04,-.02],[1,1,.7],[0,0,i*.14]);
      }
    }
    if(type==='boss'){
      const crown=part(g,new THREE.TorusGeometry(.8,.08,6,20),basic(look.eye,.42),[0,2.28,.05],[1,.72,1],[Math.PI/2,0,0],false);
      crown.userData.spin=1.2;
    }

    g.userData.animated={armL,armR,tail,wisp};
    return g;
  }

  const GHASTLY_TYPES = {
    drifter:{name:'Drifter',hp:2,speed:1.18,damage:8,scale:1,aura:0xb9c0c8},
    charger:{name:'Charger',hp:4,speed:1.55,damage:11,scale:.96,aura:0xd7b56e,charge:true},
    brute:{name:'Brute',hp:8,speed:.86,damage:17,scale:1.25,aura:0x8e949b},
    hexer:{name:'Hexer',hp:6,speed:1.0,damage:9,scale:1.04,aura:0xb987e8,ranged:true,range:6.1,shotEvery:1.75,shotDamage:9,shotColor:0xb77cff},
    reaper:{name:'Reaper',hp:11,speed:1.38,damage:14,scale:1.08,aura:0x7dd8e6,ranged:true,range:4.9,shotEvery:2.15,shotDamage:12,shotColor:0x75dff2},
    boss:{name:'Ancient Ghastly',hp:48,speed:1.0,damage:21,scale:1.8,aura:0xd3d7dc,ranged:true,range:5.8,shotEvery:1.5,shotDamage:15,shotColor:0xc7ccda}
  };

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

  const gate = new THREE.Group();
  const portal = new THREE.Group();
  let portalPower = 0.18;

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

  let player;
  let playerModel;
  let playerGlow;
  let hp = 120;
  let maxHp = 120;
  let currentLevel = 1;
  let evolved = false;
  let gameOver = false;
  let won = false;
  let boss = null;
  let bossSpawned = false;
  let levelTransition = false;
  let levelStartedAt = 0;
  let levelObjective = null;
  let exitPortal = null;
  let portalOpen = false;
  let enemySpawnTimer = 0;
  let treasureFound = false;
  const levelItems = [];
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
    createPlayer();
    startLevel(1);
    updateHUD();
    requestAnimationFrame(() => loading.classList.add('ready'));
    setTimeout(() => loading.remove(), 700);
    showToast("DOOM'S ADVENTURE!", 1000);
    clock.start();
    animate();
  }

  function createPlayer() {
    player = new THREE.Group();
    player.position.set(0, .3, 10.8);
    scene.add(player);

    playerGlow = addMesh(new THREE.RingGeometry(.45, 1.1, 24), basic(0xff1b43, .17), player, false, false);
    playerGlow.rotation.x = -Math.PI / 2;
    playerGlow.position.y = -.15;

    playerModel = createDoomModel();
    player.add(playerModel);
  }

  const LEVEL_SPAWNS=[
    [-5.8,5.4],[5.4,3.4],[-6.5,-1.5],[5.8,-3.7],[-4.4,-8.4],
    [5.0,-10.2],[-6.3,-13.4],[5.5,-14.8],[-9.2,-5.7],[9.0,-7.1],
    [-8.0,1.6],[8.2,-.2],[-13,8],[13,8],[-13,-8],[13,-8]
  ];

  const LEVEL_ROUTES=[
    {start:[0,15],exit:[0,-15]},
    {start:[-15,8],exit:[15,-8]},
    {start:[15,8],exit:[-15,-8]},
    {start:[-15,-7],exit:[15,7]},
    {start:[11,14],exit:[-12,-14]},
    {start:[-11,14],exit:[12,-14]}
  ];

  const ADVENTURE_POINTS=[
    [-12,11],[12,11],[-14,3],[14,3],[-11,-5],[11,-5],[-8,-13],[8,-13],
    [0,7],[-6,3],[6,-2],[0,-9],[-15,-1],[15,-1],[-3,-14],[3,13]
  ];

  function chapterForLevel(level){
    if(level<10) return {name:'SUNNY SHORE',sky:0x7fc6ef,fog:0x8dc9e8,hemi:0xe8f8ff};
    if(level<20) return {name:'MISTY GROVE',sky:0x7ab6c6,fog:0x789da7,hemi:0xd9f3eb};
    if(level<30) return {name:'STONE RUINS',sky:0x8c9eae,fog:0x7d8892,hemi:0xe1e5e8};
    if(level<40) return {name:'TWILIGHT REACH',sky:0x756f9e,fog:0x635f83,hemi:0xded9ff};
    if(level<50) return {name:'SHADOW FRONTIER',sky:0x4d566f,fog:0x41485d,hemi:0xcdd5ef};
    return {name:'ANCIENT GATE',sky:0x343947,fog:0x30343e,hemi:0xd7d9e1};
  }

  function setChapterTheme(level){
    const ch=chapterForLevel(level);
    scene.background.setHex(ch.sky);
    scene.fog.color.setHex(ch.fog);
    hemi.color.setHex(ch.hemi);
    ui.chapterName.textContent=ch.name;
  }

  function poolForLevel(level){
    if(level<10) return ['drifter'];
    if(level<20) return ['drifter','charger','charger'];
    if(level<30) return ['charger','brute','drifter','brute'];
    if(level<40) return ['charger','brute','hexer','hexer'];
    return ['brute','hexer','reaper','reaper'];
  }

  function newTypeAt(level){
    return ({10:'charger',20:'brute',30:'hexer',40:'reaper'})[level]||null;
  }

  function isBossLevel(level){ return level % 10 === 0; }

  function routeForLevel(level){
    return LEVEL_ROUTES[(level-1)%LEVEL_ROUTES.length];
  }

  function startLevel(level){
    currentLevel=level;
    levelTransition=true;
    levelStartedAt=elapsed;
    bossSpawned=false;
    boss=null;
    portalOpen=false;
    treasureFound=false;
    enemySpawnTimer=.35;
    ui.bossHud.classList.add('hidden');
    clearCombatObjects();
    clearAdventureLayer();
    setChapterTheme(level);

    const route=routeForLevel(level);
    player.position.set(route.start[0],.3,route.start[1]);
    setupLevelScenery(level,route);
    createExitPortal(route.exit[0],route.exit[1],route.start[0],route.start[1]);
    setupLevelObjective(level);
    updateHUD();

    const beginLevel=()=>{
      levelStartedAt=elapsed;
      levelTransition=false;
      spawnInitialPatrol(level);
      if(isBossLevel(level)) spawnBossForLevel(level);
      updateObjectiveUI();
      const intro=newTypeAt(level);
      if(intro && level!==10) showToast(`NEW GHASTLY: ${GHASTLY_TYPES[intro].name.toUpperCase()}!`,1300);
      else if(level>1) showToast(isBossLevel(level)?`BOSS LEVEL ${level}`:`LEVEL ${level}`,850);
    };

    if(level===EVOLVE_LEVEL && !evolved){
      evolve();
      setTimeout(beginLevel,1450);
    }else{
      beginLevel();
    }
  }

  function clearAdventureLayer(){
    while(adventureLayer.children.length){
      const child=adventureLayer.children.pop();
      child.traverse?.(o=>{
        if(o.geometry) o.geometry.dispose?.();
        if(o.material && !Array.isArray(o.material)) o.material.dispose?.();
      });
    }
    levelItems.length=0;
    exitPortal=null;
    levelObjective=null;
  }

  function setupLevelScenery(level,route){
    const chapter=Math.floor((level-1)/10);
    const ruinCount=4+Math.min(7,chapter+Math.floor(level/8));
    for(let i=0;i<ruinCount;i++){
      const p=ADVENTURE_POINTS[(i*3+level)%ADVENTURE_POINTS.length];
      if(Math.hypot(p[0]-route.start[0],p[1]-route.start[1])<4) continue;
      if(Math.hypot(p[0]-route.exit[0],p[1]-route.exit[1])<4) continue;
      const g=new THREE.Group();
      g.position.set(p[0]+((i%2)*1.1-.55),0.28,p[1]);
      g.rotation.y=((i*1.37+level*.29)%6.28);
      adventureLayer.add(g);
      part(g,new THREE.BoxGeometry(1.2+((i+level)%3)*.35,.45,1.0),i%2?mats.ruin:mats.ruinDark,[0,.12,0],[1,1,1],[0,0,0]);
      if(i%3===0){
        part(g,new THREE.BoxGeometry(.55,2.4+chapter*.18,.55),mats.ruin,[0,1.35,0]);
        part(g,new THREE.ConeGeometry(.45,.7,5),mats.ruinDark,[0,2.85+chapter*.18,0]);
      }else{
        const rock=part(g,new THREE.DodecahedronGeometry(.65,0),i%2?mats.rock:mats.rockDark,[0,.65,0],[1.3,.85,1]);
        rock.rotation.y=i;
      }
    }

    const sx=route.start[0], sz=route.start[1], ex=route.exit[0], ez=route.exit[1];
    for(let i=1;i<=5;i++){
      const t=i/6;
      const marker=new THREE.Group();
      marker.position.set(THREE.MathUtils.lerp(sx,ex,t)+Math.sin(level+i)*1.4,.25,THREE.MathUtils.lerp(sz,ez,t)+Math.cos(level*.6+i)*1.2);
      adventureLayer.add(marker);
      part(marker,new THREE.CylinderGeometry(.22,.3,.7,6),mats.wood,[0,.35,0]);
      const crystal=part(marker,new THREE.OctahedronGeometry(.18,0),standard(0x6cd8ff,{emissive:0x287db8,emissiveIntensity:1.7}),[0,.95,0],[1,.9,1],[0,0,0],false);
      crystal.userData.pathMarker=true;
    }

    createTreasure(level,route);
  }

  function createTreasure(level,route){
    const p=ADVENTURE_POINTS[(level*5+7)%ADVENTURE_POINTS.length];
    if(Math.hypot(p[0]-route.start[0],p[1]-route.start[1])<4) return;
    const chest=new THREE.Group();
    chest.position.set(p[0],.35,p[1]);
    adventureLayer.add(chest);
    part(chest,new THREE.BoxGeometry(1.1,.6,.75),mats.wood,[0,.3,0]);
    part(chest,new THREE.BoxGeometry(1.14,.2,.79),mats.gold,[0,.66,0]);
    const gem=part(chest,new THREE.OctahedronGeometry(.16,0),standard(0xffc34d,{emissive:0xff9a1e,emissiveIntensity:2.4}),[0,1.0,0],[1,1,1],[0,0,0],false);
    levelItems.push({kind:'treasure',group:chest,gem,done:false});
  }

  function createExitPortal(x,z,startX=0,startZ=0){
    const g=new THREE.Group();
    g.position.set(x,.45,z);
    g.rotation.y=Math.atan2(startX-x,startZ-z);
    adventureLayer.add(g);
    part(g,new THREE.CylinderGeometry(1.25,1.45,.28,16),mats.ruinDark,[0,.05,0]);
    part(g,new THREE.BoxGeometry(.42,3.2,.5),mats.ruin,[-1.05,1.7,0]);
    part(g,new THREE.BoxGeometry(.42,3.2,.5),mats.ruin,[1.05,1.7,0]);
    part(g,new THREE.BoxGeometry(2.5,.42,.5),mats.ruin,[0,3.18,0]);
    const disc=part(g,new THREE.CircleGeometry(.94,32),basic(0x59616a,.34),[0,1.72,.03],[1,1,1],[0,0,0],false);
    const ring1=part(g,new THREE.TorusGeometry(1.0,.085,7,28),basic(0x9aa5ad,.58),[0,1.72,.06],[1,1,1],[0,0,0],false);
    const ring2=part(g,new THREE.TorusGeometry(.72,.055,6,24),basic(0x737d86,.45),[0,1.72,.08],[1,.82,1],[0,0,.5],false);
    const beacon=part(g,new THREE.ConeGeometry(.35,.9,6),standard(0x9099a2,{emissive:0x303941,emissiveIntensity:.5}),[0,3.95,0],[1,1,1],[0,0,0],false);
    g.userData={disc,ring1,ring2,beacon};
    exitPortal=g;
    setPortalOpen(false);
  }

  function setPortalOpen(open){
    portalOpen=open;
    if(!exitPortal) return;
    const ud=exitPortal.userData;
    const color=open?0x54e3ff:0x6f7880;
    const emissive=open?0x1c9ec2:0x22272b;
    ud.disc.material.color.setHex(color);
    ud.disc.material.opacity=open?.62:.26;
    ud.ring1.material.color.setHex(open?0xb3f3ff:0xa0a8af);
    ud.ring1.material.opacity=open?.9:.42;
    ud.ring2.material.color.setHex(open?0x8b74ff:0x777f86);
    ud.beacon.material.color.setHex(open?0x6cecff:0x9099a2);
    ud.beacon.material.emissive.setHex(emissive);
    ud.beacon.material.emissiveIntensity=open?2.8:.5;
    if(open){
      burstFX(exitPortal.position.clone().add(new THREE.Vector3(0,1.7,0)),0x6de8ff,24,5);
      sfx('pickup');
    }
  }

  function setupLevelObjective(level){
    if(isBossLevel(level)){
      levelObjective={kind:'boss',done:false,total:1,progress:0};
      return;
    }
    const kinds=['relics','runes','key','explore'];
    const kind=kinds[(level-1)%kinds.length];
    const count=kind==='key'?1:(level<16?2:3);
    levelObjective={kind,done:false,total:count,progress:0};

    const used=[];
    for(let i=0;i<count;i++){
      const p=chooseAdventurePoint(level,i,used);
      used.push(p);
      if(kind==='relics') createRelic(p[0],p[1],i);
      if(kind==='runes') createRuneStone(p[0],p[1],i);
      if(kind==='explore') createLandmark(p[0],p[1],i);
      if(kind==='key') createAncientKey(p[0],p[1]);
    }
  }

  function chooseAdventurePoint(level,index,used){
    const route=routeForLevel(level);
    for(let j=0;j<ADVENTURE_POINTS.length;j++){
      const p=ADVENTURE_POINTS[(level*3+index*5+j)%ADVENTURE_POINTS.length];
      if(Math.hypot(p[0]-route.start[0],p[1]-route.start[1])<5) continue;
      if(Math.hypot(p[0]-route.exit[0],p[1]-route.exit[1])<3.5) continue;
      if(used.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<4)) continue;
      return p;
    }
    return ADVENTURE_POINTS[(level+index)%ADVENTURE_POINTS.length];
  }

  function createRelic(x,z,index){
    const g=new THREE.Group(); g.position.set(x,.65,z); adventureLayer.add(g);
    const gem=part(g,new THREE.OctahedronGeometry(.36,0),standard(0xffd765,{emissive:0xffa421,emissiveIntensity:2.6}),[0,.5,0],[1,1.2,1],[0,0,0],false);
    const ring=part(g,new THREE.TorusGeometry(.62,.045,6,20),basic(0xffe29a,.68),[0,.5,0],[1,1,1],[Math.PI/2,0,0],false);
    levelItems.push({kind:'objective',subkind:'relic',group:g,gem,ring,done:false,index});
  }

  function createRuneStone(x,z,index){
    const g=new THREE.Group(); g.position.set(x,.25,z); adventureLayer.add(g);
    part(g,new THREE.CylinderGeometry(.58,.72,1.55,7),mats.ruinDark,[0,.75,0]);
    const rune=part(g,new THREE.TorusGeometry(.28,.07,5,9),basic(0x8a939b,.5),[0,1.08,-.55],[1,1,1],[0,0,0],false);
    const top=part(g,new THREE.OctahedronGeometry(.18,0),standard(0x858e96,{emissive:0x242a30,emissiveIntensity:.4}),[0,1.72,0],[1,1,1],[0,0,0],false);
    levelItems.push({kind:'objective',subkind:'rune',group:g,rune,top,done:false,index});
  }

  function createLandmark(x,z,index){
    const g=new THREE.Group(); g.position.set(x,.3,z); adventureLayer.add(g);
    part(g,new THREE.CylinderGeometry(.5,.7,2.5,6),mats.ruin,[0,1.25,0]);
    const flame=part(g,new THREE.ConeGeometry(.23,.72,7),standard(0x65dfff,{emissive:0x1c8fbb,emissiveIntensity:3}),[0,2.82,0],[1,1,1],[0,0,0],false);
    const ring=part(g,new THREE.TorusGeometry(.75,.045,6,20),basic(0x65dfff,.35),[0,.08,0],[1,1,1],[Math.PI/2,0,0],false);
    levelItems.push({kind:'objective',subkind:'landmark',group:g,flame,ring,done:false,index});
  }

  function createAncientKey(x,z){
    const g=new THREE.Group(); g.position.set(x,.75,z); adventureLayer.add(g);
    const ring=part(g,new THREE.TorusGeometry(.28,.09,8,18),standard(0xffce50,{emissive:0xff9d1f,emissiveIntensity:2}),[0,.35,0],[1,1,1],[Math.PI/2,0,0],false);
    part(g,new THREE.BoxGeometry(.12,.75,.12),mats.gold,[0,.0,0]);
    part(g,new THREE.BoxGeometry(.42,.12,.12),mats.gold,[.15,-.3,0]);
    levelItems.push({kind:'objective',subkind:'key',group:g,ring,done:false,index:0});
  }

  function objectiveItemCollected(item){
    if(item.done||!levelObjective||levelObjective.done) return;
    item.done=true;
    item.group.visible=false;
    levelObjective.progress++;
    burstFX(item.group.position.clone().add(new THREE.Vector3(0,.8,0)),item.subkind==='key'?0xffca4c:0x7be8ff,14,4.5);
    sfx('pickup');
    if(levelObjective.progress>=levelObjective.total){
      levelObjective.done=true;
      setPortalOpen(true);
      showToast('PORTAL OPEN!',900);
    }
    updateObjectiveUI();
  }

  function updateObjectiveUI(){
    if(!levelObjective) return;
    if(levelObjective.kind==='boss'){
      ui.objectiveTitle.textContent=`Level ${currentLevel}: Defeat the boss`;
      ui.objectiveText.textContent=levelObjective.done?'The portal is open! Reach it.':'Defeat the Ancient Ghastly to unlock the portal.';
      return;
    }
    const p=levelObjective.progress,t=levelObjective.total;
    if(levelObjective.kind==='relics'){
      ui.objectiveTitle.textContent='Find the lost relics';
      ui.objectiveText.textContent=levelObjective.done?'Portal open — reach it!':`Explore the island and find relics: ${p}/${t}`;
    }else if(levelObjective.kind==='runes'){
      ui.objectiveTitle.textContent='Wake the ancient runes';
      ui.objectiveText.textContent=levelObjective.done?'Portal open — reach it!':`Touch the rune stones: ${p}/${t}`;
    }else if(levelObjective.kind==='key'){
      ui.objectiveTitle.textContent='Find the portal key';
      ui.objectiveText.textContent=levelObjective.done?'Portal open — reach it!':'Explore off the main path and find the golden key.';
    }else{
      ui.objectiveTitle.textContent='Explore the forgotten landmarks';
      ui.objectiveText.textContent=levelObjective.done?'Portal open — reach it!':`Discover the glowing ruins: ${p}/${t}`;
    }
  }

  function spawnInitialPatrol(level){
    const count=isBossLevel(level)?2:Math.min(4,2+Math.floor(level/18));
    for(let i=0;i<count;i++) spawnRoamingEnemy(i);
  }

  function spawnRoamingEnemy(seedOffset=0){
    const cap=isBossLevel(currentLevel)?6:Math.min(8,4+Math.floor(currentLevel/12));
    if(enemies.length>=cap) return;
    const pool=poolForLevel(currentLevel);
    const type=pool[(currentLevel+seedOffset+Math.floor(elapsed*2))%pool.length];
    let p=null;
    for(let j=0;j<LEVEL_SPAWNS.length;j++){
      const candidate=LEVEL_SPAWNS[(currentLevel*2+seedOffset+j)%LEVEL_SPAWNS.length];
      if(horizontalDistance(player.position,{x:candidate[0],z:candidate[1]})>7){
        p=candidate; break;
      }
    }
    if(!p) p=LEVEL_SPAWNS[(seedOffset+currentLevel)%LEVEL_SPAWNS.length];
    spawnGhastly(p[0],p[1],type,(seedOffset+elapsed)*.61);
  }

  function spawnBossForLevel(level){
    bossSpawned=true;
    portalPower=1.0;
    const route=routeForLevel(level);
    const bx=(route.exit[0]*.66);
    const bz=(route.exit[1]*.66);
    boss=spawnGhastly(bx,bz,'boss',0);
    boss.scale.setScalar(.12);
    ui.bossHud.classList.remove('hidden');
    showToast(`ANCIENT GHASTLY — LEVEL ${level}`,1350);
    sfx('boss');
  }

  function clearCombatObjects(){
    for(const e of [...enemies]) scene.remove(e);
    enemies.length=0;
    for(const p of [...projectiles]) scene.remove(p);
    projectiles.length=0;
    for(const p of [...hostileProjectiles]) scene.remove(p);
    hostileProjectiles.length=0;
    for(const p of [...pickups]) scene.remove(p);
    pickups.length=0;
  }

  function completeLevel(){
    if(levelTransition||gameOver) return;
    levelTransition=true;
    if(currentLevel>=TOTAL_LEVELS){
      winGame();
      return;
    }
    hp=Math.min(maxHp,hp+Math.ceil(maxHp*.22));
    if(currentLevel%10===0) hp=maxHp;
    updateHUD();
    showToast(`LEVEL ${currentLevel} COMPLETE!`,850);
    setTimeout(()=>startLevel(currentLevel+1),850);
  }

  function spawnGhastly(x, z, type='drifter', phase=0) {
    const cfg=GHASTLY_TYPES[type]||GHASTLY_TYPES.drifter;
    const isBoss=type==='boss';
    const chapter=Math.floor((currentLevel-1)/10);
    const hpScale=isBoss?(1+Math.max(0,currentLevel-10)/50):(1+chapter*.12);

    const g = new THREE.Group();
    g.position.set(x, isBoss ? 1.0 : .72, z);
    scene.add(g);

    const model = createGhastlyModel(type,cfg.scale);
    g.add(model);

    const aura = addMesh(new THREE.RingGeometry(isBoss ? .9 : .42, isBoss ? 2.0 : .95, 28), basic(cfg.aura, isBoss ? .28 : .12), g, false, false);
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = -.55;

    const bar = new THREE.Group();
    bar.position.y = isBoss ? 6.9 : 3.55*cfg.scale;
    g.add(bar);
    addMesh(new THREE.PlaneGeometry(isBoss ? 2.8 : 1.45, .18), basic(0x17191f, .94), bar, false, false);
    const fill = addMesh(new THREE.PlaneGeometry(isBoss ? 2.65 : 1.34, .11), basic(isBoss?0xd8dde3:0x9aa1aa, 1), bar, false, false);
    fill.position.z = .01;
    fill.userData.fullWidth = isBoss ? 2.65 : 1.34;

    const hpValue=Math.ceil(cfg.hp*hpScale);
    g.userData = {
      isEnemy:true,boss:isBoss,type,cfg,
      hp:hpValue,maxHp:hpValue,speed:cfg.speed,damage:cfg.damage,
      model,modelScale:cfg.scale,aura,bar,fill,phase,
      hitTimer:0,attackTimer:(cfg.shotEvery||2)+rand()*.7,contactTimer:0,
      chargeTimer:0,chargeCooldown:1.2+rand()*1.4
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
    spawnBossForLevel(currentLevel);
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

  function enemyShot(e) {
    const ud=e.userData;
    const baseDir=player.position.clone().sub(e.position); baseDir.y=0; baseDir.normalize();
    const shots=ud.boss?3:1;
    for(let i=0;i<shots;i++){
      const dir=baseDir.clone();
      if(shots>1){
        const angle=(i-1)*.18;
        const x=dir.x*Math.cos(angle)-dir.z*Math.sin(angle);
        const z=dir.x*Math.sin(angle)+dir.z*Math.cos(angle);
        dir.set(x,0,z);
      }
      const color=ud.cfg.shotColor||0xbfc5cc;
      const orb=new THREE.Mesh(new THREE.SphereGeometry(ud.boss ? .36 : .25,12,8),new THREE.MeshBasicMaterial({color}));
      orb.position.copy(e.position).add(new THREE.Vector3(0,ud.boss?2.4:1.6,0));
      orb.userData={vel:dir.multiplyScalar(ud.boss?7.4:6.4),life:3,damage:ud.cfg.shotDamage||9};
      scene.add(orb); hostileProjectiles.push(orb);
      burstFX(orb.position,color,6,2.8);
    }
  }

  function damageEnemy(e, amount) {
    if (!e.parent || e.userData.hp <= 0) return;
    e.userData.hp -= amount;
    e.userData.hitTimer = .14;
    updateEnemyBar(e);
    burstFX(e.position.clone().add(new THREE.Vector3(0, e.userData.boss ? 2.4 : 1.3, 0)), e.userData.cfg.aura, e.userData.boss ? 15 : 8, e.userData.boss ? 5 : 3.5);
    sfx('hit');
    if (e.userData.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    const isBoss=e.userData.boss;
    const pos=e.position.clone();
    scene.remove(e);
    const i=enemies.indexOf(e); if(i>=0) enemies.splice(i,1);
    burstFX(pos.clone().add(new THREE.Vector3(0,isBoss?2.2:1.2,0)),isBoss?0xe8edf2:0xb7bec6,isBoss?32:12,isBoss?7:4);
    if(isBoss){
      ui.bossHud.classList.add('hidden');
      if(levelObjective && levelObjective.kind==='boss'){
        levelObjective.progress=1;
        levelObjective.done=true;
        setPortalOpen(true);
        updateObjectiveUI();
        showToast('BOSS DEFEATED — PORTAL OPEN!',1100);
      }
    }
  }

  function evolve() {
    evolved=true;
    maxHp=170;
    hp=maxHp;

    const old=playerModel;
    player.remove(old);
    playerModel=createShadowStalkerModel();
    player.add(playerModel);
    playerGlow.scale.setScalar(1.5);

    ui.formName.textContent='SHADOW STALKER';
    ui.specialBtn.classList.remove('hidden');
    updateHUD();
    ui.evolveBanner.classList.remove('hidden');
    setTimeout(()=>ui.evolveBanner.classList.add('hidden'),1900);
    portalPower=.8;
    for(let n=0;n<4;n++) setTimeout(()=>burstFX(player.position.clone().add(new THREE.Vector3(0,1.4,0)),0xff153f,isTouch?28:40,8),n*150);
    sfx('evolve');
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
    ui.objectiveText.textContent = 'Shadow Stalker crossed all 50 portals and defeated every Ancient Ghastly!';
    showToast('ISLAND SAVED!\n✨ GREAT JOB! ✨', 5000);
    ui.restartBtn.textContent='PLAY AGAIN';
    ui.restartBtn.classList.remove('hidden');
    for (let i = 0; i < 8; i++) setTimeout(() => burstFX(new THREE.Vector3((rand() - .5) * 14, 2 + rand() * 3, -10 + (rand() - .5) * 12), i % 2 ? 0xff244f : 0xffc14d, 24, 8), i * 130);
    sfx('win');
  }

  function loseGame() {
    gameOver = true;
    showToast('DOOM NEEDS A REST!\nTry this level again?', 5000);
    ui.restartBtn.textContent='RETRY LEVEL';
    ui.restartBtn.classList.remove('hidden');
  }

  function restart() {
    if(won){ location.reload(); return; }
    gameOver=false;
    hp=maxHp;
    invulnerable=1;
    ui.restartBtn.classList.add('hidden');
    player.visible=true;
    startLevel(currentLevel);
  }

  function updateHUD() {
    const hearts=6;
    const filled=Math.ceil((hp/maxHp)*hearts);
    ui.hearts.innerHTML='';
    for(let i=0;i<hearts;i++){
      const h=document.createElement('span'); h.className='heart'+(i<filled?' full':''); ui.hearts.appendChild(h);
    }

    ui.levelNumber.textContent=currentLevel;
    if(!evolved){
      const ratio=Math.min(1,Math.max(0,(currentLevel-1)/(EVOLVE_LEVEL-1)));
      ui.energyLabel.textContent='EVOLUTION';
      ui.energyBar.style.width=`${ratio*100}%`;
      ui.energyText.textContent=`LEVEL ${currentLevel} / ${EVOLVE_LEVEL}`;
    }else{
      ui.energyLabel.textContent='SHADOW STALKER';
      ui.energyBar.style.width='100%';
      ui.energyText.textContent='EVOLVED';
    }
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
    const bob = Math.sin(playerBob) * (move.lengthSq() > .01 ? .08 : .035);
    playerModel.position.y = bob;
    if (move.lengthSq() > .001) playerModel.rotation.y = Math.atan2(-move.x, -move.z);
    playerGlow.material.opacity = (evolved ? .24 : .14) + Math.sin(elapsed * 5) * .04;
    player.visible = invulnerable <= 0 || Math.floor(invulnerable * 16) % 2 === 0;

    const anim = playerModel.userData.animated;
    if (anim) {
      const stride = Math.sin(playerBob * 1.2) * (move.lengthSq() > .01 ? .18 : .05);
      anim.armL.rotation.z += (-.9 - stride - anim.armL.rotation.z) * .18;
      anim.armR.rotation.z += (.9 + stride - anim.armR.rotation.z) * .18;
      anim.tail.rotation.z = Math.sin(elapsed * 4.4) * .12;
    }
    for (const o of playerModel.userData.magicOrbs || []) {
      const pulse = 1 + Math.sin(elapsed * 7 + o.position.x) * .08;
      o.scale.setScalar(pulse);
      for (const r of o.userData.rings || []) r.rotation.z += dt * (r === o.userData.rings[0] ? 2.1 : -1.6);
    }

    updateProjectiles(dt);
    updateEnemies(dt);
    updateAdventure(dt);
    updateEnemySpawning(dt);
  }

  function updateEnemySpawning(dt){
    if(levelTransition||gameOver) return;
    enemySpawnTimer-=dt;
    if(enemySpawnTimer<=0){
      spawnRoamingEnemy(Math.floor(elapsed*3)%17);
      enemySpawnTimer=Math.max(1.6,4.0-currentLevel*.035);
    }
  }

  function updateAdventure(dt){
    if(levelTransition||gameOver) return;

    for(const item of levelItems){
      if(item.done) continue;
      if(item.kind==='objective'){
        item.group.rotation.y += dt * (item.subkind==='key'?1.6:.35);
        const d=horizontalDistance(player.position,item.group.position);
        if(d<1.2) objectiveItemCollected(item);
      }else if(item.kind==='treasure'){
        item.gem.rotation.y+=dt*2.1;
        item.gem.position.y=1+Math.sin(elapsed*4)*.08;
        const d=horizontalDistance(player.position,item.group.position);
        if(d<1.2){
          item.done=true;
          item.group.visible=false;
          hp=Math.min(maxHp,hp+Math.ceil(maxHp*.25));
          updateHUD();
          showToast('TREASURE FOUND! + HEALTH',850);
          burstFX(item.group.position.clone().add(new THREE.Vector3(0,.8,0)),0xffcf55,18,5);
          sfx('pickup');
        }
      }
    }

    if(exitPortal){
      const ud=exitPortal.userData;
      ud.ring1.rotation.z+=dt*(portalOpen?1.8:.35);
      ud.ring2.rotation.z-=dt*(portalOpen?1.25:.25);
      ud.disc.material.opacity=(portalOpen ? .55 : .22)+Math.sin(elapsed*4)*.05;
      ud.beacon.scale.y=.9+Math.sin(elapsed*5)*.12;
      const d=horizontalDistance(player.position,exitPortal.position);
      if(portalOpen && d<1.35) completeLevel();
    }
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
      const ud=e.userData;
      ud.hitTimer=Math.max(0,ud.hitTimer-dt);
      ud.contactTimer=Math.max(0,ud.contactTimer-dt);
      ud.attackTimer-=dt;
      ud.chargeCooldown-=dt;
      ud.chargeTimer=Math.max(0,ud.chargeTimer-dt);

      if(ud.boss && e.scale.x<.995){
        const sc=THREE.MathUtils.lerp(e.scale.x,1,1-Math.pow(.0001,dt));
        e.scale.setScalar(sc);
      }

      const toPlayer=player.position.clone().sub(e.position); toPlayer.y=0;
      const d=toPlayer.length();
      const dir=toPlayer.lengthSq()>.001?toPlayer.clone().normalize():new THREE.Vector3(0,0,1);

      if(ud.cfg.charge && ud.chargeCooldown<=0 && d>2 && d<8){
        ud.chargeTimer=.55;
        ud.chargeCooldown=2.0+rand()*1.1;
        burstFX(e.position.clone().add(new THREE.Vector3(0,1.1,0)),0xd0b36e,8,3);
      }

      let moveDir=new THREE.Vector3();
      if(ud.cfg.ranged){
        const desired=ud.cfg.range||5.5;
        if(d>desired+1) moveDir.copy(dir);
        else if(d<desired-1.1) moveDir.copy(dir).multiplyScalar(-1);
        else moveDir.set(-dir.z,0,dir.x).multiplyScalar(Math.sin(elapsed*.9+ud.phase)>0?1:-1);
      }else if(d>(ud.boss?2.7:1.1)){
        moveDir.copy(dir);
        moveDir.add(new THREE.Vector3(-dir.z,0,dir.x).multiplyScalar(Math.sin(elapsed*.9+ud.phase)*.28)).normalize();
      }

      if(moveDir.lengthSq()>.001){
        const speedBoost=ud.chargeTimer>0?2.45:1;
        e.position.addScaledVector(moveDir.normalize(),ud.speed*speedBoost*dt);
      }

      if(d<(ud.boss?2.5:1.0) && ud.contactTimer<=0){
        damagePlayer(ud.damage);
        ud.contactTimer=.82;
      }

      if(ud.cfg.ranged && ud.attackTimer<=0 && d<12){
        enemyShot(e);
        ud.attackTimer=(ud.cfg.shotEvery||2)+rand()*.45;
      }

      const floatBase=ud.boss?1.1:.72;
      e.position.y=floatBase+Math.sin(elapsed*2.2+ud.phase)*(ud.boss ? .2 : .27);
      ud.model.rotation.y=Math.atan2(-toPlayer.x,-toPlayer.z);
      const ghAnim=ud.model.userData.animated;
      if(ghAnim){
        const frantic=ud.chargeTimer>0?2.2:1;
        ghAnim.armL.rotation.z=-.8+Math.sin(elapsed*3*frantic+ud.phase)*.16;
        ghAnim.armR.rotation.z=.8-Math.sin(elapsed*3*frantic+ud.phase)*.16;
        ghAnim.tail.rotation.z=Math.sin(elapsed*2.1+ud.phase)*.12;
        ghAnim.wisp.rotation.z=-.45+Math.sin(elapsed*2.8+ud.phase)*.2;
      }
      if(ud.model.userData.magicOrb){
        const mo=ud.model.userData.magicOrb;
        mo.rotation.y+=dt*2;
        for(const r of mo.userData.rings||[]) r.rotation.z+=dt*1.8;
      }
      ud.model.traverse(o=>{ if(o.userData.spin) o.rotation.z+=dt*o.userData.spin; });
      const hitPulse=ud.hitTimer>0?1.1:1;
      ud.model.scale.setScalar(ud.modelScale*hitPulse);
      ud.aura.rotation.z+=dt*(ud.boss?1.3:.65);
      ud.aura.material.opacity=(ud.boss ? .25 : .1)+Math.sin(elapsed*4+ud.phase)*.04;
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
  // iOS/iPad Safari can still try to pan or rubber-band the page even when
  // touch-action:none is set. Lock touch gestures at the document level while
  // the game is open so joystick/button drags never scroll the page.
  const stopTouchScroll = (e) => {
    if (e.cancelable) e.preventDefault();
  };
  document.addEventListener('touchstart', stopTouchScroll, { passive: false });
  document.addEventListener('touchmove', stopTouchScroll, { passive: false });
  document.addEventListener('gesturestart', stopTouchScroll, { passive: false });
  document.addEventListener('gesturechange', stopTouchScroll, { passive: false });
  document.addEventListener('gestureend', stopTouchScroll, { passive: false });
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  startGame();
})();