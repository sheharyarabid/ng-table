import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Table2Component } from './Components/table2/table2.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Table2Component],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ng-table';
}
