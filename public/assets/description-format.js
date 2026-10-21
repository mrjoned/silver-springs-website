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
  const parser = new window.marked.Marked({gfm:true,breaks:true,renderer});
  const cache = new Map();
  window.SSSDescriptions = {
    format(value) {
      const text=String(value||'No description available yet.');
      if(cache.has(text))return cache.get(text);
      const result=colorize(parser.parse(text));
      if(cache.size>=500)cache.clear();cache.set(text,result);
      return result;
    }
  };
})();
