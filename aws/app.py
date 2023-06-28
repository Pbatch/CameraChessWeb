#!/usr/bin/env python3

import aws_cdk as cdk

from aws.aws_stack import AwsStack

env = {'region': 'eu-west-2',
       'account': '068121675185'}
app = cdk.App()
AwsStack(app, "chess", env=env)

app.synth()
