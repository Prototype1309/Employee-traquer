
const inquirer = require("inquirer");
const mysql = require("mysql2");
const util = require("util");
const figlet = require("figlet");


// connect to db

const connection = mysql.createConnection(
    {
    host: "localost",
    user: "root",
    password: "",
    database: "employees_db",
    },
    console.log(`Connected to the employees_db database.`)
);

db.connect(function (err) {
    if (err) throw err;
    startingQuestion();
});

// start the question 
function startingQuestion() {
    inquirer.createPromptModule([
        {
            type: 'list',
            name: 'intro',
            message: 'What would you like to do?',
            choices: [
                'View All Employees',
                'Add employee',
                'Update Employee Role',
                'View All Roles',
                'Add Role',
                'View All Departments',
                'Add Department',
                'Quit'
            ]
        }
    ]).then((answer) => {
        switch (answer.intro) {
            case "View All Employees":
                vienEmployee();
                break;
            case "Add Employee":
                addEmployee();
                break;
            case "Update Employee Role":
                updateRole();
                break;
            case "View All Roles":
                viewRoles();
                break;
            case "Add Role":
                addRole();
                break;
            case "View All Departments":
                viewDepartments();
                break;
            case "Add Department":
                addDepartment();
                break;
            case "Quit":
                console.log("Good-Bye!");
                db.end();
                break;
        }
    });
};

// view what what table you're choosing
function viewDepartments() {
    const sql = `SELECT department.id, department.name AS Department FROM department;`;
    db.query(sql, (err, res) => {
        if (err) {
            console.log(err);
            return;
        }
        console.table(res);
        startingQuestion();
    });
};