#!/usr/bin/python3

import boto3
import config

file_name = "metrics.json"
bucket = "logpublish"

s3_client = boto3.client('s3', **config.aws_s3_creds)
_response = s3_client.upload_file(file_name, bucket, file_name)
