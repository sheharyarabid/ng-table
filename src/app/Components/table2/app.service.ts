import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";
import { SortDirection } from "@angular/material/sort";

// Define the structure of an employee
interface Employee {
  id: number;
  name: string;
  position: string;
  // Add other fields as necessary
}

// Define the structure of the API response
interface EmployeesApi {
  data: Employee[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private baseUrl = 'http://localhost:1337/api/employees';

  constructor(private httpClient: HttpClient) {}

  getEmployeeData(
    sort: string,
    order: SortDirection,
    page: number
  ): Observable<EmployeesApi> {
    // Construct the URL with the appropriate query parameters
    const url = `${this.baseUrl}?sort=${sort}:${order}&page=${page}&limit=10`;
    return this.httpClient.get<EmployeesApi>(url);
  }
}
