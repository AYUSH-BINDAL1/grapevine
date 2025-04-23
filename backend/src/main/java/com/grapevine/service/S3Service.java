package com.grapevine.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.util.UUID;

@Service
public class S3Service {

    @Value("${spring.cloud.aws.credentials.access-key}")
    private String accessKey;

    @Value("${spring.cloud.aws.credentials.secret-key}")
    private String secretKey;

    @Value("${spring.cloud.aws.endpoint}")
    private String endpoint;

    @Value("${spring.cloud.aws.endpoint.public:http://ec2-3-140-184-86.us-east-2.compute.amazonaws.com:9000}")
    private String publicEndpoint;

    @Value("${spring.cloud.aws.region.static}")
    private String region;

    private S3Client s3Client;
    private final String bucketName = "images";

    @PostConstruct
    public void init() {
        try {
            AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);

            this.s3Client = S3Client.builder()
                    .credentialsProvider(StaticCredentialsProvider.create(credentials))
                    .endpointOverride(URI.create(endpoint))
                    .region(Region.of(region))
                    // Add the path style access configuration
                    .serviceConfiguration(s -> s.pathStyleAccessEnabled(true))
                    .build();
        } catch (Exception e) {
            // Log the error properly
            System.err.println("Error initializing S3 client: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public String uploadFile(MultipartFile file) throws IOException {
        try {
            // Test connectivity first
            URI uri = new URI(endpoint);
            InetAddress.getByName(uri.getHost());

            String fileName = UUID.randomUUID() + "-" + file.getOriginalFilename();
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            return fileName;
        } catch (URISyntaxException | UnknownHostException e) {
            throw new RuntimeException("Cannot connect to file storage service: " + e.getMessage(), e);
        } catch (S3Exception e) {
            throw new RuntimeException("Failed to upload file to S3: " + e.getMessage(), e);
        }
    }

    public void deleteFile(String fileName) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
        } catch (S3Exception e) {
            throw new RuntimeException("Failed to delete file from S3", e);
        }
    }

    public String getPublicUrl(String fileName) {
        return publicEndpoint + "/" + bucketName + "/" + fileName;
    }
}
