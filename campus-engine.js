// ═══════════════════════════════════════════════
//  campus-engine.js  —  محرك الخريطة ثلاثية الأبعاد
//  يُستخدم في كلا الصفحتين
// ═══════════════════════════════════════════════

// Must be called after DOM is ready and THREE.js is loaded
// Requires: VP element (viewport div), DB array, isAdmin flag

function initEngine(VP, DB, isAdmin) {

  const getW = () => VP.clientWidth;
  const getH = () => VP.clientHeight;

  // ── SCENE ──
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x87c8f0, 40, 80);
  scene.background = new THREE.Color(0x87c8f0);

  const camera = new THREE.PerspectiveCamera(45, getW()/getH(), 0.1, 500);
  camera.position.set(0, 32, 38);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(getW(), getH());
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  VP.appendChild(renderer.domElement);

  // ── LIGHTS ──
  scene.add(new THREE.HemisphereLight(0x87ceeb, 0x7aaa6a, 0.65));
  const sunL = new THREE.DirectionalLight(0xfff5e0, 2.2);
  sunL.position.set(12, 28, 18);
  sunL.castShadow = true;
  sunL.shadow.mapSize.width = sunL.shadow.mapSize.height = 2048;
  sunL.shadow.camera.left = sunL.shadow.camera.bottom = -38;
  sunL.shadow.camera.right = sunL.shadow.camera.top = 38;
  sunL.shadow.bias = -0.0003;
  scene.add(sunL);
  const fillL = new THREE.DirectionalLight(0xbbd8f0, 0.38);
  fillL.position.set(-10, 8, -12);
  scene.add(fillL);
  scene.add(new THREE.AmbientLight(0xffeedd, 0.32));

  // ── SKY ──
  const skyMat = new THREE.ShaderMaterial({
    uniforms:{topC:{value:new THREE.Color(0x1a6bb5)},botC:{value:new THREE.Color(0x87ceeb)},off:{value:8},exp:{value:0.6}},
    vertexShader:`varying vec3 vWP;void main(){vWP=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform vec3 topC,botC;uniform float off,exp;varying vec3 vWP;void main(){float h=normalize(vWP+vec3(0,off,0)).y;gl_FragColor=vec4(mix(botC,topC,max(pow(max(h,0.),exp),0.)),1.);}`,
    side:THREE.BackSide
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(300,16,16), skyMat));

  // ── GROUND ──
  const gGeo = new THREE.PlaneGeometry(100,100,32,32);
  const gPos = gGeo.attributes.position;
  for(let i=0;i<gPos.count;i++){
    const x=gPos.getX(i),z=gPos.getY(i),d=Math.sqrt(x*x+z*z);
    gPos.setZ(i,Math.sin(x*.12)*Math.cos(z*.12)*0.18*(d/50));
  }
  gGeo.computeVertexNormals();
  const groundM = new THREE.Mesh(gGeo,new THREE.MeshLambertMaterial({color:0x7aaa6a}));
  groundM.rotation.x = -Math.PI/2; groundM.receiveShadow = true; scene.add(groundM);

  const pavedM = new THREE.Mesh(new THREE.PlaneGeometry(44,40),new THREE.MeshLambertMaterial({color:0xc4b89a}));
  pavedM.rotation.x = -Math.PI/2; pavedM.position.y = 0.01; pavedM.receiveShadow = true; scene.add(pavedM);

  // ── ROADS ──
  function mkRoad(x,z,w,d){
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,0.055,d),new THREE.MeshLambertMaterial({color:0xaaa090}));
    m.position.set(x,0.03,z); m.receiveShadow=true; scene.add(m);
  }
  mkRoad(0,0,44,0.9); mkRoad(0,0,0.9,40);
  mkRoad(-8,0,28,0.7); mkRoad(8,0,28,0.7);
  mkRoad(0,-9,26,0.7); mkRoad(0,7,26,0.7); mkRoad(0,13,26,0.7);

  // ── PARKING ──
  function mkParking(x,z,w,d){
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshLambertMaterial({color:0xa09888}));
    pm.rotation.x=-Math.PI/2; pm.position.set(x,0.02,z); pm.receiveShadow=true; scene.add(pm);
    for(let i=-w/2+0.4;i<w/2;i+=0.85){
      const sm = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.04,d*0.82),new THREE.MeshLambertMaterial({color:0xccccaa,transparent:true,opacity:0.38}));
      sm.position.set(x+i,0.05,z); scene.add(sm);
    }
  }
  mkParking(13,3,4,6); mkParking(-14,3,4,5); mkParking(13,-8,4,5);

  // ── TREES ──
  function mkTree(tx,tz,parent,scale){
    scale = scale||(0.7+Math.random()*0.42);
    const tMat=new THREE.MeshLambertMaterial({color:0x5a3510+Math.floor(Math.random()*0x0a0a0a)});
    const cMat=new THREE.MeshLambertMaterial({color:[0x2d6e2d,0x3a7a30,0x4a8840,0x2a5e22][Math.floor(Math.random()*4)]});
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.06*scale,0.09*scale,0.42*scale,5),tMat);
    trunk.position.set(tx,0.21*scale,tz); trunk.castShadow=true;
    const crown=new THREE.Mesh(new THREE.SphereGeometry(0.3*scale,6,5),cMat);
    crown.position.set(tx,0.54*scale,tz); crown.castShadow=true;
    (parent||scene).add(trunk,crown);
  }
  [[4,-6],[5,-6.5],[4.5,-5.5],[-2,-11.5],[-3,-12],[2,-11],[11,-10],[12,-10.5],[11.5,-9],[11,2],[12,2.5],[11.5,3],[-12,0],[-13,.5],[-12.5,1],[-5,2],[-6,2.5],[-5.5,3],[5,8],[6,8.5],[5.5,9],[1,14],[2,14.5],[0,14],[-4,13],[-5,13.5],[-4.5,12],[8,14],[9,14.5],[8.5,13],[13,9],[14,9.5],[13.5,10],[-8,9],[-9,9.5],[-8.5,10],[-13,-11],[-14,-11.5],[-13.5,-10.5],[6,-11],[7,-11.5],[6.5,-10.5]].forEach(([x,z])=>mkTree(x+(Math.random()-.5)*.35,z+(Math.random()-.5)*.35));

  for(let i=-14;i<=14;i+=2.2){
    [[-17,i],[17,i],[i,-17],[i,17]].forEach(([cx,cz])=>{
      const s=0.8+Math.random()*.3;
      const tk=new THREE.Mesh(new THREE.CylinderGeometry(.05*s,.08*s,.5*s,5),new THREE.MeshLambertMaterial({color:0x4a3010}));
      tk.position.set(cx,.25*s,cz); scene.add(tk);
      const cr=new THREE.Mesh(new THREE.ConeGeometry(.22*s,1.1*s,6),new THREE.MeshLambertMaterial({color:0x1e5e1e}));
      cr.position.set(cx,.82*s,cz); cr.castShadow=true; scene.add(cr);
    });
  }

  // ── BUILDING ENGINE ──
  const bObjs = {}, pickable = [];

  function mkWindowTex(floors,cols,color){
    const cv=document.createElement('canvas'); cv.width=128; cv.height=128;
    const ctx=cv.getContext('2d');
    ctx.fillStyle=`rgb(${color>>16&255},${color>>8&255},${color&255})`; ctx.fillRect(0,0,128,128);
    const ww=128/Math.max(cols,2),wh=128/Math.max(floors,1);
    for(let r=0;r<floors;r++) for(let c=0;c<Math.max(cols,2);c++){
      ctx.fillStyle=Math.random()>.32?'#a8c8e0':'#253040';
      ctx.fillRect(c*ww+2,r*wh+3,ww-4,wh-5);
    }
    return new THREE.CanvasTexture(cv);
  }

  function mkLabelSprite(num,name){
    const cv=document.createElement('canvas'); cv.width=256; cv.height=88;
    const ctx=cv.getContext('2d');
    ctx.beginPath(); const r=16;
    ctx.moveTo(r,0);ctx.lineTo(256-r,0);ctx.quadraticCurveTo(256,0,256,r);
    ctx.lineTo(256,88-r);ctx.quadraticCurveTo(256,88,256-r,88);
    ctx.lineTo(r,88);ctx.quadraticCurveTo(0,88,0,88-r);
    ctx.lineTo(0,r);ctx.quadraticCurveTo(0,0,r,0);
    ctx.fillStyle='rgba(5,12,28,0.88)';ctx.fill();
    ctx.strokeStyle='#c9a84c';ctx.lineWidth=2.5;ctx.stroke();
    ctx.beginPath();ctx.arc(40,44,24,0,Math.PI*2);
    ctx.fillStyle='#c9a84c';ctx.fill();
    ctx.fillStyle='#000';ctx.font='bold 20px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(String(num),40,45);
    ctx.fillStyle='#ffffff';
    let fs=17; ctx.font=`bold ${fs}px Arial`;
    while(ctx.measureText(name).width>168&&fs>9){fs--;ctx.font=`bold ${fs}px Arial`;}
    ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(name,250,44);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),depthTest:false}));
    sp.scale.set(3.0,1.05,1); return sp;
  }

  function buildOne(b){
    destroyOne(b.id);
    const grp=new THREE.Group(); const PH=0.14; let bodyMesh=null;

    if(b.isField){
      const fieldM=new THREE.Mesh(new THREE.PlaneGeometry(b.w*3.2,b.d*3.2),new THREE.MeshLambertMaterial({color:0x2e7d52}));
      fieldM.rotation.x=-Math.PI/2; fieldM.position.y=0.025; fieldM.receiveShadow=true; grp.add(fieldM);
      const lineM=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:0.85});
      [[b.w*3.2,0.08,0,0],[0.08,b.d*3.2,0,0],[b.w*3.2,0.08,0,-b.d*1.4],[b.w*3.2,0.08,0,b.d*1.4],[0.08,b.d*3.2,-b.w*1.5,0],[0.08,b.d*3.2,b.w*1.5,0]].forEach(([lw,lh,lx,lz])=>{
        const m=new THREE.Mesh(new THREE.PlaneGeometry(lw,lh),lineM); m.rotation.x=-Math.PI/2; m.position.set(lx,0.04,lz); grp.add(m);
      });
      const circM=new THREE.Mesh(new THREE.RingGeometry(0.75,0.84,28),new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide}));
      circM.rotation.x=-Math.PI/2; circM.position.y=0.04; grp.add(circM);
      [-b.d*1.4,b.d*1.4].forEach(gz=>{
        const pM=new THREE.MeshLambertMaterial({color:0xffffff});
        [[-0.55,0.55,gz,0.07,1.1,0.07],[0.55,0.55,gz,0.07,1.1,0.07],[0,1.12,gz,1.18,0.07,0.07]].forEach(([px,py,pz,pw,ph,pd])=>{
          const m=new THREE.Mesh(new THREE.BoxGeometry(pw,ph,pd),pM); m.position.set(px,py,pz); grp.add(m);
        });
      });
      bodyMesh=fieldM;

    } else if(b.isPlaza){
      const plazaM=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.6,0.1,32),new THREE.MeshLambertMaterial({color:0xd4c4a0}));
      plazaM.position.y=0.05; plazaM.receiveShadow=true; grp.add(plazaM);
      const basinM=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.25,0.32,22),new THREE.MeshLambertMaterial({color:0xc0bab0}));
      basinM.position.y=0.22; basinM.castShadow=true; grp.add(basinM);
      const waterM=new THREE.Mesh(new THREE.CylinderGeometry(0.95,0.95,0.1,22),new THREE.MeshLambertMaterial({color:0x4fc3f7,transparent:true,opacity:0.75}));
      waterM.position.y=0.38; grp.add(waterM);
      bObjs[b.id]={grp,body:plazaM,water:waterM,isPlaza:true};
      for(let a=0;a<8;a++){const ang=a/8*Math.PI*2;mkTree(Math.cos(ang)*3.0,Math.sin(ang)*3.0,grp,0.85);}
      for(let a=0;a<6;a++){const ang=a/6*Math.PI*2;const bm=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.08,0.2),new THREE.MeshLambertMaterial({color:0x8b6a40}));bm.position.set(Math.cos(ang)*1.9,0.44,Math.sin(ang)*1.9);grp.add(bm);}
      bodyMesh=plazaM;

    } else {
      const FH=0.38,totalH=b.h*FH;
      const plinthM=new THREE.Mesh(new THREE.BoxGeometry(b.w+0.3,PH,b.d+0.3),new THREE.MeshLambertMaterial({color:0xd0c4aa}));
      plinthM.position.y=PH/2; plinthM.castShadow=true; plinthM.receiveShadow=true; grp.add(plinthM);
      const bodyMat=new THREE.MeshLambertMaterial({map:mkWindowTex(b.h,Math.ceil(b.w*2.2),b.color)});
      bodyMat.color.setHex(b.color);
      bodyMesh=new THREE.Mesh(new THREE.BoxGeometry(b.w,totalH,b.d),bodyMat);
      bodyMesh.position.y=totalH/2+PH; bodyMesh.castShadow=true; bodyMesh.receiveShadow=true; bodyMesh.userData.buildingId=b.id; grp.add(bodyMesh);
      for(let f=0;f<=b.h;f++){const bandM=new THREE.Mesh(new THREE.BoxGeometry(b.w+0.06,0.045,b.d+0.06),new THREE.MeshLambertMaterial({color:0xc8b898}));bandM.position.y=PH+f*FH;grp.add(bandM);}
      const roofM=new THREE.Mesh(new THREE.BoxGeometry(b.w+0.14,0.14,b.d+0.14),new THREE.MeshLambertMaterial({color:0xb8a878}));
      roofM.position.y=totalH+PH+0.07; roofM.castShadow=true; grp.add(roofM);
      const pMat=new THREE.MeshLambertMaterial({color:0xd8c8a8});
      [[b.w+0.26,0.2,0.12,0,0,b.d/2+0.07],[b.w+0.26,0.2,0.12,0,0,-b.d/2-0.07],[0.12,0.2,b.d,b.w/2+0.07,0,0],[0.12,0.2,b.d,-b.w/2-0.07,0,0]].forEach(([pw,ph,pd,px,py,pz])=>{
        const pm=new THREE.Mesh(new THREE.BoxGeometry(pw,ph,pd),pMat); pm.position.set(px,totalH+PH+0.14+ph/2,pz); grp.add(pm);
      });
      if(b.isMain||b.h>=4){
        const epW=Math.min(b.w*0.5,2.4);
        const porch=new THREE.Mesh(new THREE.BoxGeometry(epW,totalH*0.55,0.38),new THREE.MeshLambertMaterial({color:0xeadcc8}));
        porch.position.set(0,totalH*0.275+PH,b.d/2+0.19); grp.add(porch);
        const archM=new THREE.Mesh(new THREE.BoxGeometry(epW*0.58,totalH*0.4,0.42),new THREE.MeshLambertMaterial({color:0x1a1a2a}));
        archM.position.set(0,totalH*0.2+PH,b.d/2+0.21); grp.add(archM);
        [-epW*0.4,epW*0.4].forEach(cx=>{const col=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.13,totalH*0.55,8),new THREE.MeshLambertMaterial({color:0xf0e4d0}));col.position.set(cx,totalH*0.275+PH,b.d/2+0.26);grp.add(col);});
      }
      if(b.type==='medical'){const cMat=new THREE.MeshLambertMaterial({color:0x22aa44});const c1=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.06,0.09),cMat);const c2=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.06,0.32),cMat);c1.position.set(b.w*0.42,totalH+PH+0.38,0);c2.position.set(b.w*0.42,totalH+PH+0.38,0);grp.add(c1,c2);}
      if(b.type==='library'){const glassM=new THREE.Mesh(new THREE.BoxGeometry(b.w*0.7,totalH*0.9,0.07),new THREE.MeshLambertMaterial({color:0x88aacc,transparent:true,opacity:0.55}));glassM.position.set(0,totalH*0.45+PH,b.d/2+0.045);grp.add(glassM);}
      if(b.type==='gate'){const archG=new THREE.Mesh(new THREE.BoxGeometry(b.w*0.5,totalH*0.65,b.d*1.1),new THREE.MeshLambertMaterial({color:0x111122}));archG.position.y=totalH*0.32+PH;grp.add(archG);}
      if(b.w>2){for(let i=0;i<Math.min(Math.ceil(b.w),4);i++){const tank=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.2,8),new THREE.MeshLambertMaterial({color:0x8899aa}));tank.position.set(-b.w/2+0.4+i*(b.w/4),totalH+PH+0.14+0.3,b.d/2-0.32);grp.add(tank);}}
    }

    const lblH=b.isPlaza?2.5:b.isField?0.5:(b.h*0.38+PH+0.14+0.55);
    const lbl=mkLabelSprite(b.id,b.name); lbl.position.set(0,lblH,0); grp.add(lbl);
    grp.position.set(b.x,0,b.z); grp.rotation.y=(b.rot||0)*Math.PI/180; scene.add(grp);
    if(bObjs[b.id]){bObjs[b.id].grp=grp;bObjs[b.id].body=bodyMesh;bObjs[b.id].label=lbl;}
    else{bObjs[b.id]={grp,body:bodyMesh,label:lbl};}
    if(bodyMesh&&!b.isField&&!b.isPlaza){bodyMesh.userData.buildingId=b.id;pickable.push(bodyMesh);}
  }

  function destroyOne(id){
    const obj=bObjs[id]; if(!obj)return;
    scene.remove(obj.grp);
    for(let i=pickable.length-1;i>=0;i--){if(pickable[i].userData.buildingId===id)pickable.splice(i,1);}
    delete bObjs[id];
  }

  DB.forEach(b=>buildOne(b));

  // ── SPRAY ──
  const spray=[];
  for(let i=0;i<55;i++){
    const sm=new THREE.Mesh(new THREE.SphereGeometry(0.028,4,4),new THREE.MeshLambertMaterial({color:0x88d8f8,transparent:true,opacity:0.7}));
    scene.add(sm); spray.push({mesh:sm,t:Math.random()*Math.PI*2,angle:Math.random()*Math.PI*2,spd:0.75+Math.random()*0.5});
  }

  // ── PEOPLE ──
  const people=[];
  for(let i=0;i<32;i++){
    const g=new THREE.Group();
    const body=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.055,0.22,5),new THREE.MeshLambertMaterial({color:[0x334488,0x883344,0x448833,0x444444,0x886644][i%5]}));
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.065,5,4),new THREE.MeshLambertMaterial({color:0xe8c8a0}));
    head.position.y=0.2; g.add(body,head);
    const px=(Math.random()-.5)*28,pz=(Math.random()-.5)*28;
    g.position.set(px,0.13,pz); g.castShadow=true; scene.add(g);
    people.push({mesh:g,ox:px,oz:pz,angle:Math.random()*Math.PI*2,spd:0.004+Math.random()*.004,r:0.8+Math.random()*1.5});
  }

  // ── CARS ──
  const carMeshes=[];
  [[t=>({x:Math.sin(t)*14,z:15}),0xcc3333],[t=>({x:Math.sin(t*1.3)*12,z:-15}),0x3366cc],[t=>({x:15,z:Math.cos(t*.8)*12}),0x888888],[t=>({x:-15,z:Math.cos(t*1.1)*10}),0xccaa22]].forEach(([path,col])=>{
    const cg=new THREE.Group();
    const body=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.18,0.28),new THREE.MeshLambertMaterial({color:col}));
    const cab=new THREE.Mesh(new THREE.BoxGeometry(0.33,0.14,0.24),new THREE.MeshLambertMaterial({color:0x334455}));
    cab.position.y=0.16; cg.add(body,cab); cg.position.set(0,0.15,0); cg.castShadow=true; scene.add(cg);
    carMeshes.push({mesh:cg,path,t:Math.random()*Math.PI*2});
  });

  // ── CAMERA ──
  let theta=0.52,phi=1.05,radius=40,dragStart=null,lastMouse={x:0,y:0};
  const settings={anim:true,cars:true,people:true,fountain:true,labels:true,shadows:true};

  function camUpdate(){
    camera.position.set(radius*Math.sin(theta)*Math.sin(phi),radius*Math.cos(phi),radius*Math.cos(theta)*Math.sin(phi));
    camera.lookAt(0,0,0);
  }
  camUpdate();

  renderer.domElement.addEventListener('mousedown',e=>{dragStart={x:e.clientX,y:e.clientY};lastMouse={x:e.clientX,y:e.clientY};document.body.classList.add('grab');});
  window.addEventListener('mousemove',e=>{if(!dragStart)return;theta-=(e.clientX-lastMouse.x)*0.007;phi=Math.max(0.14,Math.min(1.52,phi+(e.clientY-lastMouse.y)*0.007));lastMouse={x:e.clientX,y:e.clientY};camUpdate();});
  window.addEventListener('mouseup',e=>{document.body.classList.remove('grab');if(dragStart&&Math.hypot(e.clientX-dragStart.x,e.clientY-dragStart.y)<5)doClick(e);dragStart=null;});
  renderer.domElement.addEventListener('wheel',e=>{radius=Math.max(6,Math.min(75,radius+e.deltaY*0.05));camUpdate();},{passive:true});
  let ts=null;
  renderer.domElement.addEventListener('touchstart',e=>{ts={x:e.touches[0].clientX,y:e.touches[0].clientY};lastMouse={...ts};},{passive:true});
  renderer.domElement.addEventListener('touchmove',e=>{if(!ts)return;theta-=(e.touches[0].clientX-lastMouse.x)*0.009;phi=Math.max(.14,Math.min(1.52,phi+(e.touches[0].clientY-lastMouse.y)*0.009));lastMouse={x:e.touches[0].clientX,y:e.touches[0].clientY};camUpdate();},{passive:true});
  renderer.domElement.addEventListener('touchend',e=>{if(ts&&Math.hypot(e.changedTouches[0].clientX-ts.x,e.changedTouches[0].clientY-ts.y)<10)doClick({clientX:e.changedTouches[0].clientX,clientY:e.changedTouches[0].clientY});ts=null;});

  // ── SELECTION ──
  const raycaster=new THREE.Raycaster(),mP=new THREE.Vector2();
  let selectedId=null;

  function doClick(e){
    const rect=renderer.domElement.getBoundingClientRect();
    mP.x=((e.clientX-rect.left)/rect.width)*2-1;
    mP.y=-((e.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(mP,camera);
    const hits=raycaster.intersectObjects(pickable);
    if(hits.length) selectBuilding(hits[0].object.userData.buildingId);
  }

  function selectBuilding(id){
    selectedId=id;
    const b=DB.find(x=>x.id===id); if(!b)return;
    pickable.forEach(m=>{const bd=DB.find(x=>x.id===m.userData.buildingId);if(bd&&m.material)m.material.color.setHex(bd.color);});
    const obj=bObjs[id]; if(obj?.body?.material)obj.body.material.color.setHex(0xffdd55);
    const ipEl=document.getElementById('ip-num'); if(ipEl){
      document.getElementById('ip-num').textContent=b.id;
      document.getElementById('ip-name').textContent=b.name;
      document.getElementById('ip-type').textContent=(TEMOJI[b.type]||'🏢')+' '+(TLABELS[b.type]||b.type);
      document.getElementById('info-popup').classList.add('show');
    }
    if(isAdmin && window.onBuildingSelected) window.onBuildingSelected(b);
  }

  // ── ANIMATION ──
  let T=0; const CLK=new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const dt=CLK.getDelta(); if(settings.anim)T+=dt;
    if(settings.cars)carMeshes.forEach(c=>{c.t+=0.003;const p=c.path(c.t),pp=c.path(c.t-0.003);c.mesh.position.x=p.x;c.mesh.position.z=p.z;c.mesh.rotation.y=-Math.atan2(p.x-pp.x,p.z-pp.z);});
    if(settings.people)people.forEach(p=>{p.angle+=p.spd;p.mesh.position.x=p.ox+Math.cos(p.angle)*p.r;p.mesh.position.z=p.oz+Math.sin(p.angle)*p.r;p.mesh.rotation.y=-p.angle;});
    if(settings.fountain)spray.forEach(sp=>{sp.t+=dt*sp.spd*2.4;const prog=sp.t%1.0,h=Math.sin(prog*Math.PI)*0.95,rad=prog*0.45;const plaza=DB.find(x=>x.isPlaza);if(plaza){sp.mesh.position.set(plaza.x+Math.cos(sp.angle)*rad,0.38+h,plaza.z+Math.sin(sp.angle)*rad);}sp.mesh.material.opacity=0.72*Math.sin(prog*Math.PI);});
    const plzE=DB.find(x=>x.isPlaza); if(plzE&&bObjs[plzE.id]?.water)bObjs[plzE.id].water.material.opacity=0.65+Math.sin(T*2.2)*0.1;
    sunL.position.x=Math.cos(T*0.007)*22; sunL.position.z=Math.sin(T*0.007)*14;
    renderer.render(scene,camera);
  }
  animate();

  window.addEventListener('resize',()=>{camera.aspect=getW()/getH();camera.updateProjectionMatrix();renderer.setSize(getW(),getH());});

  // ── PUBLIC API ──
  return {
    scene, camera, renderer, sunL, skyMat, settings, bObjs, pickable, DB,
    buildOne, destroyOne, selectBuilding,
    camReset(){ theta=.52;phi=1.05;radius=40;camUpdate(); },
    camTop(){ phi=.12;radius=50;camUpdate(); },
    camZoom(d){ radius=Math.max(6,Math.min(75,radius-d*5));camUpdate(); },
    focusOn(b){ theta=Math.atan2(b.x,b.z)+0.35;phi=0.88;radius=18;camUpdate(); },
    setLabels(v){ Object.values(bObjs).forEach(o=>{if(o.label)o.label.visible=v;}); },
    setTOD(h){
      if(h<6||h>20){skyMat.uniforms.topC.value.set(.05,.05,.15);skyMat.uniforms.botC.value.set(.1,.1,.2);sunL.intensity=.2;}
      else if(h<8){skyMat.uniforms.topC.value.set(.3,.5,.8);skyMat.uniforms.botC.value.set(.85,.55,.3);sunL.intensity=.9;sunL.color.set(0xffaa44);}
      else if(h<17){skyMat.uniforms.topC.value.set(.1,.4,.7);skyMat.uniforms.botC.value.set(.5,.75,.92);sunL.intensity=2.2;sunL.color.set(0xfff5e0);}
      else{skyMat.uniforms.topC.value.set(.2,.3,.6);skyMat.uniforms.botC.value.set(.8,.5,.25);sunL.intensity=.9;sunL.color.set(0xff8844);}
    }
  };
}