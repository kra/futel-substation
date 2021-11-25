#!/bin/sh                                                                       
# back up futel directories of interest with rsync
# create stats database
# assumes we have a futel user and group locally

BINDIR=/opt/futel/bin
ETCDIR=/opt/futel/etc

HOST=futel-prod.phu73l.net
DIRNAME=prod

REMOTEETCASTERISK=/etc/asterisk
REMOTEVARLIBASTERISK=/var/lib/asterisk
REMOTEVARLOGASTERISK=/var/log/asterisk
REMOTEVARRUNASTERISK=/var/run/asterisk
REMOTEVARSPOOLASTERISK=/var/spool/asterisk
REMOTESBINASTERISK=/sbin/asterisk

KEYFILE=$ETCDIR/ssh/backup_id_rsa
SSHCMD="ssh -o StrictHostKeyChecking=no -i $KEYFILE -p 42422"
USER=backup
DATE=`date "+%Y-%m"`
LOCALDIR=/opt/futel/backups/$DIRNAME/$DATE

# sync backups
rsync -avcR --delete -e "$SSHCMD" $USER@$HOST:$REMOTEETCASTERISK $LOCALDIR
rsync -avcR --delete -e "$SSHCMD" $USER@$HOST:$REMOTEVARLIBASTERISK $LOCALDIR
rsync -avcR --delete -e "$SSHCMD" $USER@$HOST:$REMOTEVARLOGASTERISK $LOCALDIR
rsync -avcR --delete -e "$SSHCMD" $USER@$HOST:$REMOTEVARSPOOLASTERISK $LOCALDIR
rsync -avcR --delete -e "$SSHCMD" $USER@$HOST:$REMOTESBINASTERISK $LOCALDIR

# write stats from backups
$BINDIR/stats-futel-prod.sh
