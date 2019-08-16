/**
 * Created by yangyxu on 9/17/14.
 */
var ConnectionPool = require('./mysql/ConnectionPool');

module.exports = zn.Class({
    statics: {
        getConnector: function (config) {
            return new this(config);
        }
    },
    properties: {
        pool: {
            readonly: true,
            get: function (){
                return this._pool;
            }
        }
    },
    methods: {
        init: {
            auto: true,
            value: function (inConfig){
                this._pool = new ConnectionPool(inConfig);
            }
        },
        beginTransaction: function (){
            return this._pool.beginTransaction();
        },
        query: function (){
            return this._pool.query.apply(this._pool, arguments);
        },
        createDataBase: function () {
            return this._pool.createDataBase();
        }
    }
});