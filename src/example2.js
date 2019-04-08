const puppeteer = require('puppeteer');

let _browser;
let _page;

puppeteer.launch().then(browser => {
	_browser = browser
	return _browser.newPage().then(page => {
		_page = page
		return _page.goto('https://www.google.com').then(() => {
			return _page.screenshot({ path: 'screenshots/example.png' }).then(() => {
				console.log('teste')
			})
		})
	})
}).then(() => {
	return _browser.close()
})