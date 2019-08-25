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

  async getMedia (url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.funimation.com/log-in/?returnUrl=${url}`);

    await page.click('input#email2');
    await page.type('input#email2', this._user);
    await page.click('input#password2');
    await page.type('input#password2', this._pass);

    let found = false;
    page.on('request', res => {
      const url = res.url();
      if (url.includes('.m3u8')) {
        browser.close();
        found = true;
        return {subtitle: null, url};
      }
      res.continue();
    });
    await page.setRequestInterception(true);
    await page.click('button.btn.margin-right-0');
    setTimeout(() => {
      if (!found) {
        browser.close();
        throw 'No Media';
      }
    }, 20000);
  }
}

module.exports = FNDL;