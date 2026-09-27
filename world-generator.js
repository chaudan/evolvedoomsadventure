/* Seeded, renderer-independent layouts. Every required route has a reserved corridor. */
(function(root) {
  'use strict';
  function random(seed) {
    return function() {
      let t=seed+=0x6D2B79F5;
      t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);
      return ((t^t>>>14)>>>0)/4294967296;
    };
  }
  function segmentDistance(p,a,b) {
    const dx=b[0]-a[0],dz=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));
    return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);
  }
  function generate(level,count) {
    const seed=0xD004+level*7919,rng=random(seed);
    const radius=78+(level%5)*3;
    const angle=(rng()-.5)*.8;
    const rotate=([x,z])=>[+(x*Math.cos(angle)-z*Math.sin(angle)).toFixed(3),+(x*Math.sin(angle)+z*Math.cos(angle)).toFixed(3)];
    const start=rotate([0,radius*.77]),exit=rotate([(rng()-.5)*24,-radius*.77]);
    const objectives=[];
    for(let i=0;i<count;i++) {
      const t=(i+1)/(count+1);
      objectives.push(rotate([(i%2?1:-1)*(20+rng()*16),radius*.65*(1-2*t)]));
    }
    const boss=rotate([exit[0]*.15,-radius*.55]);
    const checkpoints=[start,...objectives,exit];
    const paths=[];
    for(let i=1;i<checkpoints.length;i++) {
      const a=checkpoints[i-1],b=checkpoints[i];
      const mid=[(a[0]+b[0])/2+(rng()-.5)*12,(a[1]+b[1])/2];
      paths.push([a,mid],[mid,b]);
    }
    const treasures=[rotate([radius*.62,8+rng()*15]),rotate([-radius*.64,-20+rng()*14])];
    for(const p of treasures) {
      const nearest=checkpoints.reduce((a,b)=>Math.hypot(p[0]-a[0],p[1]-a[1])<Math.hypot(p[0]-b[0],p[1]-b[1])?a:b);
      paths.push([nearest,p]);
    }
    const clearings=[{point:start,radius:19},{point:exit,radius:9},{point:boss,radius:level%10===0?15:5},...objectives.map(point=>({point,radius:7})),...treasures.map(point=>({point,radius:5}))];
    const blocked=p=>clearings.some(c=>Math.hypot(p[0]-c.point[0],p[1]-c.point[1])<c.radius)||paths.some(([a,b])=>segmentDistance(p,a,b)<4.8);
    const trees=[];
    for(let i=0;i<1600&&trees.length<125;i++) {
      const a=rng()*Math.PI*2,r=Math.sqrt(rng())*(radius-4),p=[Math.cos(a)*r,Math.sin(a)*r];
      if(blocked(p)||trees.some(t=>Math.hypot(p[0]-t.x,p[1]-t.z)<6)) continue;
      trees.push({x:p[0],z:p[1],scale:.65+rng()*1.25,height:.62+rng()*.95,kind:['broadleaf','pine','willow','crystal'][Math.floor(rng()*4)],rotation:rng()*Math.PI*2});
    }
    const ruins=[];
    for(let i=0;i<500&&ruins.length<15;i++) {
      const p=[(rng()-.5)*radius*1.5,(rng()-.5)*radius*1.5];
      if(Math.hypot(...p)>radius-10||blocked(p)||trees.some(t=>Math.hypot(p[0]-t.x,p[1]-t.z)<4))continue;
      ruins.push({x:p[0],z:p[1],rotation:rng()*6.28});
    }
    const foliage=[];
    const foliageTypes=['fern','mushroom','crystal','deadwood','flower','bush'];
    for(let i=0;i<420&&foliage.length<150;i++) {
      const a=rng()*Math.PI*2,r=Math.sqrt(rng())*(radius-5),p=[Math.cos(a)*r,Math.sin(a)*r];
      if(blocked(p)||trees.some(t=>Math.hypot(p[0]-t.x,p[1]-t.z)<2.3))continue;
      foliage.push({x:p[0],z:p[1],type:foliageTypes[Math.floor(rng()*foliageTypes.length)],scale:.55+rng()*.9,rotation:rng()*6.28});
    }
    const landmarks=[];
    for(let i=0;i<8;i++) {
      const a=rng()*Math.PI*2,r=radius*.62+rng()*radius*.18;
      landmarks.push({x:Math.cos(a)*r,z:Math.sin(a)*r,type:['arch','obelisk','camp','pond'][i%4],scale:.8+rng()*.6});
    }
    const encounters=(count?objectives:[boss]).flatMap((p,i)=>[
      {x:p[0]+6,z:p[1]+3,type:i%2}, {x:p[0]-5,z:p[1]-4,type:(i+1)%2}
    ]);
    return {seed,radius,start,exit,boss,objectives,treasures,paths,clearings,trees,ruins,foliage,landmarks,encounters};
  }
  const api={generate,segmentDistance};
  if(typeof module!=='undefined')module.exports=api;
  else root.DoomWorld=api;
})(typeof window==='undefined'?globalThis:window);
