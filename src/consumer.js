const amqp = require("amqplib")
const db = require("./db")

let rabbitConnection
tryConnection(0)

function consume() {
    let outChannel = rabbitConnection.createChannel()
    outChannel.then(channel => {
        console.log('Consuming...')
        channel.assertQueue(
            'toBeLogged',
            {durable: true}
        )

        channel.consume('toBeLogged', async function (msg) {
            let parsed_msg = JSON.parse(msg.content.toString())
            db.log([parsed_msg['clientId'], parsed_msg['sequenceNumber'], parsed_msg['msg']])
                .then(() => {
                    channel.ack(msg)
                })
                .catch(() => {
                    channel.nack(msg)
                })
        })
    })
}

function tryConnection(tryNum) {
    let interval
    if (tryNum < 27)
        interval = Math.round(Math.pow(1.6, tryNum))
    else
        interval = 300000
    if (tryNum !== 0)
        console.log('Retried after ' + interval + ' milliseconds')
    setTimeout(() => {
        amqp.connect().then((conn) => {
            rabbitConnection = conn
            consume()
            rabbitConnection.on('close', () => {
                console.log('Connection with RabbitMQTT closed!')
                tryConnection(tryNum + 1)
            })
            rabbitConnection.on('error', (error) => {
                console.log('Connection error ' + error)
            })
        }).catch(() => {
            tryConnection(tryNum + 1)
        })
    }, interval)
}

function initConsumer() {
    tryConnection(0)
}

module.exports = {
    initConsumer
}