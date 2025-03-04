package com.grapevine;

import org.junit.jupiter.api.Test;
import org.junit.platform.suite.api.SelectPackages;
import org.junit.platform.suite.api.Suite;
import org.springframework.boot.test.context.SpringBootTest;

@Suite
@SelectPackages("com.grapevine")
@SpringBootTest
class BackendApplicationTests {

    @Test
    void contextLoads() {
        // This test ensures Spring context loads correctly
    }
}