import { Client } from "minio";
import { env } from "../config/env.js";

const minioClient = new Client({
  endPoint: env.minioEndpoint,
  port: env.minioPort,
  useSSL: env.minioUseSSL,
  accessKey: env.minioAccessKey,
  secretKey: env.minioSecretKey,
});

let bucketReady = false;

const ensureBucket = async () => {
  if (bucketReady) return;
  const exists = await minioClient.bucketExists(env.minioBucket);
  if (!exists) await minioClient.makeBucket(env.minioBucket);
  bucketReady = true;
};

export const uploadObject = async ({ objectKey, buffer, contentType }) => {
  await ensureBucket();
  await minioClient.putObject(env.minioBucket, objectKey, buffer, undefined, {
    "Content-Type": contentType || "application/octet-stream",
  });
  const base = env.minioPublicBaseUrl || `${env.minioUseSSL ? "https" : "http"}://${env.minioEndpoint}:${env.minioPort}`;
  return `${base}/${env.minioBucket}/${objectKey}`;
};

export const deleteObject = async ({ objectKey }) => {
  await ensureBucket();
  await minioClient.removeObject(env.minioBucket, objectKey);
};

export const getObjectStream = async ({ objectKey }) => {
  await ensureBucket();
  return minioClient.getObject(env.minioBucket, objectKey);
};
