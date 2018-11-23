#!/bin/sh                                                                       
# back up futel directories of interest with rsync
# create stats database
# assumes we have a futel user and group locally

HOST=futel-prod.phu73l.net
DIRNAME=prod

BINDIR=/opt/futel/bin
REMOTEDIR=/opt/asterisk
KEYFILE=/opt/futel/etc/ssh/backup_id_rsa
SSHCMD="ssh -o StrictHostKeyChecking=no -i $KEYFILE -p 42422"
USER=backup
DATE=`date "+%Y-%m"`
LOCALDIR=/opt/futel/var/spool/backups/$DIRNAME/$DATE

# sync backups
rsync -avcR --delete -e "$SSHCMD" $USER@$HOST:$REMOTEDIR $LOCALDIR
# write stats from backups
$BINDIR/stats-futel-prod.sh
