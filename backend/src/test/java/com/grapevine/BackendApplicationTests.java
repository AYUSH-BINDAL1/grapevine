package com.grapevine;

import com.grapevine.service.S3Service;
import org.junit.jupiter.api.Test;
import org.junit.platform.suite.api.SelectPackages;
import org.junit.platform.suite.api.Suite;
import org.mockito.Mockito;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.TestPropertySource;

@Suite
@SelectPackages("com.grapevine")
@SpringBootTest
@TestPropertySource(properties = {
        "spring.cloud.aws.credentials.access-key=test",
        "spring.cloud.aws.credentials.secret-key=test",
        "spring.cloud.aws.region.static=us-east-1",
        "spring.cloud.aws.s3.bucket=test-bucket"
})
class BackendApplicationTests {

    @Test
    void contextLoads() {
        // This test ensures Spring context loads correctly
    }

    @TestConfiguration
    static class TestConfig {
        @Bean
        @Primary
        public S3Service s3Service() {
            return Mockito.mock(S3Service.class);
        }
    }
}