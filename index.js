'use strict'

const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const request = require('request')
const R = require('ramda')
const app = express()

app.set('port', (process.env.PORT || 3000))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// parse application/json
app.use(bodyParser.json())

const sendTextMessage = require('./send-data').textMessage
const sendLocation = require('./send-data').location

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
	const myID = 300416860375397
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

app.use((err, req, res, next) =>
 {
	console.error(err.stack)
	if (req.sender) {
		sendTextMessage(req.sender, 'Oops, an internal error occurred: ' + err.message)
	}
	res.status(200).send('Something broke!')
})

const sendTextMessages = (sender, messages) => {
	messages.map((message, i) => {
		const interval = (i + 1) * 1000
		setTimeout(() => { sendTextMessage(sender, message) }, interval)
	})
}

const decideMessage = async (sender, textInput) => {
	let text = textInput.toLowerCase()

	if (text === "hi" || text.includes("get_started_payload")){

		const messages = [
			"Welcome to Find My Taxi 😄 We will give you directions for getting around using minibus taxis. 🚌",
		 	"Right now, we can only tell you about areas near Cape Town. 🇿🇦",
		 	"Give it a try! You can type “help” at any time, or “restart” to start again.",
		 	"Where are you going? Type the name of the taxi rank."
		]

		return sendTextMessages(sender, messages)
	} 
}

app.listen(app.get('port'), () => {
	console.log('running on port', app.get('port'))
})
