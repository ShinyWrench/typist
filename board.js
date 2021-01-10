const RedisAsync = require('./redisAsync');

class Board {
    static buildNewBoardContent(numRows, numCols) {
        let output = '';
        for (let iRow = 0; iRow < numRows; iRow++) {
            for (let iCol = 0; iCol < numCols; iCol++) {
                output += this.randomLetter();
            }
            if (iRow < numRows - 1) {
                output += '\n';
            }
        }
        return output;
    }

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
        this.redisAsync = new RedisAsync();
        this.redisWriteLock = false;

        this.redisAsync.connect();
        this.redisAsync.set(
            'board',
            Board.buildNewBoardContent(numRows, numCols)
        );
    }

    async setRedisWriteLock(newState) {
        // If setting to true and already true, wait
        // -- this happens when lock is being used by something else
        // If setting to false and already false, wait
        // -- we only set to false at end of block that started with setting to true
        // -- TODO: log warning in this case (?)
        while (this.redisWriteLock === newState) {
            await Board.sleep_ms(3);
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
            if (!'23456789'.includes(storedCopyRows[row][col])) {
                break;
            }
        }
        storedCopyRows[row] = `${storedCopyRows[row].slice(
            0,
            col
        )}${playerNumber}${storedCopyRows[row].slice(col + 1)}`;
        this.redisAsync.set('board', storedCopyRows.join('\n'));
        await this.setRedisWriteLock(false);
    }

    async getBoardContent() {
        return await this.redisAsync.get('board');
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
                    playerCol + dCol > this.numRows
                ) {
                    continue;
                }

                //  Move to position if command matches character there
                if (
                    command === boardArrays[playerRow + dRow][playerCol + dCol]
                ) {
                    // Write player number in new position
                    boardArrays[playerRow + dRow][
                        playerCol + dCol
                    ] = `${playerNumber}`;

                    // Write '-' in old position
                    boardArrays[playerRow][playerCol] = '-';

                    // Convert the board back to a single string
                    let boardContent = '';
                    for (let iRow = 0; iRow < this.numRows; iRow++) {
                        boardContent += boardArrays[iRow].join('');
                        if (iRow < this.numRows - 1) {
                            boardContent += '\n';
                        }
                    }

                    // Store the raw board string back into redis
                    this.redisAsync.set('board', boardContent);

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
