/**
 * Created by yangyxu on 8/20/14.
 */
var node_mysql = require('mysql');
var __slice = Array.prototype.slice;

module.exports = zn.Class({
    events: [
        'acquire', 
        'connection', 
        'enqueue', 
        'release', 
        'query',
        'queryError',
        'end', 
        'endError', 
        'poolNotExistError',
        'poolConnection',
        'poolConnectionError'
    ],
    properties: {
        config: null,
        pool: null
    },
    methods: {
        init: function (config, events){
            this.initPool(config);
            this.initEvents(events);
        },
        initPool: function (config){
            this._config = zn.extend({
                acquireTimeout: 20000,
                connectionLimit: 100,
                dateStrings: true,
                multipleStatements: true
            }, config);
            this._pool = node_mysql.createPool(this._config);
            this._pool.on('acquire', (connection)=>{
                zn.debug('Mysql connection pool acquire: ' + connection.threadId);
                this.fire('acquire', connection);
            });
            this._pool.on('connection', (connection)=>{
                zn.debug('Mysql connection pool connection: ' + connection.threadId);
                this.fire('connection', connection);
            });
            this._pool.on('enqueue', (connection)=>{
                zn.debug('Mysql connection pool enqueue: ' + connection.threadId);
                this.fire('enqueue', connection);
            });
            this._pool.on('release', (connection)=>{
                zn.debug('Mysql connection pool release: ' + connection.threadId);
                this._pool.removeAllListeners();
                this.fire('release', connection);
            });

            return this;
        },
        initEvents: function (events){
            if(events && typeof events == 'object'){
                for(var key in events){
                    this.on(key, events[key]);
                }
            }

            return this;
        },
        end: function (){
            if(!this._pool){
                return this.fire('poolNotExistError', new Error('Mysql pool is not exist.')), this;
            }

            return this._pool.end((err)=>{
                if(err){
                    this.fire('endError', err);
                }
                this.fire('end', err);
            }), this;
        },
        getConnection: function(callback){
            if(!this._pool){
                return this.fire('poolNotExistError', new Error('Mysql pool is not exist.')), this;
            }

            return this._pool.getConnection(function (err, connection){
                if(err){
                    this.fire('poolConnectionError', err);
                }else{
                    this.fire('poolConnection', connection);
                }

                callback && callback(err, connection, this._pool);
            }.bind(this)), this;
        },
        query: function (){
            if(!this._pool){
                return this.fire('poolNotExistError', new Error('Mysql pool is not exist.')), this;
            }
            var _defer = zn.async.defer(),
                _argv = __slice.call(arguments),
                _sql = _argv.shift();
            if(typeof _sql == 'string' && _argv.length) _sql = _sql.format(_argv);
            this._pool.getConnection(function (err, connection){
                if (err){
                    _defer.reject(err);
                    this.fire('connectionError', err);
                }else {
                    zn.debug('Query: ', _sql);
                    this.fire('query', _sql);
                    connection.query(_sql, function (err, rows, fields){
                        connection.release();
                        if(err){
                            _defer.reject(err);
                            this.fire('queryError', err);
                        }else {
                            _defer.resolve(rows, fields, this._pool);
                        }
                    }.bind(this));
                }
            }.bind(this));

            return _defer.promise;
        },
        fastQuery: function (){
            if(!this._pool){
                return this.fire('poolNotExistError', new Error('Mysql pool is not exist.')), this;
            }
            var _defer = zn.async.defer(),
                _argv = __slice.call(arguments),
                _sql = _argv.shift();
            if(typeof _sql == 'string' && _argv.length) _sql = _sql.format(_argv);
            this.fire('query', _sql);
            this._pool.query(_sql, function (err, rows, fields){
                if(err){
                    _defer.reject(err);
                    this.fire('queryError', err);
                }else {
                    _defer.resolve(rows, fields, this._pool);
                }
            }.bind(this));

            return _defer.promise;
        }
    }
});