var Botkit = require('botkit');
require('dotenv').config();

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.PORT || !process.env.VERIFICATION_TOKEN) {
  console.log('Error: Specify CLIENT_ID, CLIENT_SECRET, VERIFICATION_TOKEN and PORT in environment');
  process.exit(1);
} else {
  console.log('Good job, you have the variables!')
}

var controller = Botkit.slackbot({
 debug: true,
 clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
})

controller.configureSlackApp({
 clientId: process.env.CLIENT_ID,
 clientSecret: process.env.CLIENT_SECRET,
 clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
 scopes: ['chat:write:bot', 'bot'],
})

var bot = controller.spawn({
  token: process.env.BOT_TOKEN,
}).startRTM();

controller.setupWebserver(process.env.PORT, function(err, webserver){
 controller.createOauthEndpoints(controller.webserver,
   function(err, req, res) {
     if (err) {
       res.status(500).send('ERROR: ' + err);
     } else {
       res.send('Success!');
     }
   });
});

const topLevelTimestamps = {};

controller.hears('.*', 'ambient', function(bot, message) {
  console.log({ message });

  if (message.thread_ts) {
    console.log('ignoring message in thread');
    return;
  }

  const { user, channel } = message;
  const userChannel = user + channel;

  const nextTopLevelTimestamp = Number(message.ts)

  const previousTopLevelTimestamp = topLevelTimestamps[userChannel];
  topLevelTimestamps[userChannel] = nextTopLevelTimestamp;

  if (!previousTopLevelTimestamp) {
    console.log('ignoring first message seen in channel')
    return;
  }

  if (nextTopLevelTimestamp - previousTopLevelTimestamp < 10) {
    bot.replyInThread(message, 'threads please');
  }
});
