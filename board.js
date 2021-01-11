const RedisAsync = require('./redisAsync');
const constants = require('./constants');

class Board {
    static randomLetter() {
        let randomNumber = 52 * Math.random();
        let uppercase = Math.floor(randomNumber / 26) > 0;
        return String.fromCharCode((uppercase ? 65 : 97) + (randomNumber % 26));
    }

    static async sleep_ms(duration_ms) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, duration_ms);
        });
    }

    constructor(numRows, numCols) {
        this.numRows = numRows;
        this.numCols = numCols;
        this.playerReplacements = {};
        this.redisAsync = new RedisAsync();
        this.redisWriteLock = false;
        this.redisAsync.connect();
    }

    async build() {
        const checkIfUniqueOffsets = [
            [-2, -2],
            [-2, -1],
            [-2, -0],
            [-2, 1],
            [-2, 2],
            [-1, -2],
            [-1, -1],
            [-1, -0],
            [-1, 1],
            [-1, 2],
            [0, -2],
            [0, -1],
        ];

        let rows = [];
        for (let iRow = 0; iRow < this.numRows; iRow++) {
            rows.push('');
            for (let iCol = 0; iCol < this.numCols; iCol++) {
                let nextLetter = null;
                while (!nextLetter) {
                    nextLetter = Board.randomLetter();

                    // Prevent ambiguous commands by assuring all squares have
                    // uniqueness vs. all adjacent squares and all adjacent squares
                    // have uniqueness vs. each other
                    for (
                        let iOffset = 0;
                        iOffset < checkIfUniqueOffsets.length;
                        iOffset++
                    ) {
                        let row = iRow + checkIfUniqueOffsets[iOffset][0];
                        let col = iCol + checkIfUniqueOffsets[iOffset][1];
                        // Make sure we're in bounds
                        if (row >= 0 && col >= 0 && col < this.numCols) {
                            // If letters match, start over with another random letter
                            if (nextLetter === rows[row][col]) {
                                nextLetter = null;
                                break;
                            }
                        }
                    }
                }
                rows[iRow] += nextLetter;
            }
        }
        this.redisAsync.set(constants.redis.keys.board, rows.join('\n'));
    }

    async setRedisWriteLock(newState) {
        // If setting to true and already true, wait
        // -- this happens when lock is being used by something else
        // If setting to false and already false, wait
        // -- we only set to false at end of block that started with setting to true
        // -- TODO: log warning in this case (?)
        while (this.redisWriteLock === newState) {
            await Board.sleep_ms(constants.redis.writeLockSleep_ms);
        }
        this.redisWriteLock = newState;
    }

    async placeNewPlayer(playerNumber) {
        await this.setRedisWriteLock(true);
        let storedCopy = await this.getBoardContent();
        let storedCopyRows = storedCopy.split('\n');
        let row, col;
        while (true) {
            row = Math.floor(this.numRows * Math.random());
            col = Math.floor(this.numCols * Math.random());
            if (!constants.playerNumbers.includes(storedCopyRows[row][col])) {
                break;
            }
        }
        this.playerReplacements[playerNumber] = storedCopyRows[row][col];
        storedCopyRows[row] = `${storedCopyRows[row].slice(
            0,
            col
        )}${playerNumber}${storedCopyRows[row].slice(col + 1)}`;
        await this.redisAsync.set(
            constants.redis.keys.board,
            storedCopyRows.join('\n')
        );
        await this.setRedisWriteLock(false);
    }

    async getBoardContent() {
        return await this.redisAsync.get(constants.redis.keys.board);
    }

    async getRendered() {
        // Get raw board content from redis
        let storedCopy = await this.getBoardContent();

        // Split content into array of rows
        let storedCopyRows = storedCopy.split('\n');

        // Build the rendered html
        let rendered = '';
        for (let iRow = 0; iRow < storedCopyRows.length; iRow++) {
            // Add spaces
            rendered += storedCopyRows[iRow].split('').join('&nbsp;&nbsp;');

            // Add line breaks
            if (iRow < storedCopyRows.length - 1) {
                rendered += '<br><br>';
            }

            // Highlight the players
            for (let id = 2; id < 10; id++) {
                rendered = rendered.replace(
                    new RegExp(`${id}`, 'g'),
                    `<span style='background-color: yellow'>${id}</span>`
                );
            }
        }

        return rendered;
    }

    async handleClientCommand(command, playerNumber) {
        await this.setRedisWriteLock(true);

        // Get the raw board string from redis
        let storedCopy = await this.getBoardContent();

        // Locate the player on the board
        let playerIndex = storedCopy.indexOf(`${playerNumber}`);
        let playerRow = Math.floor(playerIndex / (this.numCols + 1));
        let playerCol = Math.floor(playerIndex % (this.numCols + 1));

        console.log(
            `Player ${playerNumber} (at ${playerRow}, ${playerCol}): ${command}`
        );

        // Convert the raw board to a 2D array
        let boardArrays = [];
        storedCopy.split('\n').forEach((row) => {
            boardArrays.push(row.split(''));
        });

        let moveFound = false;

        // Check adjacent squares for character that matches command
        for (let dRow = -1; dRow <= 1; dRow++) {
            if (moveFound === true) {
                break;
            }
            for (let dCol = -1; dCol <= 1; dCol++) {
                // Skip current position
                if (dRow === 0 && dCol === 0) {
                    continue;
                }

                // Skip out-of-bounds positions
                if (
                    playerRow + dRow < 0 ||
                    playerRow + dRow > this.numRows - 1 ||
                    playerCol + dCol < 0 ||
                    playerCol + dCol > this.cols - 1
                ) {
                    continue;
                }

                //  Move to position if command matches character there
                if (
                    command === boardArrays[playerRow + dRow][playerCol + dCol]
                ) {
                    // Replace player with letter they originally replaced
                    boardArrays[playerRow][playerCol] = this.playerReplacements[
                        playerNumber
                    ];

                    // Check if we landed on another player
                    if (constants.playerNumbers.includes(command)) {
                        // Increment our score
                        await this.redisAsync.zincrby(
                            constants.redis.keys.scoreboard,
                            1,
                            playerNumber
                        );

                        // Copy their replacement letter over ours
                        this.playerReplacements[
                            playerNumber
                        ] = this.playerReplacements[parseInt(command)];

                        // Set a timeout for respawning the other player
                        setTimeout(async () => {
                            await this.placeNewPlayer(parseInt(command));
                        }, constants.respawnTime_ms);
                    } else {
                        // Store letter that player will now replace
                        this.playerReplacements[playerNumber] =
                            boardArrays[playerRow + dRow][playerCol + dCol];
                    }

                    // Write player number in new position
                    boardArrays[playerRow + dRow][
                        playerCol + dCol
                    ] = `${playerNumber}`;

                    // Convert the board back to a single string
                    let boardContent = '';
                    for (let iRow = 0; iRow < this.numRows; iRow++) {
                        boardContent += boardArrays[iRow].join('');
                        if (iRow < this.numRows - 1) {
                            boardContent += '\n';
                        }
                    }

                    // Store the raw board string back into redis
                    await this.redisAsync.set(
                        constants.redis.keys.board,
                        boardContent
                    );

                    // Set the flag and break so we don't keep checking adjacent squares
                    moveFound = true;
                    break;
                }
            }
        }

        await this.setRedisWriteLock(false);
    }

    async print() {
        console.log(await this.getBoardContent());
    }
}

module.exports = Board;
