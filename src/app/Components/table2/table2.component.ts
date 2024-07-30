import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, inject, Input, Output, ViewChild } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { ButtonComponent } from '../button/button.component';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormControl } from '@angular/forms';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Employee {
  id: number;
  name: string;
  designation: string;
  city: string;
  index?: number;
}

@Component({
  selector: 'app-table2',
  standalone: true,
  host: { ngSkipHydration: 'true' },
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    ButtonComponent,
    ReactiveFormsModule
  ],
  templateUrl: './table2.component.html',
  styleUrls: ['./table2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Table2Component implements AfterViewInit {
  displayedColumns: string[] = ['id', 'name', 'designation', 'city', 'buttons'];
  dataSource: MatTableDataSource<Employee> = new MatTableDataSource<Employee>([]);
  apiUrl = 'http://localhost:1337/api/employees/';

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private cdr: ChangeDetectorRef, private http: HttpClient, public dialog: MatDialog) {
    this.loadEmployees();
  }

  loadEmployees() {
    this.http.get<{ data: { id: number, attributes: { Name: string, Designation: string, City: string } }[] }>(this.apiUrl)
      .pipe(
        map(response => response.data.map(emp => ({
          id: emp.id,
          name: emp.attributes.Name,
          designation: emp.attributes.Designation,
          city: emp.attributes.City
        }))),
        catchError(error => {
          console.error('Error loading employees:', error);
          return [];
        })
      )
      .subscribe(employees => {
        this.dataSource.data = employees;
        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  addDataDialog(enterAnimationDuration: string, exitAnimationDuration: string): void {
    const dialogRef = this.dialog.open(AddDataDialog, {
      width: '250px',
      enterAnimationDuration,
      exitAnimationDuration,
    });
    dialogRef.componentInstance.dataAdded.subscribe(() => {
      this.loadEmployees();
    });
  }
}

  // deleteDataDialog(index: number): void {
  //   const dialogRef = this.dialog.open(DeleteDataDialog, {
  //     width: '250px',
  //     data: { index }
  //   });

  //   dialogRef.componentInstance.dataDeleted.subscribe(() => {
  //     this.loadEmployees();
  //   });
  // }

  // updateDataDialog(index: number): void {
  //     const dialogRef = this.dialog.open(updateDataDialog, {
  //       width: '250px',
  //       data: { index }
  //     });
  //     dialogRef.componentInstance.dataUpdated.subscribe(() => {
  //       this.loadEmployees();
  //     });
  //   }


// Create new entry
@Component({
  selector: 'dialog-animations-example-dialog1',
  templateUrl: 'addDataDialog.html',
  styleUrls: ['./table2.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatLabel,
    MatInputModule,
    MatFormFieldModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDataDialog {
  readonly dialogRef = inject(MatDialogRef<AddDataDialog>);
  @Output() dataAdded = new EventEmitter<void>();
  
  form: FormGroup;
  apiUrl = 'http://localhost:1337/api/employees/';

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      designation: ['', Validators.required],
      city: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    const newEmployee = {
      Name: this.form.value.name,
      Designation: this.form.value.designation,
      City: this.form.value.city
    };

    this.http.post(this.apiUrl, { data: newEmployee })
      .pipe(
        catchError(error => {
          console.error('Error adding employee:', error);
          return [];
        })
      )
      .subscribe(() => {
        this.dataAdded.emit();
        this.dialogRef.close();
      });
  }
}


// // Delete
// @Component({
//   selector: 'dialog-animations-example-dialog2',
//   templateUrl: 'deleteDataDialog.html',
//   styleUrls: ['./table2.component.scss'],
//   standalone: true,
//   imports: [
//     MatButtonModule,
//     MatAutocompleteModule,
//     ReactiveFormsModule,
//     MatDialogActions,
//     MatDialogClose,
//     MatDialogTitle,
//     MatDialogContent,
//     CommonModule,
//     FormsModule,
//     MatLabel,
//     MatInputModule,
//     MatFormFieldModule,
//     Table2Component
//   ],
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class DeleteDataDialog {
//   @Output() dataDeleted = new EventEmitter<void>();
//   readonly dialogRef = inject(MatDialogRef<DeleteDataDialog>);
//   id: number;

//   constructor(@Inject(MAT_DIALOG_DATA) public data: { index: number }, private http: HttpClient) {
//     this.id = data.index;
//   }

//   onSubmit() {
//     this.http.delete(`${this.apiUrl}${this.id}`)
//       .pipe(
//         catchError(error => {
//           console.error('Error deleting employee:', error);
//           return [];
//         })
//       )
//       .subscribe(() => {
//         this.dataDeleted.emit();
//         this.dialogRef.close();
//       });
//   }
// }

// // Update
// @Component({
//   selector: 'dialog-animations-example-dialog3',
//   templateUrl: 'updateDataDialog.html',
//   styleUrls: ['./table2.component.scss'],
//   standalone: true,
//   imports: [
//     MatButtonModule,
//     MatAutocompleteModule,
//     ReactiveFormsModule,
//     MatDialogActions,
//     MatDialogClose,
//     MatDialogTitle,
//     MatDialogContent,
//     CommonModule,
//     FormsModule,
//     MatLabel,
//     MatInputModule,
//     MatFormFieldModule,
//     Table2Component
//   ],
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class updateDataDialog {
//   readonly dialogRef = inject(MatDialogRef<updateDataDialog>);
//   @Input() eName: string;
//   @Input() eDesignation: string;
//   @Input() eCity: string;
//   @Input() eId: number;
//   @Output() dataUpdated = new EventEmitter<void>();

//   constructor(@Inject(MAT_DIALOG_DATA) public data: { index: number }, private http: HttpClient) {
//     this.eId = data.index;
//   }

//   onSubmit() {
//     const updatedEmployee = {
//       Name: this.eName,
//       Designation: this.eDesignation,
//       City: this.eCity
//     };

//     this.http.put(`${this.apiUrl}${this.eId}`, { data: updatedEmployee })
//       .pipe(
//         catchError(error => {
//           console.error('Error updating employee:', error);
//           return [];
//         })
//       )
//       .subscribe(() => {
//         this.dataUpdated.emit();
//         this.dialogRef.close();
//       });
//   }
// }
