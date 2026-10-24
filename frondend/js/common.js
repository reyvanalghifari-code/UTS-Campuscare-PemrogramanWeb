/* Fungsi bantu bersama + klien API (memakai token JWT di sessionStorage). */
var $=function(s){return document.querySelector(s)};
var BL=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function svg(p,s){return '<svg width="'+(s||22)+'" height="'+(s||22)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'}
function chip(s){return '<span class="chip b-'+s.toLowerCase()+'">'+s+'</span>'}
function fmtDate(iso){var p=String(iso).split('-');return p.length===3?(+p[2])+' '+BL[p[1]-1]+' '+p[0]:iso}
function toast(m){var t=$('#ts');if(!t)return;t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){t.classList.remove('on')},2600)}

var API={
  token:function(){try{return sessionStorage.getItem('cc_token')}catch(_){return null}},
  user:function(){try{return JSON.parse(sessionStorage.getItem('cc_user'))||{}}catch(_){return {}}},
  logout:function(){try{sessionStorage.clear()}catch(_){}location.href='index.html'},
  req:function(method,url,body){
    var h={},t=API.token();
    if(t)h.Authorization='Bearer '+t;
    if(body)h['Content-Type']='application/json';
    return fetch(url,{method:method,headers:h,body:body?JSON.stringify(body):undefined}).then(function(r){
      if(r.status===401){API.logout();throw new Error('Sesi berakhir. Silakan masuk lagi.')}
      return r.json().catch(function(){return{}}).then(function(b){
        if(!r.ok)throw new Error(b.error||'Terjadi kesalahan.');
        return b;
      });
    },function(){throw new Error('Tidak dapat terhubung ke server.')});
  },
  get:function(u){return API.req('GET',u)},
  post:function(u,b){return API.req('POST',u,b)},
  patch:function(u,b){return API.req('PATCH',u,b)}
};
