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
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MatIcon, MatIconModule } from '@angular/material/icon';


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
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule
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
  //Read Dat
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

  deleteDataDialog(id: number): void {
    const dialogRef = this.dialog.open(DeleteDataDialog, {
      width: '250px',
      data: { id }  // Make sure 'id' is the actual employee ID, not an index
    });
  
    dialogRef.componentInstance.dataDeleted.subscribe(() => {
      this.loadEmployees();
    });
  }

  openUpdateDialog(employee: Employee): void {
    const dialogRef = this.dialog.open(UpdateDataDialog, {
      width: '400px',
      data: { 
        id: employee.id, 
        name: employee.name, 
        designation: employee.designation, 
        city: employee.city 
      }
    });
  
    dialogRef.componentInstance.dataUpdated.subscribe(() => {
      this.loadEmployees();
    });
  }
  
  
}


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


// // Delete entry
@Component({
  selector: 'dialog-animations-example-dialog2',
  templateUrl: 'deleteDataDialog.html',
  styleUrls: ['./table2.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    CommonModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteDataDialog {
  @Output() dataDeleted = new EventEmitter<void>();
  readonly dialogRef = inject(MatDialogRef<DeleteDataDialog>);
  apiUrl = 'http://localhost:1337/api/employees/';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { id: number }, 
    private http: HttpClient
  ) {}

  onDelete() {
    if (this.data.id === undefined || this.data.id === null) {
      console.error('Invalid employee ID:', this.data.id);
      return;
    }

    this.http.delete(`${this.apiUrl}${this.data.id}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting employee:', error);
          return [];
        })
      )
      .subscribe(() => {
        this.dataDeleted.emit();
        this.dialogRef.close();
      });
  }
}



// Update
@Component({
  selector: 'dialog-animations-example-dialog3',
  templateUrl: 'updateDataDialog.html',
  styleUrls: ['./table2.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class UpdateDataDialog {
  @Output() dataUpdated = new EventEmitter<void>();
  readonly dialogRef = inject(MatDialogRef<UpdateDataDialog>);
  apiUrl = 'http://localhost:1337/api/employees/';
  updateForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { id: number, name: string, designation: string, city: string }, 
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.updateForm = this.fb.group({
      name: [data.name, Validators.required],
      designation: [data.designation, Validators.required],
      city: [data.city, Validators.required]
    });
  }

  onSubmit() {
    if (this.updateForm.invalid) {
      return;
    }

    const updatedEmployee = {
      data: {
        Name: this.updateForm.value.name,
        Designation: this.updateForm.value.designation,
        City: this.updateForm.value.city
      }
    };

    this.http.put(`${this.apiUrl}${this.data.id}`, updatedEmployee)
      .pipe(
        catchError(error => {
          console.error('Error updating employee:', error);
          return [];
        })
      )
      .subscribe(() => {
        this.dataUpdated.emit();
        this.dialogRef.close();
      });
  }
}

