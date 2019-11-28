const Sequelize = require('sequelize');
var sequelize = new Sequelize('d891nuf4i1ev11', 'vnrxmembyftuth', 'd590df6dfdf787a582c74e0e6b0d7abe3dc7325f6aa8eebaba9d1f56fbc8bc7e', {
    host: 'ec2-174-129-253-86.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
    ssl: true
    }
});

var Employee = sequelize.define('Employee',{
    employeeNum:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    hireDate: Sequelize.STRING
});

var Department = sequelize.define('Department',{
    departmentId: {
        type:Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentName: Sequelize.STRING,
});

Department.hasMany(Employee, {foreignKey: 'department'});



sequelize
    .authenticate()
    .then(function() {
        console.log('Connection has been established successfully.');
    })
    .catch(function(err) {
        console.log('Unable to connect to the database:', err);
    });

module.exports.initialize = function() {
    return new Promise((resolve, reject) => {
        sequelize.sync().then(function(){
            resolve();
        }).catch(function(err){
            reject("unable to sync the database");
        });
        
    });
};

module.exports.getAllEmployees = function(){
    return new Promise((resolve, reject) => {
        Employee.findAll().then(function(data){
            resolve(data);
        }).catch(function(err){
            reject("no results returned");
        })
    });
};

module.exports.getManagers = function(){
    return new Promise((resolve, reject) => {
        Employee.findAll({
            where: {isManager:true}
          }).then(function(data){
          resolve(data);
        }).catch(()=>{
            reject("no results returned");
        });
    });
};

module.exports.getDepartments = function(){
    return new Promise((resolve, reject) => {
        Department.findAll().then(function(data){
            resolve(data);
        }).catch((err)=>{
            reject("no results returned");
        })
    });
}; 

module.exports.addEmployee = function(employeeData){
    return new Promise((resolve, reject) => {
        employeeData.isManager = (employeeData.isManager) ? true : false;
        for (var i in employeeData) {
            if (employeeData[i] == "") {
              employeeData[i] = null;
            }
          }
        Employee.create(employeeData)
            .then(()=>resolve())
            .catch((err)=>{reject("failed to create employee:"+err)})
    });
};



module.exports.updateEmployee = function(employeeData){
    return new Promise((resolve, reject) => {
        employeeData.isManager = (employeeData.isManager) ? true : false;
        for(var i in employeeData){
            if(employeeData[i]=="") employeeData[i]=null;
        }
        
        Employee.update(employeeData,
            {where: {employeeNum:employeeData.employeeNum}})
            .then(()=>{resolve()})
            .catch((err)=>{reject("unable to update employee")})
    });
};



module.exports.getEmployeesByStatus = (status) => {
    return new Promise((resolve, reject) => {
       
        Employee.findAll({
            where: {status:status}
          }).then(function(data){
          resolve(data);
        }).catch(()=>{
            reject("no results returned");
        });
    }); 
}

module.exports.getEmployeesByDepartment = (department) => {
    return new Promise((resolve, reject) => {
       
        Employee.findAll({
            where: {department:department}
          }).then(function(data){
          resolve(data);
        }).catch(()=>{
            reject("no results returned");
        });
    }); 
}

module.exports.getEmployeesByManager = (manager) => {
    return new Promise((resolve, reject) => {
        Employee.findAll({
            where: {employeeManagerNum:manager}
          }).then(function(data){
          resolve(data);
        }).catch(()=>{
            reject("no results returned");
        });
    }); 
}

module.exports.getEmployeeByNum = (num) => {
    return new Promise((resolve, reject) => {
        Employee.findAll({
            where: {employeeNum:num}
          }).then(function(data){
          resolve(data[0]);
        }).catch(()=>{
            reject("no results returned");
        });
    }); 
}



module.exports.addDepartment = function(departmentData){
    return new Promise((resolve, reject) => {
        for(i in departmentData){
            if(i=="") i=null;
        }
        Department.create(departmentData)
            .then(()=>resolve())
            .catch((err)=>{reject("unable to create Department")})
    });
};

module.exports.updateDepartment = function(departmentData){
    return new Promise((resolve, reject) => {
        for(var i in departmentData){
            if(departmentData[i]=="") departmentData[i]=null;
        }
        Department.update(departmentData,
            {where: {departmentId:departmentData.departmentId}})
            .then(()=>{resolve()})
            .catch((err)=>{reject("unable to update department")})
    });
};

module.exports.getDepartmentById = function(id){
    return new Promise((resolve, reject) => {
       Department.findAll({
            where:{departmentId: id}
        })
        .then((data)=>resolve(data[0]))
        .catch(()=>reject("no results returned")) 
    });
}

module.exports.deleteDepartmentById = function(id){
    return new Promise((resolve, reject) => {
        Department.destroy({where: {departmentId:id}}) 
        .then(()=>resolve()) 
        .catch(()=>reject("unable to delete Department"))
    });
};


module.exports.deleteEmployeeByNum = function(empNum){
    return new Promise((resolve, reject) => {
        Employee.destroy({where: {employeeNum:empNum}}) 
        .then((data)=>resolve(data)) 
        .catch(()=>reject("unable to delete employee"))
    });
};

