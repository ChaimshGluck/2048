import { Component } from '@angular/core';
import { BoardComponent } from "../board/board.component";

@Component({
  selector: 'app-game-container',
  imports: [BoardComponent],
  templateUrl: './game-container.component.html',
  styleUrl: './game-container.component.css'
})
export class GameContainerComponent {

}
