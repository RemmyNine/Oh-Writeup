const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs')
const Telebot = require('telebot')

const links = [
  // Add all your medium links here
  'https://medium.com/feed/tag/bug-bounty-writeup',
];

// define a telegram bot
const bot = new Telebot("BOT_TOKEN_ID")

// File Section => Reading old links.
fs.readFile('old-links.txt', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  // Convert the file contents to an array
  const oldLinks = data.split('\n');

  // Scrape links from XML
  for (const link of links) {
    request(link, (error, response, xml) => {
      if (!error && response.statusCode === 200) {
        const $ = cheerio.load(xml, { xmlMode: true });
        const extractedLinks = $('link').map(function () {
          return $(this).text();
        }).get();
        console.log(extractedLinks);

        // Compare new links with old links
        const newLinks = extractedLinks.filter(link => !oldLinks.includes(link));

        // Append new links to the file
        fs.appendFile('old-links.txt', `${newLinks.join('\n')}\n`, (err) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log(`${newLinks.length} new links added to old-links.txt`);
        });

        // Send new links to Telegram channel
        const promises = [];
        for (const newLink of newLinks) {
          promises.push(new Promise((resolve) => {
            setTimeout(() => {
              bot.sendMessage('CHANNEL TOKEN', newLink).then(() => {
                console.log(`Message sent: ${newLink}`);
                resolve();
              }).catch(console.error);
            }, 1000); // delay for 1 seconds before sending each message
          }));
        }
        Promise.all(promises)
          .then(() => console.log("The messages have been Deployed, sir!"))
          .catch((error) => console.log(`Error: ${error}`));

      }
    })
  }
})
