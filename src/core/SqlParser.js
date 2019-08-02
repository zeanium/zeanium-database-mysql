/**
 * Created by yangyxu on 8/20/14.
 */
var VALUES = {
    DEFAULTS: {
        table: '',
        fields: '*',
        values: '',
        updates: '',
        where: '',
        order: '',
        group: '',
        limit: ''
    }
};

module.exports = zn.Class({
    events: ['parse', 'parseTable', 'parseGroup', 'parseOrder', 'parseValues', 'parseUpdates', 'parseFields', 'parseWhere'],
    methods: {
        init: {
            auto: true,
            value: function (context){
                this._context = context;
            }
        },
        __firstCharUpperCase: function (value){
            return value.replace(/\b(\w)(\w*)/g, function($0, $1, $2) {
                return $1.toUpperCase() + $2;
            });
        },
        __formatSqlValue: function (value){
            if(zn.is(value, 'string') && value!=='now()'){
                if(value.indexOf('{{') === 0 && value.indexOf('}}') === (value.length-2)){
                    value = value.substring(2, value.length - 2);
                }else {
                    value = "'" + value + "'";
                }
            }else if (zn.is(value, 'function')){
                value = value.call(this._context);
            }
        
            return value;
            //return isNaN(value) ? ("'"+value+"'") : value;
        },
        parse: function (data, context){
            var _key = null,
                _value = '',
                _data = {};
            this._context = this._context || context;
            data = this.fire('parse', data, context) || data;
            zn.each(data || {}, function (value, key){
                key = key.toLowerCase();
                _key = this.__firstCharUpperCase(key);
                _value = (this["parse" + _key] && this["parse" + _key].call(this, value)) || '';
                if(_value){
                    _data[key] = " " + _value + " ";
                }
            }.bind(this));
            return zn.overwrite(_data, VALUES.DEFAULTS);
        },
        parseTable: function (table){
            table = this.fire('parseTable', table) || table;
            switch (zn.type(table)){
                case 'string':
                    return table;
                case 'function':
                    return "(" + (table.call(this._context)||'') + ")";
            }
        },
        parseGroup: function (group){
            group = this.fire('parseGroup', group) || group;
            if(zn.is(group, 'function')){
                group = group.call(this._context);
            }
            var _val = '';
            switch (zn.type(group)){
                case 'string':
                    _val = group;
                    break;
                case 'array':
                    _val = group.join(',');
                    break;
            }

            if(_val){
                _val = 'group by ' + _val;
            }
            return _val;
        },
        parseOrder: function (order){
            order = this.fire('parseOrder', order) || order;
            if(zn.is(order, 'function')){
                order = order.call(this._context);
            }
            var _val = '';
            switch (zn.type(order)){
                case 'string':
                    _val = order;
                    break;
                case 'array':
                    _val = order.join(',');
                    break;
                case 'object':
                    var _temp = [];
                    zn.each(order, function (value, key){
                        _temp.push(key+' '+value);
                    });
                    _val = _temp.join(',');
                    break;
            }

            if(_val){
                _val = 'order by ' + _val;
            }

            return _val;
        },
        parseValues: function (data){
            data = this.fire('parseValues', data) || data;
            if(zn.is(data, 'function')){
                data = data.call(this._context);
            }
            switch (zn.type(data)){
                case 'string':
                    return data;
                case 'object':
                    var _keys = [],
                        _values = [];
                    zn.each(data, function (value, key){
                        _keys.push(key);
                        _values.push(this.__formatSqlValue(value));
                    }.bind(this));

                    return "({0}) values ({1})".format(_keys.join(','), _values.join(','));
            }
        },
        parseSets: function (data){
            return this.parseUpdates(data);
        },
        parseUpdates: function (data){
            data = this.fire('parseUpdates', data) || data;
            if(zn.is(data, 'function')){
                data = data.call(this._context);
            }
            switch (zn.type(data)){
                case 'string':
                    return data;
                case 'object':
                    var _updates = [];
                    zn.each(data, function (value, key){
                        _updates.push(key + ' = ' + this.__formatSqlValue(value));
                    }.bind(this));

                    return _updates.join(',');
            }
        },
        parseFields: function (fields){
            fields = this.fire('parseFields', fields) || fields;
            if(zn.is(fields, 'function')){
                fields = fields.call(this._context);
            }
            switch (zn.type(fields)){
                case 'string':
                    return fields;
                case 'function':
                    return fields.call(this._context)||'';
                case 'array':
                    return fields.join(',');
                case 'object':
                    var _fields = [];
                    zn.each(data, function (value, key){
                        _fields.push(value + ' as ' + key);
                    });

                    return _fields.join(',');
            }
        },
        parseWhere: function (where, addKeyWord){
            where = this.fire('parseWhere', where, addKeyWord) || where;
            if(zn.is(where, 'function')){
                where = where.call(this._context);
            }
            var _values = [],
                _return = '';
            switch (zn.type(where)){
                case 'string':
                    _return = where;
                    break;
                case 'array':
                    where.forEach(function (value, index){
                        if(zn.is(value, 'function')){
                            value = value.call(this._context);
                        }
                        switch (zn.type(value)) {
                            case 'string':
                                _values.push(value);
                                break;
                            case 'object':
                                zn.overwrite(value, {
                                    andOr: 'and',
                                    opt: '='
                                });
                                var _val = value.value||'';
                                switch (value.opt) {
                                    case 'like':
                                        _val = this.__like(_val);
                                        break;
                                    case 'in':
                                    case 'not in':
                                        _val = this.__in(_val);
                                    case 'between':
                                    case 'not between':
                                        _val = this.__betweenAnd(_val);
                                        break;
                                }
                                value = [value.andOr, value.key, value.opt, _val];
                            case 'array':
                                _values.push(value.join(' '));
                                break;

                        }
                    }.bind(this));

                    _return = _values.join(' ');
                    break;
                case 'object':
                    var _ors = [];
                    zn.each(where, function (value, key){
                        if(value == null || key == null){
                            return -1;
                        }
                        if(key.indexOf('&') == -1 && key.indexOf('|') == -1){
                            _values.push(key + ' = ' + this.__formatSqlValue(value));
                        }else {
                            if(key.indexOf('&') != -1){
                                switch (key.split('&')[1]) {
                                    case 'like':
                                        value = this.__like(value);
                                        break;
                                    case 'in':
                                    case 'not in':
                                        value = this.__in(value);
                                    case 'between':
                                    case 'not between':
                                        value = this.__betweenAnd(value);
                                        break;
                                }
                                _values.push(key.replace('&', ' ') + ' ' + value);
                            }else if (key.indexOf('|') != -1) {
                                switch (key.split('|')[1]) {
                                    case 'like':
                                        value = this.__like(value);
                                        break;
                                    case 'in':
                                    case 'not in':
                                        value = this.__in(value);
                                    case 'between':
                                    case 'not between':
                                        value = this.__betweenAnd(value);
                                        break;
                                }
                                _ors.push(key.replace('|', ' ') + ' ' + value);
                            }
                        }
                    }.bind(this));

                    _return = _values.join(' and ');
                    if(_ors.length){
                        _return = _return + ' or ' + _ors.join(' or ');
                    }
                    break;
            }

            if(_return.slice(0, 4) == 'and '){
                _return = _return.substring(4);
            }

            if(_return.slice(0, 3) == 'or '){
                _return = _return.substring(3);
            }

            if(_return && addKeyWord !== false){
                _return = 'where ' + _return;
            }

            return _return;
        },
        __like: function (value){
            return "'%" + value + "%'";
        },
        __isNull: function (value){
            return "is null";
        },
        __isNotNull: function (value){
            return "is not null";
        },
        __in: function (ins){
            if(zn.is(ins, 'function')){
                ins = ins.call(this._context);
            }
            ins = ins || '0';
            if(zn.is(ins, 'array')){
                ins = ins.join(',');
            }

            return '('+_val+')';
        },
        __betweenAnd: function (between){
            if(zn.is(between, 'function')){
                between = between.call(this._context);
            }
            switch (zn.type(between)){
                case 'string':
                    return between;
                case 'array':
                    return 'between ' + between[0] + ' and ' + between[1];
            }
        }
    }
});
