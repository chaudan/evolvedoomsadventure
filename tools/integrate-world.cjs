const fs=require('fs');let s=fs.readFileSync('game.js','utf8');
function replace(a,b){if(!s.includes(a))throw Error('Missing '+a);s=s.replace(a,b);}
replace('new THREE.Fog(0x8dc9e8, 25, 70)','new THREE.Fog(0x8dc9e8, 65, 185)');
replace('0.1, 130)','0.1, 330)');
replace('  let player;',`  let player;
  let worldLayout=null, treeBatches=[], treeMatrices=[], cameraObstacles=[];
  let storyOrigin=new THREE.Vector3(), navigationTimer=0;
  const hiddenTrees=new Set();
  const hiddenTreeMatrix=new THREE.Matrix4().makeScale(0,0,0);`);
replace('  document.body.appendChild(pauseButton);',`  document.body.appendChild(pauseButton);
  const trailMap=document.createElement('div');trailMap.className='trail-map';
  document.body.appendChild(trailMap);`);
replace('if(evolved){player.remove(playerModel);playerModel=createDoomModel();','if(evolved){player.remove(playerModel);disposeObject(playerModel);playerModel=createDoomModel();');
replace('player.position.set(0,.3,8);player.visible=true;',`player.position.set(worldLayout.start[0],.3,worldLayout.start[1]);player.visible=true;
    storyOrigin.copy(player.position);playerModel.rotation.y=Math.PI;
    camera.position.copy(storyOrigin).add(new THREE.Vector3(7,4.5,9));updateCamera(1);`);
replace('storyActors=[];playerModel.rotation.z=0;playLevel(1);','storyActors=[];playerModel.rotation.z=0;playerModel.rotation.y=0;playerModel.scale.setScalar(1);playLevel(1);');
replace('actor.position.set(Math.sin(a)*radius,1+Math.sin(storyTime*3+i)*.2,8+Math.cos(a)*radius);','actor.position.set(storyOrigin.x+Math.sin(a)*radius,1+Math.sin(storyTime*3+i)*.2,storyOrigin.z+Math.cos(a)*radius);');
replace('actor.rotation.y=Math.atan2(actor.position.x,actor.position.z-8);','actor.rotation.y=Math.atan2(actor.position.x-storyOrigin.x,actor.position.z-storyOrigin.z);');
replace('    setChapterTheme(level);','    setChapterTheme(level);\n    worldLayout=window.DoomWorld.generate(level,objectiveCount(level));');
replace('    setupLevelObjective(level);','    setupLevelObjective(level);\n    updateNavigation();\n    camera.position.copy(player.position).add(new THREE.Vector3(0,7,11));');
replace('  function clearAdventureLayer(){','  function clearAdventureLayer(){\n    treeBatches=[];treeMatrices=[];cameraObstacles=[];hiddenTrees.clear();');
replace('const child=adventureLayer.children.pop();','const child=adventureLayer.children[adventureLayer.children.length-1];\n      adventureLayer.remove(child);');
replace('const p=authored?authored[3][i]:chooseAdventurePoint(level,i,used);','const p=worldLayout.objectives[i];');
replace('    const count=isBossLevel(level)?2:Math.min(4,2+Math.floor(level/18));\n    for(let i=0;i<count;i++) spawnRoamingEnemy(i);',`    const pool=poolForLevel(level);
    for(const p of worldLayout.encounters) spawnGhastly(p.x,p.z,pool[p.type%pool.length],p.x*.1);`);
const a=s.indexOf('    for(let j=0;j<LEVEL_SPAWNS.length;j++){',s.indexOf('  function spawnRoamingEnemy'));const b=s.indexOf('    spawnGhastly(p[0]',a);
s=s.slice(0,a)+`    for(let j=0;j<12;j++){
      const a=(seedOffset+j)*2.399;
      const candidate=[player.position.x+Math.cos(a)*17,player.position.z+Math.sin(a)*17];
      if(Math.hypot(...candidate)<worldLayout.radius-5 && !worldLayout.trees.some(t=>Math.hypot(t.x-candidate[0],t.z-candidate[1])<2)){
        p=candidate;break;
      }
    }
    if(!p) return;
`+s.slice(b);
replace('const bx=(route.exit[0]*.66);','const bx=route.boss[0];');replace('const bz=(route.exit[1]*.66);','const bz=route.boss[1];');
replace('    player.remove(old);','    player.remove(old);\n    disposeObject(old);');
replace('    for (const o of playerModel.userData.magicOrbs || []) {',`    const joints=playerModel.userData.joints;
    if(joints){
      const walking=move.lengthSq()>.01,stride=Math.sin(playerBob)*(walking?.40:.025);
      joints.leg_l.rotation.x=stride;joints.leg_r.rotation.x=-stride;
      joints.arm_l.rotation.x=-stride*.4;joints.arm_r.rotation.x=stride*.4;
      joints.tail.rotation.y=Math.sin(elapsed*3)*.13;
      joints.head.rotation.z=Math.sin(elapsed*1.5)*.025;
    }
    for (const o of playerModel.userData.magicOrbs || []) {`);
replace('    updateEnemySpawning(dt);','    updateEnemySpawning(dt);\n    navigationTimer-=dt;if(navigationTimer<=0){updateNavigation();navigationTimer=.2;}');
replace('  function clampPlayer() {',`  function clampPlayer() {
    for(const tree of worldLayout.trees) {
      const dx=player.position.x-tree.x,dz=player.position.z-tree.z,d=Math.hypot(dx,dz),r=tree.scale*.6+.45;
      if(d<r){player.position.x=tree.x+(d?dx/d:1)*r;player.position.z=tree.z+(d?dz/d:0)*r;}
    }`);
replace('    if (r > 22.4) { player.position.x *= 22.4 / r; player.position.z *= 22.4 / r; }\n    player.position.z = THREE.MathUtils.clamp(player.position.z, -18.7, 18.7);',`    const limit=worldLayout.radius;
    if(r>limit){player.position.x*=limit/r;player.position.z*=limit/r;}`);
fs.writeFileSync('game.js',s);
