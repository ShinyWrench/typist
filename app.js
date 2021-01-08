let argv = require('minimist')(process.argv.slice(2));
const { promisify } = require('util');
const redis = require('redis');
const express = require('express');
const WebSocket = require('ws');
const Board = require('./public/js/board');

client = redis.createClient();

const constants = {
    redisAsync: {
        hsetAsync: promisify(client.hset).bind(client),
        incrbyAsync: promisify(client.incrby).bind(client),
        hincrbyAsync: promisify(client.hincrby).bind(client),
        zadd: promisify(client.zadd).bind(client),
    },
};

const board = new Board(35, 10);

const app = express();
const port = argv.port || 3000;

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        console.log('received: %s', message);
    });

    ws.send('something');
});

app.use(express.static('public'));

app.listen(port, async () => {
    console.log(`Listening on port ${port}`);
});

console.log(board.print());
