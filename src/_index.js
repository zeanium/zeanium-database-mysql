var node_mysql = require('mysql');
var TransactionBlock = require('./mysql/TransactionBlock');
var ConnectionTransaction = require('./mysql/ConnectionTransaction')
module.exports = {
    createTransactionBlock: function (context){
        return new TransactionBlock(context);
    },
    createConnectionTransaction: function (config, events){
        return new ConnectionTransaction(config, events);
    },
    createConnection: function (config){
        return node_mysql.createConnection(config);
    },
    mysql: node_mysql,
    Connector: require('./Connector'),
    Builder: require('./Builder'),
    SCHEMA: require('./mysql/SCHEMA'),
}