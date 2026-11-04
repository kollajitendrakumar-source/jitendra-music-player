import mongoose from 'mongoose';

let audioBucket = null;
let artworkBucket = null;

export function getAudioBucket() {
  if (!audioBucket && mongoose.connection && mongoose.connection.readyState === 1) {
    audioBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'audio',
    });
  }
  return audioBucket;
}

export function getArtworkBucket() {
  if (!artworkBucket && mongoose.connection && mongoose.connection.readyState === 1) {
    artworkBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'artwork',
    });
  }
  return artworkBucket;
}

// Reset buckets when connection changes
if (mongoose.connection) {
  mongoose.connection.on('disconnected', () => {
    audioBucket = null;
    artworkBucket = null;
  });
}

export async function uploadStreamToGridFS(bucket, stream, filename, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, options);
    stream
      .pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => resolve(uploadStream.id));
  });
}

export async function uploadBufferToGridFS(bucket, buffer, filename, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, options);
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => resolve(uploadStream.id));
    uploadStream.end(buffer);
  });
}

export async function findGridFSFile(bucket, query) {
  const files = await bucket.find(query).limit(1).toArray();
  return files.length > 0 ? files[0] : null;
}

export async function deleteGridFSFile(bucket, fileId) {
  try {
    if (fileId) {
      const id = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
      await bucket.delete(id);
    }
  } catch (err) {
    console.warn(`[GridFS] Failed to delete file ${fileId}:`, err.message);
  }
}

