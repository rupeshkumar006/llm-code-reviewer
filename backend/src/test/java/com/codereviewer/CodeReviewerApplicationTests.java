package com.codereviewer;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=MySQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.data.redis.host=localhost",
    "spring.data.redis.port=6379",
    "app.jwt.secret=testSecretKeyThatIsAtLeast256BitsLongForHS256AlgorithmTesting",
    "app.jwt.access-token-expiration=900000",
    "app.jwt.refresh-token-expiration=604800000",
    "app.gemini.api-key=test-placeholder",
    "app.gemini.model=gemini-1.5-flash",
    "app.gemini.max-tokens=8192",
    "spring.security.oauth2.client.registration.google.client-id=placeholder",
    "spring.security.oauth2.client.registration.google.client-secret=placeholder",
    "app.cors.allowed-origins=http://localhost:5173"
})
class CodeReviewerApplicationTests {

    @Test
    void contextLoads() {
        // Verifies that the Spring application context loads without errors
    }
}
