var node_mysql = require('mysql');
var sql = require('./sql/index.js');
var mysql = require('./mysql/index.js');
var Connector = require('./Connector');
var SqlBuilder = require('./SqlBuilder');
var SqlClient = require('./SqlClient');

module.exports = {
    sql: sql,
    mysql: mysql,
    node_mysql: node_mysql,
    SqlClient: SqlClient,
    SqlBuilder: SqlBuilder,
    Connector: Connector,
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
    }
};