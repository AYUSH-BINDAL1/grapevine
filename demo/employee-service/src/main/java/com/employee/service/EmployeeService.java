package com.employee.service;

import java.util.List;

import com.employee.entity.Employee;

public interface EmployeeService {
	
	List<Employee> getAllEmployees();
	Employee getEmployeeById(Long employeeId);
	Employee addEmployee(Employee employee);
	Employee updateEmployee(Employee employee);
	String deleteEmployee(Employee employee);

}
