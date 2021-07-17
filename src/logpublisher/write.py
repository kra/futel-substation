#!/usr/bin/python3

import boto3
import os

import config

input_directory = 'out'
bucket = "logpublish"

s3_client = boto3.client('s3', **config.aws_s3_creds)

def find_files(directory):
    for (r, _, files) in os.walk(directory):
        for filename in files:
            yield (r, filename)

paths = find_files(input_directory)
# Sort and discard all but the latest file.
paths = sorted(paths)
paths = [paths.pop()]

for (directory, filename) in paths:
    path = os.path.join(directory, filename)
    _response = s3_client.upload_file(path, bucket, filename)
