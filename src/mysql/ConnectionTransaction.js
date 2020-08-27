/**
 * Created by yangyxu on 8/20/14.
 */
var node_mysql = require('mysql');
var Transaction = require('./Transaction');
var __slice = Array.prototype.slice;

module.exports = zn.Class(Transaction, {
    methods: {
        init: function (config, events){
            this.__initConnection(config);
        },
        __initConnection: function (config){
            this._connection = node_mysql.createConnection(zn.extend({
                dateStrings: true,
                multipleStatements: true
            }, config));
            this.__initConnectionEvents__();
        },
        begin: function (before, after){
            var _self = this,
                _connection = this._connection;
            if(!_connection){
                return this.fire('error', new Error('Mysql connection is not exist.')), this;
            } 
            this._queue.push(function (task){
                var _before = before && before.call(_self, _connection, _self);
                if(_before === false){
                    task.stop(new Error('Transcation begin: before call return false.'));
                }else{
                    task.done(_connection);
                }
                zn.debug('Transaction: start');
                _connection.beginTransaction(function(err) {
                    var _after = after && after.call(_self, err, null, null, _self);
                    _self.fire('begin', [err, null, null], { ownerFirst: true, method: 'apply' });
                    if(err){
                        task.error(err);
                    } else {
                        if(_after === false){
                            task.stop(new Error('Transcation begin: after call return false.'));
                        } else {
                            task.done(_connection, _after, null);
                        }
                    }
                });
            });

            return this;
        },
        commit: function (before, after){
            var _self = this;
            this._queue.push(function (task, connection, rows, fields){
                var _before = before && before.call(_self, rows, fields, _self);
                if(_before === false){
                    task.stop(new Error('Transcation commit: before call return false.'));
                } else if(_before instanceof Error){
                    task.error(_before);
                } else{
                    connection.commit(function (err, commitRows, commitFields){
                        var _after = after && after.call(_self, err, commitRows, commitFields, _self);
                        _self.fire('commit', [err, commitRows, commitFields], { ownerFirst: true, method: 'apply' });
                        if(err){
                            task.error(err);
                        }else {
                            if(_after === false){
                                task.stop(new Error('Transcation commit: after call return false.'));
                            } else if(_after instanceof Error){
                                task.error(_after);
                            } else {
                                task.done(connection, (_after || rows), fields);
                                _self._defer.resolve((_after || rows), fields);
                                _self.destroy();
                            }
                        }
                    });
                }
            }).start();

            return  this._defer.promise;;
        },
        rollback: function (error, callback){
            if(!this._connection){
                return this;
            }
            this.fire('error', error);
            zn.debug('Transaction: rollback');
            this._connection.rollback(function (err, rows, fields){
                this.fire('rollback', [err, rows, fields], { ownerFirst: true, method: 'apply' });
                var _callback = callback && callback.call(this, err, rows, fields);
                if(_callback === false) return;
                if(err){
                    this.fire('error', err);
                }
                this._defer.reject(error || err);
                this.destroy();
            }.bind(this));
            
            return this;
        },
        destroy: function (){
            if(this._connection){
                var _threadId = this._connection.threadId;
                this._connection.end(function (err){
                    if(err){
                        zn.error('Mysql connection end error: ', err);
                    }else{
                        zn.debug('Mysql connection "' + _threadId + '" is ended.');
                    }
                });
                this._connection.destroy();
                this._connection = null;
                delete this._connection;
            }
            if(this._defer){
                this._defer.destroy();
                this._defer = null;
                delete _defer;
            }
            if(this._queue){
                this._queue.destroy();
                this._queue = null;
                delete this._queue;
            }

            return this.dispose(), this;
        }
    }
});