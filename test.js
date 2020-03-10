const expect = require('chai').expect;
const cloudBucketMigrator = require('./index');
const utils = require('./lib/utils');

const originPlatform = 'AWS_S3';
const originBucketName = 'ORIGIN_BUCKET_NAME';
const originCredentials = {
    accessKey: 'ORIGIN_ACCES_KEY',
    secretKey: 'ORIGIN_SECRET_KEY'
}

const targetPlatform = 'AWS_S3';
const targetBucketName = 'TARGET_BUCKET_NAME';
const targetCredentials = {
    accessKey: 'TARGET_ACCESS_KEY',
    secretKey: 'TARGET_SECRET_KEY'
}

const TEST_DIR = 'tests_downloads';

describe('Test suite', function () {
    this.timeout(500000);

    it('Download process', async function () {
        await cloudBucketMigrator.downloadBucket(originPlatform, originCredentials, originBucketName, TEST_DIR);

        const originInformations = await cloudBucketMigrator.getBucketInformations(originPlatform, originCredentials, originBucketName);
        const localFiles = utils.getFiles(TEST_DIR);

        console.log({
            origin: originInformations
        });

        expect(originInformations.count).to.equal(localFiles.length, "origin bucket and downloaded directory have not the same amount of objects.");
    });

    it('Upload process', async function () {
        await cloudBucketMigrator.uploadBucket(targetPlatform, targetCredentials, targetBucketName, TEST_DIR);

        const targetInformations = await cloudBucketMigrator.getBucketInformations(targetPlatform, targetCredentials, targetBucketName);
        const localFiles = utils.getFiles(TEST_DIR);

        expect(targetInformations.count).to.equal(localFiles.length, "origin bucket and uploaded directory have not the same amount of objects.");
    });

    it('Migrate process', async function () {
        await cloudBucketMigrator.migrateBucket(originPlatform, originCredentials, originBucketName, targetPlatform, targetCredentials, targetBucketName);
        
        const originInformations = await cloudBucketMigrator.getBucketInformations(originPlatform, originCredentials, originBucketName);
        const targetInformations = await cloudBucketMigrator.getBucketInformations(targetPlatform, targetCredentials, targetBucketName);

        expect(originInformations.count).to.equal(targetInformations.count, "origin and target bucket have not the same amount of objects.");
        expect(originInformations.size).to.equal(targetInformations.size, "origin and target buckets have not the same size.");
    });

    after(function() {
        utils.removeDir(TEST_DIR);
    })
})