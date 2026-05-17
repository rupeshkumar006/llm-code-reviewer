# ── Multi-stage Build approach ──────────────────────────────────────────────
# Stage 1: Build the application using Maven in a container.
# This avoids needing native Windows JVM resources or facing native out-of-memory errors on the host.
FROM maven:3.8.5-openjdk-17-slim AS build
WORKDIR /app

# Copy pom.xml first to fetch dependencies and cache this layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy src and compile the package
COPY src ./src
RUN mvn clean package -DskipTests -Dmaven.demo.disable=true

# Stage 2: Create the lightweight execution container
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Add non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the built JAR from the builder stage
COPY --from=build /app/target/code-reviewer-backend-1.0.0.jar app.jar

RUN chown appuser:appgroup app.jar
USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "app.jar"]
