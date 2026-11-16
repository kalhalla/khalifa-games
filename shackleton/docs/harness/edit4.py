import subprocess, os
R='/tmp/full4'; C='/home/claude/h/cap4'; E='/tmp/enc4'; os.makedirs(E,exist_ok=True)
V=['-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-r','30','-video_track_timescale','30000']
def run(a): subprocess.run(['nice','-n','5','ffmpeg','-y','-loglevel','error']+a,check=True)
def build(inp, n, ovs, out, fo=0, fi=0):
    """inp: ffmpeg input args for the base; ovs: [(png, tin, tout, fade_in, fade_out)]"""
    d=n/30; args=list(inp); fc=[]; last='[0:v]'
    for k,(png,a,b,fin,fout) in enumerate(ovs):
        args+=['-loop','1','-framerate','30','-i',f'{C}/{png}']
        f=f"[{k+1}:v]format=rgba"
        if fin: f+=f",fade=t=in:st={a}:d={fin}:alpha=1"
        if fout: f+=f",fade=t=out:st={b-fout}:d={fout}:alpha=1"
        f+=f"[o{k}]"; fc.append(f)
        fc.append(f"{last}[o{k}]overlay=0:0:shortest=1:enable='between(t,{a},{b})'[b{k}]"); last=f'[b{k}]'
    tail=last+("" if not fc else "")
    post="null"
    if fi: post+=f",fade=t=in:st=0:d={fi}"
    if fo: post+=f",fade=t=out:st={d-fo}:d={fo}"
    fc.append(f"{last}{post},trim=duration={d},format=yuv420p[v]")
    run(args+['-filter_complex',';'.join(fc),'-map','[v]','-frames:v',str(n)]+V+[out]); return out
def frames(name,s0): return ['-framerate','30','-start_number',str(s0),'-i',f'{R}/{name}/f%04d.jpg']
def black(n): return ['-f','lavfi','-i',f'color=black:s=1920x1080:r=30:d={n/30+0.5}']
F=[]
# 1. radio static on black
F.append(build(['-f','lavfi','-i','color=0x050608:s=1920x1080:r=30:d=4,noise=alls=10:allf=t'],90,
   [('r1a.png',0.4,1.2,0.15,0),('r1b.png',1.2,2.0,0,0),('r1c.png',2.0,3.0,0,0.25)],f'{E}/01.mp4'))
F.append(build(frames('open',90),90,[('wake.png',0.6,2.9,0.3,0.3)],f'{E}/02.mp4',fi=0.4))
F.append(build(frames('wreck',0),78,[('ship.png',0.4,2.5,0.3,0.3)],f'{E}/03.mp4'))
F.append(build(frames('lost',0),90,[('lost.png',0.4,2.9,0.3,0.3)],f'{E}/04.mp4'))
F.append(build(frames('found',0),75,[('robots.png',0.3,2.45,0.3,0.3)],f'{E}/05.mp4'))
F.append(build(frames('walk',0),60,[],f'{E}/06.mp4'))
F.append(build(frames('airout',6),45,[],f'{E}/07.mp4'))
F.append(build(frames('airin',60),45,[],f'{E}/08.mp4'))
F.append(build(frames('power',12),66,[],f'{E}/09.mp4',fo=0.2))
# memory flash: white flash, the fragment's lines, then the card
run(['-f','lavfi','-i','color=white:s=1920x1080:r=30:d=0.3','-vf','fade=t=out:st=0.05:d=0.25,format=yuv420p','-frames:v','8']+V+[f'{E}/10a.mp4'])
build(['-loop','1','-framerate','30','-i',f'{C}/mem.png'],37,[],f'{E}/10b.mp4',fi=0.2,fo=0.25)
build(['-loop','1','-framerate','30','-i',f'{C}/pieces.png'],30,[],f'{E}/10c.mp4',fi=0.2,fo=0.25)
open(f'{E}/mem.txt','w').write(''.join(f"file '{E}/{x}'\n" for x in ['10a.mp4','10b.mp4','10c.mp4']))
run(['-f','concat','-safe','0','-i',f'{E}/mem.txt','-c','copy',f'{E}/10.mp4']); F.append(f'{E}/10.mp4')
F.append(build(frames('flyerA',0),90,[('r2a.png',0.3,1.3,0.2,0),('r2b.png',1.3,3.0,0,0.25)],f'{E}/11.mp4'))
F.append(build(frames('flyerB',0),75,[('flyer.png',0.2,2.5,0.3,0.3)],f'{E}/12.mp4'))
cuts=[build(frames('stab',6),30,[],f'{E}/13a.mp4'), build(frames('brace',40),33,[],f'{E}/13b.mp4'),
      build(frames('ice',20),36,[],f'{E}/13c.mp4'), build(frames('rescue',20),33,[],f'{E}/13d.mp4')]
open(f'{E}/cuts.txt','w').write(''.join(f"file '{x}'\n" for x in cuts))
run(['-f','concat','-safe','0','-i',f'{E}/cuts.txt','-c','copy',f'{E}/13raw.mp4'])
F.append(build(['-i',f'{E}/13raw.mp4'],132,[('rebuild.png',0.15,4.3,0.25,0.25)],f'{E}/13.mp4'))
F.append(build(frames('earth2',0),135,[('r3a.png',0.5,2.1,0.2,0),('r3b.png',2.1,4.4,0,0.3)],f'{E}/14.mp4',fo=0.4))
for k,q in enumerate(['q1.png','q2.png','q3.png']):
    F.append(build(['-loop','1','-framerate','30','-i',f'{C}/{q}'],66,[],f'{E}/15{k}.mp4',fi=0.3,fo=0.35))
F.append(build(['-loop','1','-framerate','30','-i',f'{C}/title.png'],90,[],f'{E}/16.mp4',fi=0.05))
open(f'{E}/list.txt','w').write(''.join(f"file '{x}'\n" for x in F))
run(['-f','concat','-safe','0','-i',f'{E}/list.txt','-c','copy',f'{E}/video.mp4'])
out='/tmp/shackleton_trailer_v4_1080p.mp4'
run(['-i',f'{E}/video.mp4','-ss','0.8','-i','/home/claude/h/music/shackleton_trailer_v4_cue.wav','-map','0:v','-map','1:a','-c:v','copy','-af','afade=t=out:st=47.2:d=0.6','-c:a','aac','-b:a','256k','-shortest','-movflags','+faststart',out])
print(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration,bit_rate:stream=codec_name,width,height,r_frame_rate','-of','compact',out],capture_output=True,text=True).stdout)
