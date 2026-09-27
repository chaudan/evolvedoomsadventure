const fs=require('fs');
let s=fs.readFileSync('game.js','utf8');
const a=s.indexOf('  function createDoomModel()');const b=s.indexOf('  function createGhastlyModel(',a);
s=s.slice(0,a)+`  function createDoomModel() { return window.createBlenderCharacter('doom'); }
  function createShadowStalkerModel() { return window.createBlenderCharacter('shadow-stalker'); }

`+s.slice(b);
const c=s.indexOf('  function buildWorld()');const d=s.indexOf('  function addPalm(',c);
s=s.slice(0,c)+`  function buildWorld() {
    const water=addMesh(new THREE.CircleGeometry(450,64),standard(0x357e9b,{roughness:.65}),root,false,false);
    water.rotation.x=-Math.PI/2;water.position.y=-2.3;
  }

`+s.slice(d);
const e=s.indexOf('  function routeForLevel(');const f=s.indexOf('  function startLevel(',e);
s=s.slice(0,e)+`  function objectiveCount(level) {
    if(isBossLevel(level)) return 0;
    if(level<=10) return forestLevels[level-1][3].length;
    return ['relics','runes','key','explore'][(level-1)%4]==='key'?1:3;
  }
  function routeForLevel(level) {
    return worldLayout && currentLevel===level ? worldLayout : window.DoomWorld.generate(level,objectiveCount(level));
  }

`+s.slice(f);
const g=s.indexOf('  function setupLevelScenery(');const h=s.indexOf('  function createExitPortal(',g);
s=s.slice(0,g)+`  function setupLevelScenery(level,route) {
    const radius=route.radius;
    const land=part(adventureLayer,new THREE.CylinderGeometry(radius+2,radius-2,3,72),mats.soil,[0,-1.4,0]);
    part(adventureLayer,new THREE.CircleGeometry(radius+2,72),mats.grass2,[0,.15,0],[1,1,1],[-Math.PI/2,0,0]);
    land.receiveShadow=true;
    const trailMaterial=standard(level<=10?0xa5996e:0x8a8d80);
    // Connected, winding paths with generous clear space, including treasure branches.
    for(const [a,b] of route.paths) {
      const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
      const path=part(adventureLayer,new THREE.PlaneGeometry(3.5,length+.8),trailMaterial,[(a[0]+b[0])/2,.17,(a[1]+b[1])/2],[1,1,1],[-Math.PI/2,0,0],false);
      path.rotation.z=-Math.atan2(b[0]-a[0],b[1]-a[1]);
    }
    const grove=new THREE.Group();adventureLayer.add(grove);
    const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.3,.6,4.5,7),mats.wood,route.trees.length);
    const crowns=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.2,1),mats.leaves,route.trees.length);
    const tops=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.55,0),mats.leavesLight,route.trees.length);
    treeBatches=[trunk,crowns,tops];
    for(const batch of treeBatches){batch.castShadow=true;batch.receiveShadow=true;grove.add(batch);}
    const dummy=new THREE.Object3D();treeMatrices=[[],[],[]];
    route.trees.forEach((tree,i)=>{
      [[2.35,1,1],[5.4,1,1.12],[7,.9,1]].forEach(([height,width,tall],j)=>{
        dummy.position.set(tree.x,.15+height*tree.scale,tree.z);dummy.rotation.set(0,tree.rotation,0);
        dummy.scale.set(tree.scale*width,tree.scale*tall,tree.scale*width);dummy.updateMatrix();
        treeMatrices[j].push(dummy.matrix.clone());treeBatches[j].setMatrixAt(i,dummy.matrix);
      });
    });
    for(const batch of treeBatches){batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();}
    for(const ruin of route.ruins){
      const obj=new THREE.Group();obj.position.set(ruin.x,.2,ruin.z);obj.rotation.y=ruin.rotation;adventureLayer.add(obj);
      obj.userData.solidRadius=1.4;
      part(obj,new THREE.BoxGeometry(1.1,4.7,1.1),mats.ruin,[-1,2.3,0]);
      part(obj,new THREE.BoxGeometry(1.1,3.4,1.1),mats.ruin,[1,1.7,0]);
      part(obj,new THREE.BoxGeometry(3.2,.7,1.2),mats.ruinDark,[0,4.4,0],[1,1,1],[0,0,.13]);
      cameraObstacles.push(obj);
    }
    // Distant hills give a larger world a horizon without expensive terrain physics.
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6+level*.17,r=radius+12+(i%3)*5;
      part(adventureLayer,new THREE.IcosahedronGeometry(9+i%3*2,1),i%2?mats.rock:mats.grass,[Math.cos(a)*r,-2,Math.sin(a)*r],[1.4,.6+i%3*.2,1.3]);
    }
    for(const p of route.objectives) {
      const beacon=part(adventureLayer,new THREE.CylinderGeometry(.11,.11,5,6),basic(0xffd36b,.48),[p[0],3,p[1]],[1,1,1],[0,0,0],false);
      beacon.userData.objectiveBeacon=true;
    }
    for(const p of route.treasures) createTreasure(p);
  }

  function createTreasure(p) {
    const chest=new THREE.Group();chest.position.set(p[0],.35,p[1]);adventureLayer.add(chest);
    part(chest,new THREE.BoxGeometry(1.1,.6,.75),mats.wood,[0,.3,0]);
    part(chest,new THREE.BoxGeometry(1.14,.2,.79),mats.gold,[0,.66,0]);
    const gem=part(chest,new THREE.OctahedronGeometry(.16,0),standard(0xffc34d,{emissive:0xff9a1e,emissiveIntensity:2.4}),[0,1,0],[1,1,1],[0,0,0],false);
    levelItems.push({kind:'treasure',group:chest,gem,done:false});
  }

`+s.slice(h);
fs.writeFileSync('game.js',s);
