const fetch = require('node-fetch');

fetch('https://api.github.com/repos/Hiro527/LaF/releases')
.then(res => res.json())
.then((data) => {
    const latestRelease = data[0];
    let downloads = 0;
    Object.values(latestRelease.assets).forEach((v) => {
        downloads += v.download_count;
    });
    console.log(`Downloads: ${downloads}`);
})
.catch(err => console.error);