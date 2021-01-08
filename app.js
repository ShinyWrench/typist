let argv = require('minimist')(process.argv.slice(2));
const { promisify } = require('util');
const redis = require('redis');
const express = require('express');
const Board = require('./board');

client = redis.createClient();

const app = express();
const port = argv.port || 3000;

const constants = {
    myIPAndPort: {
        ipAddress: 'localhost',
        port: port,
    },
    redisAsync: {
        hsetAsync: promisify(client.hset).bind(client),
        incrbyAsync: promisify(client.incrby).bind(client),
        hincrbyAsync: promisify(client.hincrby).bind(client),
        zadd: promisify(client.zadd).bind(client),
    },
};

// app.listen(port, async () => {
//     console.log(`Listening on port ${port}`);
// });

let board = new Board(35, 10);
board.print();
