(()=>{ const G=shackletonScene.getGroundY; rescueSit.active=false; astroSeat.want=false; refill.connected=false; __step(3); const P=player.pos, V=player.vel; player.grounded=true; const med=colliders.filter(c=>!c.rock);
 const stepTo=(nx,nz)=>{ const px=P.x,pz=P.z; P.x=nx; P.z=nz; for(const c of med){ if(P.y>c.h+0.4) continue; const dx=P.x-c.x,dz=P.z-c.z,d2=dx*dx+dz*dz,md=c.r+0.35; if(d2<md*md){ const d=Math.sqrt(d2)||1e-3; P.x=c.x+dx/d*md; P.z=c.z+dz/d*md; } } rockResolvePlayer(px,pz); rockShoulders(px,pz); boxResolvePlayer(P,V); P.y=playerGroundY(P.x,P.z,P.y); };
 const go=(tx,tz)=>{ let n=0, still=0; while(n<4000){ const dx=tx-P.x, dz=tz-P.z, L=Math.hypot(dx,dz); if(L<0.15) return 0; const bx=P.x,bz=P.z; stepTo(P.x+dx/L*0.025, P.z+dz/L*0.025); n++; if(Math.hypot(P.x-bx,P.z-bz)<0.002){ if(++still>40) break; } else still=0; } return +Math.hypot(tx-P.x,tz-P.z).toFixed(2); };
 const I=ICE_POCKET, out={};
 const route=(name,pts)=>{ P.set(I.x+pts[0][0],0,I.z+pts[0][1]); P.y=G(P.x,P.z); const res=[]; for(const p of pts.slice(1)) res.push(go(I.x+p[0], I.z+p[1])); out[name]=res; };
 route('east side: F2 → F1 → F3 footings', [[8,-1.2],[3.9,-1.2],[4.0,2.5],[3.8,6.0]]);
 route('round the south end to the reflector', [[4,-1.2],[4,-6],[-2.5,-6],[-2.6,2.4]]);
 route('round the north end to the reflector', [[4,6],[4,9.5],[-2.5,9.5],[-2.6,3.6]]);
 route('reflector → beside the ice and the chunk', [[-2.6,3.0],[-2.6,1.0],[-1.2,-0.6]]);
 route('through the gap in the ridge (v 2.4)', [[3.5,2.4],[-2.0,2.4]]);
 out.note='each number is the distance left to that waypoint (0 = reached)';
 const s=STUDY_ROCK_POS; out.studySpot={ rockAtRobotSpot:+(Math.max(-9,rockTopAt(s.x+1.2,s.z+0.6)-G(s.x+1.2,s.z+0.6))).toFixed(2) };
 P.set(s.x+4,0,s.z+3); P.y=G(P.x,P.z); out.studySpot.playerToSpot=go(s.x+1.6,s.z+0.9);
 return out; })()
