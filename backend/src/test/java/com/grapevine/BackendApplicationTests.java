package com.grapevine;

import com.grapevine.service.S3Service;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest  // <-- loads the full Spring context
@ActiveProfiles("test")  // <-- picks up application-test.properties
class BackendApplicationTests {

    // Replaces the real S3Service bean with a Mockito mock
    @MockitoBean
    private S3Service s3Service;

    @Test
    void contextLoads() {
        // If anything in your context fails to start, this test will fail
    }
}
