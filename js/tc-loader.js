/* Use the completed Lottie SVG itself as the aperture, preserving its exact transforms. */
(()=>{
 'use strict';
 const root=document.documentElement,overlay=document.querySelector('#tc-loader');
 if(!overlay)return;
 const stage=overlay.querySelector('.tc-loader-stage'),screen=overlay.querySelector('.tc-loader-screen');
 const cutout=overlay.querySelector('#tc-loader-cutout'),pose=overlay.querySelector('#tc-loader-pose');
 const white=overlay.querySelector('#tc-loader-white'),cover=overlay.querySelector('#tc-loader-cover');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const content=[...document.querySelectorAll('body > header,body > main,body > footer')];
 const wasInert=content.map(el=>el.inert);content.forEach(el=>el.inert=true);
 let animation,frame=0,revealing=false,finished=false,announced=false,ready=false,resumeFilm=null;
 const ns='http://www.w3.org/2000/svg';
 function announce(){
   if(announced)return;announced=true;window.__tcIntroPending=false;
   root.classList.remove('tc-intro-wait');window.dispatchEvent(new Event('tc:reveal'));
 }
 function finish(){
   if(finished)return;finished=true;cancelAnimationFrame(frame);clearTimeout(window.__tcLoaderTimeout);
   announce();root.classList.remove('tc-loading');content.forEach((el,i)=>el.inert=wasInert[i]);
   if(overlay.contains(document.activeElement))document.querySelector('.brand')?.focus({preventScroll:true});
   animation?.destroy();overlay.remove();
   if(resumeFilm){resumeFilm.play().catch(()=>{});resumeFilm=null}
 }
 window.addEventListener('tc:loader-timeout',finish,{once:true});
 function dimensions(){
   const w=innerWidth,h=innerHeight;
   screen.setAttribute('viewBox',`0 0 ${w} ${h}`);
   [white,cover].forEach(rect=>{rect.setAttribute('width',w);rect.setAttribute('height',h)});
   cutout.setAttribute('width',w);cutout.setAttribute('height',h);
 }
 function silhouette(source){
   const copy=source.cloneNode(true),originals=[...source.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line,text')];
   const copies=[...copy.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line,text')];
   copies.forEach((node,i)=>{
     if(originals[i].closest('defs,mask,clipPath'))return;
     const paint=getComputedStyle(originals[i]);
     if(paint.fill!=='none')node.style.fill='#000';
     if(paint.stroke!=='none')node.style.stroke='#000';
   });
   const ids=new Map();copy.querySelectorAll('[id]').forEach(node=>{const old=node.id;node.id='tc-cutout-'+old;ids.set(old,node.id)});
   copy.querySelectorAll('*').forEach(node=>[...node.attributes].forEach(attr=>{
     let value=attr.value;ids.forEach((next,old)=>{value=value.split('#'+old).join('#'+next)});
     if(value!==attr.value)node.setAttribute(attr.name,value);
   }));
   copy.removeAttribute('style');copy.setAttribute('width','1200');copy.setAttribute('height','900');copy.setAttribute('x','0');copy.setAttribute('y','0');
   pose.replaceChildren(copy);
 }
 // Rasterize once at the resting size. Mobile never enlarges the live SVG tree.
 function snapshotSVG(source,width){
   return new Promise(resolve=>{
     const copy=source.cloneNode(true);copy.removeAttribute('style');
     copy.setAttribute('width','1200');copy.setAttribute('height','900');
     const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml'}));
     const image=new Image();let done=false;
     const end=value=>{if(done)return;done=true;clearTimeout(timer);URL.revokeObjectURL(url);resolve(value)};
     const timer=setTimeout(()=>end(null),900);
     image.onload=()=>{
       if(done)return;
       try{const bitmap=document.createElement('canvas');bitmap.width=Math.ceil(width*2);bitmap.height=Math.ceil(width*1.5);
         const context=bitmap.getContext('2d');context.drawImage(image,0,0,bitmap.width,bitmap.height);end(bitmap);
       }catch(error){end(null)}
     };
     image.onerror=()=>end(null);image.src=url;
   });
 }
 async function reveal(){
   if(revealing||finished)return;
   if(!ready||reduced.matches){finish();return}
   revealing=true;animation.goToAndStop(410,true);
   const mobile=matchMedia('(max-width:760px), (pointer:coarse)').matches;
   const box=stage.getBoundingClientRect(),base=box.width/1200;
   let bitmap=null,canvas=null,context=null;
   if(mobile){
     const video=document.querySelector('.hero-video');
     if(video&&!video.paused){resumeFilm=video;video.pause()}
     bitmap=await snapshotSVG(stage.querySelector('svg'),box.width).catch(()=>null);
     if(finished)return;
     if(!bitmap){finish();return}
     canvas=document.createElement('canvas');canvas.className='tc-loader-canvas';canvas.setAttribute('aria-hidden','true');
     // Bound per-frame pixel work even on high-DPR phones and tablets.
     const ratio=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1400000/(innerWidth*innerHeight)));
     canvas.width=Math.ceil(innerWidth*ratio);canvas.height=Math.ceil(innerHeight*ratio);
     context=canvas.getContext('2d');if(!context){finish();return}
     context.setTransform(ratio,0,0,ratio,0,0);context.fillStyle='#fff';context.fillRect(0,0,innerWidth,innerHeight);
     overlay.insertBefore(canvas,stage);screen.style.display='none';stage.style.display='none';
   }else{
     try{silhouette(stage.querySelector('svg'))}catch(error){console.warn('Loader reveal unavailable',error);finish();return}
   }
   dimensions();overlay.classList.add('tc-opening');
   // Authored 1200x900 coordinates: asset 4's swoop ends beside layer 10's ball.
   // (700,285) lies inside the upper swoop, close to their shared edge.
   const anchor={x:700,y:285};
   const pin={x:box.left+anchor.x*base,y:box.top+anchor.y*base};
   stage.style.transformOrigin=`${anchor.x/12}% ${anchor.y/9}%`;
   const relay=document.createElementNS(ns,'circle');
   relay.setAttribute('fill','black');relay.setAttribute('cx',pin.x);relay.setAttribute('cy',pin.y);relay.setAttribute('r',0);cutout.append(relay);
   const radius=Math.hypot(Math.max(pin.x,innerWidth-pin.x),Math.max(pin.y,innerHeight-pin.y))+2;
   const target=Math.max(18,Math.hypot(innerWidth,innerHeight)/(box.width*.08));
   const start=performance.now(),duration=1050;
   // Keep the same swoop point fixed in both layers; the circle follows from it.
   function tick(now){
     const t=Math.min(1,(now-start)/duration),eased=t*t*(3-2*t),scale=1+(target-1)*eased;
     const s=base*scale;
     const x=pin.x-anchor.x*s,y=pin.y-anchor.y*s,follow=Math.max(0,(t-.38)/.62);
     const circleRadius=radius*follow*follow*(3-2*follow),fade=1-Math.min(1,t/.22);
     if(context){
       context.globalCompositeOperation='source-over';context.globalAlpha=1;
       context.fillStyle='#fff';context.fillRect(0,0,innerWidth,innerHeight);
       context.globalCompositeOperation='destination-out';context.globalAlpha=Math.min(1,t/.14);
       context.drawImage(bitmap,x,y,1200*s,900*s);
       context.globalAlpha=1;context.beginPath();context.arc(pin.x,pin.y,circleRadius,0,Math.PI*2);context.fill();
       if(fade>0){context.globalCompositeOperation='source-over';context.globalAlpha=fade;context.drawImage(bitmap,x,y,1200*s,900*s)}
     }else{
       pose.setAttribute('transform',`translate(${x} ${y}) scale(${s})`);
       pose.setAttribute('opacity',Math.min(1,t/.14));
       if(fade>0){stage.style.transform=`translate(-50%,-50%) scale(${scale})`;stage.style.opacity=String(fade)}
       else stage.style.display='none';
       relay.setAttribute('r',circleRadius);
     }
     if(t>.28)announce();
     if(t<1)frame=requestAnimationFrame(tick);else finish();
   }
   frame=requestAnimationFrame(tick);
 }
 overlay.querySelector('button').addEventListener('click',reveal);
 addEventListener('resize',()=>{if(revealing)finish();else dimensions()},{passive:true});
 reduced.addEventListener('change',()=>{if(reduced.matches)finish()});
 dimensions();
 if(reduced.matches){finish();return}
 try{
   animation=lottie.loadAnimation({container:stage,renderer:'svg',loop:false,autoplay:false,animationData:window.TC_LOADER_DATA,rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});
   const start=()=>{if(ready||finished)return;ready=true;animation.setSpeed(1.05);animation.playSegments([0,410],true)};
   animation.addEventListener('DOMLoaded',start);
   animation.addEventListener('complete',reveal);
   animation.addEventListener('data_failed',finish);
   if(animation.isLoaded)start();
 }catch(error){console.warn('Loader unavailable',error);finish()}
})();
