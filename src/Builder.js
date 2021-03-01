/**
 * Created by yangyxu on 8/20/14.
 */
var Parser = require('./mysql/SqlParser');
var SCHEMA = require('./mysql/SCHEMA');
var __slice = Array.prototype.slice;

module.exports = zn.Class({
    static: true,
    properties: {
        SCHEMA: null,
        parser: null
    },
    methods: {
        init: function (){
            this.SCHEMA = SCHEMA;
            this.parser = new Parser(this);
        },
        extendMethod: function (method, methodFunction){
            this[method] = methodFunction;
        },
        joinOn: function (table1, table2, where, type){
            var _keys = [];
            for(var key in where) {
                _keys.push(table1 + '.' + key + ' = ' + table2 + '.' + where[key]);
            }
            return "table " + table1 + " " + (type||'left') + " join table " + table2 + " on " + _keys.join(','); 
        },
        tableFields: function (table, fields){
            var _fields = fields.map(function (field){
                return table + '.' + field;
            });
            
            return _fields.join(','); 
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
        table: function (table, data){
            return this.parser.parseTable(table, data);
        },
        fields: function (fields, data) {
            return this.parser.parseFields(fields, data);
        },
        values: function (values, data){
            return this.parser.parseValues(values, data);
        },
        updates: function (updates, data){
            return this.parser.parseUpdates(updates, data);
        },
        where: function (where, addKeyWord){
            return this.parser.parseWhere(where, addKeyWord == undefined ? false : true);
        },
        order: function (order, data){
            return this.parser.parseOrder(order, data);
        },
        group: function (group, data){
            return this.parser.parseGroup(group, data);
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
            var _sql = sql.format(this.parser.parse(_data)).replace(/\s+/g, ' ');
            if(_data.noBreak){
                _sql = _sql.replace(';', '');
            }

            return _sql;
            //return sql.format(Parser.parse(data)).replace(/\s+/g, ' ').replace(/(^s*)|(s*$)/g, '');
        }
    }
});