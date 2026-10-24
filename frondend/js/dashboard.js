/* Halaman Dashboard: kartu statistik + laporan terbaru (dari API). */
(function(){
  var v=$('#v');v.innerHTML='<p class="note">Memuat data…</p>';
  Promise.all([API.get('api/stats'),API.get('api/reports?limit=4')]).then(function(x){
    var s=x[0],rows=x[1].data;
    var st=[
      ['Total Laporan',s.total,'',svg('<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h6"/>',34),''],
      ['Laporan Baru',s.baru,'Butuh respon',svg('<path d="M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01"/>',34),'b-baru'],
      ['Laporan Diproses',s.diproses,'Sedang ditangani',svg('<path d="M21 12a9 9 0 01-15.5 6.2L3 16M3 12a9 9 0 0115.5-6.2L21 8M21 3v5h-5M3 21v-5h5"/>',34),'b-soft'],
      ['Laporan Selesai',s.selesai,'Tuntas',svg('<circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/>',34),'b-selesai']
    ];
    var nc=['var(--ink)','#c98a12','var(--navy)','var(--teal)'],ic=['var(--navy)','#c98a12','var(--navy)','var(--teal)'];
    v.innerHTML='<div class="stats">'+st.map(function(c,i){
      return '<div class="card st"><div class="ic" style="color:'+ic[i]+'">'+c[3]+'</div><p class="lb">'+c[0]+'</p><div class="n" style="color:'+nc[i]+'">'+c[1]+'</div>'+(c[2]?'<span class="chip '+c[4]+'">'+c[2]+'</span>':'')+'</div>';
    }).join('')+'</div><div class="card"><h2>Laporan Terbaru</h2><div class="tw"><table class="plain"><thead><tr><th>ID Laporan</th><th>Pelapor</th><th>Kerusakan</th><th>Tanggal</th><th>Status</th></tr></thead><tbody>'
    +(rows.length?rows.map(function(r){return '<tr><td>'+r.kode+'</td><td>'+esc(r.nama_pelapor)+'</td><td>'+esc(r.kategori_kerusakan)+'</td><td>'+fmtDate(r.tanggal)+'</td><td>'+chip(r.status)+'</td></tr>'}).join(''):'<tr><td colspan="5" class="note">Belum ada laporan.</td></tr>')
    +'</tbody></table></div></div>';
  }).catch(function(e){v.innerHTML='<p class="note">'+esc(e.message)+'</p>'});
})();
