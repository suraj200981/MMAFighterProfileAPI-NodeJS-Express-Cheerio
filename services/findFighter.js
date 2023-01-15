const request = require("request");
const cheerio = require("cheerio");

module.exports = {
  find: function step1(initalUrlToScrape, req, res) {
    return new Promise((resolve, reject) => {
      request(
        initalUrlToScrape,
        { headers: { "User-Agent": req.headers["user-agent"] } },
        (error, response, html) => {
          if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
            let fighterNameIndex = $(".new_table td a");
            let figherBlocks = [];

            $(fighterNameIndex).each((x) => {
              figherBlocks.push({
                href: fighterNameIndex[x].attribs.href,
                name: fighterNameIndex[x].children[0].data,
              });
            });

            resolve(figherBlocks);
          } else {
            reject(error);
          }
        }
      );
    });
  },
};
