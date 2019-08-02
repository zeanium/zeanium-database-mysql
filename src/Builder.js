/**
 * Created by yangyxu on 8/20/14.
 */
var Parser = require('./mysql/SqlParser');
var SCHEMA = require('./mysql/SCHEMA');
var __slice = Array.prototype.slice;

module.exports = zn.Class({
    static: true,
    properties: {
        SCHEMA: SCHEMA
    },
    methods: {
        init: function (){
            this.parser = new Parser(this);
        },
        paging: function (){
            return __slice.call(arguments).map(function (data){
                var _index = data.pageIndex || 1,
                    _size = data.pageSize || 10,
                    _start = (_index - 1) * _size,
                    _end = _index * _size;

                data.limit = [_start, _size];
                return this.__format(SCHEMA.TABLE.PAGING, data);
            }.bind(this)).join('');
        },
        select: function (){
            return this.format(SCHEMA.TABLE.SELECT, arguments);
        },
        insert: function (){
            return this.format(SCHEMA.TABLE.INSERT, arguments);
        },
        update: function (){
            return this.format(SCHEMA.TABLE.UPDATE, arguments);
        },
        delete: function (){
            return this.format(SCHEMA.TABLE.DELETE, arguments);
        },
        parse: function (sql, data){
            return this.__format(sql, data);
        },
        format: function (sql, argv){
            var _argv = [];
            switch (zn.type(argv)) {
                case 'array':
                    _argv = argv;
                    break;
                case 'object':
                    return this.__format(sql, argv);
                case 'arguments':
                    _argv = __slice.call(argv);
                    break;
            }

            return _argv.map(function (data){
                return this.__format(sql, data);
            }.bind(this)).join('');
        },
        __format: function (sql, data){
            var _data = zn.overwrite({ }, data);
            _data.fields = _data.fields || '*';
            return sql.format(this.parser.parse(_data)).replace(/\s+/g, ' ');
            //return sql.format(Parser.parse(data)).replace(/\s+/g, ' ').replace(/(^s*)|(s*$)/g, '');
        }
    }
});