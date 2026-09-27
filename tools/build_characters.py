"""Run in Blender 4.5: blender --background --python tools/build_characters.py.

Editable mesh characters, GLB interchange, and identical indexed mesh buffers for
the offline browser build. Authoring coordinates are X right, Y up, Z back.
The reference is embedded in each .blend. No textures or external add-ons needed.
"""
import bpy, math, json, pathlib, uuid
from mathutils import Vector

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'characters'
OUT.mkdir(parents=True,exist_ok=True)
MODELS=ROOT/'art'/'characters'
MODELS.mkdir(parents=True,exist_ok=True)
def v(p): return Vector((p[0],-p[2],p[1]))
def game(p): return [round(p[0],5),round(p[2],5),round(-p[1],5)]
materials={}
parts=[]
pivots={}
current='body'

def material(name,color,emission=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1);m.use_nodes=True
    shader=m.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value=(*color,1)
    shader.inputs['Roughness'].default_value=.78
    if emission:
        shader.inputs['Emission Color'].default_value=(*color,1)
        shader.inputs['Emission Strength'].default_value=emission
    materials[name]=m
    return m

def mesh(name,verts,faces,mat,smooth=True):
    data=bpy.data.meshes.new(name);data.from_pydata([v(p) for p in verts],[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
    obj.data.materials.append(materials[mat]);obj['part']=current
    for p in data.polygons:p.use_smooth=smooth
    parts.append(obj);return obj

def ellipsoid(name,center,scale,mat,segments=20,rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=v(center))
    o=bpy.context.object;o.name=name;o.scale=(scale[0],scale[2],scale[1]);o.data.materials.append(materials[mat]);o['part']=current
    for p in o.data.polygons:p.use_smooth=True
    parts.append(o);return o

def tube(name,points,radii,mat,sides=9):
    vertices=[]
    for i,p in enumerate(points):
        tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])
        tangent.normalize(); axis=tangent.cross(Vector((0,0,1)))
        if axis.length<.01:axis=tangent.cross(Vector((0,1,0)))
        axis.normalize(); other=tangent.cross(axis).normalized()
        radius=radii[i] if isinstance(radii,list) else radii
        for j in range(sides):
            q=Vector(p)+radius*(axis*math.cos(j*2*math.pi/sides)+other*math.sin(j*2*math.pi/sides))
            vertices.append(tuple(q))
    faces=[]
    for i in range(len(points)-1):
        for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
    faces.extend([tuple(range(sides-1,-1,-1)),tuple((len(points)-1)*sides+j for j in range(sides))])
    return mesh(name,vertices,faces,mat)

def patch(name,outline,z,depth,mat):
    # A beveled silhouette with a raised front, rather than a cone primitive.
    n=len(outline);cx=sum(p[0] for p in outline)/n;cy=sum(p[1] for p in outline)/n
    verts=[(x,y,z) for x,y in outline]+[(cx+(x-cx)*.85,cy+(y-cy)*.85,z-depth) for x,y in outline]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    faces +=[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh(name,verts,faces,mat)

def lock(name,base,tip,width,mat='Fur highlight'):
    a=Vector(base);b=Vector(tip);d=b-a
    tube(name,[a,a+d*.3,a+d*.7,b],[width,width*.86,width*.42,.008],mat,7)

def mirrored(points,side):return [(p[0]*side,p[1],p[2]) for p in points]
def group(name,pivot):
    global current
    current=name;pivots[name]=pivot

def face(shadow):
    cy=3.05 if shadow else 1.92
    z=-.74 if shadow else -.58
    for s in [-1,1]:
        # Almond eyes with a dark outline, ruby iris, vertical pupil, warm glint.
        outline=[(.10,cy-.02),(.21,cy+.15),(.50 if shadow else .46,cy+.23),(.46,cy-.04),(.24,cy-.08)]
        patch('Eye socket '+str(s),[(x*s,y) for x,y in outline],z+.02,.045,'Ink')
        cx=.29;ey=cy+.055
        patch('Ruby almond '+str(s),[((cx+(x-cx)*.8)*s,ey+(y-ey)*.78) for x,y in outline],z-.03,.028,'Ruby')
        tube('Slit pupil '+str(s),[(s*.29,cy-.025,z-.065),(s*.31,cy+.07,z-.079),(s*.34,cy+.15,z-.06)],[.024,.031,.009],'Ink',6)
        ellipsoid('Eye glint',(s*.24,cy+.08,z-.082),(.025,.035,.01),'Hot pink',10,6)
        if shadow:
            lock('Heavy brow',(s*.1,cy+.18,z+.01),(s*.63,cy+.35,z+.12),.095,'Fur')
    if not shadow:
        patch('Little nose',[(-.075,1.83),(.075,1.83),(0,1.77)],-.657,.027,'Ink')
        tube('Smile',[(-.27,1.72,-.55),(-.15,1.67,-.624),(0,1.69,-.658),(.15,1.67,-.624),(.27,1.72,-.55)],.014,'Ink',6)
        # Three forehead flames, matching the red markings in the concept.
        for s in [-1,1]:
            tube('Brow flame '+str(s),[(s*.13,2.08,-.59),(s*.12,2.22,-.54),(s*.25,2.32,-.45),(s*.27,2.42,-.31)],[.018,.028,.041,.009],'Ruby',7)
        tube('Forehead flame',[(0,2.10,-.59),(0,2.27,-.55),(0,2.40,-.38)],[.012,.043,.008],'Ruby',8)
    else:
        mouth=[(-.53,2.91),(-.39,2.69),(-.26,2.85),(-.12,2.66),(0,2.82),(.15,2.66),(.29,2.85),(.41,2.71),(.55,2.93)]
        tube('Jagged glowing grin',[(x,y,-.74+.19*abs(x)) for x,y in mouth],.035,'Ruby',7)
        for s in [-1,1]:
            lock('Cheek blade',(s*.64,2.99,-.15),(s*.83,2.66,-.25),.2)

def make_doom():
    group('body',(0,0,0))
    ellipsoid('Pear shaped body',(0,.97,.04),(.44,.68,.34),'Fur')
    ellipsoid('Chest bib',(0,1.25,-.20),(.36,.46,.24),'Fur highlight')
    for s in [-1,1]:
        for i in range(4):lock('Hip fur',(s*(.27+i*.022),.91-i*.13,.02),(s*(.5+i*.02),.66-i*.13,.02),.13,'Fur')
    group('head',(0,1.58,0))
    ellipsoid('Catlike head',(0,1.97,.01),(.65,.53,.48),'Fur highlight',24,16)
    ellipsoid('Muzzle',(0,1.75,-.40),(.36,.18,.22),'Fur',20,10)
    for s in [-1,1]:
        for i in range(3):lock('Cheek tuft',(s*.47,1.99-i*.12,0),(s*(.77-i*.05),1.85-i*.11,-.02),.13)
        # Large swept ears: thick leaf shapes with inset crimson panels.
        outline=[(.27,2.24),(.25,2.65),(.44,3.15),(.91,3.83),(.85,3.12),(.97,2.61),(.72,2.26)]
        patch('Swept ear '+str(s),[(s*x,y) for x,y in outline],.04,.20,'Fur')
        inner=[(.38,2.40),(.36,2.70),(.52,3.12),(.83,3.57),(.73,3.02),(.84,2.64),(.67,2.42)]
        patch('Crimson inner ear '+str(s),[(s*x,y) for x,y in inner],-.175,.025,'Ear velvet')
        tube('Ear swirl '+str(s),mirrored([(.5,2.48,-.219),(.69,2.62,-.219),(.68,2.83,-.219),(.54,2.93,-.219),(.48,2.81,-.219) ],s),[.022,.03,.035,.027,.006],'Ruby',7)
        for i in range(5):
            ellipsoid('Ear marking',(s*(.40+i*.056),2.75+i*.125,-.218),(.032,.048,.013),'Ruby',10,6)
    for i in range(7):
        x=(i-3)*.12
        lock('Neck ruff',(x,1.58,-.23),(x*1.35,1.22-abs(x)*.1,-.39),.105)
    face(False)
    for s,side in [(-1,'l'),(1,'r')]:
        group('arm_'+side,(s*.36,1.35,0))
        tube('Forearm '+side,mirrored([(.35,1.35,0),(.64,1.19,-.02),(.88,1.25,-.04),(1.02,1.38,-.05)],s),[.16,.13,.11,.12],'Fur',10)
        ellipsoid('Open palm '+side,(s*1.04,1.38,-.05),(.19,.12,.17),'Fur highlight',14,8)
        for j in range(3):
            x=.92+j*.10
            tube('Finger '+side+str(j),mirrored([(x,1.42,-.13),(x+.055,1.53,-.18),(x+.065,1.61,-.18)],s),[.058,.043,.008],'Ink',7)
        tube('Thumb '+side,mirrored([(1.17,1.37,-.02),(1.24,1.46,-.06),(1.24,1.55,-.11)],s),[.065,.046,.007],'Fur',7)
        lock('Wrist tuft',(s*.72,1.23,.05),(s*.86,1.02,.04),.085)
        group('leg_'+side,(s*.26,.60,0))
        ellipsoid('Thigh '+side,(s*.29,.49,.03),(.23,.35,.24),'Fur')
        tube('Ankle '+side,[(s*.31,.4,.02),(s*.32,.21,-.03),(s*.35,.12,-.14)],[.15,.12,.14],'Fur',10)
        ellipsoid('Foot '+side,(s*.35,.12,-.19),(.24,.12,.3),'Fur highlight',16,8)
        for j in range(3):lock('Toe claw',(s*.35+(j-1)*.11,.13,-.38),(s*.35+(j-1)*.12,.075,-.52),.053,'Ink')
    group('tail',(0,.75,.24))
    tube('Fox tail',[(0,.8,.24),(.3,.69,.55),(.62,.75,.72),(.9,.99,.73),(1.04,1.36,.63)],[.19,.25,.21,.13,.005],'Fur',11)
    for i in range(3):lock('Tail tuft',(.4+i*.17,.75+i*.04,.65),(.71+i*.15,.62+i*.12,.75),.12)
    magic_orbs(False)

def make_shadow():
    group('body',(0,0,0))
    ellipsoid('Powerful torso',(0,1.95,.06),(.87,1.15,.55),'Fur',24,16)
    ellipsoid('Chest mane',(0,2.33,-.28),(.88,.62,.38),'Fur highlight',22,14)
    for s in [-1,1]:
        for i in range(5):lock('Flank fur',(s*(.63-i*.055),2.27-i*.23,.1),(s*(.93-i*.08),1.92-i*.23,.12),.20,'Fur')
        for i in range(4):lock('Chest layered fur',(s*(.15+i*.18),2.43-i*.065,-.49),(s*(.22+i*.18),1.85+i*.09,-.48),.18)
    lock('Chest central tuft',(0,2.21,-.49),(0,1.45,-.42),.25)
    group('head',(0,2.67,0))
    ellipsoid('Demon cat head',(0,3.08,0),(.81,.67,.6),'Fur highlight',24,16)
    ellipsoid('Dark muzzle',(0,2.84,-.47),(.62,.34,.25),'Fur',22,12)
    for s in [-1,1]:
        horn=[(.55,3.30),(.57,3.70),(.74,4.03),(.67,4.47),(1.02,4.15),(1.04,3.83),(.85,3.35)]
        patch('Curved crown horn '+str(s),[(s*x,y) for x,y in horn],.05,.23,'Fur')
        inset=[(.68,3.50),(.72,3.80),(.85,4.08),(.94,4.11),(.88,3.81),(.80,3.54)]
        patch('Horn crimson edge '+str(s),[(s*x,y) for x,y in inset],-.20,.03,'Ear velvet')
        for i in range(3):lock('Jaw fur',(s*.64,2.91-i*.10,.01),(s*(.94-i*.04),2.72-i*.15,.02),.17)
    for x,y in [(-.42,3.76),(-.21,3.90),(0,4.02),(.21,3.90),(.42,3.76)]:
        lock('Ruby crown spike',(x,3.47,-.35),(x*1.08,y,-.24),.105,'Ruby')
    face(True)
    for s,side in [(-1,'l'),(1,'r')]:
        group('arm_'+side,(s*.7,2.36,0))
        tube('Raised powerful arm '+side,mirrored([(.7,2.36,0),(1.02,2.39,0),(1.37,2.64,0),(1.54,3.05,-.02),(1.55,3.35,-.04)],s),[.37,.35,.29,.24,.24],'Fur',12)
        for i in range(3):lock('Arm fur',(s*(1.02+i*.18),2.49+i*.22,.05),(s*(1.21+i*.16),2.26+i*.24,.04),.14)
        ellipsoid('Clawed palm '+side,(s*1.54,3.4,-.05),(.31,.28,.21),'Fur highlight',18,12)
        for j in range(4):
            x=1.30+j*.16
            tube('Curved talon '+side+str(j),mirrored([(x,3.49,-.11),(x+.06,3.76,-.14),(x+.015,3.96,-.18),(x-.07,4.09,-.2)],s),[.105,.08,.052,.004],'Ink',9)
        tube('Hook thumb '+side,mirrored([(1.29,3.35,-.13),(1.12,3.52,-.23),(1.12,3.7,-.26)],s),[.14,.085,.006],'Fur',9)
        group('leg_'+side,(s*.47,1.13,0))
        ellipsoid('Haunch '+side,(s*.54,.84,.04),(.43,.58,.4),'Fur',20,12)
        tube('Heavy ankle '+side,[(s*.61,.7,.06),(s*.66,.36,0),(s*.66,.2,-.15)],[.28,.24,.25],'Fur',12)
        ellipsoid('Broad paw '+side,(s*.67,.16,-.2),(.40,.17,.45),'Fur highlight',18,10)
        for j in range(3):lock('Large toe claw',(s*.67+(j-1)*.19,.17,-.50),(s*.67+(j-1)*.21,.09,-.72),.09,'Ink')
        for i in range(2):lock('Thigh tuft',(s*.72,.99-i*.16,.08),(s*1.0,.79-i*.19,.10),.17)
    group('tail',(0,1.27,.43))
    tube('Long devil tail',[(0,1.28,.43),(.45,1.08,.87),(1.05,1.1,1.03),(1.61,1.48,.94),(1.98,2.07,.69),(2.11,2.44,.5)],[.25,.23,.20,.16,.105,.075],'Fur',12)
    patch('Arrow tail outline',[(1.82,2.34),(2.31,2.86),(2.28,2.13),(2.1,2.30)],.55,.15,'Ink')
    patch('Red arrow tip',[(1.9,2.36),(2.26,2.77),(2.23,2.23),(2.09,2.39)],.383,.02,'Ruby')
    magic_orbs(True)

def magic_orbs(shadow):
    for s,side in [(-1,'l'),(1,'r')]:
        p=(s*(1.7 if shadow else 1.26),4.65 if shadow else 1.86,-.05)
        group('orb_'+side,p);r=.37 if shadow else .23
        ellipsoid('Magic core '+side,p,(r,r,r),'Ruby',18,12)
        ellipsoid('Magic hot centre '+side,(p[0]-.035,p[1]+.02,p[2]-.06),(r*.70,r*.70,r*.70),'Hot pink',16,10)
        for k in range(3):
            points=[]
            for i in range(28):
                a=i/27*math.pi*1.8+k*2.1
                rr=r*(1.12+i/27*.36)
                points.append((p[0]+math.cos(a)*rr,p[1]+math.sin(a)*rr,p[2]+math.sin(a*2+k)*r*.4))
            tube('Swirling magic '+side+str(k),points,[r*.11*(1-i/29) for i in range(28)],'Ruby',5)

def export_model(name):
    # Apply transforms and merge by animated part/material: modest draw-call budget.
    grouped={}
    for obj in parts:grouped.setdefault(obj['part'],[]).append(obj)
    runtime={'groups':[],'materials':{}}
    for name_,mat in materials.items():
        sh=mat.node_tree.nodes.get('Principled BSDF')
        runtime['materials'][name_]={'color':list(mat.diffuse_color)[:3],'emission':sh.inputs['Emission Strength'].default_value}
    for part_name,objects in grouped.items():
        pivot=pivots[part_name];record={'name':part_name,'pivot':pivot,'meshes':[]}
        by_material={}
        for o in objects:by_material.setdefault(o.data.materials[0].name,[]).append(o)
        anchor=bpy.data.objects.new(part_name,None);bpy.context.collection.objects.link(anchor);anchor.location=v(pivot)
        for mat_name,items in by_material.items():
            bpy.ops.object.select_all(action='DESELECT')
            for obj in items:obj.select_set(True)
            bpy.context.view_layer.objects.active=items[0];bpy.ops.object.join()
            obj=bpy.context.object;obj.name=part_name+'__'+mat_name
            bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
            world=obj.matrix_world.copy();obj.parent=anchor;obj.matrix_world=world
            data=obj.data;data.calc_loop_triangles()
            positions=[];normals=[];indices=[]
            for vert in data.vertices:
                positions+=game(vert.co-v(pivot));normals+=game(vert.normal)
            for triangle in data.loop_triangles:indices+=list(triangle.vertices)
            record['meshes'].append({'material':mat_name,'position':positions,'normal':normals,'index':indices})
        runtime['groups'].append(record)
    # A packed reference image in the editable project.
    ref=bpy.data.images.load(str(ROOT/'reference'/'character_concepts.jpg'));ref.pack()
    reference=bpy.data.objects.new('Original concept reference',None);reference.empty_display_type='IMAGE';reference.data=ref
    bpy.context.collection.objects.link(reference);reference.location=(5,0,2);reference.hide_render=True
    # Save with a clean, framed viewport and a useful studio render setup.
    bpy.ops.object.camera_add(location=v((6,4.0,-10)))
    camera=bpy.context.object;camera.name='Character portrait';camera.rotation_euler=(v((0,2.2,0))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO';camera.data.ortho_scale=6.5;bpy.context.scene.camera=camera
    for loc,power,size in [((4,6,-5),800,5),((-4,3,-2),550,4),((2,6,4),1100,4)]:
        bpy.ops.object.light_add(type='AREA',location=v(loc));light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size
        light.rotation_euler=(v((0,2,0))-light.location).to_track_quat('-Z','Y').to_euler()
    scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.resolution_x=800;scene.render.resolution_y=900;scene.render.resolution_percentage=100
    scene.world.color=(.16,.19,.23);scene.render.film_transparent=True
    scene.view_settings.view_transform='AgX'
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':
                area.spaces.active.region_3d.view_distance=8
                area.spaces.active.region_3d.view_location=v((0,2,0))
    bpy.ops.wm.save_as_mainfile(filepath=str(MODELS/(name+'.blend')))
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if obj.type=='MESH' or obj.name in pivots:obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
    scene.render.filepath=str(MODELS/(name+'-preview.png'));bpy.ops.render.render(write_still=True)
    return runtime

result={}
for name,builder in [('doom',make_doom),('shadow-stalker',make_shadow)]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.world=bpy.data.worlds.new('Studio')
    materials={};parts=[];pivots={}
    material('Fur',(.022,.028,.040));material('Fur highlight',(.045,.052,.068))
    material('Ink',(.006,.009,.015));material('Ear velvet',(.22,.009,.03))
    material('Ruby',(.65,.008,.038),.7);material('Hot pink',(1,.10,.18),1.1)
    builder();result[name]=export_model(name)
    triangles=sum(len(m['index'])//3 for g in result[name]['groups'] for m in g['meshes'])
    print(name,'triangles:',triangles)
(OUT/'characters.js').write_text('/* Exported from Blender by tools/build_characters.py. */\nwindow.DoomCharacterAssets='+json.dumps(result,separators=(',',':'))+';\n',encoding='utf-8')
print('CHARACTER EXPORT COMPLETE')
