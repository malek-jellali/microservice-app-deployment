package com.apigateway.zuul;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@TestPropertySource(properties = "eureka.client.enabled=false")
class ZuulApplicationTests {

	@Test
	void contextLoads() {
	}

}
