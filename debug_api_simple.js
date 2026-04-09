const http = require('http');

http.get('http://localhost:5006/api/terminals', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
        const json = JSON.parse(data);
        console.log('--- RAW API DATA (FIRST ITEM) ---');
        if (json.length > 0) {
            console.log(JSON.stringify(json[0], null, 2));
        } else {
            console.log('API returned empty array!');
        }
    } catch (e) {
        console.error('JSON Parse error:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('Fetch error:', err.message);
});
