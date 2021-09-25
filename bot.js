require('dotenv').config()
const Discord = require("discord.js");
const fetch = require('node-fetch')
const ytdl = require("ytdl-core")

let isPlaying = false
let queue = []
const client = new Discord.Client()
const prefix = '!'

client.once("ready", () => {
  console.log("The bot is running!")
});

client.on("message", message =>{
  if(message.content.startsWith(`${prefix}play`)) {
    playsong(message.content.substring(6), message)
  } else if (message.content.startsWith(`${prefix}stop`)) {
    leave(message)
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message)
  } else if (message.content.startsWith(`${prefix}help`)) {
    help(message)
  }
})

function playsong(song, message) {
    fetch(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${song}&key=${process.env.Youtube_api}`)
    .then(res => res.json())
    .then(res => {
      if(res.items[0].id) {
        if(res.items[0].id.videoId === undefined || null) {
          message.reply('No video founded')
        } else {
          playSong(res.items[0].id.videoId, res.items[0].snippet.title, res.items[0].snippet.thumbnails.default.url, res.items[0].snippet.channelTitle)
        }
      } else {
        const embed = new Discord.MessageEmbed()
        .setColor('red')
        .setTitle('Error')
        .addFields(
          { name: 'Error value', value: 'Sorry, the api\'s daily maximum request is a hundred'}
          )
        message.channel.send(embed)
      }
    })
  
    let voicechannel = message.member.voice.channel
    if(!voicechannel) {
      message.reply('You need to connect to a voice channel')
    }
  
    message.react('🎶')
    function playSong(songURL, songTitle, songThumbnail, channel) {
      let songLINK = `https://www.youtube.com/wath?v=${songURL}`
      if(queue.length !== 0) {
        for (let i = 0; i < queue.length; i++) {
          if(songLINK === queue[i]) {
            queue.pop()
          } 
        }
      }
      queue.push(songLINK)
      voicechannel.join()
      .then(connection => {
        if(isPlaying == true) {
  
        } else {
          const dispatcher = connection.play(ytdl(queue[0]))
          isPlaying = true
          dispatcher.on('finish', () => {
          queue.shift()
          if(queue.length === 0 ) {
            leave(message)
          }
          connection.play(ytdl(queue[0]))
        })
        }
    })

    if(queue.length === 0) {
      const embed = new Discord.MessageEmbed()
      .setColor('#0099ff')
      .setTitle(songTitle)
      .setURL(`https://www.youtube.com/watch?v=${songURL}`)
      .setAuthor('Playing song', message.author.avatarURL())
      .setThumbnail(songThumbnail)
      .addFields(
        { name: 'Channel', value: channel, inline: true }
      )
  
      message.reply(embed)
    } else {
      const embed = new Discord.MessageEmbed()
      .setColor('#0099ff')
      .setTitle(songTitle)
      .setURL(`https://www.youtube.com/watch?v=${songURL}`)
      .setAuthor('Added to queue', message.author.avatarURL())
      .setThumbnail(songThumbnail)
      .addFields(
        { name: 'Channel', value: channel, inline: true }
      )
  
      message.reply(embed)
    }
    }
}

function skip(message) {
  message.react("⏩")
  queue.shift()
  isPlaying = false
  if(queue.length === 0) {
    leave(message)
  }
  playsong(queue[0], message)
  const embed = new Discord.MessageEmbed()
  .setColor('#0099ff')
  .setTitle('Skipped')

  message.reply(embed)
}

function leave(message) {
  message.react('🛑')
  message.member.voice.channel.leave()
  queue = []
}

function help(message) {
  message.react('🙋')
  const replymsg = `**__Feri help__ **
  *commands:*
  - **!play**
     !play + *songs name* => the bot is going to join to your voice channel and play the song
  -**!skip**
     skips the songs and plays the next one on the queue
  -**!stop**
     The bot is going to leave the voice channel`
  message.channel.send(replymsg)
}

client.login(process.env.Bot_token);