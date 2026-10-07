/* Fit the custom face, then reduce the fitted heading size by a further 4%. */
(()=>{
  const headings=[...document.querySelectorAll('h1,h2,h3')];
  const canvas=document.createElement('canvas');const context=canvas.getContext('2d');
  if(!context)return;
  const phrases=new Map(headings.map(h=>{
    if(h.matches('.hero h1'))return[h,[...h.children].map(n=>n.textContent.trim())];
    if(h.matches('.signup-intro h2')){
      const lines=[''];h.childNodes.forEach(n=>{if(n.nodeName==='BR')lines.push('');else lines[lines.length-1]+=n.textContent});
      return[h,lines.map(n=>n.trim())];
    }
    return[h,h.textContent.trim().split(/\s+/)];
  }));
  function fit(){
    headings.forEach(h=>h.style.removeProperty('font-size'));
    const results=headings.map(h=>{
      const css=getComputedStyle(h),size=parseFloat(css.fontSize);
      context.font=`${css.fontStyle} ${css.fontWeight} ${size}px ${css.fontFamily}`;
      const spacing=parseFloat(css.letterSpacing)||0;
      const widest=Math.max(...phrases.get(h).map(s=>context.measureText(s).width+Math.max(0,s.length-1)*spacing));
      const available=h.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight);
      // Reserve a little extra width for the oblique outlines and animated masks.
      const opticalScale=parseFloat(css.getPropertyValue('--headline-optical-scale'))||.96;
      return[h,size*Math.min(1,Math.max(0,available)/(widest+size*.18))*opticalScale];
    });
    results.forEach(([h,size])=>{if(size>0)h.style.fontSize=`${size.toFixed(2)}px`});
  }
  let frame=0;function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;fit()})}
  document.fonts.load('40px "Akira JC"').then(()=>{fit();window.dispatchEvent(new Event('resize'))});
  window.addEventListener('resize',schedule,{passive:true});window.addEventListener('pageshow',schedule);
})();
