const aws = require('./lib/platforms/aws');

module.exports = {
    downloadBucket: function (originPlatform, originCredentials, originBucketName, rootPath = './download') {
        switch (originPlatform) {
            case 'AWS_S3':
            default:
                return aws.downloadBucket(originCredentials, originBucketName, rootPath);
            break;
        }
    },
    uploadBucket: function (targetPlatform, targetCredentials, targetBucketName, rootPath ='./upload') {
        switch (targetPlatform) {
            case 'AWS_S3':
            default:
                return aws.uploadBucket(targetCredentials, targetBucketName, rootPath);
            break;
        }
    },
    migrateBucket: function (originPlatform, originCredentials, originBucketName, targetPlatform, targetCredentials, targetBucketName) {
        switch(originPlatform) {
            case 'AWS_S3':
            default:
                return aws.migrateBucket(originCredentials, originBucketName, targetCredentials, targetBucketName)
            break;
        }
    },
    getBucketInformations: async function (platform, credentials, bucketName) {
        switch(platform) {
            case 'AWS_S3':
            default:
                return aws.getBucketInformations(credentials, bucketName);
            break;
        }
    }
}