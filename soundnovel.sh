#!/bin/sh

ROOT_PATH=$(dirname $0)
LINK_PATH=$(readlink $0)
if [ $? == 0 ]; then
  ROOT_PATH=$(dirname $LINK_PATH)
fi
PYTHONPATH=$ROOT_PATH:$PYTHONPATH
cd $ROOT_PATH
python ./soundnovel.py $1 
