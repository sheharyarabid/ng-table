import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, inject, Input, Output, ViewChild } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { ButtonComponent } from '../button/button.component';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';

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
  totalEmployees = 0; // Total number of employees
  pageSize = 5; // Default page size
  pageIndex = 0; // Default page index
  sortField = 'id'; // Default sort field
  sortDirection = 'asc'; // Default sort direction
  apiUrl = 'http://localhost:1337/api/employees/'; // API URL

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private cdr: ChangeDetectorRef, private http: HttpClient, public dialog: MatDialog) {}

  loadEmployees(
    pageIndex: number = 0,
    pageSize: number = 5,
    sortField: string = 'id',
    sortDirection: string = 'asc'
  ) {
    const validSortDirection = sortDirection.toLowerCase() === 'asc' || sortDirection.toLowerCase() === 'desc'
      ? sortDirection.toLowerCase()
      : 'asc';
  
    // Convert 0-based index from MatPaginator to 1-based index for the API
    const params = {
      'pagination[page]': (pageIndex + 1).toString(), // 1-based index for the API
      'pagination[pageSize]': pageSize.toString(),
      'sort': `${sortField}:${validSortDirection}`
    };
  
    this.http.get<{ data: { id: number, attributes: { name: string, designation: string, city: string } }[], meta: { pagination: { total: number } } }>(this.apiUrl, { params })
      .pipe(
        map(response => {
          this.totalEmployees = response.meta.pagination.total; // Update total employees
          return response.data.map(emp => ({
            id: emp.id,
            name: emp.attributes.name,
            designation: emp.attributes.designation,
            city: emp.attributes.city
          }));
        }),
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
    // Initially load the employees
    this.loadEmployees(this.pageIndex, this.pageSize, this.sortField, this.sortDirection);
  
    this.paginator.page.subscribe((event: PageEvent) => {
      // Update the pageIndex and pageSize
      this.pageIndex = event.pageIndex;
      this.pageSize = event.pageSize;
      this.loadEmployees(this.pageIndex, this.pageSize, this.sort.active, this.sort.direction);
    });
  
    this.sort.sortChange.subscribe((sort: Sort) => {
      // Update the sortField and sortDirection
      this.sortField = sort.active;
      this.sortDirection = sort.direction;
      this.pageIndex = 0; // Reset to the first page when sorting changes
      this.loadEmployees(this.pageIndex, this.pageSize, this.sortField, this.sortDirection);      
    });
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
      this.loadEmployees(this.pageIndex, this.pageSize, this.sortField, this.sortDirection);
    });
  }

  deleteDataDialog(id: number): void {
    const dialogRef = this.dialog.open(DeleteDataDialog, {
      width: '250px',
      data: { id }
    });

    dialogRef.componentInstance.dataDeleted.subscribe(() => {
      this.loadEmployees(this.pageIndex, this.pageSize, this.sortField, this.sortDirection);
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
      this.loadEmployees(this.pageIndex, this.pageSize, this.sortField, this.sortDirection);
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
      name: this.form.value.name,
      designation: this.form.value.designation,
      city: this.form.value.city
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
  ) { }

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
        name: this.updateForm.value.name,
        designation: this.updateForm.value.designation,
        city: this.updateForm.value.city
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

