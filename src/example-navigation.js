// https://github.com/emadehsan/thal

const puppeteer = require('puppeteer');
const fs = require('fs')
const CREDS = require('./creds');

async function run() {
	const browser = await puppeteer.launch({
		headless: false
	});
	const page = await browser.newPage();

	// entra na pagina de login github
	await page.goto('https://github.com/login');
	await page.screenshot({ path: 'screenshots/github_01.png', fullPage: true });

	// preenche os dados de login
	await page.click('form input#login_field');
	await page.keyboard.type(CREDS.username);
	await page.click('form input#password');
	await page.keyboard.type(CREDS.password);
	await page.click('form input.btn-primary');

	// espera a pagina carregar
	await page.waitForNavigation();
	await page.screenshot({ path: 'screenshots/github_02.png', fullPage: true });

	// vai para a pagina de busca
	const userToSearch = 'welton';
	const searchUrl = `https://github.com/search?q=${userToSearch}&type=Users`;
	await page.goto(searchUrl);
	await page.waitFor(2*1000);
	await page.screenshot({ path: 'screenshots/github_03.png', fullPage: true });

  let numPages = await getNumPages(page);

	// pega todos os emails
	let emailList = [];

	// itera por todas as paginas
	for (let h = 1; h <= numPages; h++) {

		// vai para a pagina indicada
		await page.goto(searchUrl + '&p=' + h);

		// total de itens na pagina
		let listLength = await page.evaluate((sel) => {
	    return document.getElementsByClassName(sel).length;
	  }, 'user-list-item');

	  console.log(listLength);

		for (let i = 1; i <= listLength; i++) {
	    let usernameSelector = '#user_search_results div.user-list div:nth-child(' + i + ') div.d-flex div a';
	    let emailSelector = '#user_search_results div.user-list div:nth-child(' + i + ') div.d-flex div ul li:nth-child(2) > a';

	    // pega o username
	    let username = await page.evaluate((sel) => {
	        return document.querySelector(sel).getAttribute('href').replace('/', '');
	      }, usernameSelector);

	    // pega o email
	    let email = await page.evaluate((sel) => {
	        let element = document.querySelector(sel);
	        return element? element.innerHTML: null;
	      }, emailSelector);

	    // caso o usuario não tenha email visivel
	    if (!email)
	      continue;

	    emailList.push({ name:username, email: email });
	  }
	}

  console.log(emailList);

  // grava o json
	fs.writeFile(
		'./json/github_emails.json',
		JSON.stringify(emailList, null, 2), // optional params to format it nicely
		(err) => err ? console.error('Data not written!', err) : console.log('Data written!')
		)

	browser.close();
}

async function getNumPages(page) {
  let inner = await page.evaluate((sel) => {
    let html = document.querySelector(sel).innerHTML;
    
    // o formato é: "69,803 users"
    return html.replace(',', '').replace('users', '').trim();
  }, 'div.codesearch-results div.px-2 div.d-flex h3');

  let numUsers = parseInt(inner);

  console.log('numero de usuarios: ', numUsers);

  /*
  * GitHub mostra 10 resultados por pagina
  */
  let numPages = Math.ceil(numUsers / 10);
  return numPages;
}

run();