const EventEmitter = require('events');
const ffmpeg = require('fluent-ffmpeg');
const shell = require('shelljs');
const path = require('path');

ffmpeg.setFfmpegPath(require('ffmpeg-static').path); // eslint-disable-line global-require

class Downloader extends EventEmitter {
  constructor (tmpPath, i) {
    super();

    this.instance = i;

    this._tmp = shell.tempdir();
    this._stage = 1;

    this._dlPath = path.join(this._tmp, tmpPath, this.instance);
    
    if (!shell.test('-e', path.join(this._tmp, tmpPath))) shell.mkdir(path.join(this._tmp, tmpPath));
    if (shell.test('-e', this._dlPath)) shell.rm('-r', this._dlPath);
    
    shell.mkdir(this._dlPath);
  }

  _addListener () {
    this._ffmpeg.once('progress', () => this.emit('status', this._stage === 1 ? 'downloading' : 'copying'));
    this._ffmpeg.on('progress', data => {
      if (data) {
        this.emit('progress', Math.min(data.percent, 100).toFixed(2));
      }
    });
  }

  _getMedia () {
    return Promise.reject('No Media');
  }

  start (url, subtitles, output) {
    this.emit('status', 'starting');
    this._getMedia(url)
      .then(media => {
        this._ffmpeg = ffmpeg(media.link).addOption('-c copy');

        this._ffmpeg.addOutput(path.join(this._dlPath, 'download.mkv'));
    
        this._ffmpeg.on('end', () => {
          this._ffmpeg = ffmpeg(path.join(this._dlPath, 'download.mkv'));
          this._addListener();

          if (subtitles && media.subtitle) {
            this._ffmpeg.addInput(media.subtitle);
            this._ffmpeg.addOption('-c copy');
            this._ffmpeg.addOption('-c:s mov_text');
          }
          else this._ffmpeg.addOption('-c copy');
      
          this._ffmpeg.on('end', () => {
            shell.rm('-r', this._dlPath);
            this.emit('end');
          }).save(output);
          this._stage = 2;
        });

        this._addListener();
    
        try {
          this._ffmpeg.run();
        }
        catch (e) {
          console.log(e);
        }
      });
  }
}

module.exports = Downloader;
