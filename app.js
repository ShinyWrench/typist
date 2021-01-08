let argv = require('minimist')(process.argv.slice(2));
const { promisify } = require('util');
const redis = require('redis');
const express = require('express');

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

function randomLetter() {
    let randomNumber = 52 * Math.random();
    let uppercase = Math.floor(randomNumber / 26) > 0;
    return String.fromCharCode((uppercase ? 65 : 97) + (randomNumber % 26));
}

function printBoard(board) {
    let output = '';
    board.forEach((row) => {
        output += '|';
        row.forEach((letter) => {
            output += `  ${letter}`;
        });
        output += '  |\n';
        output += `|${' '.repeat(3 * row.length + 2)}|\n`;
    });
    console.log(output);
}

const boardWidth = 10;
const boardLength = 35;
let board = [];
for (let iRow = 0; iRow < boardLength; iRow++) {
    let row = [];
    for (let iCol = 0; iCol < boardWidth; iCol++) {
        row.push(randomLetter());
    }
    board.push(row);
}

printBoard(board);
