class Board {
    static buildBoard(numRows, numCols) {
        let board = [];
        for (let iRow = 0; iRow < numRows; iRow++) {
            let row = [];
            for (let iCol = 0; iCol < numCols; iCol++) {
                row.push(Board.randomLetter());
            }
            board.push(row);
        }
        return board;
    }

    static randomLetter() {
        let randomNumber = 52 * Math.random();
        let uppercase = Math.floor(randomNumber / 26) > 0;
        return String.fromCharCode((uppercase ? 65 : 97) + (randomNumber % 26));
    }

    constructor(numRows, numCols) {
        this.numRows = numRows;
        this.numCols = numCols;
        this.board = Board.buildBoard(numRows, numCols);
    }

    print() {
        let output = '';
        this.board.forEach((row) => {
            output += '|';
            row.forEach((letter) => {
                output += `  ${letter}`;
            });
            output += '  |\n';
            output += `|${' '.repeat(3 * row.length + 2)}|\n`;
        });
        console.log(output);
    }
}

module.exports = Board;
