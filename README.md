cloud-bucket-migrator
==========

A lightweight library to migrate cloud buckets. 
It includes : upload a local directory to a remote cloud bucket, download a bucket to a local directory or transfer an origin bucket to a target bucket.

<!-- TOC -->

- [Features](#features)
- [Installation](#installation)
- [Loading the module](#loading-and-configuring-the-module)
- [Common Usage](#common-usage)
    - [Download bucket](#download-bucket)
    - [Upload bucket](#upload-bucket)
    - [Migrate bucket](#migrate-bucket)
- [License](#license)

<!-- /TOC -->

## Features

- Download a bucket
- Upload a local directory to a bucket
- Migrate a bucket ( Cross-Account supported ) 

## Support
Currently only AWS S3 buckets operations are supported.

## Installation

```sh
$ npm install cloud-bucket-migrator
```

## Loading the module
```js
const cloudBucketMigrator = require('cloud-bucket-migrator');
```

## Common Usage

#### Download bucket

```js
const path = 'LOCAL_PATH'; 
const platform = 'AWS_S3';
const bucketName = 'ORIGIN_BUCKET_NAME';
const credentials = {
    accessKey: 'ACCESS_KEY',
    secretKey:  'SECRET_KEY'
}

(async function() {
    await cloudBucketMigrator.downloadBucket(platform, credentials, bucketName, path);
})();
```

#### Upload bucket

```js
const path = 'LOCAL_PATH'; 
const platform = 'AWS_S3';
const bucketName = 'TARGET_BUCKET_NAME';
const credentials = {
    accessKey: 'ACCESS_KEY',
    secretKey:  'SECRET_KEY'
}

(async function() {
    await cloudBucketMigrator.uploadBucket(platform, credentials, bucketName, path);
})()
```

#### Migrate bucket

```js
const originPlatform = 'AWS_S3';
const originBucketName = 'ORIGIN_BUCKET_NAME';
const originCredentials = {
    accessKey: 'ORIGIN_ACCESS_KEY',
    secretKey:  'ORIGIN_SECRET_KEY'
}

const targetPlatform = 'AWS_S3';
const targetBucketName = 'TARGET_BUCKET_NAME';
const targetCredentials = {
    accessKey: 'TARGET_ACCESS_KEY',
    secretKey:  'TARGET_SECRET_KEY'
}

(async function() {
    await cloudBucketMigrator.migrateBucket(originPlatform, credentials, originBucketName, targetPlatform, credentials, targetBucketName);       
})();
```

## License

MIT

[npm-url]: https://www.npmjs.com/package/cloud-bucket-migrator
