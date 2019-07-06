module.exports = {
    DATABASE: {
        
    },
    TABLE: {
        DESC: 'desc {table};',
        DROP: 'drop table {table};',
        SHOW: 'show tables;',
        CREATE: 'DROP TABLE IF EXISTS {table};CREATE TABLE {table} ({fields}) ENGINE=innodb DEFAULT CHARSET=utf8;',
        INSERT: "insert into {table} {values};",
        UPDATE: "update {table} set {updates} {where};",
        DELETE: "delete from {table} {where};",
        SELECT: "select {fields} from {table} {where} {order} {group} {limit};",
        PAGING: "select {fields} from {table} {where} {order} {group} {limit};select count(*) as count from {table} {where};"
    },
    FIELD: {
        ADD: 'alter table {table} add {field};',
        MODIFY: 'alter table {table} modify {field};',
        DROP: 'alter table {table} drop {field};'
    }
}