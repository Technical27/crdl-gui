const EventEmitter = require('events');
const ffmpeg = require('fluent-ffmpeg');
const shell = require('shelljs');
const fetch = require('node-fetch');

let i = 0;

class CRDL extends EventEmitter {
  constructor () {
    super();

    this.i = i++;
    this._tmp = shell.tempdir();
    this._stage = 1;
    
    if (!shell.test('-e', `${this._tmp}/crdl`)) shell.mkdir(`${this._tmp}/crdl`);
    if (shell.test('-e', `${this._tmp}/crdl/${this.i}`)) shell.rm('-r', `${this._tmp}/crdl/${this.i}`);
    
    shell.mkdir(`${this._tmp}/crdl/${this.i}`);
  }

  _addListener () {
    this._ffmpeg.once('progress', () => this.emit('status', this._stage === 1 ? 'downloading' : 'copying'));
    this._ffmpeg.on('progress', data => {
      if (data) {
        this.emit('progress', Math.min(data.percent, 100) / 100);
      }
    });
  }

  _getMediaConfig (line) {
    return JSON.parse(line.trim().replace('vilos.config.media = ', '').replace(';', ''));
  }

  async _getMedia (url) {
    const html = await fetch(url);
    const lines = html.text().split('\n');
    let config, link;
    for (const line of lines) if (line.includes('vilos.config.media')) config = this._getMediaConfig(line);
    if (!config) throw 'No link found';
    for (const stream of config.streams) if (stream.format === 'adaptive_hls' && stream.hardsub_lang === null) link = stream.url;
    const subtitle = config.subtitles[0].url.trim();
    return {link, subtitle};
  }

  async start (url ,subtitles, path) {
    const {link, subtitle} = this._getMedia(url);
    this._ffmpeg = ffmpeg(link).addOption('-c copy');

    this._ffmpeg.addOutput(`${this._tmp}/crdl/${this.i}/download.mkv`);
    
    this._ffmpeg.on('end', () => {
      this._ffmpeg = ffmpeg(`${this._tmp}/crdl/${this.i}/download.mkv`);
      this._addListener();

      if (subtitles) {
        this._ffmpeg.addInput(subtitle);
        this._ffmpeg.addOption('-c copy');
        this._ffmpeg.addOption('-c:s mov_text');
      }
      else this._ffmpeg.addOption('-c copy');
      
      this._ffmpeg.on('end', () => {
        shell.rm('-r', `${this._tmp}/crdl/${this.i}`);
        this.emit('end');
      }).save(path);
      this._stage = 2;
    });

    this._addListener();
    this.emit('status', 'starting');
    this._ffmpeg.run();
  }
}

module.exports = CRDL;