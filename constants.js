module.exports = {
    defaultBoardRows: 25,
    defaultBoardCols: 35,
    playerNumbers: '23456789',
    redis: {
        keys: {
            board: 'Typist_board',
            scoreboard: 'Typist_scoreboard',
        },
        writeLockSleep_ms: 3,
    },
    respawnTime_ms: 3000,
    sendUpdateInterval_ms: 25,
};
