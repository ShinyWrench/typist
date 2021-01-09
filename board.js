const RedisAsync = require('./redisAsync');

class Board {
    static buildNewBoardContent(numRows, numCols) {
        let output = '';
        for (let iRow = 0; iRow < numRows; iRow++) {
            for (let iCol = 0; iCol < numCols; iCol++) {
                output += this.randomLetter();
                if (iCol < numCols - 1) {
                    output += '&nbsp;&nbsp;';
                }
            }
            if (iRow < numRows - 1) {
                output += '<br>';
            }
        }
        return output;
    }

    static randomLetter() {
        let randomNumber = 52 * Math.random();
        let uppercase = Math.floor(randomNumber / 26) > 0;
        return String.fromCharCode((uppercase ? 65 : 97) + (randomNumber % 26));
    }

    constructor(numRows, numCols) {
        this.numRows = numRows;
        this.numCols = numCols;
        this.redisAsync = new RedisAsync();

        this.redisAsync.connect();
        this.redisAsync.set(
            'board',
            Board.buildNewBoardContent(numRows, numCols)
        );
    }

    async getRendered() {
        return await this.redisAsync.get('board');
    }

    handleClientCommand() {
        // TODO
    }

    async print() {
        console.log(await this.getRendered());
    }
}

module.exports = Board;
