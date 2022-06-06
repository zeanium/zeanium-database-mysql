var _ = require("./_index.js");

module.exports = zn.Class({
    properties: {
        connector: null,
        sql: null
    },
    methods: {
        init: function (config, events){
            this._connector = _.createConnector(config, events);
            this._sql = _.createSqlBuilder();
        },
        sliceArrayData: function (arrayData, size){
            var _data = [], _ary = [], _length = arrayData.length;
            if(_length < size + 1){
                return [ arrayData ];
            }
            while(arrayData.length > 0){
                if(_ary.length == size) {
                    _data.push(_ary);
                    _ary = [];
                }
                _ary.push(arrayData.shift());
                if(arrayData.length == 0) {
                    _data.push(_ary);
                }
            }
            
            return _data;
        },
        splitArrayData: function (arrayData, size){
            var _totalLength = arrayData.length, _totalSize = Math.ceil(_totalLength / size), _ary = []; 
            for(var i = 0; i < _totalSize; i++) {
                _ary[i] = arrayData.slice(i * size, Math.min((i+1) * size, _totalLength));
            }

            return _ary;
        },
        getConnector: function (){
            return this._connector;
        },
        createTransactionBlock: function (){
            var _connector = this.getConnector();
            if(!_connector){
                throw new zn.ERROR.HttpRequestError({
                    code: 403,
                    message: "HTTP/1.1 403 Connector is Null.",
                    detail: "HTTP/1.1 403 Connector is Null, You Need Configuration For DataBase."
                });
            }

            return _connector.createTransactionBlock();
        },
        beginTransaction: function (events, before, after){
            var _connector = this.getConnector();
            if(!_connector){
                throw new zn.ERROR.HttpRequestError({
                    code: 403,
                    message: "HTTP/1.1 403 Connector is Null.",
                    detail: "HTTP/1.1 403 Connector is Null, You Need Configuration For DataBase."
                });
            }

            return _connector.beginTransaction(events, before, after);
        },
        beginPoolTransaction: function (events, before, after){
            var _connector = this.getConnector();
            if(!_connector){
                throw new zn.ERROR.HttpRequestError({
                    code: 403,
                    message: "HTTP/1.1 403 Connector is Null.",
                    detail: "HTTP/1.1 403 Connector is Null, You Need Configuration For DataBase."
                });
            }

            return _connector.beginPoolTransaction(events, before, after);
        },
        query: function (){
            var _connector = this.getConnector();
            if(!_connector){
                throw new zn.ERROR.HttpRequestError({
                    code: 403,
                    message: "HTTP/1.1 403 Connector is Null.",
                    detail: "HTTP/1.1 403 Connector is Null, You Need Configuration For DataBase."
                });
            }
            return _connector.query.apply(_connector, arguments);
        }
    }
});