(function () {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Render only known Markdown tokens. Catalog text cannot inject raw HTML, media, styles, or script URLs.
  const renderer = {
    space() { return ''; },
    html({text}) {
      // Only formatting tags survive; attributes, scripts and styles never execute.
      return text.split(/(<[^>]*>)/g).map(part => {
        if (/^<\/?(?:p|br|strong|b|em|i|u|s|del|ul|ol|li|blockquote|code|pre)\s*\/?\s*>$/i.test(part)) return part;
        return escape(part).replace(/&amp;((?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-f]+);)/gi,'&$1');
      }).join('');
    },
    code({text}) { return '<pre><code>'+escape(text)+'</code></pre>'; },
    codespan({text}) { return '<code>'+escape(text)+'</code>'; },
    heading({tokens}) { return '<p><strong>'+this.parser.parseInline(tokens)+'</strong></p>'; },
    paragraph({tokens}) { return '<p>'+this.parser.parseInline(tokens)+'</p>'; },
    strong({tokens}) { return '<strong>'+this.parser.parseInline(tokens)+'</strong>'; },
    em({tokens}) { return '<em>'+this.parser.parseInline(tokens)+'</em>'; },
    del({tokens}) { return '<del>'+this.parser.parseInline(tokens)+'</del>'; },
    br() { return '<br>'; },
    hr() { return '<hr>'; },
    blockquote({tokens}) { return '<blockquote>'+this.parser.parse(tokens)+'</blockquote>'; },
    list({items,ordered,start}) {
      const tag=ordered?'ol':'ul';
      const attr=ordered&&Number.isSafeInteger(start)&&start>0?' start="'+start+'"':'';
      return '<'+tag+attr+'>'+items.map(item=>this.listitem(item)).join('')+'</'+tag+'>';
    },
    listitem({tokens,task,checked}) { return '<li>'+(task?(checked?'☑ ':'☐ '):'')+this.parser.parse(tokens)+'</li>'; },
    checkbox({checked}) { return checked?'☑ ':'☐ '; },
    image({text}) { return escape(text); },
    link({href,tokens}) {
      const label=this.parser.parseInline(tokens);
      if(!/^https?:\/\//i.test(href)||/[\u0000-\u0020]/.test(href))return label;
      try { const url=new URL(href);if(!['http:','https:'].includes(url.protocol))return label; }
      catch { return label; }
      return '<a href="'+escape(href)+'" rel="noopener noreferrer">'+label+'</a>';
    },
    text({text,tokens}) { return tokens?this.parser.parseInline(tokens):escape(text); },
    table({header,rows}) {
      const cell=(token,tag)=>'<'+tag+'>'+this.parser.parseInline(token.tokens)+'</'+tag+'>';
      return '<div class="sss-richtext-table"><table><thead><tr>'+header.map(t=>cell(t,'th')).join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(t=>cell(t,'td')).join('')+'</tr>').join('')+'</tbody></table></div>';
    }
  };
  const colors = new Set(['red','gold','yellow','green','aqua','blue','purple','pink','gray','white']);
  // Process text nodes only, leaving HTML attributes and code samples untouched.
  function colorize(html) {
    const parts = html.split(/(<[^>]*>)/g);
    const output = [], stack = [];
    let codeDepth = 0;
    for (const part of parts) {
      if (part.startsWith('<')) {
        if (/^<(?:pre|code)\b/i.test(part)) codeDepth++;
        if (/^<\/(?:pre|code)>/i.test(part)) codeDepth = Math.max(0, codeDepth - 1);
        if (/^<\/?(?:p|div|li|ul|ol|blockquote|pre|table|tr|td|th|hr)\b/i.test(part)) stack.length = 0;
        output.push(part);
        continue;
      }
      if (codeDepth) { output.push(part); continue; }
      for (const token of part.split(/(\[\/?[a-z]+\])/gi)) {
        const match = /^\[(\/?)([a-z]+)\]$/i.exec(token);
        const color = match?.[2].toLowerCase();
        if (!colors.has(color)) { output.push(token); continue; }
        if (!match[1]) {
          stack.push({color, index:output.length}); output.push(token);
        } else if (stack.length && stack[stack.length-1].color === color) {
          const opening = stack.pop();
          output[opening.index] = '<span class="sss-color-' + color + '">';
          output.push('</span>');
        } else { output.push(token); }
      }
    }
    return output.join('');
  }
  function explain(html, entry={}, glossary=[]) {
    const parts=html.split(/(<[^>]*>)/g), out=[];
    let pending=null, skip=0;
    const roman=n=>['','I','II','III','IV','V','VI','VII','VIII','IX','X'][n]||String(n);
    for(const part of parts){
      if(part.startsWith('<')){
        if(/^<(?:a|code|pre)\b/i.test(part)){skip++;pending=null;}
        if(/^<\/(?:a|code|pre)>/i.test(part))skip=Math.max(0,skip-1);
        if(/^<\/?(?:p|div|li|ul|ol|blockquote|table|tr|td|th|hr)\b/i.test(part))pending=null;
        out.push(part);continue;
      }
      if(skip){out.push(part);continue;}
      for(const token of part.split(/(\[(?:effect|term):[a-z][a-z0-9-]*\]|\[\/(?:effect|term)\])/g)){
        const start=/^\[(effect|term):([a-z][a-z0-9-]*)\]$/.exec(token);
        if(start){pending={type:start[1],key:start[2],index:out.length};out.push(token);continue;}
        if(pending && token==='[/'+pending.type+']'){
          let detail='';
          if(pending.type==='effect'){
            const effect=(entry.effects||[]).find(e=>e.key===pending.key);
            if(effect)detail=(effect.label?.trim()?effect.label.trim()+'\n':'')+[...(effect.levels||[])].sort((a,b)=>a.level-b.level).map(r=>'Level '+roman(r.level)+': '+r.value).join('\n');
          } else {
            const term=(glossary||[]).find(t=>!t.draft&&t.key===pending.key);
            if(term)detail=(term.name?.trim()?term.name.trim()+'\n':'')+term.description;
          }
          if(detail){out[pending.index]='<span class="sss-explanation" tabindex="0" role="button" aria-expanded="false" data-explanation="'+escape(detail)+'">';out.push('</span>');}
          else out.push(token);
          pending=null;
        }else out.push(token);
      }
    }
    return out.join('');
  }
  // One shared popup, outside clipped cards, for mouse, keyboard and touch.
  if(typeof document!=='undefined'){
    let popup,active,hideTimer;
    const close=()=>{if(active){active.removeAttribute('aria-describedby');active.setAttribute('aria-expanded','false');}active=null;if(popup)popup.hidden=true;};
    const show=el=>{
      clearTimeout(hideTimer);close();active=el;
      if(!popup){popup=document.createElement('div');popup.id='sss-description-tooltip';popup.className='sss-tooltip';popup.setAttribute('role','tooltip');document.body.append(popup);
        popup.addEventListener('pointerenter',()=>clearTimeout(hideTimer));popup.addEventListener('pointerleave',()=>{hideTimer=setTimeout(close,150);});}
      popup.textContent=el.dataset.explanation;popup.hidden=false;el.setAttribute('aria-describedby',popup.id);el.setAttribute('aria-expanded','true');
      const r=el.getBoundingClientRect(),p=popup.getBoundingClientRect();
      popup.style.left=Math.max(8,Math.min(r.left,window.innerWidth-p.width-8))+'px';
      popup.style.top=Math.max(8,r.bottom+p.height+12<window.innerHeight?r.bottom+8:r.top-p.height-8)+'px';
    };
    const target=e=>e.target.closest?.('.sss-explanation');
    document.addEventListener('pointerover',e=>{const el=target(e);if(el&&el!==active&&e.pointerType!=='touch')show(el);});
    document.addEventListener('pointerout',e=>{if(target(e)&&!target(e).contains(e.relatedTarget))hideTimer=setTimeout(close,150);});
    document.addEventListener('focusin',e=>{const el=target(e);if(el)show(el);});
    document.addEventListener('focusout',e=>{if(target(e))close();});
    document.addEventListener('click',e=>{const el=target(e);if(el)show(el);else if(!popup?.contains(e.target))close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close();else if((e.key==='Enter'||e.key===' ')&&target(e)){e.preventDefault();show(target(e));}});
    document.addEventListener('scroll',close,true);window.addEventListener('resize',close);
  }
  const parser = new window.marked.Marked({gfm:true,breaks:true,renderer});
  const cache = new Map();
  window.SSSDescriptions = {
    format(value, entry={}, glossary=[]) {
      const text=String(value||'No description available yet.');
      const key=JSON.stringify([text,entry.effects||[],glossary]);
      if(cache.has(key))return cache.get(key);
      const result=explain(colorize(parser.parse(text)),entry,glossary);
      if(cache.size>=500)cache.clear();cache.set(key,result);
      return result;
    }
  };
})();
