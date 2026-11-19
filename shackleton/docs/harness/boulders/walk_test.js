(()=>{ const G=shackletonScene.getGroundY; const rc=new THREE.Raycaster(), dn=new THREE.Vector3(0,-1,0), o3=new THREE.Vector3();
 rescueSit.active=false; astroSeat.want=false; refill.connected=false; __step(3);
 const meshes=[]; scene.traverse(o=>{ if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||!o.geometry) return; let p=o,vis=true; while(p){ if(!p.visible) vis=false; p=p.parent; } if(!vis) return;
   const t=o.geometry.type, m=o.material; let cls=null; const wp=o.getWorldPosition(new THREE.Vector3()); const hex=m.color?m.color.getHexString():'';
   const inIce=Math.hypot(wp.x-ICE_POCKET.x, wp.z-ICE_POCKET.z)<14, inStack=Math.hypot(wp.x-rescue.cx, wp.z-rescue.cz)<16;
   if(t==='IcosahedronGeometry' && m===boulderFloorMat){ const sy=o.scale.y; cls = sy>=0.5?'floor-big':(sy>=0.2?'floor-medium':'floor-small'); }
   else if(t==='IcosahedronGeometry' && m===boulderMat) cls='wall';
   else if(t==='BoxGeometry' && m===boulderMat && inStack) cls = o.scale.x<0.9 ? null : 'stack-block';
   else if(inIce && hex==='ffffff' && (t==='IcosahedronGeometry'||t==='DodecahedronGeometry')) cls = t==='DodecahedronGeometry' ? 'ice-shade-boulder' : 'ice-ridge';
   else if(inIce && hex==='6f8fc0') cls='ice-crystals';
   else if(inIce && t==='DodecahedronGeometry') cls='ice-chunk';
   else if(hex==='a89888') cls='study-rock';
   if(cls) meshes.push({o,cls,wp}); });
 const lim=CRATER_FLOOR-0.6, med=colliders.filter(c=>!c.rock), P=player.pos, V=player.vel; const gp=player.grounded; player.grounded=true;
 const vt=(o,x,z,ymax)=>{ rc.set(o3.set(x,ymax+1,z),dn); rc.far=40; const h=rc.intersectObject(o,false); return h.length?h[0].point.y:-1e9; };
 const stepTo=(nx,nz)=>{ const px=P.x, pz=P.z; P.x=nx; P.z=nz;
   for(const c of med){ if(P.y>c.h+0.4) continue; const dx=P.x-c.x, dz=P.z-c.z, d2=dx*dx+dz*dz, md=c.r+0.35; if(d2<md*md){ const d=Math.sqrt(d2)||1e-3; P.x=c.x+dx/d*md; P.z=c.z+dz/d*md; } }
   rockResolvePlayer(px,pz); rockShoulders(px,pz); boxResolvePlayer(P,V); P.y=playerGroundY(P.x,P.z,P.y); };
 const okStart=(x,z)=>{ const g=G(x,z); if(rockTopAt(x,z)>g+0.2) return false; for(const c of med){ if(Math.hypot(x-c.x,z-c.z)<c.r+0.4) return false; } const p={x,y:g,z},v={x:0,y:0,z:0}; boxResolvePlayer(p,v); if(Math.hypot(p.x-x,p.z-z)>1e-4) return false; return boxTopAt(x,z,g+0.46)<=g+0.02; };
 const walk=(sx,sz,ux,uz,maxD)=>{ P.set(sx,G(sx,sz),sz); P.y=playerGroundY(sx,sz,P.y); let still=0, d=0; while(d<maxD){ const bx=P.x,bz=P.z; stepTo(P.x+ux*0.025, P.z+uz*0.025); d+=0.025; if(Math.hypot(P.x-bx,P.z-bz)<0.003){ if(++still>25) break; } else still=0; } };
 const overlap=(M,bb)=>{ let mx=0; const y=P.y; for(let a=-1;a<12;a++){ const r=a<0?0:0.2, x=P.x+Math.cos(a*Math.PI/6)*r, z=P.z+Math.sin(a*Math.PI/6)*r; const v=vt(M.o,x,z,bb.max.y); if(v>-1e8) mx=Math.max(mx, v-y); } return mx; };
 const stats={};
 for(const M of meshes){ const o=M.o; o.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(o), c=bb.getCenter(new THREE.Vector3()); const R=Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)/2;
   const S=stats[M.cls]||(stats[M.cls]={n:0, tested:0, runs:0, knee:0, waist:0, worst:[], h:[]}); S.n++; if(Math.hypot(c.x,c.z)+R+2.6>lim) continue; S.tested++;
   const h=bb.max.y-G(c.x,c.z); S.h.push(h); let wm=0, wd=null;
   for(let a=0;a<8;a++){ const ang=a*Math.PI/4, ux=-Math.cos(ang), uz=-Math.sin(ang); if(!okStart(c.x-ux*(R+2.2), c.z-uz*(R+2.2))){ S.skipped=(S.skipped||0)+1; continue; } walk(c.x-ux*(R+2.2), c.z-uz*(R+2.2), ux, uz, 2*R+4.4); const ov=overlap(M,bb); S.runs++; if(ov>0.45) S.knee++; if(ov>1.0) S.waist++; if(ov>wm){ wm=ov; wd='head-on '+(a*45)+'°'; } }
   for(let a=0;a<4;a++){ const ang=a*Math.PI/2, ux=-Math.cos(ang), uz=-Math.sin(ang), lx=-uz, lz=ux; // a line that passes off-centre, 60% of the way out
     let worstHere=0; const off=R*0.6; if(!okStart(c.x-ux*(R+2.2)+lx*off, c.z-uz*(R+2.2)+lz*off)){ S.skipped=(S.skipped||0)+1; continue; } P.set(c.x-ux*(R+2.2)+lx*off, 0, c.z-uz*(R+2.2)+lz*off); P.y=playerGroundY(P.x,P.z,G(P.x,P.z)); let still=0, d=0; while(d<2*R+4.4){ const bx=P.x,bz=P.z; stepTo(P.x+ux*0.025,P.z+uz*0.025); d+=0.025; if(d%0.1<0.026){ const ov=overlap(M,bb); if(ov>worstHere) worstHere=ov; } if(Math.hypot(P.x-bx,P.z-bz)<0.003){ if(++still>25) break; } else still=0; }
     S.runs++; if(worstHere>0.45) S.knee++; if(worstHere>1.0) S.waist++; if(worstHere>wm){ wm=worstHere; wd='glancing '+(a*90)+'°'; } }
   if(wm>0.45) S.worst.push({over:+wm.toFixed(2), how:wd, at:[+c.x.toFixed(1),+c.z.toFixed(1)], h:+h.toFixed(2)}); }
 player.grounded=gp; const out={};
 for(const k in stats){ const S=stats[k]; S.worst.sort((a,b)=>b.over-a.over); S.h.sort((a,b)=>a-b); out[k]={n:S.n, tested:S.tested, runs:S.runs, skipped:S.skipped||0, bodyInRockOverKnee:S.knee, overWaist:S.waist, bouldersAffected:S.worst.length, tallest:+(S.h[S.h.length-1]||0).toFixed(2), worst:S.worst.slice(0,4)}; }
 out._fields=rockFields.length; out._stack=[rescue.cx,rescue.cz]; return out; })()
