/* These are Blender-exported mesh buffers, not runtime primitive characters. */
(function() {
  'use strict';
  window.createBlenderCharacter=function(name) {
    const THREE=window.THREE,asset=window.DoomCharacterAssets?.[name];
    if(!asset) throw new Error(`Missing Blender character asset: ${name}`);
    const root=new THREE.Group();root.name=name;
    const materials={};
    for(const [key,value] of Object.entries(asset.materials)) {
      const color=new THREE.Color().fromArray(value.color);
      materials[key]=new THREE.MeshStandardMaterial({color,roughness:.88,metalness:0,
        emissive:value.emission?color:0x000000,emissiveIntensity:value.emission,
        side:THREE.DoubleSide});
    }
    const joints={};
    for(const part of asset.groups) {
      const group=new THREE.Group();group.name=part.name;group.position.fromArray(part.pivot);
      root.add(group);joints[part.name]=group;
      for(const data of part.meshes) {
        const geometry=new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(data.position,3));
        geometry.setAttribute('normal',new THREE.Float32BufferAttribute(data.normal,3));
        geometry.setIndex(data.index);geometry.computeBoundingSphere();
        const mesh=new THREE.Mesh(geometry,materials[data.material]);
        mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
      }
    }
    root.userData.blender=true;
    root.userData.joints=joints;
    root.userData.magicOrbs=[joints.orb_l,joints.orb_r];
    return root;
  };
})();
