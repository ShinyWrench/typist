let argv = require('minimist')(process.argv.slice(2));
const express = require('express');
const WebSocket = require('ws');
const Board = require('./board');

// TODO: letter replace
// TODO: game logic
// TODO: scoreboard
// TODO: client null array
// TODO: DRY
// TODO: readme
// TODO: ...
// TODO: bots

const app = express();
const port = argv.port || 3000;
app.use(express.static('public'));

const wss = new WebSocket.Server({ port: 8080 });
const wsClients = [];

const board = new Board(35, 10);

board
    .build()
    .then(() => {
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

        app.listen(port, async () => {
            console.log(`Listening on port ${port}`);
        });

        return board.print();
    })
    .then(() => {});
