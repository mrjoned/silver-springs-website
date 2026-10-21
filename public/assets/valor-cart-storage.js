(function () {
  'use strict';
  window.SSSValorStorage = {
    load(items, legacyIds, canPurchase, storage) {
      try { storage ||= window.localStorage; } catch {}
      storage ||= { getItem:()=>null, setItem:()=>{} };
      const read=key=>{try{const data=JSON.parse(storage.getItem(key));return data&&typeof data==='object'&&!Array.isArray(data)?data:{};}catch{return {};}};
      const byId=new Map(items.map((item,index)=>[item.Id,index]));
      let saved,checked;
      // A v2 cart, even an empty one, supersedes the legacy cart permanently.
      let hasV2=false;try{hasV2=storage.getItem('valor-shop-cart-v2')!==null;}catch{}
      if(hasV2){saved=read('valor-shop-cart-v2');checked=read('valor-shop-purchased-v2');}
      else{
        saved=Object.fromEntries(Object.entries(read('valor-shop-cart-v1')).filter(([key])=>/^\d+$/.test(key)&&legacyIds[Number(key)]).map(([key,n])=>[legacyIds[Number(key)],n]));
        checked=Object.fromEntries(Object.entries(read('valor-shop-purchased-v1')).filter(([key])=>/^\d+$/.test(key)&&legacyIds[Number(key)]).map(([key,value])=>[legacyIds[Number(key)],value]));
      }
      const cart={},purchased={};
      for(const [id,n] of Object.entries(saved)){
        const index=byId.get(id);
        if(index===undefined||!canPurchase(items[index])||!Number.isInteger(n)||n<=0||n>999)continue;
        cart[index]=n;if(checked[id]===true)purchased[index]=true;
      }
      return {cart,purchased};
    },
    save(items,cart,purchased,storage) {
      try { storage ||= window.localStorage; } catch {}
      storage ||= { getItem:()=>null, setItem:()=>{} };
      const entries=Object.entries(cart).filter(([i])=>items[i]);
      try{
        storage.setItem('valor-shop-cart-v2',JSON.stringify(Object.fromEntries(entries.map(([i,n])=>[items[i].Id,n]))));
        storage.setItem('valor-shop-purchased-v2',JSON.stringify(Object.fromEntries(entries.filter(([i])=>purchased[i]).map(([i])=>[items[i].Id,true]))));
      }catch{}
    }
  };
})();
