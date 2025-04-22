package com.grapevine;

import com.grapevine.service.S3Service;
import org.junit.jupiter.api.Test;
import org.junit.platform.suite.api.SelectPackages;
import org.junit.platform.suite.api.Suite;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.bind.annotation.RestController;
import java.lang.reflect.Constructor;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Map;

@Suite
@SelectPackages("com.grapevine")
@SpringBootTest
@ActiveProfiles("test")
class BackendApplicationTests {

}