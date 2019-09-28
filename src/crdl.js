const fetch = require('node-fetch');
const Downloader = require('./dl');

let i = 0;

class CRDL extends Downloader {
  constructor () {
    super('crdl', i.toString());
    i++;
  }

  _getMediaConfig (line) {
    return JSON.parse(line.trim().replace('vilos.config.media = ', '').replace(';', ''));
  }

  _getMedia (url) {
    return fetch(url)
      .then(html => html.text())
      .then(lines => {
        return new Promise((resolve, reject) => {
          let config, link, subtitle;
          for (const line of lines.split('\n')) if (line.includes('vilos.config.media')) config = this._getMediaConfig(line);
          if (!config) reject('No link found');
          for (const stream of config.streams) if (stream.format === 'adaptive_hls' && stream.hardsub_lang === null) link = stream.url;
          try {
            subtitle = config.subtitles[0].url.trim();
          }
          catch (e) {
            subtitle = null;
          }
          resolve({link, subtitle});
        });
      });
  }
}

module.exports = CRDL;
