/**
 * Created by yangyxu on 8/20/14.
 */
var __slice = Array.prototype.slice;
var Transaction = require('./Transaction');
module.exports = zn.Class(Transaction, {
    methods: {
        init: function (pool, events){
            this.setPool(pool);
        },
        setPool: function (pool){
            if(!pool){
                return this.fire('error', new Error('setPool pool is not exist.')), this;
            }
            pool.on('error', function (err){
                this.rollback(err);
            }.bind(this));
            this._pool = pool;
        },
        begin: function (before, after){
            var _self = this;
            this._queue.push(function (task){
                _self._pool.getConnection(function (err, connection){
                    if(err){
                        task.error(err);
                    } else {
                        var _before = before && before.call(_self, connection, _self);
                        if(_before === false){
                            task.stop(new Error('Transcation begin: before call return false.'));
                        } else {
                            _self._connection = connection;
                            _self.__initConnectionEvents__();
                            task.done(connection);
                        }
                    }
                });
            }).push(function (task, connection){
                zn.debug('Transaction: start');
                connection.query('START TRANSACTION', function (err, rows, fields) {
                    var _after = after && after.call(_self, err, rows, fields, _self);
                    _self.fire('begin', [err, rows, fields], { ownerFirst: true, method: 'apply' });
                    if(err){
                        task.error(err);
                    } else {
                        if(_after === false){
                            task.stop(new Error('Transcation begin: after call return false.'));
                        } else {
                            task.done(connection, (_after || rows), fields);
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
                }else{
                    zn.debug('Transaction: commit');
                    connection.query('COMMIT', function (err, rows, fields){
                        var _after = after && after.call(_self, err, rows, fields, _self);
                        _self.fire('commit', [err, rows, fields], { ownerFirst: true, method: 'apply' });
                        if(err){
                            task.error(err);
                        }else {
                            if(_after === false){
                                task.stop(new Error('Transcation commit: after call return false.'));
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
            this._connection.query('ROLLBACK', function (err, rows, fields){
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
                this._connection.release();
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
