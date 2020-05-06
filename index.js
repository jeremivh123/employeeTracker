var mysql = require("mysql");
var inquirer = require("inquirer");

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "MyPassword",
  database: "employeeTracker_db"
});

connection.connect(function(err) {
  if (err) throw err;
  // run the start function after the connection is made to prompt the user
  start();
});


function start(){
  inquirer
    .prompt({
      name: "start",
      type: "list",
      message: "What would you like to do?",
      choices: ["Add Role", "Add Employee", "Add Department", "View Employees", "View Roles", "View Departments", "Update Employee Roles"]
    })
    .then(function(answer){
      if (answer.start === "Add Employee"){
        addEmployee();
      }
      else if (answer.start==="Add Department"){
        addDepartment();
      }
      else if (answer.start==="Add Role"){
        addRole();
      }
      else if (answer.start==="View Employees"){
        viewEmployees();
      }
      else if (answer.start==="View Roles"){
        viewRoles();
      }
      else if(answer.start==="View Departments"){
        viewDepartments();
      }
      else if (answer.start==="Update Employee Roles"){
        updateRoles();
      }

    });
}

function addDepartment(){
  inquirer
    .prompt([
      {
        name: "departmentName",
        type: "input",
        message: "Whats the department name?"
      }
    ]).then(function(answers){
      connection.query('INSERT INTO `department` (`name`) VALUES ("' + answers.departmentName + '");', (error) => {
        if (error) {
          console.log(error);
        } else {
          start();
        }
      });
    })
}

function addRole(){
  // getting the department names from the database
  connection.query('SELECT `id`, `name` FROM `department`', (error, departments) => {
    if (error) {
      console.log(error);
    }
    else {
      inquirer.prompt([
        {
          name: 'title',
          message: 'Enter the title of the role: ',
          type: 'input',
        },
        {
          name: 'salary',
          message: 'Enter the salary of the role: ',
          type: 'input',
        },
        {
          type: 'list',
          name: 'departmentId',
          message: 'Select the department id: ',
          choices: departments.map(department => department.id + '. ' + department.name)
        },
      ])
        .then(function(answers) {
          var department = departments.find((department) => {
            if (answers.departmentId == department.id + '. ' + department.name) {
              return true;
            }

            return false;
          });
  
          connection.query('INSERT INTO `role` (`title`, `salary`, `department_id`) VALUES ("' + answers.title + '", "' + answers.salary + '", "' + department.id + '")', (error) => {
            if (error) {
              console.log(error);
            } else {
              start();
            }
          });
        });
    }
  });
}

function addEmployee(){
  connection.query('SELECT `id`, `title` FROM `role`', (roleError, roles) => {
    if (roleError) {
      console.log(roleError);
    }
    else {
      var managerRole = roles.find(function(role) {
        if (role.title === 'Manager') {
          return true;
        }

        return false;
      });

      // search the roles table for a manager role and find its id
      // search the employees table role_id

      connection.query("SELECT `id`, `first_name`, `last_name` FROM `employee` WHERE `role_id` = " + managerRole.id, (managerError, managers) => {
        if (managerError) {
          console.log(managerError);
        }
        else {
          inquirer
          .prompt([
            {
              name: "firstName",
              type: "input",
              message: "What is the employee's first name?"
            },
            {
              name: "lastName",
              type: "input",
              message: "What is the employee's last name?"
            },
            {
              name: "newEmployeeRole",
              type: "list",
              message: "What is the employee's role?",
              choices: roles.map(role => role.id + '. ' + role.title)
            },
            {
              name: "employeesManager",
              type: "list",
              message: "Who is the employee's manager?",
              choices: [...managers.map(manager => manager.id + '. ' + manager.first_name + " " + manager.last_name), 'None']
            }
          ])
          .then(function(answer){
             // when finished prompting, insert a new item into the db with that info
             var managerId = null;
        
             if (answer.employeesManager != 'None') {
              managerId = answer.employeesManager.split('.')[0];
             } else {
               managerId = null;
             }

             connection.query(
               'INSERT INTO `employee` (`first_name`, `last_name`, `role_id`, `manager_id`) VALUES ("' + answer.firstName + '", "' +answer.lastName+ '", ' + answer.newEmployeeRole.split('.')[0] + ', ' + managerId + '); ',
               function(err) {
                if (err) throw err;
                else{
                  start();
                }
                } 
             );
          });
        }
      });
    }
  });

}

function viewDepartments(){
connection.query("SELECT * FROM `department`",function(err,department){
if (err) throw err;
else{
  for(var i = 0; i < department.length; i++){
    console.log(department[i].id + ". " + department[i].name);
    start();
  }
}
});

};

function viewEmployees(){

}

function updateRoles(){
  connection.query("SELECT `id`, `first_name`, `last_name`, `role_id` FROM `employee`",function(err,employees){
    if (err) throw err;
    else {
      connection.query('SELECT `title` from `role`', function(error, roles) {
        if (error) {
          throw error;
        }
        else {
          var employeeChoices = [];

          for (var i =0; i < employees.length; i++) {
            employeeChoices.push(employees[i].id + '. ' + employees[i].first_name + ' ' + employees[i].last_name);
          }

          var roleChoices = [];

          for (var i = 0; i < roles.length; i++) {
            roleChoices.push(roles[i].id + '. ' + roles[i].title);
          }

          inquirer.prompt([
            {
              type: 'list',
              name: 'employee',
              message: "Select the employee you would like to update",
              choices: employeeChoices,
            },
            {
              type: 'list',
              name: 'newRole',
              message: "Select the role you would like to update",
              choices: roleChoices
            }
          ])
            .then(function(answers) {
              var employeeId = answers.employee.split('.')[0];
              var newRoleId = answers.newRole.split('.')[0];

              // set the role_id to newRoleId
              connection.query('UPDATE `employee` SET `role_id` WHERE `id` = "' + employeeId + '"')
              // call the start function (within the connection.query function)
            })
        }
      });
    }
  });
}