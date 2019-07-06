/**
 * Created by yangyxu on 8/20/14.
 */
var SchemaSqlParser = require('./schema/SchemaSqlParser');
var SCHEMA = require('./zn.sql.schema');
var __slice = Array.prototype.slice;

module.exports = zn.sql = zn.Class({
    static: true,
    methods: {
        init: function (){
            this._schema = SCHEMA;
        },
        setSessionId: function (sessionid){
            this._sessionId = sessionid;
        },
        getSessionId: function (){
            return this._sessionId;
        },
        rights: function (userId){
            return " (zn_rights_enabled = 0 or (zn_rights_enabled <> 0 and zn_plugin_admin_user_exist({0}, zn_rights_users, zn_rights_roles) <> 0)) ".format(userId || this.getSessionId());
        },
        observeRights: function (userId){
            return " (zn_rights_enabled = 0 or (zn_rights_enabled <> 0 and zn_plugin_admin_user_exist({0}, zn_rights_observe_users, zn_rights_observe_roles) <> 0)) ".format(userId || this.getSessionId());
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
            return sql.format(SchemaSqlParser.parse(_data)).replace(/\s+/g, ' ');
            //return sql.format(SchemaSqlParser.parse(data)).replace(/\s+/g, ' ').replace(/(^s*)|(s*$)/g, '');
        }
    }
});