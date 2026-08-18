"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

type Params={width:number;depth:number;rearHeight:number;frontHeight:number;thickness:number;cp1Depth:number;cp1Height:number;cp2Depth:number;cp2Height:number};
type Display={wireframe:boolean;grid:boolean;dimensions:boolean};
type Api={camera:THREE.PerspectiveCamera;renderer:THREE.WebGLRenderer;controls:OrbitControls;mesh:THREE.Mesh;grid:THREE.GridHelper;dims:THREE.Group};
const defaults:Params={width:9,depth:6,rearHeight:4,frontHeight:.72,thickness:.12,cp1Depth:-1.45,cp1Height:.76,cp2Depth:2.36,cp2Height:1.62};
const displayDefaults:Display={wireframe:false,grid:true,dimensions:true};

function geometry(p:Params){
  const front=-p.depth/2,rear=p.depth/2,profile=new THREE.Shape();
  // One closed Y–Z side profile, extruded once across the full X width.
  profile.moveTo(front,0);profile.lineTo(front,p.frontHeight);
  profile.bezierCurveTo(p.cp1Depth,p.cp1Height,p.cp2Depth,p.cp2Height,rear,p.rearHeight);
  profile.lineTo(rear,0);profile.closePath();
  const g=new THREE.ExtrudeGeometry(profile,{depth:p.width,steps:1,curveSegments:72,bevelEnabled:true,bevelSegments:3,bevelSize:Math.min(p.thickness*.24,.035),bevelThickness:Math.min(p.thickness*.32,.045)});
  g.translate(0,0,-p.width/2);g.rotateY(-Math.PI/2);g.computeVertexNormals();return g;
}
function label(text:string){
  const c=document.createElement("canvas");c.width=512;c.height=112;const x=c.getContext("2d")!;
  x.fillStyle="rgba(250,250,248,.94)";x.roundRect(4,4,504,104,24);x.fill();x.strokeStyle="rgba(23,25,24,.15)";x.lineWidth=3;x.stroke();x.fillStyle="#202321";x.font="600 42px Arial";x.textAlign="center";x.textBaseline="middle";x.fillText(text,256,57);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.scale.set(2.05,.45,1);s.renderOrder=10;return s;
}
function dimension(group:THREE.Group,a:THREE.Vector3,b:THREE.Vector3,text:string,offset:THREE.Vector3){
  const m=new THREE.LineBasicMaterial({color:0x737b76,depthTest:false}),line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),m);line.renderOrder=8;group.add(line);
  const tick=Math.abs(b.y-a.y)>.5?new THREE.Vector3(.18,0,0):new THREE.Vector3(0,.18,0);[a,b].forEach(p=>{const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([p.clone().sub(tick),p.clone().add(tick)]),m);l.renderOrder=8;group.add(l)});
  const s=label(text);s.position.copy(a).lerp(b,.5).add(offset);group.add(s);
}
function clearGroup(group:THREE.Group){group.traverse(o=>{if(o instanceof THREE.Line){o.geometry.dispose();(o.material as THREE.Material).dispose()}if(o instanceof THREE.Sprite){o.material.map?.dispose();o.material.dispose()}});group.clear()}
function rebuildDims(group:THREE.Group,p:Params){clearGroup(group);const f=-p.depth/2,r=p.depth/2,s=p.width/2;
  dimension(group,new THREE.Vector3(-s,.08,f-.62),new THREE.Vector3(s,.08,f-.62),`${Math.round(p.width*1000).toLocaleString()} mm`,new THREE.Vector3(0,.32,0));
  dimension(group,new THREE.Vector3(s+.66,.08,f),new THREE.Vector3(s+.66,.08,r),`${Math.round(p.depth*1000).toLocaleString()} mm`,new THREE.Vector3(0,.32,0));
  dimension(group,new THREE.Vector3(s+.66,0,r+.08),new THREE.Vector3(s+.66,p.rearHeight,r+.08),`${Math.round(p.rearHeight*1000).toLocaleString()} mm`,new THREE.Vector3(.52,0,0));}
function Slider({name,value,min,max,step=.01,unit="m",change}:{name:string;value:number;min:number;max:number;step?:number;unit?:string;change:(n:number)=>void}){return <label className="control-row"><span>{name}</span><b>{unit==="mm"?Math.round(value*1000):value.toFixed(2)} {unit}</b><input aria-label={name} type="range" min={min} max={max} step={step} value={value} onChange={e=>change(Number(e.target.value))}/></label>}

export default function Home(){
  const mount=useRef<HTMLDivElement>(null),api=useRef<Api|null>(null);const[p,setP]=useState(defaults),[display,setDisplay]=useState(displayDefaults);const set=useCallback((key:keyof Params,value:number)=>setP(v=>({...v,[key]:value})),[]);
  const cameraView=useCallback((view:"perspective"|"front"|"side"|"top")=>{if(!api.current)return;const span=Math.max(p.width,p.depth,p.rearHeight*1.8),target=new THREE.Vector3(0,p.rearHeight*.43,0);const pos={perspective:new THREE.Vector3(span*1.05,span*.73,-span*1.08),front:new THREE.Vector3(0,p.rearHeight*.48,-span*1.6),side:new THREE.Vector3(span*1.55,p.rearHeight*.48,0),top:new THREE.Vector3(.001,span*1.75,.001)};api.current.camera.position.copy(pos[view]);api.current.camera.up.set(0,view==="top"?0:1,view==="top"?-1:0);api.current.controls.target.copy(target);api.current.controls.update()},[p]);
  useEffect(()=>{const host=mount.current;if(!host)return;const scene=new THREE.Scene();scene.background=new THREE.Color(0xeeeeeb);scene.fog=new THREE.Fog(0xeeeeeb,22,38);
    const camera=new THREE.PerspectiveCamera(35,1,.05,100),renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.appendChild(renderer.domElement);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=4;controls.maxDistance=32;controls.maxPolarAngle=Math.PI/2-.025;scene.add(new THREE.HemisphereLight(0xffffff,0xb7bbb5,2.2));
    const light=new THREE.DirectionalLight(0xffffff,3.1);light.position.set(-5,11,-7);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:30});light.shadow.bias=-.0003;scene.add(light);
    const mat=new THREE.MeshStandardMaterial({color:0xf8f8f4,roughness:.86,metalness:.01}),mesh=new THREE.Mesh(geometry(defaults),mat);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(12,10),new THREE.MeshStandardMaterial({color:0xf4f4f1,roughness:.95}));floor.rotation.x=-Math.PI/2;floor.position.y=-.035;floor.receiveShadow=true;scene.add(floor);
    const cc=document.createElement("canvas");cc.width=cc.height=256;const cx=cc.getContext("2d")!,gr=cx.createRadialGradient(128,128,12,128,128,126);gr.addColorStop(0,"rgba(20,24,22,.27)");gr.addColorStop(.42,"rgba(20,24,22,.1)");gr.addColorStop(1,"rgba(20,24,22,0)");cx.fillStyle=gr;cx.fillRect(0,0,256,256);const contact=new THREE.Mesh(new THREE.PlaneGeometry(10.4,7.2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cc),transparent:true,depthWrite:false,opacity:.62}));contact.rotation.x=-Math.PI/2;contact.position.y=-.012;scene.add(contact);
    const grid=new THREE.GridHelper(12,24,0xc8cbc6,0xd9dbd7);grid.position.y=-.005;(grid.material as THREE.Material).transparent=true;(grid.material as THREE.Material).opacity=.42;scene.add(grid);const dims=new THREE.Group();rebuildDims(dims,defaults);scene.add(dims);
    const resize=()=>{camera.aspect=host.clientWidth/Math.max(host.clientHeight,1);camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight,false)};resize();const ro=new ResizeObserver(resize);ro.observe(host);api.current={camera,renderer,controls,mesh,grid,dims};camera.position.set(9.45,6.57,-9.72);controls.target.set(0,1.72,0);controls.update();let frame=0;const draw=()=>{controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(draw)};draw();
    return()=>{cancelAnimationFrame(frame);ro.disconnect();controls.dispose();clearGroup(dims);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}});renderer.dispose();renderer.domElement.remove();api.current=null}},[]);
  useEffect(()=>{if(!api.current)return;const old=api.current.mesh.geometry;api.current.mesh.geometry=geometry(p);old.dispose();(api.current.mesh.material as THREE.MeshStandardMaterial).wireframe=display.wireframe;api.current.grid.visible=display.grid;api.current.dims.visible=display.dimensions;rebuildDims(api.current.dims,p)},[p,display]);
  return <main className="app-shell"><section className="viewer" aria-label="3D exhibition stand viewer"><div className="brand"><p>PROFILE / EXTRUSION STUDY</p><h1>Exhibition Stand</h1><span>9 × 6 × 4 m · cubic Bezier profile</span></div><div className="axis"><span><i className="x"/>X width</span><span><i className="y"/>Y height</span><span><i className="z"/>Z depth</span></div><div className="viewport" ref={mount}/><div className="hint">Drag to orbit · Scroll to zoom · Right-drag to pan</div></section>
    <aside className="panel"><header><p>LIVE GEOMETRY</p><h2>Structure controls</h2><span>Real-world metres. Geometry rebuilds while you move a control.</span></header>
      <section><Title n="01" text="Dimensions"/><Slider name="Width" value={p.width} min={5} max={12} change={v=>set("width",v)}/><Slider name="Depth" value={p.depth} min={3} max={9} change={v=>set("depth",v)}/><Slider name="Maximum height" value={p.rearHeight} min={2.5} max={6} change={v=>set("rearHeight",v)}/><Slider name="Front height" value={p.frontHeight} min={.25} max={1.6} change={v=>set("frontHeight",v)}/><Slider name="Edge thickness" value={p.thickness} min={.08} max={.2} step={.005} unit="mm" change={v=>set("thickness",v)}/></section>
      <section><Title n="02" text="Bezier curve"/><small>Depth positions each point on Z; height controls the rise.</small><Curve title="CONTROL POINT 1" note="gentle entry"><Slider name="Depth" value={p.cp1Depth} min={-2.85} max={.5} change={v=>set("cp1Depth",v)}/><Slider name="Height" value={p.cp1Height} min={.3} max={2.6} change={v=>set("cp1Height",v)}/></Curve><Curve title="CONTROL POINT 2" note="steep finish"><Slider name="Depth" value={p.cp2Depth} min={0} max={2.92} change={v=>set("cp2Depth",v)}/><Slider name="Height" value={p.cp2Height} min={.7} max={3.8} change={v=>set("cp2Height",v)}/></Curve></section>
      <section><Title n="03" text="Camera"/><div className="buttons"><button onClick={()=>cameraView("perspective")}>Perspective</button><button onClick={()=>cameraView("front")}>Front</button><button onClick={()=>cameraView("side")}>Side</button><button onClick={()=>cameraView("top")}>Top</button></div><button className="reset" onClick={()=>cameraView("perspective")}>Reset camera</button></section>
      <section><Title n="04" text="Display"/>{([['wireframe','Wireframe'],['grid','Grid'],['dimensions','Dimensions']] as [keyof Display,string][]).map(([key,name])=><label className="switch" key={key}><span>{name}</span><input type="checkbox" checked={display[key]} onChange={e=>setDisplay(v=>({...v,[key]:e.target.checked}))}/><i/></label>)}<button className="defaults" onClick={()=>{setP(defaults);setDisplay(displayDefaults);requestAnimationFrame(()=>cameraView("perspective"))}}>Restore all defaults</button></section>
    </aside></main>}
function Title({n,text}:{n:string;text:string}){return <div className="title"><span>{n}</span><h3>{text}</h3></div>}
function Curve({title,note,children}:{title:string;note:string;children:React.ReactNode}){return <div className="curve"><div><span>{title}</span><b>{note}</b></div>{children}</div>}
