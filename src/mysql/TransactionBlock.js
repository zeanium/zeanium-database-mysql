/**
 * Created by yangyxu on 8/20/14.
 */
module.exports = zn.Class({
    methods: {
        init: function (context){
            this._tasks = [];
        },
        insert: function (handler, before, after){
            return this._tasks.push({
                type: 'insert',
                handler: handler,
                before: before,
                after: after
            }), this;
        },
        query: function(query, before, after){
            return this._tasks.push({
                type: 'query',
                handler: query,
                before: before,
                after: after
            }), this;
        },
        each: function (handler, context){
            this._tasks.forEach(function (task, index){
                handler && handler.call(context, task, index);
            });

            return this;
        },
        reverseEach: function (handler, context){
            var _len = this._tasks.length;
            for(var i = _len - 1; i > -1; i--){
                handler && handler.call(context, this._tasks[i], i);
            }

            return this;
        }
    }
});