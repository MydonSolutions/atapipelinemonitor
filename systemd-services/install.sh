#!/bin/bash 

if [[ $EUID > 0 ]]
then 
  echo "Please run with super-user privileges"
  exit 1
else
	cp ./hashpipe_monitor.service /etc/systemd/system/

	systemctl disable hashpipe_monitor.service
	systemctl daemon-reload
	systemctl enable hashpipe_monitor.service
fi