/* Sidebar, header, penjaga login, dan logout untuk semua halaman admin. */
(function(){
  if(!API.token()){location.replace('index.html');return}
  var page=document.body.dataset.page;
  var PG={
    dash:{t:'Dashboard Admin',s:'Selamat datang kembali, Admin!',n:'Dashboard',u:'dashboard.html',i:'<path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1z"/>'},
    data:{t:'Data Laporan',s:'Kelola, pantau, dan ubah status laporan dari mahasiswa.',n:'Data Laporan',u:'data-laporan.html',i:'<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h6"/>'},
    add:{t:'Tambah Laporan Baru',s:'Masukkan detail laporan kerusakan fasilitas kampus ke dalam sistem.',n:'Tambah Laporan',u:'tambah-laporan.html',i:'<path d="M12 5v14M5 12h14"/>'}
  };
  var u=API.user(),ini=(u.nama||'AD').split(/\s+/).slice(0,2).map(function(w){return w[0]}).join('').toUpperCase();
  var links=['dash','data','add'].map(function(k){
    var on=k===page;
    return '<a class="nv'+(on?' on':'')+'" href="'+PG[k].u+'"'+(on?' aria-current="page"':'')+'>'+svg(PG[k].i)+PG[k].n+(on?'<em>Aktif</em>':'')+'</a>';
  }).join('');
  $('#sidebar').innerHTML='<div class="brand"><div class="logo"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/><path d="M22 9v5"/></svg></div><div><b>CampusCare</b><span>Your Campus, Your Care</span></div></div><nav>'+links+'</nav><button class="nv out" id="lo">'+svg('<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>')+'Logout</button>';
  $('#topbar').innerHTML='<div><h1>'+PG[page].t+'</h1><p>'+PG[page].s+'</p></div><div class="tools"><button class="bell" aria-label="Notifikasi" id="bl">'+svg('<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/>',26)+'<i></i></button><div class="av" title="'+esc(u.nama||'Admin')+'">'+esc(ini)+'</div></div>';
  document.body.insertAdjacentHTML('beforeend','<dialog id="dg"></dialog><div class="toast" id="ts" role="status" aria-live="polite"></div>');
  $('#lo').onclick=API.logout;
  $('#bl').onclick=function(){API.get('api/stats').then(function(s){toast('Ada '+s.baru+' laporan baru yang butuh respon.')}).catch(function(e){toast(e.message)})};
  try{var f=sessionStorage.getItem('cc_flash');if(f){sessionStorage.removeItem('cc_flash');setTimeout(function(){toast(f)},150)}}catch(_){}
})();
