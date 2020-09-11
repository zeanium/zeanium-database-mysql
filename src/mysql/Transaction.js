var __slice = Array.prototype.slice;
module.exports = zn.Class({
    events: ['connect', 'begin', 'query', 'commit', 'rollback', 'disconnect', 'error', 'end', 'finally'],
    properties: {
        connection: null,
        defer: null,
        queue: null
    },
    methods: {
        init: {
            auto: true,
            value: function (config, events){
                this.__initEvents__(events);
                this._defer = zn.async.defer();
                this._queue = zn.queue({}, {
                    error: function (sender, err){
                        return this.rollback(err), false;
                    }.bind(this),
                    stop: function (sender, err){
                        return this.rollback(err), false;
                    }.bind(this),
                    finally: function (){
                        this.fire('finally', __slice.call(arguments), { ownerFirst: true, method: 'apply' });
                    }.bind(this)
                });
            }
        },
        __initEvents__: function (events){
            if(events && typeof events == 'object'){
                for(var key in events){
                    this.on(key, events[key]);
                }
            }

            return this;
        },
        __initConnectionEvents__: function (){
            if(this._connection){
                var _threadId = this._connection.threadId;
                this._connection.on('error', function (err){
                    this.fire('error', err);
                    zn.error('Mysql connection error(' + err.code + '): ', err);
                    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                        this.fire('disconnect', err);
                        zn.error('Mysql connection "'+ _threadId+ '" disconnect.');
                    }
                }.bind(this));
                this._connection.on('end', function (err){
                    if(err){
                        zn.error('Mysql connection "'+ _threadId+ '" end error: ', err);
                        this.fire('error', err);
                    }else{
                        zn.debug('Mysql connection "'+ _threadId+ '" end.');
                        this.fire('end', this._connection);
                    }
                }.bind(this));
            }

            return this;
        },
        begin: function (before, after){
            throw new Error("Transaction 'begin' method not be implemented.");
        },
        query: function(query, before, after, index){
            if(!query && !before){ return this; }
            var _task = this.__parseQueryTask(query, before, after);
            if(index){
                this._queue.insert(_task, null, index);
            }else {
                this._queue.push(_task);
            }

            return this;
        },
        commit: function (before, after){
            throw new Error("Transaction 'commit' method not be implemented.");
        },
        rollback: function (error, callback){
            throw new Error("Transaction 'rollback' method not be implemented.");
        },
        block: function (block, each){
            if(zn.is(block, 'function')){
                block = block.call(this);
            }
            if(!block){
                return this.fire('error', new Error('block is not exist.')), this;
            }

            var _task = null;
            block.each(function (task){
                switch (task.type) {
                    case 'query':
                        _task = this.__parseQueryTask(task.handler, task.before, task.after);
                        break;
                    case 'insert':
                        _task = this.__parseInsertTask(task.handler, task.before, task.after);
                        break;
                }
                this._queue.push(_task);
                each && each(task, _task);
            }, this);

            return this;
        },
        release: function (){
            if(!this._connection){
                return this.fire('error', new Error('Mysql connection is not exist.')), this;
            }

            return this._connection.release(), this;
        },
        connect: function(callback){
            if(!this._connection){
                return this.fire('error', new Error('Mysql connection is not exist.')), this;
            }
            
            return this._connection.connect(function (err){
                callback && callback(err);
                if(err){
                    this.fire('error', err);
                }else {
                    this.fire('connect', this._connection);
                }
            }.bind(this)), this;
        },
        end: function (callback) {
            if(!this._connection){
                return this.fire('error', new Error('Mysql connection is not exist.')), this;
            }
            
            if(this._connection.state=='disconnected'){
                return this;
            }

            return this._connection.end(function (err){
                callback && callback(err);
                if(err){
                    this.fire('error', err);
                }else{
                    this.fire('end', this._connection);
                }
            }.bind(this)), this;
        },
        unshift: function (handler, before, after){
            return this.insert(handler, before, after, 0);
        },
        push: function (handler, before, after){
            return this.insert(handler, before, after, -1);
        },
        insert: function (handler, before, after, index) {
            return this._queue.insert(this.__parseInsertTask(handler, before, after), this, index), this;
        },
        __parseInsertTask: function (handler, before, after){
            return function (task, connection, rows, fields){
                var _callback = null;
                if(before){
                    _callback = before.call(this, handler, rows, fields, this);
                    if(typeof _callback == 'function'){
                        handler = _callback;
                    }
                }
                if(_callback === false){
                    task.stop('Transcation: before call return false.');
                } else if(_callback instanceof Error){
                    task.error(_callback);
                } else if(_callback === -1){
                    task.done(connection, rows, fields);
                } else {
                    _callback = handler.call(this, task, connection, rows, fields);
                    if(_callback === false){
                        task.stop('Transcation: handler call return false.');
                    } else {
                        var _after = after && after.call(this, null, _callback || rows, fields, this);
                        if(_after === false){
                            task.stop('Transcation: after call return false.');
                        } else if(_after instanceof Error){
                            task.error(_after);
                        } else{
                            task.done(connection, _after || rows, fields);
                        }
                    }
                }
            }.bind(this);
        },
        __parseQueryTask: function (query, before, after){
            return function (task, connection, rows, fields){
                var _callback = null,
                    _tag = query;
                if(before){
                    _callback = before.call(this, query, rows, fields, this);
                    if(typeof _callback == 'string'){
                        query = _callback;
                    }else if(zn.is(_callback, 'array')){
                        query = _callback.join('');
                    }
                }
                if(_callback === false){
                    task.stop('Transcation: before call return false.');
                } else if(_callback instanceof Error){
                    task.error(_callback);
                } else if(_callback === -1){
                    task.done(connection, rows, fields);
                } else {
                    if(_callback && _callback.then && typeof _callback.then == 'function') {
                        _callback.then(function (data){
                            var _after = after && after.call(this, null, data, null, this);
                            this.fire('query', [null, data, null], { ownerFirst: true, method: 'apply' });
                            if(_after === false){
                                task.stop('Transcation: after call return false.');
                            } else if(_after instanceof Error){
                                task.error(_after);
                            } else {
                                task.done(connection, (_after || data), null);
                            }
                        }.bind(this), function (err){
                            after && after.call(this, err, null, null, this);
                            this.fire('query', [err, null, null], { ownerFirst: true, method: 'apply' });
                            task.error(err);
                        }.bind(this));
                    }else {
                        zn.debug('Transaction query{0}: '.format(_tag!=query?' [ '+_tag+' ]':''), query);
                        if(zn.is(query, 'array')){
                            query = query.join(' ');
                        }
                        connection.query(query, function (err, rows, fields){
                            var _after = after && after.call(this, err, rows, fields, this);
                            this.fire('query', [err, rows, fields], { ownerFirst: true, method: 'apply' });
                            if(err){
                                task.error(err);
                            }else {
                                if(_after === false){
                                    task.stop('Transcation: after call return false.');
                                } else if(_after instanceof Error){
                                    task.error(_after);
                                } else {
                                    task.done(connection, (_after || rows), fields);
                                }
                            }
                        }.bind(this));
                    }
                }
            }.bind(this);
        }
    }
});