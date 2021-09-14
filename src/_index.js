var node_mysql = require('mysql');
var sql = require('./sql/index.js');
var mysql = require('./mysql/index.js');
var Connector = require('./Connector');
var SqlBuilder = require('./SqlBuilder');

module.exports = {
    createTransactionBlock: function (context){
        return new mysql.TransactionBlock(context);
    },
    createConnectionTransaction: function (config, events){
        return new mysql.ConnectionTransaction(config, events);
    },
    createConnection: function (config){
        return node_mysql.createConnection(config);
    },
    createSqlBuilder: function (session){
        return new SqlBuilder(session);
    },
    createConnector: function (config, events){
        return new Connector(config, events);
    },
    node_mysql: node_mysql,
    sql: sql,
    mysql: mysql
};