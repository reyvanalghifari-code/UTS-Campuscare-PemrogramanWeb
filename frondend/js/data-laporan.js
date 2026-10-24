/* Halaman Data Laporan: cari, filter status, pagination, ubah status, detail (via API). */
(function(){
  var S={q:'',f:'',pg:1},PER=5,rows=[],meta={total:0,page:1,pages:1},seq=0,timer;
  $('#v').innerHTML='<div class="bar"><div class="sw">'+svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',20)+'<input class="in" id="q" placeholder="Cari ID, pelapor, atau kerusakan..." aria-label="Cari laporan"></div><select id="fs" aria-label="Filter status"><option value="">Semua Status</option><option>Baru</option><option>Diproses</option><option>Selesai</option></select></div><div class="card"><h2>Data Laporan</h2><div id="tb"><p class="note">Memuat data…</p></div></div>';
  function load(){
    var n=++seq,qs=new URLSearchParams({page:S.pg,limit:PER,q:S.q,status:S.f});
    API.get('api/reports?'+qs).then(function(r){if(n!==seq)return;rows=r.data;meta=r;S.pg=r.page;draw()})
    .catch(function(e){if(n===seq)$('#tb').innerHTML='<p class="note">'+esc(e.message)+'</p>'});
  }
  function pages(n,c){var a=[],i;if(n<=7){for(i=1;i<=n;i++)a.push(i)}else{a=[1];if(c>3)a.push('…');for(i=Math.max(2,c-1);i<=Math.min(n-1,c+1);i++)a.push(i);if(c<n-2)a.push('…');a.push(n)}return a}
  function draw(){
    var s=(meta.page-1)*PER;
    $('#tb').innerHTML='<div class="tw"><table class="solid"><thead><tr><th>ID Laporan</th><th>Tanggal</th><th>Nama Pelapor</th><th>Lokasi</th><th>Kerusakan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>'
    +(rows.length?rows.map(function(r){return '<tr><td>'+r.kode+'</td><td>'+fmtDate(r.tanggal)+'</td><td>'+esc(r.nama_pelapor)+'</td><td>'+esc(r.lokasi)+'</td><td>'+esc(r.kategori_kerusakan)+'</td><td>'+chip(r.status)+'</td><td style="white-space:nowrap">'+(r.status==='Selesai'?'':'<button class="btn sm" data-u="'+r.id+'">Ubah Status</button> ')+'<button class="lnk" data-d="'+r.id+'">'+(r.status==='Selesai'?'Lihat Detail':'Detail')+'</button></td></tr>'}).join(''):'<tr><td colspan="7" class="note">Tidak ada laporan yang cocok. Coba kata kunci atau status lain.</td></tr>')
    +'</tbody></table></div><div class="ft"><span>Menampilkan '+(meta.total?s+1:0)+'-'+Math.min(s+PER,meta.total)+' dari '+meta.total+' laporan</span><div class="pg"><button data-g="'+(meta.page-1)+'" aria-label="Sebelumnya"'+(meta.page<2?' disabled':'')+'>‹</button>'
    +pages(meta.pages,meta.page).map(function(p){return p==='…'?'<span style="align-self:center;padding:0 4px">…</span>':'<button data-g="'+p+'"'+(p===meta.page?' class="on" aria-current="page"':'')+'>'+p+'</button>'}).join('')+'<button data-g="'+(meta.page+1)+'" aria-label="Berikutnya"'+(meta.page>=meta.pages?' disabled':'')+'>›</button></div></div>';
  }
  function row(id){return rows.filter(function(r){return r.id===+id})[0]}
  function detail(id){var r=row(id),d=$('#dg');
    d.innerHTML='<h2>'+r.kode+'</h2>'+(r.foto?'<img alt="Bukti foto" src="'+r.foto+'">':'')+'<dl><dt>Tanggal</dt><dd>'+fmtDate(r.tanggal)+'</dd><dt>Pelapor</dt><dd>'+esc(r.nama_pelapor)+' ('+esc(r.kategori_pelapor)+')</dd><dt>NIM / NIP</dt><dd>'+esc(r.nim_nip)+'</dd><dt>Lokasi</dt><dd>'+esc(r.lokasi)+'</dd><dt>Kerusakan</dt><dd>'+esc(r.kategori_kerusakan)+'</dd><dt>Deskripsi</dt><dd>'+esc(r.deskripsi)+'</dd><dt>Status</dt><dd>'+chip(r.status)+'</dd></dl><button class="btn fill" id="cl">Tutup</button>';
    d.showModal();$('#cl').onclick=function(){d.close()}}
  function ubah(id){var r=row(id),d=$('#dg');
    d.innerHTML='<h2>Ubah status '+r.kode+'</h2><div class="f"><label for="ns">Status baru</label><select id="ns"><option>Baru</option><option>Diproses</option><option>Selesai</option></select></div><p class="err" id="e-ns"></p><div class="acts"><button class="btn" id="cl">Batal</button><button class="btn fill" id="sv">Simpan</button></div>';
    $('#ns').value=r.status;d.showModal();$('#cl').onclick=function(){d.close()};
    $('#sv').onclick=function(){var b=this;b.disabled=true;
      API.patch('api/reports/'+r.id+'/status',{status:$('#ns').value}).then(function(u){d.close();toast('Status '+u.kode+' diubah menjadi '+u.status+'.');load()})
      .catch(function(e){b.disabled=false;$('#e-ns').textContent=e.message})}}
  $('#q').oninput=function(e){S.q=e.target.value;S.pg=1;clearTimeout(timer);timer=setTimeout(load,250)};
  $('#fs').onchange=function(e){S.f=e.target.value;S.pg=1;load()};
  $('#tb').onclick=function(e){var g=e.target.closest('[data-g]'),u=e.target.closest('[data-u]'),d=e.target.closest('[data-d]');
    if(g&&!g.disabled){S.pg=+g.dataset.g;load()}if(u)ubah(u.dataset.u);if(d)detail(d.dataset.d)};
  load();
})();
