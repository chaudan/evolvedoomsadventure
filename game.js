const mount = document.getElementById("game");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91c9e9);
scene.fog = new THREE.FogExp2(0x91c9e9, 0.018);

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 180);
camera.position.set(0, 10, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
mount.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xdff6ff, 0x365a3a, 2.2);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff3d8, 3.3);
sun.position.set(-10, 18, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 28;
sun.shadow.camera.bottom = -28;
scene.add(sun);

const root = new THREE.Group();
scene.add(root);

const islandMat = new THREE.MeshStandardMaterial({ color: 0x68a84f, roughness: .95 });
const dirtMat = new THREE.MeshStandardMaterial({ color: 0x7d5d3c, roughness: 1 });
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x66717a, roughness: .88 });
const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x343944, roughness: .9 });

function mesh(geo, mat, parent=root) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

const island = mesh(new THREE.CylinderGeometry(25, 20, 2.2, 48, 2), dirtMat);
island.position.y = -1.4;
const grass = mesh(new THREE.CylinderGeometry(24.6, 24.6, .5, 48), islandMat);
grass.position.y = -.15;

for (let i=0;i<34;i++){
  const a=Math.random()*Math.PI*2, r=17+Math.random()*6;
  const rock=mesh(new THREE.DodecahedronGeometry(.45+Math.random()*.75,0),Math.random()>.5?stoneMat:darkStoneMat);
  rock.position.set(Math.cos(a)*r,.2,Math.sin(a)*r);
  rock.rotation.set(Math.random(),Math.random(),Math.random());
  rock.scale.y=.6+Math.random()*.8;
}
for (let i=0;i<18;i++){
  const a=Math.random()*Math.PI*2, r=9+Math.random()*12;
  const trunk=mesh(new THREE.CylinderGeometry(.18,.28,1.6,7),new THREE.MeshStandardMaterial({color:0x6a432b}));
  trunk.position.set(Math.cos(a)*r,.8,Math.sin(a)*r);
  const crown=mesh(new THREE.ConeGeometry(1.05,2.5,7),new THREE.MeshStandardMaterial({color:0x2e7a43}));
  crown.position.copy(trunk.position).add(new THREE.Vector3(0,1.65,0));
}
for(let i=-2;i<=2;i++){
  const p=mesh(new THREE.BoxGeometry(1.5,1.4,1.1),stoneMat);
  p.position.set(i*2.6,.55,-19.4);
}
const archL=mesh(new THREE.BoxGeometry(2.2,5.5,2),darkStoneMat); archL.position.set(-4.1,2.45,-20.2);
const archR=mesh(new THREE.BoxGeometry(2.2,5.5,2),darkStoneMat); archR.position.set(4.1,2.45,-20.2);
const archT=mesh(new THREE.BoxGeometry(10.4,1.6,2),darkStoneMat); archT.position.set(0,5.2,-20.2);

function createDoom() {
  const g = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({color:0x0b101a,roughness:.7});
  const charcoal = new THREE.MeshStandardMaterial({color:0x161c27,roughness:.65});
  const red = new THREE.MeshStandardMaterial({color:0xff163d,emissive:0x740018,emissiveIntensity:1.9});
  const body=mesh(new THREE.SphereGeometry(.7,18,14),black,g); body.scale.set(.8,1.05,.72);
  const head=mesh(new THREE.SphereGeometry(.57,18,14),charcoal,g); head.position.y=.86;
  const earGeo=new THREE.ConeGeometry(.28,.85,5);
  const ear1=mesh(earGeo,black,g); ear1.position.set(-.37,1.48,0); ear1.rotation.z=-.22;
  const ear2=mesh(earGeo,black,g); ear2.position.set(.37,1.48,0); ear2.rotation.z=.22;
  const eyeGeo=new THREE.SphereGeometry(.1,10,8);
  const e1=mesh(eyeGeo,red,g); e1.position.set(-.2,.93,.5); e1.scale.set(1.5,.7,.5);
  const e2=e1.clone(); e2.position.x=.2; g.add(e2);
  const tail=mesh(new THREE.ConeGeometry(.16,1.25,7),black,g); tail.position.set(0,.25,-.78); tail.rotation.x=-.85;
  for(const x of [-.46,.46]){
    const arm=mesh(new THREE.CapsuleGeometry(.12,.65,5,8),black,g); arm.position.set(x,.25,0); arm.rotation.z=x>0?-.55:.55;
    const leg=mesh(new THREE.CapsuleGeometry(.14,.48,5,8),black,g); leg.position.set(x*.62,-.73,0);
  }
  g.userData.redMat=red;
  return g;
}

function createShadowStalker() {
  const g=createDoom();
  g.scale.setScalar(1.35);
  const red=new THREE.MeshStandardMaterial({color:0xff173e,emissive:0xb80024,emissiveIntensity:2.6});
  const hornGeo=new THREE.ConeGeometry(.17,.72,5);
  for(const x of [-.42,0,.42]){
    const h=mesh(hornGeo,red,g); h.position.set(x,1.55,.08); h.rotation.z=x*.42;
  }
  const clawMat=new THREE.MeshStandardMaterial({color:0x121722,roughness:.5});
  for(const x of [-.72,.72]){
    const claw=mesh(new THREE.ConeGeometry(.12,.65,5),clawMat,g);
    claw.position.set(x,.18,.18); claw.rotation.z=x>0?-1.3:1.3;
  }
  const tailTip=mesh(new THREE.ConeGeometry(.28,.72,4),red,g); tailTip.position.set(0,.18,-1.05); tailTip.rotation.x=1.28;
  return g;
}

let player = createDoom();
scene.add(player);
player.position.set(0,0,8);

const keys = new Set();
const justPressed = new Set();
addEventListener("keydown",e=>{
  const code=e.code;
  if(!keys.has(code)) justPressed.add(code);
  keys.add(code);
  if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(code)) e.preventDefault();
});
addEventListener("keyup",e=>keys.delete(e.code));

document.querySelectorAll("#touchControls button[data-key]").forEach(btn=>{
  const k=btn.dataset.key;
  const down=e=>{e.preventDefault(); if(!keys.has(k)) justPressed.add(k); keys.add(k)};
  const up=e=>{e.preventDefault(); keys.delete(k)};
  btn.addEventListener("pointerdown",down);
  btn.addEventListener("pointerup",up);
  btn.addEventListener("pointercancel",up);
  btn.addEventListener("pointerleave",up);
});

let hp=100,maxHp=100, energy=0, evolved=false, gameOver=false, won=false;
let attackCooldown=0, dashCooldown=0, dashTime=0, invuln=0, burstCooldown=0;
let bossSpawned=false,boss=null;
const projectiles=[], enemies=[], particles=[], pickups=[];

const healthBar=document.getElementById("healthBar");
const healthText=document.getElementById("healthText");
const energyBar=document.getElementById("energyBar");
const energyText=document.getElementById("energyText");
const formName=document.getElementById("formName");
const objective=document.getElementById("objective");
const msg=document.getElementById("message");
const bossBanner=document.getElementById("bossBanner");

function updateHUD(){
  healthBar.style.width=(hp/maxHp*100)+"%";
  healthText.textContent=Math.ceil(hp)+" / "+maxHp;
  energyBar.style.width=(Math.min(energy,8)/8*100)+"%";
  energyText.textContent=Math.min(energy,8)+" / 8";
}

function showMessage(text, ms=1500){
  msg.textContent=text; msg.classList.remove("hidden");
  clearTimeout(showMessage.t); showMessage.t=setTimeout(()=>msg.classList.add("hidden"),ms);
}

function evolve(){
  if(evolved) return;
  evolved=true;
  const pos=player.position.clone(), rot=player.rotation.y;
  scene.remove(player);
  player=createShadowStalker(); scene.add(player);
  player.position.copy(pos); player.rotation.y=rot;
  maxHp=150; hp=Math.min(maxHp,hp+70);
  formName.textContent="SHADOW STALKER";
  document.getElementById("specialHint").classList.remove("hidden");
  document.getElementById("touchSpecial").classList.remove("hidden");
  showMessage("EVOLUTION! SHADOW STALKER!",2200);
  burstFX(player.position,0xff174c,48,7);
  updateHUD();
  setTimeout(spawnBoss,1600);
}

function createGhastly(scale=1,bossy=false){
  const g=new THREE.Group();
  const ghostMat=new THREE.MeshStandardMaterial({
    color:bossy?0x7a163c:0xe9efff,
    emissive:bossy?0x6d082f:0x5060a0,
    emissiveIntensity:bossy?1.7:.55,
    transparent:true,opacity:.9,roughness:.35
  });
  const head=mesh(new THREE.SphereGeometry(.65*scale,16,12),ghostMat,g);
  head.position.y=.7*scale;
  const body=mesh(new THREE.ConeGeometry(.62*scale,1.45*scale,10),ghostMat,g);
  body.position.y=-.15*scale;
  body.rotation.x=Math.PI;
  const eyeMat=new THREE.MeshStandardMaterial({color:0xff1745,emissive:0xff0033,emissiveIntensity:2.8});
  for(const x of [-.22,.22]){
    const eye=mesh(new THREE.SphereGeometry(.08*scale,8,6),eyeMat,g);
    eye.position.set(x*scale,.78*scale,.57*scale);
  }
  const mouth=mesh(new THREE.TorusGeometry(.16*scale,.045*scale,6,12,Math.PI),eyeMat,g);
  mouth.position.set(0,.52*scale,.61*scale); mouth.rotation.x=Math.PI/2; mouth.rotation.z=Math.PI;
  g.userData={hp:bossy?16:2,boss:bossy, speed:bossy?1.4:1.8+Math.random()*.6, hit:0};
  scene.add(g);
  return g;
}

function spawnGhastly(i){
  const e=createGhastly();
  const a=(i/enemyTarget)*Math.PI*2 + Math.random()*.35;
  const r=10+Math.random()*9;
  e.position.set(Math.cos(a)*r,1.15,Math.sin(a)*r);
  enemies.push(e);
}
const enemyTarget=8;
for(let i=0;i<enemyTarget;i++)spawnGhastly(i);

function spawnBoss(){
  if(bossSpawned) return;
  bossSpawned=true;
  boss=createGhastly(2.1,true);
  boss.position.set(0,2,-16.3);
  enemies.push(boss);
  bossBanner.classList.remove("hidden");
  setTimeout(()=>bossBanner.classList.add("hidden"),2400);
  objective.textContent="Defeat the Ancient Ghastly!";
}

function shoot(){
  if(attackCooldown>0||gameOver)return;
  attackCooldown=evolved?.22:.32;
  const dir=new THREE.Vector3(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y));
  const mat=new THREE.MeshStandardMaterial({color:0xff1648,emissive:0xff002d,emissiveIntensity:4});
  const orb=mesh(new THREE.SphereGeometry(evolved?.28:.21,12,8),mat,scene);
  orb.position.copy(player.position).add(new THREE.Vector3(0,evolved?1.25:.82,0)).addScaledVector(dir,.9);
  orb.userData={vel:dir.multiplyScalar(evolved?14:11),life:1.7,damage:evolved?2:1};
  projectiles.push(orb);
  burstFX(orb.position,0xff1648,5,1.6);
}

function shadowBurst(){
  if(!evolved||burstCooldown>0||gameOver)return;
  burstCooldown=3.2;
  burstFX(player.position,0xff1247,70,11);
  for(const e of [...enemies]){
    if(e.position.distanceTo(player.position)<6.5) damageEnemy(e,4);
  }
}

function burstFX(pos,color,count=18,speed=4){
  for(let i=0;i<count;i++){
    const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:1});
    const p=new THREE.Mesh(new THREE.SphereGeometry(.05+Math.random()*.09,5,4),mat);
    p.position.copy(pos).add(new THREE.Vector3((Math.random()-.5)*.7,Math.random()*1.2,(Math.random()-.5)*.7));
    const v=new THREE.Vector3(Math.random()-.5,Math.random()*.7+.15,Math.random()-.5).normalize().multiplyScalar(speed*(.45+Math.random()));
    p.userData={v,life:.45+Math.random()*.45};
    scene.add(p); particles.push(p);
  }
}

function dropEnergy(pos){
  const mat=new THREE.MeshStandardMaterial({color:0xff184c,emissive:0xff0038,emissiveIntensity:3});
  const o=mesh(new THREE.OctahedronGeometry(.28,0),mat,scene);
  o.position.copy(pos); o.position.y=.55;
  o.userData={t:0}; pickups.push(o);
}

function damageEnemy(e,amt){
  if(!enemies.includes(e))return;
  e.userData.hp-=amt; e.userData.hit=.12;
  burstFX(e.position,0xff184c,e.userData.boss?16:8,e.userData.boss?5:3);
  if(e.userData.hp<=0){
    const wasBoss=e.userData.boss;
    scene.remove(e);
    enemies.splice(enemies.indexOf(e),1);
    if(wasBoss){
      won=true; gameOver=true;
      objective.textContent="Island saved!";
      showMessage("YOU DEFEATED THE ANCIENT GHASTLY!\nPress R to play again",5000);
      for(let i=0;i<12;i++)setTimeout(()=>burstFX(new THREE.Vector3((Math.random()-.5)*10,2+Math.random()*3,-10+(Math.random()-.5)*7),0xff2255,28,8),i*130);
    }else dropEnergy(e.position);
  }
}

function damagePlayer(amt){
  if(invuln>0||gameOver)return;
  hp-=amt; invuln=.7;
  burstFX(player.position,0xffffff,12,4);
  updateHUD();
  if(hp<=0){
    hp=0; gameOver=true;
    updateHUD();
    showMessage("DOOM NEEDS A REST!\nPress R to try again",5000);
  }
}

function restart(){ location.reload(); }

function clampIsland(v){
  const r=Math.hypot(v.x,v.z);
  if(r>22){v.x*=22/r;v.z*=22/r;}
}

const clock=new THREE.Clock();
function tick(){
  requestAnimationFrame(tick);
  const dt=Math.min(clock.getDelta(),.033);
  if(justPressed.has("KeyR")&&gameOver) restart();
  if(!gameOver){
    attackCooldown=Math.max(0,attackCooldown-dt);
    dashCooldown=Math.max(0,dashCooldown-dt);
    dashTime=Math.max(0,dashTime-dt);
    invuln=Math.max(0,invuln-dt);
    burstCooldown=Math.max(0,burstCooldown-dt);

    if(justPressed.has("Space"))shoot();
    if(justPressed.has("KeyE"))shadowBurst();
    if((justPressed.has("ShiftLeft")||justPressed.has("ShiftRight"))&&dashCooldown<=0){dashTime=.22;dashCooldown=.8;}

    const move=new THREE.Vector3(
      (keys.has("KeyD")||keys.has("ArrowRight")?1:0)-(keys.has("KeyA")||keys.has("ArrowLeft")?1:0),
      0,
      (keys.has("KeyS")||keys.has("ArrowDown")?1:0)-(keys.has("KeyW")||keys.has("ArrowUp")?1:0)
    );
    if(move.lengthSq()>0){
      move.normalize();
      const speed=(evolved?6.1:5.2)*(dashTime>0?2.35:1);
      player.position.addScaledVector(move,speed*dt);
      player.rotation.y=Math.atan2(move.x,move.z);
      player.position.y=Math.sin(performance.now()*.009)*(move.lengthSq()?0.05:0);
      clampIsland(player.position);
    }else player.position.y*=.8;

    for(const p of [...projectiles]){
      p.position.addScaledVector(p.userData.vel,dt);
      p.userData.life-=dt;
      if(p.userData.life<=0){scene.remove(p);projectiles.splice(projectiles.indexOf(p),1);continue;}
      for(const e of [...enemies]){
        const hitR=e.userData.boss?1.8:.9;
        if(p.position.distanceTo(e.position)<hitR){
          damageEnemy(e,p.userData.damage);
          scene.remove(p); projectiles.splice(projectiles.indexOf(p),1); break;
        }
      }
    }

    for(const e of [...enemies]){
      if(!enemies.includes(e))continue;
      const toP=player.position.clone().sub(e.position); toP.y=0;
      const d=toP.length();
      if(d>1.1){
        toP.normalize(); e.position.addScaledVector(toP,e.userData.speed*dt);
        e.rotation.y=Math.atan2(toP.x,toP.z);
      }else damagePlayer(e.userData.boss?22:10);
      const base=e.userData.boss?2:1.15;
      e.position.y=base+Math.sin(performance.now()*.003+(e.id%10))*0.28;
      if(e.userData.hit>0){e.userData.hit-=dt;e.scale.setScalar(1.08)} else e.scale.lerp(new THREE.Vector3(1,1,1),.18);
    }

    for(const o of [...pickups]){
      o.userData.t+=dt; o.rotation.y+=dt*2.2; o.position.y=.65+Math.sin(o.userData.t*5)*.15;
      if(o.position.distanceTo(player.position)<1.35){
        scene.remove(o); pickups.splice(pickups.indexOf(o),1);
        energy++; updateHUD();
        burstFX(player.position,0xff174c,18,5);
        if(energy>=8) evolve();
      }
    }
  }

  for(const p of [...particles]){
    p.position.addScaledVector(p.userData.v,dt);
    p.userData.v.y-=4*dt; p.userData.life-=dt; p.material.opacity=Math.max(0,p.userData.life*1.6);
    if(p.userData.life<=0){scene.remove(p);particles.splice(particles.indexOf(p),1);}
  }

  const camTarget=player.position.clone().add(new THREE.Vector3(0,0,-1.4));
  const desired=player.position.clone().add(new THREE.Vector3(0,8.5,12.5));
  camera.position.lerp(desired,1-Math.pow(.001,dt));
  camera.lookAt(camTarget);

  justPressed.clear();
  renderer.render(scene,camera);
}

updateHUD();
showMessage("DOOM'S ADVENTURE!",1300);
tick();

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight);
});
