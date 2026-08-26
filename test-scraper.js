const https = require('https');

https.get('https://peraturan.go.id/cariglobal?PeraturanSearch%5Bidglobal%5D=1', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    const text = d.replace(/<[^>]+>/g, '|').replace(/&amp;/g, '&').replace(/&#039;/g, "'");
    const lines = text.split('|').map(l => l.trim()).filter(l => l.length > 0);
    
    const docs = [];
    
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^(Undang-Undang|Peraturan Pemerintah|Peraturan Presiden|Peraturan Menteri)\s+Nomor\s+(\d+)\s+Tahun\s+(\d{4})$/);
      if (m) {
        let tentang = '';
        for (let k = i + 1; k < Math.min(i + 4, lines.length); k++) {
          if (lines[k].length > 10 && !lines[k].match(/^(Dokumen|Pemerintah|&nbsp;|\d{4}|Peraturan|Undang)/)) {
            tentang = lines[k];
            break;
          }
        }
        docs.push({
          jenis: m[1],
          nomor: m[2],
          tahun: m[3],
          judul: lines[i],
          tentang: tentang || lines[i],
        });
      }
    }
    console.log('Found:', docs.length);
    docs.forEach(d => console.log(`  ${d.jenis} ${d.nomor}/${d.tahun}: ${d.tentang.substring(0, 80)}`));
  });
});
