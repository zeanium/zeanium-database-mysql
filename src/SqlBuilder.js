/**
 * Created by yangyxu on 8/20/14.
 */
var Parser = require('./mysql/SqlParser');
var SCHEMA = require('./mysql/SCHEMA');
var __slice = Array.prototype.slice;

module.exports = zn.Class({
    events: [ 
        'joinOn', 'tableFields', 'tableWhere', 'tableOrder', 
        'paging', 'select', 'insert', 'update', 'delete', 
        'format'
    ],
    properties: {
        SCHEMA: null,
        session: null,
        parser: null
    },
    methods: {
        init: function (session){
            this.SCHEMA = SCHEMA;
            this.session = session;
            this.parser = new Parser(this, this);
        },
        loadMetas: function (metas){
            if(metas.methods) {
                for(var key in metas.methods) {
                    this.extendMethod(key, metas.methods[key]);
                }
            }
    
            if(metas.events) {
                for(var key in metas.events) {
                    this.onParserEvent(key, metas.events[key]);
                }
            }

            return this;
        },
        onParserEvent: function (event, handler, context){
            return this.parser.on(event, handler, context), this;
        },
        extendMethod: function (method, methodFunction){
            this[method] = methodFunction;
        },
        joinOn: function (table1, table2, where, type){
            var _keys = [];
            for(var key in where) {
                _keys.push(table1 + '.' + key + ' = ' + table2 + '.' + where[key]);
            }

            var _return  = table1 + " " + (type||'left') + " join " + table2 + " on " + _keys.join(',');
            return this.fire('joinOn', _return, __slice.call(arguments)) || _return;
        },
        tableFields: function (table, fields){
            var _temp = null;
            var _fields = fields.map(function (field){
                if(field.indexOf('.') != -1){
                    _temp = field.split('.');
                    return _temp[0] + "(" + table + '.' + _temp[1] + ")" + (_temp[2] ? ' as ' + _temp[2] : '')
                }else{
                    return table + '.' + field;
                }
            });

            var _return = _fields.join(','); 
            return this.fire('tableFields', _return, __slice.call(arguments)) || _return;
        },
        tableWhere: function (table, where){
            var _objs = {};
            for(var key in where) {
                if(where[key] !== null) {
                    if(key.indexOf('.') == -1){
                        _objs[table + '.' + key] = where[key];
                    }else{
                        _objs[key] = where[key];
                    }
                }
            }

            var _return = _objs; 
            return this.fire('tableWhere', _return, __slice.call(arguments)) || _return;
        },
        tableOrder: function (table, order){
            var _objs = {};
            for(var key in order) {
                if(order[key] !== null) {
                    _objs[table + '.' + key] = order[key];
                }
            }

            var _return = _objs; 
            return this.fire('tableOrder', _return, __slice.call(arguments)) || _return;
        },
        paging: function (){
            var _return = __slice.call(arguments).map(function (data){
                var _index = data.pageIndex || 1,
                    _size = data.pageSize || 10,
                    _start = (_index - 1) * _size,
                    _end = _index * _size;

                data.limit = [_start, _size];
                return this.__format(SCHEMA.TABLE.PAGING, data, 'paging');
            }.bind(this)).join('');

            return this.fire('paging', _return, __slice.call(arguments)) || _return;
        },
        select: function (){
            var _return = this.format(SCHEMA.TABLE.SELECT, arguments, 'select');
            return this.fire('select', _return, __slice.call(arguments)) || _return;
        },
        insert: function (){
            var _return = this.format(SCHEMA.TABLE.INSERT, arguments, 'insert');
            return this.fire('insert', _return, __slice.call(arguments)) || _return;
        },
        update: function (){
            var _return = this.format(SCHEMA.TABLE.UPDATE, arguments, 'update');
            return this.fire('update', _return, __slice.call(arguments)) || _return;
        },
        delete: function (){
            var _return = this.format(SCHEMA.TABLE.DELETE, arguments, 'delete');
            return this.fire('delete', _return, __slice.call(arguments)) || _return;
        },
        parse: function (sql, data, type){
            return this.__format(sql, data, type);
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
        format: function (sql, argv, type){
            var _argv = [];
            switch (zn.type(argv)) {
                case 'array':
                    _argv = argv;
                    break;
                case 'object':
                    return this.__format(sql, argv, type);
                case 'arguments':
                    _argv = __slice.call(argv);
                    break;
            }

            return _argv.map((data)=>{
                return this.__format(sql, data, type);
            }).join('');
        },
        __format: function (sql, data, type){
            var _data = zn.overwrite({ }, data);
            _data.fields = _data.fields || '*';
            _data.type = type;
            var _parseData = this.parser.parse(_data);
            switch(type) {
                case 'insert':

                    break;
                case 'update':

                    break;
                case 'select':

                    break;
                case 'delete':

                    break;
            }
            if(type == 'update' || type == 'select' || type == 'delete'){
                if(_parseData.where != null && typeof _parseData.where == 'string' && _parseData.where.trim().length < 2) {
                    return '';
                }
            }
            var _sql = sql.format(_parseData).replace(/\s+/g, ' ');
            if(_data.noBreak){
                _sql = _sql.replace(';', '');
            }

            return _sql;
            //return sql.format(Parser.parse(data)).replace(/\s+/g, ' ').replace(/(^s*)|(s*$)/g, '');
        }
    }
});