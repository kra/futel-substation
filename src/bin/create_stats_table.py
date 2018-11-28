#!/usr/bin/env python
""" Create metrics table. """

import sys

import metrics_util

if __name__ == "__main__":
    stats_filename = sys.argv.pop()
    metrics_util.create_table(stats_filename)
