#!/usr/bin/python3

"""
Clean, format metrics files, write to stdout.
"""

import json
import os

root_dirs = ['/opt/futel/backups/prod']
allow_keys = ['CHANNEL', 'name', 'timestamp']

def line_to_record(line):
    """Return record from line."""
    # 2021-07-13 03:20:30,602 UNIQUEID=1626171620.23333, CHANNEL=SIP/660-00002ae0, CALLERID(number)=+19713512383, name=outgoing-dialtone-wrapper
    timestamp = line[:23]
    line = line[24:].strip()
    [timestamp, _] = timestamp.split(',')
    items = line.split(', ')
    items = dict(item.split('=') for item in items)
    items['timestamp'] = timestamp
    return items

def metric_name_filter(record):
    """Return True if metric name is in whitelist."""
    return True

def strip_record(record):
    """Return record with items not in allow list removed."""
    return dict((k, v) for (k, v) in record.items() if k in allow_keys)

def output(record):
    """Write record to stdout in whatever format we are using."""
    print(json.dumps(record))

def find_files(directories):
    """Yield filenames for all metric files in trees of directories."""
    for directory in directories:
        for (r, _, files) in os.walk(directory):
            for filename in files:
                if filename.startswith("metrics"):
                    yield os.path.join(r, filename)

for filename in find_files(root_dirs):
    with open(filename, 'r') as f:
        records = (line_to_record(l) for l in f)
        records = (r for r in records if metric_name_filter(r))
        records = (strip_record(r) for r in records)
        for record in records:
            output(record)
