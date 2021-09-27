const amqp = require('amqplib')
const ws = require('ws')
const uuid = require('uuid')
const fs = require('fs')
const port = 8080
let status = 'offline'
let rabbitConnection
let mainChannel
let wsServer
let fileStream

let reqCount = 0
let prevCount = 0
let seconds = 1

function initSF() {
    fileStream = fs.createWriteStream('local', {flags: 'a'})
    let interval = setInterval(() => {
        prevCount = reqCount - prevCount
        if (reqCount !== 0)
            fileStream.write("Count:" + seconds + "ReqCount: " + reqCount + "   ReqSec: " + prevCount + "\n")
        seconds += 1
        if (seconds === 60)
            clearInterval(interval)
        prevCount = reqCount
    }, 1000)
    wsServer = new ws.WebSocketServer({port: port})
    wsServer.on('connection', wsClient => {
        wsClient.id = uuid.v4()
        console.log('New client connected with id: ' + wsClient.id)
        let channel
        wsClient.on('message', msg => {
            reqCount++
            let obj = JSON.parse(msg)
            obj['clientId'] = wsClient.id
            if (status === 'offline') saveLocal(obj)
            else {
                if (channel)
                    manageMsg(channel, 'toBeLogged', JSON.stringify(obj))
                else {
                    rabbitConnection.createChannel().then(ch => {
                        channel = ch
                        manageMsg(channel, 'toBeLogged', JSON.stringify(obj))
                    })
                }
            }
            wsClient.send(wsClient.id)
        })
        wsClient.on('close', () => {
            console.log('Client closed connection!')
            if (status === 'online')
                channel.close()
        })
    })
    tryConnection(0)
}

function manageMsg(channel, queue, msg) {
    channel.assertQueue(queue)
    let done
    do {
        done = channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)))
    } while (status === 'online' && !done)
    if (status === 'offline') saveLocal(msg)
}

function saveLocal(msg) {
    fileStream.write(JSON.stringify(msg) + '\n')
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
            updateStatus('online')
            rabbitConnection.on('close', () => {
                console.log('Connection with RabbitMQTT closed!')
                updateStatus('offline')
            })
            rabbitConnection.on('error', (error) => {
                console.log('Connection error ' + error)
            })
        }).catch(() => {
            tryConnection(tryNum + 1)
        })
    }, interval)
}

function updateStatus(newStatus = 'offline') {
    status = newStatus
    if (newStatus === 'offline') {
        rabbitConnection = null
        tryConnection(1)
    } else {
        console.log('Connected!\n Checking local storage...')
        let toBeSent = fs.readFileSync('local').toString().split('\n')
        fs.writeFileSync('local', '')
        rabbitConnection.createChannel().then(ch => {
            mainChannel = ch
            toBeSent.forEach(elem => {
                if (elem !== '') {
                    elem = JSON.parse(elem)
                    manageMsg(ch, 'toBeLogged', elem)
                }
            })
            console.log('Done sending old messages')
        })
    }
}

module.exports = {
    initSF
}