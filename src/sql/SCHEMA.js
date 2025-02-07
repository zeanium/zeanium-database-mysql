module.exports = {
    DATABASE: {
        CREATE: "create database {database};"
    },
    TABLE: {
        DROP: 'drop table {table};',
        CREATE: 'create table {table} ({fields}) engine={engine} default charset={charset};',
        INSERT: "insert into {table} {values};",
        UPDATE: "update {table} set {updates} {where};",
        DELETE: "delete from {table} {where};",
        SELECT: "select {fields} from {table} {where} {order} {group};"
    },
    FIELD: {
        ADD: 'alter table {table} add {field} {type};',
        ALTER: 'alter table {table} alter column {field} {type};',
        MODIFY: 'alter table {table} modify column {field} {type};',
        DROP: 'alter table {table} drop column {field};'
    }
};