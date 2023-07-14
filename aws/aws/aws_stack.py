import shutil

from aws_cdk import (
    Stack,
    CfnOutput,
    RemovalPolicy,
    aws_s3 as s3,
    aws_s3_deployment as s3_deployment,
    aws_cloudfront as cloudfront,
    aws_route53 as route53,
    aws_certificatemanager as acm,
    aws_cloudfront_origins as origins,
    aws_route53_targets as targets,
    aws_lambda,
    aws_apigateway as api_gw
)
from constructs import Construct


class AwsStack(Stack):
    SITE_SUB_DOMAIN = "chess"
    DOMAIN_NAME = 'andrewcrew.com'
    CERTIFICATE_ARN = "arn:aws:acm:us-east-1:068121675185:certificate/4e8f8162-9c87-41ee-951c-878c6e5e2c5a"
    ENDPOINT_BASENAME = 'tracker'

    def setup_bucket(self):
        bucket = s3.Bucket(self, 'my_website_bucket',
                           bucket_name=self.site_domain,
                           public_read_access=False,
                           block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
                           removal_policy=RemovalPolicy.DESTROY,
                           auto_delete_objects=True)

        return bucket

    def setup_bucket_deployment(self):
        asset_path = '../website/dist'
        deployment = s3_deployment.BucketDeployment(self, 'my_deployment',
                                                    destination_bucket=self.bucket,
                                                    sources=[s3_deployment.Source.asset(asset_path)],
                                                    distribution=self.distribution,
                                                    distribution_paths=['/*'])
        return deployment

    def setup_zone(self):
        zone = route53.PublicHostedZone(self, 'my_zone',
                                        zone_name=self.DOMAIN_NAME)
        return zone

    def setup_route53_record(self):
        target = targets.CloudFrontTarget(distribution=self.distribution)
        record = route53.ARecord(self, 'my_record',
                                 record_name=self.site_domain,
                                 target=route53.RecordTarget.from_alias(target),
                                 zone=self.zone)
        return record

    def setup_cloudfront_distribution(self):
        certificate = acm.Certificate.from_certificate_arn(self, 'my_certificate',
                                                           certificate_arn=self.CERTIFICATE_ARN)
        default_behavior = {'origin': origins.S3Origin(self.bucket),
                            'allowed_methods': cloudfront.AllowedMethods.ALLOW_ALL,
                            'viewer_protocol_policy': cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS}
        distribution = cloudfront.Distribution(self, 'my_distribution',
                                               default_behavior=default_behavior,
                                               domain_names=[self.site_domain],
                                               minimum_protocol_version=cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
                                               ssl_support_method=cloudfront.SSLMethod.SNI,
                                               certificate=certificate,
                                               default_root_object='index.html'
                                               )
        return distribution

    def setup_lambda(self):
        shutil.make_archive('tracker', 'zip', 'tracker')
        shutil.make_archive('layer', 'zip', 'layer')

        pychess_layer = aws_lambda.LayerVersion(self, 'chess_layer',
                                                code=aws_lambda.Code.from_asset('layer.zip'),
                                                compatible_runtimes=[aws_lambda.Runtime.PYTHON_3_8])

        scipy_layer_arn = "arn:aws:lambda:eu-west-2:142628438157:layer:AWSLambda-Python38-SciPy1x:107"
        scipy_layer = aws_lambda.LayerVersion.from_layer_version_arn(self, 'scipy_layer',
                                                                     layer_version_arn=scipy_layer_arn)

        lambda_ = aws_lambda.Function(self, 'my_lambda',
                                      code=aws_lambda.Code.from_asset('tracker.zip'),
                                      handler='lambda_function.lambda_handler',
                                      runtime=aws_lambda.Runtime.PYTHON_3_8,
                                      layers=[pychess_layer, scipy_layer],
                                      memory_size=3008)
        return lambda_

    def setup_api(self):
        api = api_gw.RestApi(self, 'my_api',
                             rest_api_name='tracker')

        entity = api.root.add_resource(
            'tracker',
            default_cors_preflight_options=api_gw.CorsOptions(
                allow_methods=['POST'],
                allow_origins=api_gw.Cors.ALL_ORIGINS)
        )

        integration_responses = [api_gw.IntegrationResponse(status_code="200",
                                                            response_parameters={
                                                                'method.response.header.Access-Control-Allow-Origin': "'*'"})]
        integration = api_gw.LambdaIntegration(
            self.lambda_,
            proxy=False,
            integration_responses=integration_responses
        )

        method_response = api_gw.MethodResponse(status_code="200",
                                                response_parameters={
                                                    'method.response.header.Access-Control-Allow-Origin': True})
        entity.add_method(
            http_method='POST',
            integration=integration,
            method_responses=[method_response]
        )
        return api

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.site_domain = f'{self.SITE_SUB_DOMAIN}.{self.DOMAIN_NAME}'
        self.bucket = self.setup_bucket()
        self.zone = self.setup_zone()
        self.distribution = self.setup_cloudfront_distribution()
        self.deployment = self.setup_bucket_deployment()
        self.record = self.setup_route53_record()
        self.lambda_ = self.setup_lambda()
        self.api = self.setup_api()

        d = {'bucket': self.bucket.bucket_name,
             'region': self.region,
             'url': f'https://{self.site_domain}',
             'distribution_url': f'https://{self.distribution.domain_name}'
             }
        for key, value in d.items():
            CfnOutput(self, key, value=value)
