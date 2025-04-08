import { Component, HostListener } from '@angular/core';
import { Board, Direction } from './board.model';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-board',
  imports: [NgClass],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css'
})
export class BoardComponent {

  ngOnInit() {
    const savedBoard = localStorage.getItem("board");
    if (savedBoard) {
      this.board = JSON.parse(savedBoard);
    } else {
      this.board = Array.from({ length: this.boardSize }, (_, row) =>
        Array.from({ length: this.boardSize }, (_, col) => ({ index: row * this.boardSize + col, number: null }))
      );
      this.addNewNumber();
    }
  }

  boardSize: number = parseInt(localStorage.getItem("boardSize") || "4") || 4;
  board: Board[][] = [];
  gameOver: boolean = false;
  playerScore: number = parseInt(localStorage.getItem("playerScore") || "0") || 0;
  gameWon: boolean = false;
  showWinMsg: boolean = localStorage.getItem("showWinMsg") === "true" || false;
  playingAfterWinning: boolean = localStorage.getItem("playingAfterWinning") === "true" || false;
  boardSizes: number[] = [4, 5, 6, 7, 8];
  winningNumber: number = 2048;
  highestScore: number = parseInt(localStorage.getItem("highestScore") || "0") || 0;

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    event.preventDefault(); // prevent scrolling
    if (this.gameOver || this.showWinMsg) return; // prevent moving after game over
    switch (event.key) {
      case 'ArrowUp':
        this.doRound("up");
        break;
      case 'ArrowDown':
        this.doRound("down");
        break;
      case 'ArrowLeft':
        this.doRound("left");
        break;
      case 'ArrowRight':
        this.doRound("right");
        break;
    }
  }

  doRound = (direction: Direction): void => {
    let boardCopy: Board[][] = [];
    if (direction === "left" || direction === "right")
      boardCopy = this.horizontalMove(direction);
    else if (direction === "up" || direction === "down")
      boardCopy = this.verticalMove(direction);

    if (JSON.stringify(boardCopy) !== JSON.stringify(this.board)) {
      this.board = boardCopy;
      this.addNewNumber();
    }

    localStorage.setItem("board", JSON.stringify(this.board));

    if (!this.canMove()) {
      this.gameOver = true;
    }

    if (this.gameWon && !this.playingAfterWinning) {
      this.showWinMsg = true;
      localStorage.setItem("showWinMsg", "true");
    }
  }

  canMove(): boolean {
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        if (!this.board[i][j].number) return true; // if there's an empty space we can move
        else {
          if (
            // check right
            (j < this.boardSize - 1 && this.board[i][j].number === this.board[i][j + 1].number) ||
            // check down
            (i < this.boardSize - 1 && this.board[i][j].number === this.board[i + 1][j].number) ||
            // check left
            (j > 0 && this.board[i][j].number === this.board[i][j - 1].number) ||
            // check up
            (i > 0 && this.board[i][j].number === this.board[i - 1][j].number)
          )
            return true;
        }
      }
    }
    return false;
  }

  horizontalMove(direction: ("left" | "right")): Board[][] {
    const boardCopy: Board[][] = JSON.parse(JSON.stringify(this.board)); // deep copy of the board
    for (const row of boardCopy) {
      // get all the numbers currently on this row
      const numbersAvailable: number[] = [];
      for (let i = 0; i < this.boardSize; i++) {
        if (row[i].number) {
          numbersAvailable.push(row[i].number!);
        }
      }

      const combinedNumbers = this.combineMatches(numbersAvailable, direction === "left" ? false : true);

      // move all the numbers the most to the left
      for (let i = 0; i < this.boardSize; i++) {
        row[direction === "left" ? i : this.boardSize - 1 - i].number =
          combinedNumbers[direction === "left" ? i : combinedNumbers.length - 1 - i] || null;
      }
    }

    return boardCopy;
  }

  verticalMove(direction: ("up" | "down")): Board[][] {
    const boardCopy: Board[][] = JSON.parse(JSON.stringify(this.board)); // deep copy of the board
    for (let i = 0; i < this.boardSize; i++) {
      // get all the numbers currently on this column
      const numbersAvailable: number[] = [];
      for (let j = 0; j < this.boardSize; j++) {
        if (boardCopy[j][i].number) {
          numbersAvailable.push(boardCopy[j][i].number!);
        }
      }

      const combinedNumbers = this.combineMatches(numbersAvailable, direction === "up" ? false : true);

      // move all the numbers the most to the top
      for (let j = 0; j < this.boardSize; j++) {
        boardCopy[direction === "up" ? j : this.boardSize - 1 - j][i].number =
          combinedNumbers[direction === "up" ? j : combinedNumbers.length - 1 - j] || null;
      }
    }

    return boardCopy;
  }

  combineMatches(array: number[], reverse: boolean): number[] {
    const combinedNumbers: number[] = [];
    for (let i = 0; i < array.length; i++) {
      const currentIndex = reverse ? array.length - 1 - i : i;
      if (array[currentIndex] === array[reverse ? array.length - 2 - i : i + 1]) {
        combinedNumbers.push(array[currentIndex] * 2);
        this.playerScore += array[currentIndex] * 2;
        localStorage.setItem("playerScore", JSON.stringify(this.playerScore));
        if (this.playerScore > this.highestScore) {
          this.highestScore = this.playerScore;
          localStorage.setItem("highestScore", JSON.stringify(this.highestScore));
        }
        i++;
      } else {
        combinedNumbers.push(array[currentIndex]);
      }

      if (combinedNumbers.includes(this.winningNumber)) this.gameWon = true;
    }
    return reverse ? combinedNumbers.reverse() : combinedNumbers;
  }

  addNewNumber() {
    const twosAndFours = Array(9).fill(2).concat(4);
    const randomNumber = twosAndFours[Math.floor(Math.random() * 10)];
    const randomSpaceIndex = this.getRandomEmptySpaceIndex();
    if (randomSpaceIndex == null) return; // failsafe, shouldn't happen
    for (const row of this.board) {
      for (let i = 0; i < this.boardSize; i++) {
        if (row[i].index === randomSpaceIndex) {
          row[i].number = randomNumber;
        }
      }
    }
  }

  getRandomEmptySpaceIndex(): number | null {
    // filter out all the empty spaces 
    const emptySpaces: number[] = [];
    for (const row of this.board) {
      for (let i = 0; i < this.boardSize; i++) {
        if (!row[i].number) {
          emptySpaces.push(row[i].index);
        }
      }
    }

    return emptySpaces[Math.floor(Math.random() * emptySpaces.length)];
  }

  changeBoardSize(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.boardSize = parseInt(target.value, 10);
    localStorage.setItem("boardSize", target.value);
    this.restartGame();
  }

  restartGame() {
    this.board = Array.from({ length: this.boardSize }, (_, row) =>
      Array.from({ length: this.boardSize }, (_, col) => ({ index: row * this.boardSize + col, number: null }))
    );
    localStorage.removeItem("board");
    localStorage.removeItem("playerScore");
    localStorage.removeItem("boardSize");
    localStorage.removeItem("showWinMsg");
    localStorage.removeItem("playingAfterWinning");
    this.playerScore = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.showWinMsg = false;

    this.addNewNumber();
  }

  continueGame() {
    localStorage.removeItem("showWinMsg");
    localStorage.removeItem("board");
    this.showWinMsg = false;

    localStorage.setItem("playingAfterWinning", "true");
    this.playingAfterWinning = true;
  }

  getCellClass(cellNumber: number | null): string {
    if (cellNumber && cellNumber >= 2048) {
      return "cell-2048";
    }
    switch (cellNumber) {
      case 2: return "cell-2";
      case 4: return "cell-4";
      case 8: return "cell-8";
      case 16: return "cell-16";
      case 32: return "cell-32";
      case 64: return "cell-64";
      case 128: return "cell-128";
      case 256: return "cell-256";
      case 512: return "cell-512";
      case 1024: return "cell-1024";
      default: return "";
    }
  }
}
