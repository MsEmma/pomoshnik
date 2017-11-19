'use strict'

const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const request = require('request')
const R = require('ramda')
const app = express()

app.set('port', (process.env.PORT || 3000))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: false
}))

// parse application/json
app.use(bodyParser.json())

const sendTextMessage = require('./send-data').textMessage
const sendLocation = require('./send-data').location
const sendButtonMessage = require('./send-data').buttonMessage
const sendMediaMessage = require('./send-data').mediaMessage
const sendGenericTemplate = require('./send-data').genericTemplate

// index
app.get('/', (req, res) => {
  res.send("Hi I am your Moscow Metro assistant")
})

// for facebook verification
app.get('/webhook/', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.VERIFICATION_TOKEN) {
    res.send(req.query['hub.challenge'])
  } else {
    res.send('Error, wrong token')
  }
})

// to post data
app.post('/webhook/', (req, res) => {
  const myID = 297444890746134
  const data = req.body.entry[0]

  if (data.messaging) {
    const messaging_events = data.messaging
    messaging_events.map(event => {
      const sender = event.sender.id
      req.sender = sender


      if (event.message && event.message.attachments && event.message.attachments.length > 0 && sender != myID) {
        const attachment = event.message.attachments[0]
        if (attachment.type === 'location') {
          const loc = attachment.payload.coordinates
          const dest = getSenderDest(sender)
          displayJourney(sender, loc, dest)
        }
      } else if (event.postback && event.postback.payload && sender != myID) {
        const text = event.postback.payload
        decideMessage(sender, text)
      } else if (event.message && event.message.text && sender != myID) {
        const text = event.message.text
        decideMessage(sender, text)
      }
    })
  }
  res.sendStatus(200)
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  if (req.sender) {
    sendTextMessage(req.sender, 'Oops, an internal error occurred: ' + err.message)
  }
  res.status(200).send('Something broke!')
})

const sendTextMessages = (sender, messages) => {
  messages.map((message, i) => {
    const interval = (i + 1) * 2000
    setTimeout(() => {
      sendTextMessage(sender, message)
    }, interval)
  })
}

const decideMessage = async (sender, textInput) => {
  console.log(textInput)
  let text = textInput.toLowerCase()

  if (text === "hi" || text.includes("get_started_payload")) {
    sendTextMessage(sender, "How is the game going?")
    setTimeout(() => {
      sendButtonMessage(
        sender,
        "Where would you like to go next?", [{
            "type": "postback",
            "title": "Go Home 🏠",
            "payload": "goHome"
          },
          {
            "type": "postback",
            "title": "Get Drinks 🍺",
            "payload": "getDrinks"
          }
        ])
    }, 2000)
  } else if (textInput === "getDrinks") {
    sendTextMessage(sender, "Sorry, I can't help you with this.")
    setTimeout(() => {
      sendButtonMessage(
        sender,
        "Do you want to go home?", [{
            "type": "postback",
            "title": "Yes",
            "payload": "goHome"
          },
          {
            "type": "postback",
            "title": "No",
            "payload": "no"
          }
        ])
    }, 2000)
  } else if (textInput === "goHome") {
    sendTextMessage(sender, "Okay, I see you are at the Luzhniki Stadium.")
    setTimeout(() => {
      sendButtonMessage(
        sender,
        "Well you can either follow the crowd and go to Luzhniki Metro station or I can look for an alternative for you.", [{
            "type": "postback",
            "title": "Nearest Metro Ⓜ️",
            "payload": "nearestMetro"
          },
          {
            "type": "postback",
            "title": "Avoid Crowd 🏃",
            "payload": "avoidCrowd"
          }
        ])
    }, 1000)
  } else if (textInput === "nearestMetro") {
    sendTextMessage(sender, "Okay, Just follow the crowd.")

  } else if (textInput === "avoidCrowd") {
    sendTextMessage(sender, "Sure, I would do the same :). I'll have a look.")

    setTimeout(() => {
      sendTextMessage(sender, "I found a great alternative route along the river to a less crowded station.")
    }, 1000)

    setTimeout(() => {
      sendGenericTemplate(sender)
    }, 1500)



  } else if (textInput === "detailsWalking") {
    const messages = ["It is only a 30 minute walk and you will be home faster.", "Avoid the crowd and head to the east part of the stadium.", "From there walk toward the river and follow it until you reach the bridge.", "Now just head straight towards Leninsky Prospekt station."]

    sendTextMessages(sender, messages)

  } else if (['thx', 'thanks', 'ok'].includes(text)) {
    sendTextMessage(sender, "Awesome! Ping me if you need help along the way.")

  } else if (textInput === "start") {
    setTimeout(() => {
      sendTextMessage(sender, "Seems like the game ⚽ is almost over?")
      setTimeout(() => {
        sendButtonMessage(
          sender,
          "Where would you like to go next?", [{
              "type": "postback",
              "title": "Go Home 🏠",
              "payload": "goHome"
            },
            {
              "type": "postback",
              "title": "Get Drinks 🍺",
              "payload": "getDrinks"
            }
          ])
      }, 1000)
    }, 5000)

  }
}

app.listen(app.get('port'), () => {
  console.log('running on port', app.get('port'))
})
