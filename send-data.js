const request = require('request')

const textMessage = (sender, text) => {
  let messageData = {
    text: text
  }
  sendRequest(sender, messageData)
}

const location = sender => {
  let messageData = {
    "text": "Please share your location:",
    "quick_replies": [{
      "content_type": "location"
    }]
  }
  sendRequest(sender, messageData)
}

const buttonMessage = (sender, text, buttons) => {
  let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": text,
        "buttons": buttons
      }
    }
  }
  sendRequest(sender, messageData)
}

const genericTemplate = sender => {
  let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Directions to Leninsky Prospekt station",
          "image_url": "https://image.ibb.co/dVe2A6/Screen_Shot_2017_11_19_at_12_49_29_PM.png",
          "buttons": [{
            "type": "postback",
            "title": "Show Details",
            "payload": "detailsWalking"
          }]
        }]
      }
    }
  }
  sendRequest(sender, messageData)
}

const mediaMessage = (sender) => {
  console.log('here')
  let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "media",
        "elements": [{
          "media_type": "image",
          "attachment_id": "297489814074975"
        }]
      }
    }
  }
  sendRequest(sender, messageData)
}

const sendRequest = (sender, messageData) => {

  return new Promise((resolve, reject) => {
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {
        access_token: process.env.PAGE_ACCESS_TOKEN
      },
      method: 'POST',
      json: {
        recipient: {
          id: sender
        },
        message: messageData,
      }
    }, (error, response, body) => {
      if (error) {
        console.log('Error sending messages: ', response.error)
        return reject(response.error)
      } else if (response.body.error) {
        console.log('Response body Error: ', response.body.error)
        return reject(response.body.error)
      }

      console.log("Message sent successfully to " + sender);
      return resolve(response);
    })
  })
}

exports.textMessage = textMessage
exports.location = location
exports.buttonMessage = buttonMessage
exports.mediaMessage = mediaMessage
exports.genericTemplate = genericTemplate
