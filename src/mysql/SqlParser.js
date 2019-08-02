var SqlParser = require('../core/SqlParser');
module.exports = zn.Class(SqlParser, {
    events: ['parseLimit'],
    methods: {
        parseLimit: function (limit){
            if(zn.is(limit, 'function')){
                limit = limit.call(this._context);
            }
            var _val = '';
            switch (zn.type(limit)){
                case 'string':
                    _val = limit;
                    break;
                case 'array':
                    _val = limit[0] + ',' + limit[1];
                    break;
            }

            if(_val){
                _val = 'limit ' + _val;
            }

            return _val;
        }
    }
});
