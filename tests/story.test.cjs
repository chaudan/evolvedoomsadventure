'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const THREE=require('../vendor/three.min.js');
const DoomWorld=require('../world-generator.js');
class Element {
  constructor(){this.style={};this.children=[];this.nodes={};this.events={};this.classList={add(){},remove(){}};}
  appendChild(e){this.children.push(e);return e;}
  replaceChildren(){this.children=[];}
  querySelector(s){return this.nodes[s]??=new Element();}
  addEventListener(name,fn){this.events[name]=fn;}
  remove(){}
}
function game(saved,blocked=false){
 const elements={},body=new Element(),timers=[];
 const storage=new Map(saved?[['dooms-adventure-story-v1',JSON.stringify(saved)]]:[]);
 class Renderer {constructor(){this.domElement=new Element();this.shadowMap={};}setPixelRatio(){}setSize(){}render(){}}
 const stubCharacter=()=>{const g=new THREE.Group();g.userData={animated:{armL:{rotation:{z:0}},armR:{rotation:{z:0}},tail:{rotation:{z:0}}},magicOrbs:[]};return g;};
 const context=vm.createContext({console,performance,Math,Set,window:{THREE:{...THREE,WebGLRenderer:Renderer},createBlenderCharacter:stubCharacter,DoomWorld},
 document:{body,hidden:false,getElementById:id=>elements[id]??=new Element(),createElement:()=>new Element(),querySelector:s=>elements[s]??=new Element(),querySelectorAll:()=>[],addEventListener(){}},
 navigator:{maxTouchPoints:5},matchMedia:()=>({matches:false}),innerWidth:1024,innerHeight:768,devicePixelRatio:2,
 addEventListener(){},requestAnimationFrame(){},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},
 localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return storage.get(k)||null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');storage.set(k,v);}}});
 const source=fs.readFileSync(require.resolve('../game.js'),'utf8').replace('  startGame();',`  globalThis.gameTest={startGame,playLevel,beginStory,finishStory,updateStory,pauseGame,updateGame,damageEnemy,updateLeafBoss,objectiveItemCollected,menu,restart,damagePlayer,
 state:()=>({mode,currentLevel,evolved,hp,maxHp,saved,storageAvailable,boss,levelItems,portalOpen,enemies,player,storyActors,levelTransition}),panel};\n  startGame();`);
 vm.runInContext(source,context);
 return {api:context.gameTest,storage,timers};
}
test('loading preserves saved progress; Continue resumes without cutscene',()=>{
 const {api,storage}=game({level:8});assert.equal(api.state().saved.level,8);assert.equal(JSON.parse(storage.values().next().value).level,8);
 api.playLevel(8);assert.equal(api.state().mode,'play');assert.equal(api.state().currentLevel,8);
});
test('new adventure, cutscene skip, pause and retry',()=>{
 const {api}=game();api.beginStory();assert.equal(api.state().storyActors.length,3);api.updateStory(9);api.finishStory();
 assert.equal(api.state().storyActors.length,0);assert.equal(api.state().mode,'play');api.pauseGame();assert.equal(api.state().mode,'paused');
 api.playLevel(3);api.damagePlayer(999);api.restart();assert.equal(api.state().currentLevel,3);assert.equal(api.state().hp,120);
});
test('all nine authored objectives can open their exit',()=>{
 const {api}=game();for(let level=1;level<=9;level++) {api.playLevel(level);for(const item of api.state().levelItems.filter(i=>i.kind==='objective'))api.objectiveItemCollected(item);assert.equal(api.state().portalOpen,true);}
});
test('Leaf Guardian telegraphs, exposes heart, and unlocks exit',()=>{
 const {api}=game();api.playLevel(10);const boss=api.state().boss;assert.equal(boss.userData.leaf,true);
 api.updateLeafBoss(boss,1.3);assert.equal(boss.userData.warning.visible,true);
 api.state().player.position.set(18,.3,18);api.updateLeafBoss(boss,1.6);assert.equal(boss.userData.warning.visible,false);
 api.updateLeafBoss(boss,.4);assert.ok(boss.userData.heart.material.emissiveIntensity>1);
 api.damageEnemy(boss,9999);assert.equal(api.state().portalOpen,true);assert.equal(api.state().enemies.length,0);
});
test('evolution occurs in Level 30 battle and is restored after Level 30',()=>{
 const {api}=game();api.playLevel(30);assert.equal(api.state().evolved,false);const boss=api.state().boss;
 api.damageEnemy(boss,boss.userData.maxHp*.51);assert.equal(api.state().evolved,true);
 const resumed=game({level:31}).api;resumed.playLevel(31);assert.equal(resumed.state().evolved,true);
});
test('blocked storage does not prevent playing',()=>{const {api}=game(null,true);api.playLevel(2);assert.equal(api.state().storageAvailable,false);assert.equal(api.state().currentLevel,2);});
