const AWS = require('aws-sdk');
const fs = require('fs');
const os = require('os');
const cliProgress = require('cli-progress'); 
const _colors = require('colors');
const utils = require('../utils');

function createBucket(credentials, bucketName, bucketRegion) {
    return new Promise((resolve, reject) => {
        const s3 = new AWS.S3({
            accessKeyId: credentials.accessKey,
            secretAccessKey: credentials.secretKey
        });

        const options = {
            Bucket: bucketName
        };

        s3.createBucket(options, function (err, data) {
            if (err) {
                return reject(err.message);
            } else {
                return resolve();
            }
        })
    })
}

function existsBucket(credentials, bucketName) {
    return new Promise((resolve, reject) => {
        const s3 = new AWS.S3({
            accessKeyId: credentials.accessKey,
            secretAccessKey: credentials.secretKey
        });

        const options = {
            Bucket: bucketName
        };

        s3.headBucket(options, function (err, data) {
            if (err) {
                return resolve(false);
            } else {
                return resolve(true);
            }
        });
    })
}

function listObjects(credentials, bucketName, start, max) {
    return new Promise((resolve, reject) => {
        const s3 = new AWS.S3({
            accessKeyId: credentials.accessKey,
            secretAccessKey: credentials.secretKey
        });

        const options = {
            Bucket: bucketName,
            Delimiter: ';',
            EncodingType: 'url',
            Marker: start,
            MaxKeys: max || 1000,
            RequestPayer: 'requester'
        };

        s3.listObjects(options, function (err, data) {
            if (err) {
                return reject(err.message);
            } else {
                return resolve(data);
            }
        });
    })
}

async function listAllObjects(credentials, bucketName) {
    return new Promise(async (resolve, reject) => {
        let objects = [];
        let list;
    
        do {
            try {
                list = await listObjects(credentials, bucketName, list && list.NextMarker ? list.NextMarker : null, 1000);
            } catch (err) {
                return reject(err);
            }
    
            objects = objects.concat(list.Contents);
        } while (list && list.IsTruncated);
    
        return resolve(objects);
    })
}

function downloadObject(credentials, bucketName, objectKey, targetPath) {
    return new Promise((resolve, reject) => {
        const s3 = new AWS.S3({
            accessKeyId: credentials.accessKey,
            secretAccessKey: credentials.secretKey
        });

        const options = {
            Bucket: bucketName,
            Key: objectKey
        };

        s3.getObject(options, function (err, data) {
            if (err) {
                return reject(err.message);
            }

            const fileWriteMigrate = fs.createWriteStream(targetPath, {
                autoDestroy: true
            });
    
            fileWriteMigrate.end(data.Body);
            
            resolve();
        });
    })
}

function uploadObject(targetCredentials, targetBucketName, objectPath, objectKey) {
    return new Promise((resolve, reject) => {
        const objectReadMigrate = fs.createReadStream(objectPath);
        const s3Target = new AWS.S3({
            accessKeyId: targetCredentials.accessKey,
            secretAccessKey: targetCredentials.secretKey
        });

        const targetOptions = {
            Bucket: targetBucketName,
            Key: objectKey,
            Body: objectReadMigrate
        };

        s3Target.upload(targetOptions, function (err, data) {
            if (err) {
                console.log(err);
                return reject(err.message);
            }
            return resolve();
        })
    })
}

function migrateObject(originCredentials, originBucketName, targetCredentials, targetBucketName, objectKey) {
    return new Promise((resolve, reject) => {
        const s3Origin = new AWS.S3({
            accessKeyId: originCredentials.accessKey,
            secretAccessKey: originCredentials.secretKey
        });

        const originOptions = {
            Bucket: originBucketName,
            Key: objectKey
        };

        s3Origin.getObject(originOptions, function (err, data) {
            if (err && err.code !== 'ERR_STREAM_WRITE_AFTER_END') return reject(err.message);

            const s3Target = new AWS.S3({
                accessKeyId: targetCredentials.accessKey,
                secretAccessKey: targetCredentials.secretKey
            });
    
            const targetOptions = {
                Bucket: targetBucketName,
                Key: objectKey,
                Body: data.Body
            };
    
            s3Target.upload(targetOptions, function (err, data) {
                if (err && err.code !== 'ERR_STREAM_WRITE_AFTER_END') reject(err.message);
                return resolve();
            })
        })
    })
}

module.exports = {
    getBucketInformations: function (credentials, bucketName) {
        return new Promise(async (resolve, reject) => {
            try {
                var list = await listAllObjects(credentials, bucketName);
    
                resolve({
                    count: list.length,
                    size: list.reduce((size, object) => size + object.Size, 0)
                })
            } catch (err) {
                reject({
                    error: err
                })
            }
        })
    },
    downloadBucket: function (originCredentials, originBucketName, rootPath = '') {
        return new Promise(async (resolve, reject) => {
            const start = Date.now();
            const downloadProgressBar = new cliProgress.SingleBar({
                format: 'Download Progress |' + _colors.white('{bar}') + '| {percentage}% | {value}/{total} Files downloaded',
                barCompleteChar: '\u2588',
                barIncompleteChar: '\u2591',
                hideCursor: true
            }, cliProgress.Presets.shades_classic);

            const originBucketExists = await existsBucket(originCredentials, originBucketName);

            if (!originBucketExists) {
                return reject('bucket not exists');
            }

            try {
                const objects = await listAllObjects(originCredentials, originBucketName);

                downloadProgressBar.start(objects.length, 0);
    
                await Promise.all(objects.map((object) => {
                    const filePath = rootPath + '/' + unescape(object.Key.replace(/\+/g, ' '));
                    const fileDirSplitted = filePath.split('/');
                    const fileDir = fileDirSplitted.length === 1 ? fileDirSplitted[0] : fileDirSplitted.splice(0, fileDirSplitted.length - 1).join('/');

                    fs.mkdirSync(fileDir, {
                        recursive: true
                    });

                    let promise = downloadObject(originCredentials, originBucketName, unescape(object.Key.replace(/\+/g, ' ')), filePath);
                    
                    promise.then(() => {
                        downloadProgressBar.increment();
                    })

                    return promise;
                }));
            } catch (err) {
                return reject(err);
            }

            const end = Date.now();
            const elapsedTime = Math.round((end - start)/1000);

            downloadProgressBar.stop();

            console.log('Download time : '+elapsedTime+' s');

            setTimeout(()=>{
                return resolve();
            }, 5000);
        })
    },
    uploadBucket: function (targetCredentials, targetBucketName, rootPath) {
        return new Promise(async (resolve, reject) => {
            const start = Date.now();
            const uploadProgressBar = new cliProgress.SingleBar({
                format: 'Upload Progress |' + _colors.white('{bar}') + '| {percentage}% | {value}/{total} Files uploaded}',
                barCompleteChar: '\u2588',
                barIncompleteChar: '\u2591',
                hideCursor: true
            }, cliProgress.Presets.shades_classic);

            const targetBucketExists = await existsBucket(targetCredentials, targetBucketName);

            if (!targetBucketExists) {
                try {
                    await createBucket(targetCredentials, targetBucketName)
                } catch (err) {
                    console.log(err);
                    return reject('target bucket could not be created');
                }
            }

            let error = false;
            let promises = [];
            let fileList = utils.getFiles(rootPath);
            let cursor = 0;

            uploadProgressBar.start(fileList.length, 0);

            while (cursor < fileList.length && !error) {
                try {
                    let file = fileList[cursor];
                    let objectKey = file.slice(rootPath.length + 1);
                    let promise = uploadObject(targetCredentials, targetBucketName, file, objectKey);
                    
                    promise.then(() => { uploadProgressBar.increment() });
                    promises.push(promise);
                    
                    cursor++;
                } catch (err) {
                    error = true;
                    console.log(err);
                    return reject(err);
                }
            }

            try {
                await Promise.all(promises);
            } catch (err) {
                console.log(err);
                return reject(err);
            }

            const end = Date.now();
            const elapsedTime = Math.round((end - start)/1000);
            
            uploadProgressBar.stop();

            console.log('upload time : '+elapsedTime+' s');

            return resolve();;
        })
    },
    migrateBucket: function (originCredentials, originBucketName, targetCredentials, targetBucketName) {
        return new Promise(async (resolve, reject) => {
            const start = Date.now();
            const migrateProgressBar = new cliProgress.SingleBar({
                format: 'Migrating Progress |' + _colors.white('{bar}') + '| {percentage}% | {value}/{total} Files migrateed',
                barCompleteChar: '\u2588',
                barIncompleteChar: '\u2591',
                hideCursor: true
            }, cliProgress.Presets.shades_classic);

            const originBucketExists = await existsBucket(originCredentials, originBucketName);

            if (!originBucketExists) {
                return reject('origin bucket not exists');
            }

            const targetBucketExists = await existsBucket(targetCredentials, targetBucketName);

            if (!targetBucketExists) {
                try {
                    await createBucket(targetCredentials, targetBucketName)
                } catch (err) {
                    console.log(err);
                    return reject('target bucket could not be created');
                }
            }

            try {
                const objects = await listAllObjects(originCredentials, originBucketName);
                migrateProgressBar.start(objects.length, 0);

                await Promise.all(objects.map((object) => {
                    let promise = migrateObject(originCredentials, originBucketName, targetCredentials, targetBucketName, unescape(object.Key.replace(/\+/g, ' ')));
                    promise.then(() => migrateProgressBar.increment());
                    return promise;
                }));
            } catch (err) {
                return reject(err);
            }

            const end = Date.now();
            const elapsedTime = Math.round((end - start)/1000);
            
            migrateProgressBar.stop();

            console.log('Migrating time : '+elapsedTime+' s');

            return resolve();
        })
    }
}