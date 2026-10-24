/* Halaman Tambah Laporan: form, validasi, unggah foto, simpan ke API. */
(function(){
  function fld(id,l,h){return '<div class="f"><label for="'+id+'">'+l+'</label>'+h+'<p class="err" id="e-'+id+'" role="alert"></p></div>'}
  $('#v').innerHTML='<form class="card" id="af" novalidate><h2>Tambah Laporan</h2><div class="form"><div><h3>Informasi Pelapor</h3>'
  +fld('nama','Nama Pelapor','<input class="in" id="nama" maxlength="100" placeholder="Masukkan nama pelapor">')
  +fld('nim','NIM / NIP','<input class="in" id="nim" maxlength="30" placeholder="Masukkan NIM atau NIP">')
  +fld('kp','Kategori Pelapor','<select id="kp"><option value="">Pilih Kategori (Mahasiswa / Staf / Dosen)</option><option>Mahasiswa</option><option>Staf</option><option>Dosen</option></select>')
  +fld('kk','Kategori Kerusakan','<select id="kk"><option value="">Pilih Kategori Kerusakan</option><option>Komputer rusak</option><option>Atap bocor</option><option>Pagar rusak</option><option>Kursi patah</option><option>Lampu padam</option><option>Lainnya</option></select>')
  +fld('lok','Lokasi','<input class="in" id="lok" maxlength="120" placeholder="Masukkan lokasi spesifik (misal: Lab Komputer 2)">')
  +'</div><div><h3>Detail Kerusakan</h3>'+fld('des','Deskripsi Kerusakan','<textarea id="des" maxlength="2000" placeholder="Jelaskan detail kerusakan secara lengkap..."></textarea>')
  +'<div class="f"><label>Unggah Bukti Foto (Opsional)</label><div class="drop" id="dr" tabindex="0" role="button"><div id="dp">'+svg('<path d="M16 16l-4-4-4 4M12 12v9M20.4 18.4A5 5 0 0018 9h-1.3A8 8 0 104 16.3"/>',34)+'<p style="margin:6px 0 0">Klik atau seret foto ke sini untuk mengunggah<br>(JPG, PNG, maks. 5MB)</p></div></div><input type="file" id="fi" accept="image/jpeg,image/png" hidden><p class="err" id="e-fi"></p></div>'
  +'<p class="err" id="e-form" role="alert"></p><div class="acts"><button type="button" class="btn" id="bt">Batal</button><button class="btn fill" type="submit" id="sb">Simpan Laporan</button></div></div></div></form>';
  var fi=$('#fi'),dr=$('#dr'),foto=null;
  function pick(f){if(!f)return;var e=$('#e-fi');
    if(!/^image\/(jpeg|png)$/.test(f.type)){e.textContent='Format harus JPG atau PNG.';return}
    if(f.size>5*1024*1024){e.textContent='Ukuran foto maksimal 5MB.';return}
    e.textContent='';var r=new FileReader();r.onload=function(){foto=r.result;$('#dp').innerHTML='<img alt="Pratinjau foto" src="'+foto+'">'};r.readAsDataURL(f)}
  dr.onclick=function(){fi.click()};
  dr.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();fi.click()}};
  dr.ondragover=function(e){e.preventDefault()};
  dr.ondrop=function(e){e.preventDefault();pick(e.dataTransfer.files[0])};
  fi.onchange=function(){pick(fi.files[0])};
  $('#bt').onclick=function(){location.href='data-laporan.html'};
  $('#af').onsubmit=function(e){e.preventDefault();var ok=true;$('#e-form').textContent='';
    [['nama','Nama pelapor wajib diisi.'],['nim','NIM atau NIP wajib diisi.'],['kp','Pilih kategori pelapor.'],['kk','Pilih kategori kerusakan.'],['lok','Lokasi wajib diisi.'],['des','Deskripsi kerusakan wajib diisi.']].forEach(function(r){
      var v=$('#'+r[0]).value.trim();$('#e-'+r[0]).textContent=v?'':r[1];if(!v){if(ok)$('#'+r[0]).focus();ok=false}});
    if(!ok)return;
    var b=$('#sb');b.disabled=true;b.textContent='Menyimpan…';
    API.post('api/reports',{nama_pelapor:$('#nama').value.trim(),nim_nip:$('#nim').value.trim(),kategori_pelapor:$('#kp').value,kategori_kerusakan:$('#kk').value,lokasi:$('#lok').value.trim(),deskripsi:$('#des').value.trim(),foto:foto})
    .then(function(r){try{sessionStorage.setItem('cc_flash','Laporan '+r.kode+' tersimpan.')}catch(_){}location.href='data-laporan.html'})
    .catch(function(err){b.disabled=false;b.textContent='Simpan Laporan';$('#e-form').textContent=err.message});
  };
})();
