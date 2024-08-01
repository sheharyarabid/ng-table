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
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import { fromEvent, interval } from 'rxjs';
import { debounce, scan } from 'rxjs/operators';

// Define the structure of an Employee object
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
  host: { ngSkipHydration: 'true' },  // Skip hydration in server-side rendering
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
  changeDetection: ChangeDetectionStrategy.OnPush, // Use OnPush change detection strategy
})
export class Table2Component implements AfterViewInit {
  displayedColumns: string[] = ['id', 'name', 'designation', 'city', 'buttons'];  // Columns to display in the table
  dataSource: MatTableDataSource<Employee> = new MatTableDataSource<Employee>([]);  // Data source for the table
  totalEmployees = 0; // Total number of employees
  pageSize = 5; // Default page size
  pageIndex = 0; // Default page index
  sortField = 'id'; // Default sort field
  sortDirection = 'asc'; // Default sort direction
  apiUrl = 'http://localhost:1337/api/employees/'; // API URL

  @ViewChild(MatPaginator) paginator: MatPaginator; // Reference to MatPaginator for pagination
  @ViewChild(MatSort) sort: MatSort; // Reference to MatSort for sorting
  @ViewChild('filterInput') filterInput: any; // Reference to filter input field

  filterValue = ''; // Store filter value

  constructor(private cdr: ChangeDetectorRef, private http: HttpClient, public dialog: MatDialog) {}

  ngAfterViewInit() {
    // Load employees initially
    this.loadEmployees(this.pageIndex, this.pageSize, this.sortField, this.sortDirection, this.filterValue);

    // Listen to page changes in the paginator
    this.paginator.page.subscribe((event: PageEvent) => {
      this.pageIndex = event.pageIndex;
      this.pageSize = event.pageSize;
      this.loadEmployees(this.pageIndex, this.pageSize, this.sort.active, this.sort.direction, this.filterValue);
    });

    // Listen to sort changes
    this.sort.sortChange.subscribe((sort: Sort) => {
      this.sortField = sort.active;
      this.sortDirection = sort.direction;
      this.pageIndex = this.paginator.pageIndex;
      this.loadEmployees(this.pageIndex, this.pageSize, this.sortField, this.sortDirection, this.filterValue);
    });

    // Filter input observable
    fromEvent(this.filterInput.nativeElement, 'input').pipe(
      debounce(() => interval(1500)), // Adjust debounce time as needed
      map((event: any) => event.target.value.trim().toLowerCase()),
      scan((acc, curr) => curr) // Get the latest filter value
    ).subscribe(value => {
      this.filterValue = value;
      this.loadEmployees(this.pageIndex, this.pageSize, this.sortField, this.sortDirection, this.filterValue);
    });
  }

  // Load employees with pagination, sorting, and filtering
  loadEmployees(
    pageIndex: number = 0,
    pageSize: number = 5,
    sortField: string = 'id',
    sortDirection: string = 'asc',
    filterValue: string = ''
  ) {
    const validSortDirection = ['asc', 'desc'].includes(sortDirection.toLowerCase()) ? sortDirection.toLowerCase() : 'asc';
    const normalizedFilterValue = filterValue.trim().toLowerCase();
    let params = new HttpParams()
      .set('pagination[page]', (pageIndex + 1).toString())
      .set('pagination[pageSize]', pageSize.toString())
      .set('pagination[withCount]', 'true')
      .set('sort', `${sortField}:${validSortDirection}`);

    if (normalizedFilterValue) {
      params = params
        .set('filters[$or][0][name][$containsi]', normalizedFilterValue)
        .set('filters[$or][1][designation][$containsi]', normalizedFilterValue)
        .set('filters[$or][2][city][$containsi]', normalizedFilterValue);
    }

    this.http.get<{ data: { id: number, attributes: { name: string, designation: string, city: string } }[], meta: { pagination: { total: number } } }>(this.apiUrl, { params })
      .pipe(
        map(response => {
          this.totalEmployees = response.meta.pagination.total;
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

  // Apply filter when input changes

  // Open a dialog to add a new employee
  addDataDialog(enterAnimationDuration: string, exitAnimationDuration: string): void {
    const dialogRef = this.dialog.open(AddDataDialog, {
      width: '250px',
      enterAnimationDuration,
      exitAnimationDuration,
    });
    dialogRef.componentInstance.dataAdded.subscribe(() => {
      this.loadEmployees(this.pageIndex, this.pageSize, this.sortField, this.sortDirection, this.filterValue);
    });
  }

  // Open a dialog to delete an employee
  deleteDataDialog(id: number): void {
    const dialogRef = this.dialog.open(DeleteDataDialog, {
      width: '250px',
      data: { id }
    });

    dialogRef.componentInstance.dataDeleted.subscribe(() => {
      this.loadEmployees(this.pageIndex, this.pageSize, this.sortField, this.sortDirection, this.filterValue);
    });
  }

  // Open a dialog to update an employee
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
      this.loadEmployees(this.pageIndex, this.pageSize, this.sortField, this.sortDirection, this.filterValue);
    });
  }
}

// Dialog component for adding a new entry
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
  changeDetection: ChangeDetectionStrategy.OnPush, // Use OnPush change detection strategy
})
export class AddDataDialog {
  readonly dialogRef = inject(MatDialogRef<AddDataDialog>); // Reference to the dialog
  @Output() dataAdded = new EventEmitter<void>(); // Event emitter for notifying data addition

  form: FormGroup; // Form group for the dialog form
  apiUrl = 'http://localhost:1337/api/employees/'; // API URL

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
        this.dataAdded.emit(); // Notify parent component that data was added
        this.dialogRef.close(); // Close the dialog
      });
  }
}

// Dialog component for deleting an entry
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
  changeDetection: ChangeDetectionStrategy.OnPush, // Use OnPush change detection strategy
})
export class DeleteDataDialog {
  @Output() dataDeleted = new EventEmitter<void>(); // Event emitter for notifying data deletion
  readonly dialogRef = inject(MatDialogRef<DeleteDataDialog>); // Reference to the dialog
  apiUrl = 'http://localhost:1337/api/employees/'; // API URL

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { id: number }, // Inject the ID of the employee to delete
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
        this.dataDeleted.emit(); // Notify parent component that data was deleted
        this.dialogRef.close(); // Close the dialog
      });
  }
}

// Dialog component for updating an entry
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
  changeDetection: ChangeDetectionStrategy.OnPush, // Use OnPush change detection strategy
})
export class UpdateDataDialog {
  @Output() dataUpdated = new EventEmitter<void>(); // Event emitter for notifying data update
  readonly dialogRef = inject(MatDialogRef<UpdateDataDialog>); // Reference to the dialog
  apiUrl = 'http://localhost:1337/api/employees/'; // API URL
  updateForm: FormGroup; // Form group for the update dialog form

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { id: number, name: string, designation: string, city: string }, // Inject employee data to update
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
        this.dataUpdated.emit(); // Notify parent component that data was updated
        this.dialogRef.close(); // Close the dialog
      });
  }
}
