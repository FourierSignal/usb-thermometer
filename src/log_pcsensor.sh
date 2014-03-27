#!/bin/sh

TEMP_C=`/usr/local/bin/pcsensor -c`

#echo $TEMP_C c

mysql -h localhost -u pcsensor --password=pcsensor pcsensor << EOF
update sensor set latest_value=$TEMP_C, latest_value_timestamp=current_timestamp where cv_tag_name='PCSENSOR-1';
insert into temperatures (Name, Timestamp, Value) values ('PCSENSOR-1', current_timestamp , $TEMP_C);
EOF
