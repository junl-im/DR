const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const base=process.argv[2]||__dirname,out=path.join(base,'kit');fs.mkdirSync(out,{recursive:true});
const packs=[
 ['fantasy-ui','kenney_fantasy-ui-borders','https://kenney.nl/assets/fantasy-ui-borders','Kenney','CC0-1.0'],
 ['rpg-ui','kenney_ui-pack-rpg-expansion','https://kenney.nl/assets/ui-pack-rpg-expansion','Kenney','CC0-1.0'],
 ['particles','kenney_particle-pack','https://kenney.nl/assets/particle-pack','Kenney and credited filter contributors','CC0-1.0'],
 ['rpg-audio','kenney_rpg-audio','https://kenney.nl/assets/rpg-audio','Kenney','CC0-1.0'],
 ['mini-dungeon','kenney_mini-dungeon','https://kenney.nl/assets/mini-dungeon','Kenney','CC0-1.0'],
 ['isometric-buildings','kenney-isometric-buildings','https://opengameart.org/content/isometric-buildings-1','Kenney','CC0-1.0'],
 ...['KayKit-Dungeon-Remastered-1.0','KayKit-Character-Pack-Adventures-1.0','KayKit-Character-Pack-Skeletons-1.0'].map(n=>[n,n,'https://github.com/KayKit-Game-Assets/'+n,'Kay Lousberg','CC0-1.0'])
];
for(const [id,dir] of packs){const dest=path.join(out,id);fs.mkdirSync(dest,{recursive:true});const src=path.join(base,dir);if(dir.startsWith('KayKit')){fs.cpSync(path.join(src,'addons'),path.join(dest,'addons'),{recursive:true});fs.copyFileSync(path.join(src,'LICENSE.txt'),path.join(dest,'LICENSE.txt'));}else fs.cpSync(src,dest,{recursive:true});}
const icons=['crossed-swords','broadsword','checked-shield','crested-helmet','locked-chest','scroll-unfurled','standing-potion','heart-bottle','fireball','crystal-wand','crystal-cluster','battle-axe','bowman','campfire','wooden-door','lightning-arc'];
const iconDir=path.join(out,'game-icons-lorc');fs.mkdirSync(iconDir,{recursive:true});
for(const icon of icons){const src=path.join(base,'game-icons','lorc',icon+'.svg');if(!fs.existsSync(src))throw Error('Missing '+icon);fs.copyFileSync(src,path.join(iconDir,icon+'.svg'));}
fs.writeFileSync(path.join(iconDir,'CREDITS.md'),'Icons made by Lorc. Available on https://game-icons.net.\nLicense: CC BY 3.0 https://creativecommons.org/licenses/by/3.0/\nOriginal SVG files, unmodified. Credit Lorc in the game credits before runtime integration.\n');
packs.push(['game-icons-lorc','game-icons','https://github.com/game-icons/icons','Lorc','CC-BY-3.0']);
const flare=path.join(out,'flare-grassland');fs.mkdirSync(flare,{recursive:true});fs.copyFileSync(path.join(base,'flare-grassland-tiles.png'),path.join(flare,'grassland_tiles.png'));
fs.writeFileSync(path.join(flare,'CREDITS.md'),'Grassland Tileset by Clint Bellanger. Original PNG, unmodified.\nSource: https://opengameart.org/content/grassland-tileset\nLicense: CC BY-SA 3.0 https://creativecommons.org/licenses/by-sa/3.0/\nCredit the author, link the license, identify changes, and retain share-alike for adapted art. Not the code license.\n');
packs.push(['flare-grassland',null,'https://opengameart.org/content/grassland-tileset','Clint Bellanger','CC-BY-SA-3.0']);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const failures=[],manifest=[],summary=[];
for(const [id,dir,url,author,license] of packs){let revision=null;if(dir&&fs.existsSync(path.join(base,dir,'.git')))revision=cp.execFileSync('git',['-C',path.join(base,dir),'rev-parse','HEAD'],{encoding:'utf8'}).trim();const files=walk(path.join(out,id));const counts={};let bytes=0,animatedGlbs=0;
 for(const file of files){const b=fs.readFileSync(file),ext=path.extname(file).toLowerCase();bytes+=b.length;counts[ext]=(counts[ext]||0)+1;if(b.subarray(0,100).toString().startsWith('version https://git-lfs.github.com/spec'))failures.push(file+': LFS pointer');if(ext==='.png'&&b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')failures.push(file+': PNG signature');if(ext==='.glb'){try{if(b.readUInt32LE(0)!==0x46546c67||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length)throw Error('header');const json=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());if(json.animations?.length)animatedGlbs++;}catch(e){failures.push(file+': GLB '+e.message);}}if(ext==='.svg'&&/<script|javascript:|<foreignObject/i.test(b.toString()))failures.push(file+': active SVG');manifest.push({pack:id,path:path.relative(out,file).split(path.sep).join('/'),bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});}
 summary.push({id,url,author,license,revision,files:files.length,bytes,counts,animatedGlbs,status:'downloaded; structural checks only; not runtime integrated'});
}
const result={date:'2026-10-12',packs:summary,totalFiles:manifest.length,totalBytes:manifest.reduce((n,f)=>n+f.bytes,0),failures,limits:'File counts include formats, previews and ancillary files; not unique asset count. Character animation visual quality, glTF external references and runtime performance still require integration checks.'};
fs.writeFileSync(path.join(out,'asset-manifest.json'),JSON.stringify(manifest,null,2));fs.writeFileSync(path.join(out,'collection-summary.json'),JSON.stringify(result,null,2));
fs.copyFileSync(__filename,path.join(out,'build-library.cjs'));
console.log(JSON.stringify(result,null,2));if(failures.length)process.exitCode=1;
