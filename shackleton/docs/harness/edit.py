import subprocess, os
R='/tmp/full'; C='/home/claude/h/cap'; E='/tmp/enc'; os.makedirs(E,exist_ok=True)
V=['-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-r','30','-video_track_timescale','30000']
def run(a): subprocess.run(['ffmpeg','-y','-loglevel','error']+a,check=True)
# (name, start frame, frames, caption, cap_in, cap_out, fade_out)
scenes=[('open',90,84,None,0,0,0),
 ('found',0,84,'found.png',1.0,2.8,0),
 ('wreck',0,84,'ship.png',0.4,2.6,0),
 ('walk',0,90,'robots.png',0.3,2.8,0),
 ('eyes',0,45,None,0,0,0),
 ('airout',6,60,None,0,0,0),
 ('airin',52,54,None,0,0,0),
 ('power',12,66,'power.png',1.0,2.2,0),
 ('radio',0,42,None,0,0,0),
 ('ice',0,66,'water.png',0.3,2.1,0),
 ('earth',0,57,'call.png',0.2,1.8,0.35)]
files=[]
for name,s0,n,cap,ci,co,fo in scenes:
    d=n/30; inp=['-framerate','30','-start_number',str(s0),'-i',f'{R}/{name}/f%04d.jpg']
    if cap:
        inp+=['-loop','1','-framerate','30','-i',f'{C}/{cap}']
        fc=f"[1:v]format=rgba,fade=t=in:st={ci}:d=0.3:alpha=1,fade=t=out:st={co-0.3}:d=0.3:alpha=1[c];[0:v][c]overlay=0:0:shortest=1"
    else: fc="[0:v]null"
    if fo: fc+=f",fade=t=out:st={d-fo}:d={fo}"
    fc+=f",trim=duration={d},format=yuv420p[v]"
    out=f'{E}/{name}.mp4'
    run(inp+['-filter_complex',fc,'-map','[v]','-frames:v',str(n)]+V+[out]); files.append(out)
run(['-f','lavfi','-i','color=black:s=1920x1080:r=30','-loop','1','-framerate','30','-i',f'{C}/elias.png','-filter_complex',
     "[1:v]format=rgba,fade=t=in:st=0.15:d=0.5:alpha=1[c];[0:v][c]overlay=0:0,trim=duration=1.5,format=yuv420p[v]",'-map','[v]','-frames:v','45']+V+[f'{E}/elias.mp4']); files.append(f'{E}/elias.mp4')
run(['-framerate','30','-loop','1','-i',f'{C}/title.png','-vf','format=yuv420p,trim=duration=2.6','-frames:v','78']+V+[f'{E}/title.mp4']); files.append(f'{E}/title.mp4')
open(f'{E}/list.txt','w').write(''.join(f"file '{f}'\n" for f in files))
run(['-f','concat','-safe','0','-i',f'{E}/list.txt','-c','copy',f'{E}/video.mp4'])
run(['-i',f'{E}/video.mp4','-ss','1.5','-i','/home/claude/h/music/shackleton_trailer_cue.wav','-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','256k','-shortest','-movflags','+faststart','/tmp/shackleton_trailer_1080p.mp4'])
print(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration,bit_rate:stream=codec_name,width,height,r_frame_rate','-of','compact','/tmp/shackleton_trailer_1080p.mp4'],capture_output=True,text=True).stdout)
