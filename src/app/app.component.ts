import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TableComponent } from './Components/table/table.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TableComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ng-table';
}
