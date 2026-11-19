(()=>{ rescueSit.active=false; astroSeat.want=false; refill.connected=false; __step(5);
 const C=rescue, G=shackletonScene.getGroundY, g0=C.g0; const out=[];
 const tryJump=(x,z,vx,vz,label)=>{ player.pos.set(x, Math.max(G(x,z), boxTopAt(x,z,1e9)>-1e8?0:0), z); player.pos.y = (()=>{ let y=G(x,z); for(const s of C.steps.concat([C.top])){ if(Math.abs(x-s.x)<=3.5&&Math.abs(z-s.z)<=3.5) y=Math.max(y,s.y1);} return y; })();
   player.vel.set(0,0,0); player.grounded=true; player.jumpAvailable=true; keys[' ']=false; __step(3);
   player.vel.x=vx; player.vel.z=vz; player.heading=Math.atan2(vx,vz); keys[' ']=true; __step(1); keys[' ']=false;
   let apex=-1e9, n=0; const y0=player.pos.y; while(n<400){ __step(1); n++; apex=Math.max(apex,player.pos.y); if(player.grounded && n>5) break; }
   out.push({label, from:+(y0-g0).toFixed(2), apex:+(apex-y0).toFixed(2), air:+(n/60).toFixed(2), land:+(player.pos.y-g0).toFixed(2), dx:+(player.pos.x-x).toFixed(1), dz:+(player.pos.z-z).toFixed(1), wp: document.getElementById('waypoint').textContent}); };
 const s=C.steps; const half=(b)=>b===C.top?[3.5,3.7]:(b===s[2]?[3.8,3.8]:[3.5,3.5]);
 const inB=(x,z,b)=>{const h=half(b); return Math.abs(x-b.x)<=h[0]&&Math.abs(z-b.z)<=h[1];};
 // walk from a's centre toward b's centre; take off `lead` metres before leaving a
 const hop=(a,b,sp,lead,label)=>{ const dx=b.x-a.x, dz=b.z-a.z, L=Math.hypot(dx,dz), ux=dx/L, uz=dz/L; let t=0; while(inB(a.x+ux*t,a.z+uz*t,a)) t+=0.05; t-=lead;
   const x=a.x+ux*t, z=a.z+uz*t; player.pos.set(x,a.y1,z); player.vel.set(0,0,0); player.grounded=true; player.jumpAvailable=true; keys[' ']=false; __step(3);
   player.vel.x=ux*sp; player.vel.z=uz*sp; player.heading=Math.atan2(ux,uz); keys[' ']=true; __step(1); keys[' ']=false; let n=0; while(n<400){__step(1);n++; if(player.grounded&&n>5)break;}
   out.push({label, lead, land:+(player.pos.y-g0).toFixed(2), want:+(b.y1-g0).toFixed(1)}); };
 // distance from the next block's face at take-off, walking straight at it
 const face=(a,b,sp,d,label)=>{ const dx=b.x-a.x, dz=b.z-a.z, L=Math.hypot(dx,dz), ux=dx/L, uz=dz/L; let t=0; while(!inB(a.x+ux*t,a.z+uz*t,b)) t+=0.02; t-=d;
   const x=a.x+ux*t, z=a.z+uz*t; if(!inB(x,z,a)){ out.push({label,d,skip:'not on the lower block'}); return; } player.pos.set(x,a.y1,z); player.vel.set(0,0,0); player.grounded=true; player.jumpAvailable=true; keys[' ']=false; __step(3);
   player.vel.x=ux*sp; player.vel.z=uz*sp; player.heading=Math.atan2(ux,uz); keys[' ']=true; __step(1); keys[' ']=false; let n=0; while(n<400){__step(1);n++; if(player.grounded&&n>5)break;}
   out.push({label, d, ok: Math.abs(player.pos.y-b.y1)<0.05}); };
 const pairs=[[s[0],s[1],'1→2'],[s[1],s[2],'2→3'],[s[2],C.top,'3→top']];
 for(const [a,b,l] of pairs) for(const d of [0.6,0.9,1.2,1.6,2.0,2.5,3.0,3.5]) face(a,b,1.5,d,l+' walk');
 for(const [a,b,l] of pairs) for(const d of [1.5,3.0,4.5]) face(a,b,3.5,d,l+' jog');
 const G2=shackletonScene.getGroundY; for(const d of [0.6,0.9,1.2,1.6,2.0,2.5,3.0,3.5]){ const x=s[0].x-3.5-d, z=s[0].z; player.pos.set(x,G2(x,z),z); player.vel.set(0,0,0); player.grounded=true; player.jumpAvailable=true; __step(3); player.vel.x=1.5; player.heading=Math.PI/2; keys[' ']=true; __step(1); keys[' ']=false; let n=0; while(n<400){__step(1);n++; if(player.grounded&&n>5)break;} out.push({label:'ground→1 walk', d, ok: Math.abs(player.pos.y-s[0].y1)<0.05}); }
 return out; })()
