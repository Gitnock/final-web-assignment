/*********************************************************************************
*  WEB322 – Assignment 02
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: enock lubega Student ID: 154192181 Date: 10/30/2019
*
*  Online (Heroku) Link: https://web322-ass5.herokuapp.com
*
********************************************************************************/
const express = require("express");
const app = express();
var dataService = require("./data-service");
var dataServiceAuth = require("./data-service-auth");
var clientSessions = require("client-sessions");
var path = require('path');
const port = process.env.PORT || 8080;
const multer = require("multer");
var fs = require('fs');
var bodyParser = require("body-parser");
var exphbs = require("express-handlebars");
function onHttpStart() {
    console.log("Express http server listening on: " + port);
}
app.use(bodyParser.urlencoded({ extended: true }));
const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(express.static("public"));

app.use(function (req, res, next) {
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});

app.use(clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "week10example_web322", // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
  }));

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});

app.engine('.hbs', exphbs({
    extname: '.hbs',
    layoutsDir: __dirname + '/views/layouts/',
    helpers: {
        navLink: function (url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlerbars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
}));
app.set('view engine', '.hbs');


app.get("/", (req, res) => {
    res.render('home');
});

app.get("/about", (req, res) => {
    res.render('about');
});

app.get("/register", (req, res) => {
    res.render('register');
});
app.get("/login", (req, res) => {
    res.render('login');
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    dataServiceAuth.checkUser(req.body).then((user) => {
        req.session.user = {
            userName: user.userName,// authenticated user's userName
            email: user.email,// authenticated user's email
            loginHistory: user.loginHistory// authenticated user's loginHistory
        }
        res.redirect('/employees');
    }).catch(err=>{
        res.render('login', { errorMessage: err, userName: req.body.userName });
    });

});
app.post("/register", (req, res) => {
    dataServiceAuth.registerUser(req.body).then((user) => {
        res.render("register", {successMessage: "User created"});
    }).catch(err=>{
        res.render("register", {errorMessage: err, userName: req.body.userName})
    });

});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect('/');
});

app.get("/userHistory", (req, res) => {
    res.render('userHistory');
});

app.get('/employees',ensureLogin, (req, res) => {
    if (req.query.status) {
        dataService.getEmployeesByStatus(req.query.status)
            .then((data) => {
                if (data.length > 0) res.render("employees", { employees: data });
                else res.render("employees", { message: "no results" })
            })
            .catch((err) => res.render("employees", { message: "no results" }))
    } else if (req.query.manager) {
        dataService.getEmployeesByManager(req.query.manager)
            .then((data) => {
                if (data.length > 0) res.render("employees", { employees: data });
                else res.render("employees", { message: "no results" })
            })
            .catch((err) => res.render("employees", { message: "no results" }))
    } else if (req.query.department) {
        dataService.getEmployeesByDepartment(req.query.department)
            .then((data) => {
                if (data.length > 0) res.render("employees", { employees: data });
                else res.render("employees", { message: "no results" })
            })
            .catch((err) => res.render("employees", { message: "no results" }))
    } else {
        dataService.getAllEmployees()
            .then((data) => {
                if (data.length > 0) res.render("employees", { employees: data });
                else res.render("employees", { message: "no results" })
            })
            .catch((err) => res.render("employees", { message: "no results" }))
    }
});

app.get("/employee/:empNum",ensureLogin, (req, res) => {
    // initialize an empty object to store the values
    let viewData = {};
    dataService.getEmployeeByNum(req.params.empNum).then((data) => {
        if (data) {
            viewData.employee = data; //store employee data in the "viewData" object as "employee"
            console.log("DATA EMPTY");
        } else {
            viewData.employee = null; // set employee to null if none were returned
        }
    }).catch(() => {
        viewData.employee = null; // set employee to null if there was an error
    }).then(dataService.getDepartments)
        .then((data) => {
            viewData.departments = data; // store department data in the "viewData" object as "departments"
            // loop through viewData.departments and once we have found the departmentId that matches
            // the employee's "department" value, add a "selected" property to the matching
            // viewData.departments object
            for (let i = 0; i < viewData.departments.length; i++) {
                if (viewData.departments[i].departmentId == viewData.employee.department) {
                    viewData.departments[i].selected = true;
                }
            }
        }).catch(() => {
            viewData.departments = []; // set departments to empty if there was an error
        }).then(() => {
            if (viewData.employee == null) { // if no employee - return an error
                res.status(404).send("Employee Not Found");
            } else {
                res.render("employee", { viewData: viewData }); // render the "employee" view
            }
        });
});

app.get('/managers',ensureLogin, (req, res) => {
    dataService.getManagers()
        .then((data) => res.render("employee", { employee: data }))
        .catch((err) => res.render("employee", { message: "no results" }));
});

app.get('/departments',ensureLogin, (req, res) => {
    dataService.getDepartments()
        .then((data) => {
            if (data.length > 0) res.render("departments", { departments: data });
            else res.render("departments", { message: "no results" })
        })
        .catch((err) => res.json({ "message": err }));
});

app.get("/employees/add",ensureLogin, (req, res) => {
    dataService.getDepartments()
        .then((data) => res.render("addEmployee", { departments: data }))
        .catch(() => res.render("addEmployee", { departments: [] }))
});
app.get("/images/add",ensureLogin, (req, res) => {
    res.render('addImage', { layout: 'main', template: 'addImage-template' });
});

app.post("/images/add", upload.single("imageFile"), (req, res) => {
    res.redirect("/images");
});
app.get("/images",ensureLogin, (req, res) => {
    fs.readdir("./public/images/uploaded", (err, items) => {
        res.render("images", { data: items, title: "Images" });
    });
});

app.post("/employees/add", (req, res) => {
    dataService.addEmployee(req.body)
    .then(() => {
        res.redirect("/employees");
    }).catch((err) => {
        res.status(500).send("Unable to Add Employees");
    });
});

app.post("/employee/update", function (req, res) {
    dataService.updateEmployee(req.body)
        .then(res.redirect('/employees'))
        .catch((err) => {
            res.status(500).send("Unable to Update Employee");
        });
});

app.get("/departments/add",ensureLogin, (req, res) => {
    res.render("addDepartment");
});

app.post("/departments/add", (req, res) => {
    dataService.addDepartment(req.body)
        .then(() => {
            res.redirect("/departments");
        }).catch((err) => {
            res.status(500).send("Unable to Add Department");
        });
});

app.post("/department/update", (req, res) => {
    console.log(req.body);
    dataService.updateDepartment(req.body)
        .then(() => {
            res.redirect("/departments");
        }).catch((err) => {
            res.status(500).send("Unable to Update Department");
        });
});

app.get("/department/:departmentId",ensureLogin, (req, res) => {
    dataService.getDepartmentById(req.params.departmentId)
        .then((data) => {
            res.render("department", { department: data });
        }).catch((err) => {
            res.status(404).send("Department Not Found");
        });
});

app.get("/departments/delete/:departmentId",ensureLogin, (req, res) => {
    dataService.deleteDepartmentById(req.params.departmentId)
        .then(() => {
            res.redirect("/departments");
        }).catch((err) => {
            res.status(500).send("Unable to Delete Employee");
        });
});


app.get("/employees/delete/:empNum",ensureLogin, (req, res) => {
    dataService.deleteEmployeeByNum(req.params.empNum)
        .then(() => {
            res.redirect("/employees");
        }).catch((err) => {
            res.status(500).send("Unable to Delete Employee");
        });
});

app.get('*', (req, res) => {
    res.status(404);
    res.redirect("https://miro.medium.com/max/800/1*dMtM0XI574DCyD5miIcQYg.png");
});

dataService.initialize()
    .then(dataServiceAuth.initialize)
    .then((data) => {
        app.listen(port, () => onHttpStart());
    })
    .catch((err) => {
        console.log("There was an error initializing: "+err);
    })