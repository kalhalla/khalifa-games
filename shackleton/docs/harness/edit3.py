import subprocess, os
R='/tmp/full3'; R2='/tmp/full'; C='/home/claude/h/cap'; E='/tmp/enc3'; os.makedirs(E,exist_ok=True)
V=['-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-r','30','-video_track_timescale','30000']
def run(a): subprocess.run(['ffmpeg','-y','-loglevel','error']+a,check=True)
def clip(src, name, s0, n, cap=None, ci=0, co=0, fo=0, out=None):
    d=n/30; inp=['-framerate','30','-start_number',str(s0),'-i',f'{src}/{name}/f%04d.jpg']
    if cap:
        inp+=['-loop','1','-framerate','30','-i',f'{C}/{cap}']
        fc=f"[1:v]format=rgba,fade=t=in:st={ci}:d=0.3:alpha=1,fade=t=out:st={co-0.3}:d=0.3:alpha=1[c];[0:v][c]overlay=0:0:shortest=1"
    else: fc="[0:v]null"
    if fo: fc+=f",fade=t=out:st={d-fo}:d={fo}"
    fc+=f",trim=duration={d},format=yuv420p[v]"
    out=out or f'{E}/{name}.mp4'
    run(inp+['-filter_complex',fc,'-map','[v]','-frames:v',str(n)]+V+[out]); return out
files=[]
files.append(clip(R2,'open',90,84))
files.append(clip(R,'found',0,75,'found.png',1.0,2.4))
files.append(clip(R,'wreck',0,72,'ship.png',0.4,2.3))
files.append(clip(R,'walk',0,84,'robots.png',0.3,2.7))
files.append(clip(R,'airout',8,48))
files.append(clip(R,'airin',60,45))
files.append(clip(R,'power',12,66,'power.png',1.0,2.15))
# quick cuts: stabiliser panel, brace with M-08, rescue jump — one caption across them
cuts=[clip(R,'stab',6,30), clip(R,'brace',40,33), clip(R,'rescue',20,33)]
open(f'{E}/cuts.txt','w').write(''.join(f"file '{f}'\n" for f in cuts))
run(['-f','concat','-safe','0','-i',f'{E}/cuts.txt','-c','copy',f'{E}/cuts_raw.mp4'])
run(['-i',f'{E}/cuts_raw.mp4','-loop','1','-framerate','30','-i',f'{C}/rebuild.png','-filter_complex',
     "[1:v]format=rgba,fade=t=in:st=0.15:d=0.25:alpha=1,fade=t=out:st=2.95:d=0.25:alpha=1[c];[0:v][c]overlay=0:0:shortest=1,trim=duration=3.2,format=yuv420p[v]",'-map','[v]','-frames:v','96']+V+[f'{E}/cuts.mp4'])
files.append(f'{E}/cuts.mp4')
files.append(clip(R,'ice',0,66,'water.png',0.3,2.1))
files.append(clip(R,'radio',0,39))
files.append(clip(R,'earth',0,57,'call.png',0.2,1.8,0.35))
run(['-f','lavfi','-i','color=black:s=1920x1080:r=30','-loop','1','-framerate','30','-i',f'{C}/elias.png','-filter_complex',
     "[1:v]format=rgba,fade=t=in:st=0.15:d=0.5:alpha=1[c];[0:v][c]overlay=0:0,trim=duration=1.5,format=yuv420p[v]",'-map','[v]','-frames:v','45']+V+[f'{E}/elias.mp4']); files.append(f'{E}/elias.mp4')
run(['-framerate','30','-loop','1','-i',f'{C}/title.png','-vf','format=yuv420p,trim=duration=2.6','-frames:v','78']+V+[f'{E}/title.mp4']); files.append(f'{E}/title.mp4')
open(f'{E}/list.txt','w').write(''.join(f"file '{f}'\n" for f in files))
run(['-f','concat','-safe','0','-i',f'{E}/list.txt','-c','copy',f'{E}/video.mp4'])
out='/tmp/shackleton_trailer_v3_1080p.mp4'
run(['-i',f'{E}/video.mp4','-ss','1.5','-i','/home/claude/h/music/shackleton_trailer_cue.wav','-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','256k','-shortest','-movflags','+faststart',out])
print(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration,bit_rate:stream=codec_name,width,height,r_frame_rate','-of','compact',out],capture_output=True,text=True).stdout)
