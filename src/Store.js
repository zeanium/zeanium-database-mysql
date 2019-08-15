/**
 * Created by yangyxu on 9/17/14.
 */
var ConnectionPool = require('./mysql/ConnectionPool');

module.exports = zn.Class({
    statics: {
        getStore: function (config) {
            return new this(config);
        }
    },
    properties: {
        config: {
            readonly: true,
            get: function (){
                return this._config;
            }
        }
    },
    methods: {
        init: {
            auto: true,
            value: function (inConfig){
                this._config = zn.extend({}, inConfig);
                this._pool = new ConnectionPool(this._config);
            }
        },
        beginTransaction: function (){
            return this._pool.beginTransaction();
        },
        query: function (){
            return this._pool.query.apply(this._pool, arguments);
        },
        createDataBase: function () {
            return this._pool.createDataBase(this._config.database);
        }
    }
});