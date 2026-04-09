const axios = require('axios');
const fs = require('fs');

async function debug() {
    try {
        const res = await axios.get('http://localhost:5006/api/terminals');
        const data = res.data;
        if (data.length > 0) {
            console.log('--- SAMPLE DATA ---');
            console.log(JSON.stringify(data[0], null, 2));
            fs.writeFileSync('debug_api.json', JSON.stringify(data, null, 2));
        } else {
            console.log('API returned empty list.');
        }
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}
debug();
