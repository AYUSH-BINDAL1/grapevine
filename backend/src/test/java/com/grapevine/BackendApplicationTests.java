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
import org.springframework.test.context.ActiveProfiles;

@Suite
@SelectPackages("com.grapevine")
@SpringBootTest
@ActiveProfiles("test")
class BackendApplicationTests {

    @Test
    void contextLoads() {
        // This test verifies the Spring context loads correctly
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