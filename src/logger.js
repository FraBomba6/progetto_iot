const cluster = require('cluster')
const numCPUs = require('os').cpus().length
const {initSF} = require("./storeAndForward")
const {initConsumer} = require("./consumer")

if (numCPUs > 1) {
    if (cluster.isMaster) {
        console.log(`Master ${process.pid} is running`)
        for (let i = 0; i < 2; i++) {
            cluster.fork();
        }

        cluster.on('exit', () => {
            cluster.fork();
        });

    } else {
        if (cluster.worker.id === 1) {
            console.log('Worker ' + cluster.worker.id + ' serving')
            initSF()
        } else {
            console.log('Worker ' + cluster.worker.id + ' working on queue')
            initConsumer()
        }
    }
} else {
    initSF()
    initConsumer()
}