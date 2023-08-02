
//Dependencies
const inquirer = require('inquirer');
const mysql = require('mysql2');
const util = require('util');
const figlet = require('figlet');

//Connection to database
const connection = mysql.createConnection(
  {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'employeetracker_db',
  },
  console.log(`You are connected to the employeetracker_db database!`)
);

connection.query = util.promisify(connection.query);

//Connect to MySQL server
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL server');
  startApp();
});

//Figlet display 'Employee Tracker' using ASCII art
const options = {
  font: 'Standard',
  horizontalLayout: 'default',
  verticalLayout: 'default',
  width: 80,
  whitespaceBreak: true,
};

figlet('Employee Tracker', options, function (err, data) {
  if (err) {
    console.log('Something went wrong...');
    console.dir(err);
    return;
  }
  console.log(data);
});

//Function to start the application
function startApp() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'View all Employees',
          'View all employees by Department',
          'View all employees by Manager',
          'Add Employee',
          'Add Department',
          'Add Role',
          'Remove Employee',
          'Delete Department',
          'Delete Role',
          'Update Employee role',
          'Update Employee Manager',
          'Exit',
        ],
      },
    ])
    .then((answers) => {
      switch (answers.action) {
        case 'View all Employees':
          viewAllEmployees();
          break;
        case 'View all employees by Department':
          viewAllEmployeesByDepartment();
          break;
        case 'View all employees by Manager':
          viewAllEmployeesByManager();
          break;
        case 'Add Employee':
          addEmployee();
          break;
        case 'Add Department':
          addDepartment();
          break;
        case 'Add Role':
          addRole();
          break;
        case 'Remove Employee':
          deleteEmployee();
          break;
        case 'Delete Department':
          deleteDepartment();
          break;
        case 'Delete Role':
          deleteRole();
          break;
        case 'Update Employee role':
          updateEmployeeRole();
          break;
        case 'Update Employee Manager':
          updateEmployeeManager();
          break;
        case 'Exit':
          connection.end();
          console.log('Connection to server has ended. Have a great day!');
          break;
      }
    });
}

// Function to view all employees
function viewAllEmployees() {
  connection.query(
    'SELECT employee.id, employee.first_name, employee.last_name, role.title, role.salary, department.department_name, CONCAT(manager.first_name, " ", manager.last_name) AS manager_name FROM employee INNER JOIN role ON employee.role_id = role.id INNER JOIN department ON role.department_id = department.id LEFT JOIN employee manager ON employee.manager_id = manager.id',
    (err, res) => {
      if (err) throw err;
      console.table(res);
      startApp();
    }
  );
}

// Function to view employees by department
function viewAllEmployeesByDepartment() {
  connection.query('SELECT * FROM department', (err, results) => {
    if (err) throw err;

    const deptChoices = [];
    for (let i = 0; i < results.length; i++) {
      deptChoices.push({
        name: results[i].department_name,
        value: results[i].id,
      });
    }

    inquirer
      .prompt([
        {
          type: 'list',
          name: 'department',
          message: 'Select a department:',
          choices: deptChoices,
        },
      ])
      .then((answers) => {
        const department = answers.department;
        connection.query(
          'SELECT employee.id, employee.first_name, employee.last_name, role.title, role.salary, department.department_name, CONCAT(manager.first_name, " ", manager.last_name) AS manager_name FROM employee INNER JOIN role ON employee.role_id = role.id INNER JOIN department ON role.department_id = department.id JOIN employee manager ON employee.manager_id = manager.id WHERE department.id = ?',
          [department],
          (err, res) => {
            if (err) throw err;
            console.table(res);
            startApp();
          }
        );
      });
  });
}

// Function to view employees by manager
function viewAllEmployeesByManager() {
  connection.query('SELECT * FROM employee', (err, employees) => {
    if (err) {
      console.log('An error occurred while fetching employees.');
      console.error(err);
      startApp();
    } else {
      const managerChoices = employees.map((employee) => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.id,
      }));

      inquirer
        .prompt([
          {
            type: 'list',
            name: 'manager',
            message: 'Select a manager:',
            choices: managerChoices,
          },
        ])
        .then((answers) => {
          const managerId = answers.manager;

          connection.query(
            'SELECT employee.id, employee.first_name, employee.last_name, role.title, role.salary, department.department_name FROM employee INNER JOIN role ON employee.role_id = role.id INNER JOIN department ON role.department_id = department.id WHERE employee.manager_id = ?',
            [managerId],
            (err, res) => {
              if (err) {
                console.log('An error occurred while fetching employees!');
                console.error(err);
              } else {
                console.table(res);
              }
              startApp();
            }
          );
        })
        .catch((err) => {
          console.log('An error occurred!');
          console.error(err);
          startApp();
        });
    }
  });
}

// Function to update employee role
function updateEmployeeRole() {
  connection.query('SELECT id, title FROM role', (err, results) => {
    if (err) throw err;

    const roleChoices = [];
    for (let i = 0; i < results.length; i++) {
      roleChoices.push({
        name: results[i].title,
        value: results[i].id,
      });
    }

    inquirer
      .prompt([
        {
          type: 'input',
          name: 'employeeId',
          message: 'Enter the ID of the employee to update:',
        },
        {
          type: 'list',
          name: 'newRole',
          message: 'Select the new role for the employee!',
          choices: roleChoices,
        },
      ])
      .then((answers) => {
        const employeeId = answers.employeeId;
        const roleId = answers.newRole;
        const query = 'UPDATE employee SET role_id = ? WHERE id = ?';
        connection.query(query, [roleId, employeeId], (err, results) => {
          if (err) throw err;
          console.log('Employee role updated successfully!');
          startApp();
        });
      });
  });
}

// Function to add department
function addDepartment() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'departmentName',
        message: 'Enter the name of the department:',
      },
    ])
    .then((answers) => {
      const departmentName = answers.departmentName;
      const query = 'INSERT INTO department (department_name) VALUES (?)';
      connection.query(query, [departmentName], (err, results) => {
        if (err) throw err;
        console.log('Department added successfully!');
        startApp();
      });
    });
}

// Function to add role
function addRole() {
  connection.query('SELECT * FROM department', (err, results) => {
    if (err) throw err;

    const departmentChoices = [];
    for (let i = 0; i < results.length; i++) {
      departmentChoices.push({
        name: results[i].department_name,
        value: results[i].id,
      });
    }

    inquirer
      .prompt([
        {
          type: 'input',
          name: 'roleTitle',
          message: 'Enter the title of the role:',
        },
        {
          type: 'input',
          name: 'roleSalary',
          message: 'Enter the salary for the role:',
        },
        {
          type: 'list',
          name: 'roleDepartment',
          message: 'Select the department for the role:',
          choices: departmentChoices,
        },
      ])
      .then((answers) => {
        const roleTitle = answers.roleTitle;
        const roleSalary = answers.roleSalary;
        const roleDepartment = answers.roleDepartment;
        const query =
          'INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)';
        connection.query(
          query,
          [roleTitle, roleSalary, roleDepartment],
          (err, results) => {
            if (err) throw err;
            console.log('Role added successfully!');
            startApp();
          }
        );
      });
  });
}

// Function to add employee
function addEmployee() {
  connection.query('SELECT * FROM role', (err, results) => {
    if (err) throw err;

    const roleChoices = [];
    for (let i = 0; i < results.length; i++) {
      roleChoices.push({
        name: results[i].title,
        value: results[i].id,
      });
    }

    connection.query(
      'SELECT * FROM employee WHERE manager_id IS NULL',
      (err, results) => {
        if (err) throw err;

        const managerChoices = [];
        for (let i = 0; i < results.length; i++) {
          managerChoices.push({
            name: `${results[i].first_name} ${results[i].last_name}`,
            value: results[i].id,
          });
        }

        inquirer
          .prompt([
            {
              type: 'input',
              name: 'firstName',
              message: 'Enter the first name of the employee:',
            },
            {
              type: 'input',
              name: 'lastName',
              message: 'Enter the last name of the employee:',
            },
            {
              type: 'list',
              name: 'role',
              message: 'Select the role for the employee:',
              choices: roleChoices,
            },
            {
              type: 'list',
              name: 'manager',
              message: 'Select the manager for the employee:',
              choices: managerChoices,
            },
          ])
          .then((answers) => {
            const firstName = answers.firstName;
            const lastName = answers.lastName;
            const role = answers.role;
            const manager = answers.manager;
            const query =
              'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)';
            connection.query(
              query,
              [firstName, lastName, role, manager],
              (err, results) => {
                if (err) throw err;
                console.log('Employee added successfully!');
                startApp();
              }
            );
          });
      }
    );
  });
}

// Function to delete employee
function deleteEmployee() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'employeeId',
        message: 'Enter the ID of the employee to delete:',
      },
    ])
    .then((answers) => {
      const employeeId = answers.employeeId;
      const query = 'DELETE FROM employee WHERE id = ?';
      connection.query(query, [employeeId], (err, results) => {
        if (err) throw err;
        console.log('Employee deleted successfully!');
        startApp();
      });
    });
}

// Function to delete department
function deleteDepartment() {
  connection.query('SELECT * FROM department', (err, results) => {
    if (err) throw err;

    const departmentChoices = [];
    for (let i = 0; i < results.length; i++) {
      departmentChoices.push({
        name: results[i].department_name,
        value: results[i].id,
      });
    }

    inquirer
      .prompt([
        {
          type: 'list',
          name: 'department',
          message: 'Select the department to delete:',
          choices: departmentChoices,
        },
      ])
      .then((answers) => {
        const departmentId = answers.department;
        const query = 'DELETE FROM department WHERE id = ?';
        connection.query(query, [departmentId], (err, results) => {
          if (err) throw err;
          console.log('Department deleted successfully!');
          startApp();
        });
      });
  });
}

// Function to delete role
function deleteRole() {
  connection.query('SELECT * FROM role', (err, results) => {
    if (err) throw err;

    const roleChoices = [];
    for (let i = 0; i < results.length; i++) {
      roleChoices.push({
        name: results[i].title,
        value: results[i].id,
      });
    }

    inquirer
      .prompt([
        {
          type: 'list',
          name: 'role',
          message: 'Select the role to delete:',
          choices: roleChoices,
        },
      ])
      .then((answers) => {
        const roleId = answers.role;
        const query = 'DELETE FROM role WHERE id = ?';
        connection.query(query, [roleId], (err, results) => {
          if (err) throw err;
          console.log('Role deleted successfully!');
          startApp();
        });
      });
  });
}

// Function to update employee manager
function updateEmployeeManager() {
  connection.query(
    'SELECT id, first_name, last_name FROM employee',
    (err, results) => {
      if (err) throw err;

      const managerChoices = [];
      for (let i = 0; i < results.length; i++) {
        managerChoices.push({
          name: `${results[i].first_name} ${results[i].last_name}`,
          value: results[i].id,
        });
      }

      inquirer
        .prompt([
          {
            type: 'input',
            name: 'employeeId',
            message: 'Enter the ID of the employee to update:',
          },
          {
            type: 'list',
            name: 'newManager',
            message: 'Enter the new manager for the employee:',
            choices: managerChoices,
          },
        ])
        .then((answers) => {
          const employeeId = answers.employeeId;
          const newManager = answers.newManager;
          const query = 'UPDATE employee SET manager_id = ? WHERE id = ?';
          connection.query(query, [newManager, employeeId], (err, results) => {
            if (err) throw err;
            console.log('Employee manager updated successfully!');
            startApp();
          });
        });
    }
  );
}