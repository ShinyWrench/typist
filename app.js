let argv = require('minimist')(process.argv.slice(2));
const express = require('express');
const WebSocket = require('ws');
const Board = require('./board');
const constants = require('./constants');

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

const board = new Board(constants.defaultBoardRows, constants.defaultBoardCols);

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
            let scores = await board.getScores();
            let renderedBoard = await board.getRendered();
            let message = JSON.stringify({
                board: renderedBoard,
                scores: scores,
            });
            wsClients.forEach((client) => {
                client.send(message);
            });
        }, constants.sendUpdateInterval_ms);

        app.listen(port, async () => {
            console.log(`Listening on port ${port}`);
        });

        return board.print();
    })
    .then(() => {})
    .catch((err) => {
        console.log(`${err.stack ? err.stack : err}`);
    });
