var feeds = [
    'https://status.mailgun.com/history.rss',
    'https://www.githubstatus.com/history.rss',
    'https://status.gitlab.com/pages/5b36dc6502d06804c08349f7/rss',
    'https://www.cloudflarestatus.com/history.rss',
    'https://status.digitalocean.com/history.rss',
    'https://status.bunnycdn.com/history.rss',
    'https://www.google.com/appsstatus/rss/en',
    'https://status.discordapp.com/history.rss',
    'https://localhost/test.rss',
];

const redis = require('redis');
const Parser = require('rss-parser');
const parser = new Parser();
const bluebird = require('bluebird');

var redis_client = redis.createClient();

// add promises
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

var feeds_ran = 0;

feeds.forEach(url => {
    ProcessFeed(url, function() {
        feeds_ran++;
        console.log(feeds_ran +"==" +feeds.length);
        if(feeds_ran == feeds.length) {
            process.exit(0);
        }
    });
});

async function ProcessFeed(url, callback) {
            try {
                var feed = await parser.parseURL(url);  
            }
            catch(E) {
                console.log(E);
                callback();
            }
            console.log(feed.title);
            var i = 0;
            while(feed.items.length > i) {
                var item = feed.items[i];

                let exists = await redis_client.getAsync(item.link);
                console.log("exists:"+exists+": -> "+item.link);
                if(exists != '1') {
                    console.log(item.title + ' - ' + item.link + ' - ' + item.pubDate);
                    redis_client.publish("operations-robot-msgs", item.title + ' - ' + item.link + ' - ' + item.pubDate);
                }
                redis_client.set(item.link,"1");

                i++;
            };

    callback();
}
