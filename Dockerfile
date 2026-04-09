
FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY backend/ .

RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY --from=build /app/target/reviewin-backend-1.0.0.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]

