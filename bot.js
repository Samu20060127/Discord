require('dotenv').config()
const Discord = require("discord.js")
const fetch = require('node-fetch')
const ytdl = require("ytdl-core")
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const User = require('./User')

let isPlaying = false
let isLoggedIn = false
let queue = []
const client = new Discord.Client()
const prefix = '!'

const uri = process.env.Mongo_Connection
mongoose.connect(uri, () => {
  console.log('Connected to the database')
})

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
  } else if (message.content.startsWith(`${prefix}pause`)) {
    pause(message)
  }  else if (message.content.startsWith(`${prefix}resume`)) {
    resume(message)
  } else if (message.content.startsWith(`${prefix}register`)) {
    registerUser(message)
  } else if (message.content.startsWith(`${prefix}login`)) {
    loginUser(message)
  } else if (message.content.startsWith(`${prefix}deleteaccount`)) {
    deleteaccount(message)
  }
})

function playsong(song, message) {
    fetch(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${song}&key=${process.env.Youtube_api}`)
    .then(res => res.json())
    .then(res => {
      if(res.items[0]) {
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
          global.dispatcher = connection.play(ytdl(queue[0]))
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
  }
}

function skip(message) {
  message.react("⏩")
  queue.shift()
  isPlaying = false
  if(queue.length === 0) {
    leave(message)
  } else {
    playsong(queue[0], message)
  }
  const embed = new Discord.MessageEmbed()
  .setColor('#0099ff')
  .setTitle('Skipped')

  message.reply(embed)
}

function leave(message) {
  message.react('🛑')
  if(message.member.voice.channel) {
    message.member.voice.channel.leave()
  } else {
    message.channel.send('I can not leave anything')
  }
  queue = []
}

function help(message) {
  message.react('🙋')
  const replymsg = `**__Feri help__ **
  *commands:*
  - **!play**
     !play + *songs name* => the bot is going to join to your voice channel and play the song
  -**!skip**
     skips the current songs and plays the next one on the queue
  -**!stop**
     The bot is going to leave the voice channel
  -**!pause**
     The bot is going to pause the current song
  -**!resume**
     The bot is going to continue the paused song
  -**!register**
     !register + *email address* + *password* => the bot will register an account whit the email and password you passed
  -**!login**
     !login + *email address* + *password* => the bot will login you and you can create music tracks, which you can play in the future`
  message.channel.send(replymsg)
}

function pause(message) {
  if(!global.dispatcher.paused && isPlaying == true) {
    message.react('⏸')
    global.dispatcher.pause()
    message.channel.send('Paused⏸')
    isPlaying = false
  } else {
    message.channel.send('The song is already paused')
  }
}

function resume(message) {

  if(global.dispatcher.paused && isPlaying == false) {
    global.dispatcher.resume()
    message.channel.send('Resumed▶') //This is working bc the v14.15.4
    message.react('▶')
    isPlaying = true
  } else {
    message.channel.send('The song is not paused')
  }

}

async function registerUser(message) {
  const components = message.content.split(' ')
  message.delete()
  if(components.length !== 3) {
    return message.channel.send('Sorry, you have to pass the data for your acc')
  }

  const emailexist = await User.findOne({email: components[1]})
  if(emailexist) {
    return message.channel.send('Sorry, but the email is already in use')
  }

  const salt = await bcrypt.genSalt(10)
  const hashedpassword = await bcrypt.hash(components[2], salt)

  const user = new User({
    email: components[1],
    password: hashedpassword
  })

  try {
    await user.save()
  } catch (error) {
    return message.channel.send(err)
  }
  message.channel.send('You are successfully registered!')
}

async function loginUser(message) {
  if(isLoggedIn == true) {
    return message.channel.send('You are already logged in')
  }

  const components = message.content.split(' ')
  message.delete()

  if(components.length !== 3) {
    return message.channel.send('Sorry, you need to pass your account data')
  }

  const foundedUser = await User.findOne({email: components[1]})

  if(!foundedUser) {
    return message.channel.send('No user with that email')
  }

  const validpassword = await bcrypt.compare(components[2], foundedUser.password)
  if(!validpassword) {
    return message.channel.send('Password is incorrect')
  }

  isLoggedIn = true
  message.channel.send('Successfully logged in')
}

async function deleteaccount(message) {
  if(isLoggedIn == false) {
    return message.channel.send('You need to be logged in to delete your account')
  }

  const email = message.content.split(' ')[1]
  const user = await User.findOne({email: email})
  if(!email) {
    return message.channel.send('Sorry, no user with that email')
  }

  try {
    user.delete()
    message.channel.send('Account deleted')
  } catch (error) {
    return message.channel.send(err)
  }

  isLoggedIn = false
}
client.login(process.env.Bot_token);