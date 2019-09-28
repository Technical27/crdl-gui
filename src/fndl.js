const puppeteer = require('puppeteer');
const Downloader = require('./dl');

let i = 0;

class FNDL extends Downloader {
  constructor (user, pass) {
    super('fndl', i.toString());
    i++;
    if (!user || !pass) throw 'Invalid username or password';
    this._user = user;
    this._pass = pass;
  }

  _getMedia (url) {
    return puppeteer.launch()
      .then(browser => {
        return browser.newPage()
          .then(page => {
            return page.goto(`https://www.funimation.com/log-in/?returnUrl=${url}`)
              .then(() => page.click('input#email2'))
              .then(() => page.type('input#email2', this._user))
              .then(() => page.click('input#password2'))
              .then(() => page.type('input#password2', this._pass))
              .then(() => {
                return new Promise ((resolve, reject) => {
                  let found = false;
                  page.on('request', res => {
                    const url = res.url();
                    if (url.includes('.m3u8')) {
                      found = true;
                      res.abort();
                      browser.close();
                      resolve({url, subtitle: null});
                    }
                    else res.continue();
                  });
                  page.setRequestInterception(true)
                    .then(() => page.click('button.btn.margin-right-0'))
                    .then(() => setTimeout(() => {
                      if (!found) reject('Timeout on getting media');
                    }, 20000));
                });
              });
          });
      });
  }
}

module.exports = FNDL;
