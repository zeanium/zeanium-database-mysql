var SCHEMA = require('../core/SCHEMA');
var MYSQL = {
    DATABASE: {
        CREATE: "drop database if exists {database};create database if not exists {database};"
    },
    TABLE: {
        DESC: 'desc {table};',
        SHOW: 'show tables;',
        CREATE: 'drop table if exists {table};create table {table} ({fields}) engine=innodb default charset=utf8;',
        SELECT: "select {fields} from {table} {where} {order} {group} {limit};",
        PAGING: "select {fields} from {table} {where} {order} {group} {limit};select count(zxnz_ID) as count from {table} {where};"
    },
    FIELD: {
        ADD: 'alter table {table} add {field};',
        MODIFY: 'alter table {table} modify {field};',
        DROP: 'alter table {table} drop {field};'
    }
};
var __deepCopy = function (source, target){
    for(var key in source){
        if(zn.is(source[key], 'plain')){
            target[key] = __deepCopy(source[key], target[key]);
        } else {
            if(target[key] === undefined && source[key] !== undefined){
                target[key] = source[key];
            }
        }
    }
    return target
}

module.exports = __deepCopy(SCHEMA, MYSQL);