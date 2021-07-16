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

for (directory, filename) in find_files(input_directory):
    path = os.path.join(directory, filename)
    _response = s3_client.upload_file(path, bucket, filename)
