import bpy,json,hashlib,sys
from pathlib import Path
from mathutils import Vector
root=Path(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv else Path(__file__).parent
source=root/'modular_rpg_characters'
out=root/'converted';out.mkdir(exist_ok=True)
variants={'traveler':['light_armor_2','light_boots_2','hands_default','head_default','hair_1'], 'ranger':['medium_armor','medium_boots','medium_gloves','medium_helmet','head_default'], 'knight':['heavy_armor','heavy_boots','heavy_gloves','heavy_helmet','head_default']}
clips={'human_male_idle':'Idle','human_male_run':'Run','human_male_cast_main_hand_melee':'Attack','human_male_cast_unarmed_magic':'Cast','human_male_death':'Death'}
reports=[]
for variant,parts in variants.items():
 bpy.ops.wm.open_mainfile(filepath=str(source/'human_male.blend'),load_ui=False,use_scripts=False)
 rig=bpy.data.objects['human_male'];rig.hide_set(False);rig.hide_viewport=False
 for collection in bpy.data.collections:collection.hide_viewport=False;collection.hide_render=False
 def unhide(layer):
  layer.exclude=False;layer.hide_viewport=False
  for child in layer.children:unhide(child)
 unhide(bpy.context.view_layer.layer_collection)
 selected=[bpy.data.objects['human_male_'+part] for part in parts]
 for o in list(bpy.data.objects):
  if o!=rig and o not in selected:bpy.data.objects.remove(o,do_unlink=True)
 textures=[]
 for o in selected:
  o.hide_set(False);o.hide_viewport=False;o.hide_render=False
  if not any(m.type=='ARMATURE' for m in o.modifiers):o.modifiers.new('Verified original weights','ARMATURE').object=rig
  if o.parent!=rig:
   world=o.matrix_world.copy();o.parent=rig;o.matrix_world=world
  for mat in o.data.materials:
   name=mat.name.replace('mat_','tex_').replace('_skirt','')
   image=source/'textures'/(name+'.png')
   if not image.exists():image=source/'textures'/(name.replace('human_male','human_female')+'.png')
   if not image.exists():raise RuntimeError('Texture missing '+mat.name)
   mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear()
   shader=nodes.new('ShaderNodeBsdfPrincipled');shader.inputs['Roughness'].default_value=.85
   shader.inputs['Metallic'].default_value=.25 if 'heavy' in mat.name else 0
   tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(image),check_existing=True)
   output=nodes.new('ShaderNodeOutputMaterial');mat.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color']);mat.node_tree.links.new(shader.outputs['BSDF'],output.inputs['Surface'])
   textures.append(image.name)
 rig.animation_data_create()
 for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
 for action in list(bpy.data.actions):
  if action.name not in clips:bpy.data.actions.remove(action)
  else:action.name=clips[action.name];action.use_fake_user=True
 rig.animation_data.action=bpy.data.actions['Idle']
 bpy.context.scene.render.fps=24;bpy.context.scene.frame_set(1)
 bpy.ops.object.select_all(action='DESELECT')
 for o in [rig]+selected:o.select_set(True)
 bpy.context.view_layer.objects.active=rig
 path=out/(variant+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_skins=True,export_yup=True,export_materials='EXPORT')
 payload=path.read_bytes();jlen=int.from_bytes(payload[12:16],'little');doc=json.loads(payload[20:20+jlen]);
 report={'variant':variant,'bytes':len(payload),'sha256':hashlib.sha256(payload).hexdigest(),'parts':parts,'textures':sorted(set(textures)),'clips':[a['name'] for a in doc.get('animations',[])],'skins':len(doc.get('skins',[])),'triangles':sum(doc['accessors'][p['indices']]['count']//3 for m in doc['meshes'] for p in m['primitives']),'clipChannels':{a['name']:len(a['channels']) for a in doc.get('animations',[])}}
 reports.append(report)
(out/'conversion.json').write_text(json.dumps(reports,indent=2),encoding='utf8');print(json.dumps(reports,indent=2))

