# Etapa de build
FROM maven:3.9.7-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -e -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q -e -DskipTests package

# Etapa de runtime
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/vuln-lab-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
EXPOSE 9000
RUN apt-get update
RUN apt-get install -y iputils-ping netcat-traditional
ENTRYPOINT ["java","-jar","/app/app.jar"]
