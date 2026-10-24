/* Login CampusCare: memanggil POST /api/auth/login. */
(function(){
  var f=document.getElementById('f'),id=document.getElementById('id'),pw=document.getElementById('pw'),
      e1=document.getElementById('e1'),e2=document.getElementById('e2'),t=document.getElementById('t'),
      go=document.getElementById('go'),eye=document.getElementById('eye');
  var open='<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>';
  var shut=document.getElementById('eyeI').innerHTML;
  try{var s=localStorage.getItem('cc_id');if(s){id.value=s;document.getElementById('rm').checked=true}}catch(_){}
  eye.onclick=function(){
    var show=pw.type==='password';
    pw.type=show?'text':'password';
    eye.setAttribute('aria-pressed',show);
    eye.setAttribute('aria-label',show?'Sembunyikan kata sandi':'Tampilkan kata sandi');
    document.getElementById('eyeI').innerHTML=show?open:shut;
  };
  function bad(el,box,msg){el.setAttribute('aria-invalid','true');box.textContent=msg}
  function ok(el,box){el.removeAttribute('aria-invalid');box.textContent=''}
  f.onsubmit=function(ev){
    ev.preventDefault();t.textContent='';
    var v=id.value.trim(),good=true;
    ok(id,e1);ok(pw,e2);
    if(!v){bad(id,e1,'Masukkan NIM atau email Anda.');good=false}
    else if(v.indexOf('@')>-1&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){bad(id,e1,'Format email belum benar. Contoh: nama@campus.ac.id');good=false}
    if(pw.value.length<6){bad(pw,e2,'Kata sandi minimal 6 karakter.');good=false}
    if(!good){(id.hasAttribute('aria-invalid')?id:pw).focus();return}
    try{if(document.getElementById('rm').checked)localStorage.setItem('cc_id',v);else localStorage.removeItem('cc_id')}catch(_){}
    go.disabled=true;go.textContent='Memproses…';
    fetch('api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:v,password:pw.value})})
    .then(function(r){return r.json().catch(function(){return{}}).then(function(b){return{ok:r.ok,b:b}})})
    .then(function(x){
      if(!x.ok)throw new Error(x.b.error||'Login gagal.');
      try{sessionStorage.setItem('cc_token',x.b.token);sessionStorage.setItem('cc_user',JSON.stringify(x.b.user))}catch(_){}
      location.href='dashboard.html';
    })
    .catch(function(err){
      go.disabled=false;go.textContent='Masuk';
      bad(pw,e2,err.message==='Failed to fetch'?'Tidak dapat terhubung ke server.':err.message);
    });
  };
  document.getElementById('sso').onclick=function(){t.textContent='Mengarahkan ke SSO Kampus… (demo)'};
  document.getElementById('forgot').onclick=function(e){e.preventDefault();t.textContent='Tautan reset kata sandi (demo).'};
  document.getElementById('adm').onclick=function(e){e.preventDefault();t.textContent='Kontak Unit Administrasi (demo).'};
})();
