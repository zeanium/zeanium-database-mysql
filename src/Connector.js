/**
 * Created by yangyxu on 9/17/14.
 */
var node_mysql = require('mysql');
var ConnectionPool = require('./mysql/ConnectionPool');
var ConnectionPoolTransaction = require('./mysql/ConnectionPoolTransaction');
var ConnectionTransaction = require('./mysql/ConnectionTransaction');
var TransactionBlock = require('./mysql/TransactionBlock');

module.exports = zn.Class({
    statics: {
        getConnector: function (config, events) {
            return new this(config, events);
        }
    },
    properties: {
        config: null,
        pool: null
    },
    methods: {
        init: {
            auto: true,
            value: function (inConfig, inEvents){
                this._config = inConfig;
                this._pool = new ConnectionPool(inConfig, inEvents);
            }
        },
        createTransactionBlock: function (context){
            return new TransactionBlock(context);
        },
        createConnectionTransaction: function (config, events){
            return new ConnectionTransaction(config, events);
        },
        createConnection: function (config){
            return node_mysql.createConnection(config);
        },
        createPoolTransaction: function (events) {
            var _transaction = new ConnectionPoolTransaction(this._pool, events);
            _transaction.on('finally', function (){
                _transaction = null;
                delete _transaction;
            });
            return _transaction;
        },
        createTransaction: function (events){
            var _transaction = new ConnectionTransaction(this._config, events);
            _transaction.on('finally', function (){
                _transaction = null;
                delete _transaction;
            });
            return _transaction;
        },
        beginPoolTransaction: function (events, before, after){
            return this.createPoolTransaction(events).begin(before, after);
        },
        beginTransaction: function (events, before, after){
            return this.createTransaction(events).begin(before, after);
        },
        getPool: function (){
            return this._pool;
        },
        query: function (){
            return this._pool.fastQuery.apply(this._pool, arguments);
        },
        poolQuery: function (){
            return this._pool.query.apply(this._pool, arguments);
        },
        createConnection: function (config, events){
            var _connection = node_mysql.createConnection(config),
                _events = events || {};
            _connection.on('error', _events.error);
            _connection.on('end', _events.end);

            return _connection;
        },
        createDataBase: function () {
            return this._pool.createDataBase();
        }
    }
});