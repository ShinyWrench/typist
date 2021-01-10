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
        let storedCopy = await this.getBoardContent();
        let storedCopyRows = storedCopy.split('\n');
        let rendered = '';
        for (let iRow = 0; iRow < storedCopyRows.length; iRow++) {
            rendered += storedCopyRows[iRow].split('').join('&nbsp;&nbsp;');
            if (iRow < storedCopyRows.length - 1) {
                rendered += '<br><br>';
            }
        }
        return rendered;
    }

    handleClientCommand() {
        // TODO
        // if()
    }

    async print() {
        console.log(await this.getBoardContent());
    }
}

module.exports = Board;
