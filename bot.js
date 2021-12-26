require("dotenv").config();
const Discord = require("discord.js");
const fetch = require("node-fetch");
const { URL } = require("url");
const ytdl = require("ytdl-core");

let isPlaying = false;
let queue = [];
const client = new Discord.Client();
const prefix = "!";

client.once("ready", () => {
  console.log("The bot is running!");
});

client.on("message", (message) => {
  if (message.content.startsWith(`${prefix}play`)) {
    searchSong(message.content.substring(6), message);
  } else if (message.content.startsWith(`${prefix}stop`)) {
    leave(message);
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message);
  } else if (message.content.startsWith(`${prefix}help`)) {
    help(message);
  } else if (message.content.startsWith(`${prefix}pause`)) {
    pause(message);
  } else if (message.content.startsWith(`${prefix}resume`)) {
    resume(message);
  }
});

function searchSong(song, message) {
  fetch(
    new URL(
      `https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${song}&key=${process.env.Youtube_api}`
    )
  )
    .then((res) => res.json())
    .then((res) => {
      if (res.items[0]) {
        if (res.items[0].id.videoId === undefined || null) {
          return message.reply("No video founded");
        } else {
          let URL = `https://www.youtube.com/watch?v=${res.items[0].id.videoId}`;
          playSong(URL, message);
          replyMessage(
            URL,
            res.items[0].snippet.title,
            res.items[0].snippet.thumbnails.default.url,
            res.items[0].snippet.channelTitle,
            message
          );
        }
      } else {
        const embed = new Discord.MessageEmbed()
          .setColor("red")
          .setTitle("Error")
          .addFields({
            name: "Error value",
            value: "Sorry, the api's daily maximum request is a hundred",
          });
        message.channel.send(embed);
      }
    });
}

function playSong(songURL, message) {
  const voiceChannel = getVoicechannel(message);
  queue.push(songURL);
  message.react("🎶");
  if (voiceChannel) {
    voiceChannel.join().then((connection) => {
      if (isPlaying == true) {
      } else {
        global.dispatcher = connection;
        global.dispatcher.play(ytdl(queue[0]));
        isPlaying = true;
      }
      global.dispatcher.on("end", () => {
        queue.shift();
        global.dispatcher.play(ytdl(queue[0]));
      });
    });
  }
}

function getVoicechannel(message) {
  let voicechannel = message.member.voice.channel;
  if (!voicechannel) {
    return message.reply("You need to connect to a voice channel");
  }
  return voicechannel;
}

function replyMessage(songURL, songTitle, songThumbnail, channel, message) {
  const embed = new Discord.MessageEmbed()
    .setColor("#0099ff")
    .setTitle(songTitle)
    .setURL(songURL)
    .setAuthor("Playing song", message.author.avatarURL())
    .setThumbnail(songThumbnail)
    .addFields({ name: "Channel", value: channel, inline: true });

  message.reply(embed);
}

function skip(message) {
  queue.shift();
  message.react("⏩");
  if (!queue[0]) {
    return leave(message);
  }
  isPlaying = false;
  global.dispatcher.play(ytdl(queue[0]));
  const embed = new Discord.MessageEmbed()
    .setColor("#0099ff")
    .setTitle("Skipped");

  message.reply(embed);
}

function leave(message) {
  message.react("🛑");
  if (message.member.voice.channel) {
    message.member.voice.channel.leave();
  } else {
    message.channel.send("I can not leave anything");
  }
  queue = [];
  isPlaying = false;
}

function help(message) {
  message.react("🙋");
  const replymsg = `**__Feri help__ **
  *commands:*
  - **!play**
     !play + *songs name* => the bot is going to join to your voice channel and play the song
  -**!skip**
     The bot is going to skip the current song and play the next one in the queue
  -**!stop**
     The bot is going to leave the voice channel
  -**!pause**
     The bot is going to pause the current song
  -**!resume**
     The bot is going to continue the paused song`;
  message.channel.send(replymsg);
}

function pause(message) {
  if (!global.dispatcher.paused && isPlaying == true) {
    message.react("⏸");
    global.dispatcher.pause();
    message.channel.send("Paused⏸");
    isPlaying = false;
  } else {
    message.channel.send("The song is already paused");
  }
}

function resume(message) {
  if (global.dispatcher.paused && isPlaying == false) {
    global.dispatcher.resume();
    message.channel.send("Resumed▶"); //This is working bc the v14.15.4
    message.react("▶");
    isPlaying = true;
  } else {
    message.channel.send("The song is not paused");
  }
}
client.login(process.env.Bot_token);
