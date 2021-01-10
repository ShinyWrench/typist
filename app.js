let argv = require('minimist')(process.argv.slice(2));
const express = require('express');
const WebSocket = require('ws');
const Board = require('./board');

const board = new Board(35, 10);

const app = express();
const port = argv.port || 3000;

const wss = new WebSocket.Server({ port: 8080 });
const wsClients = [];

wss.on('connection', async (client) => {
    let playerNumber = wsClients.length + 2;
    await board.placeNewPlayer(playerNumber);
    client.on('message', async (message) => {
        await board.handleClientCommand(message, playerNumber);
    });
    wsClients.push(client);
});

setInterval(async () => {
    let renderedBoard = await board.getRendered();
    wsClients.forEach((client) => {
        client.send(renderedBoard);
    });
}, 25);

app.use(express.static('public'));

app.listen(port, async () => {
    console.log(`Listening on port ${port}`);
});

board.print().then(() => {});
