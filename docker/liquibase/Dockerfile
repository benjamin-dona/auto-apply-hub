FROM liquibase/liquibase:latest

USER root
ADD https://jdbc.postgresql.org/download/postgresql-42.7.4.jar /liquibase/lib/postgresql-42.7.4.jar
RUN chmod 644 /liquibase/lib/postgresql-42.7.4.jar

USER liquibase

ENTRYPOINT ["liquibase"]
CMD ["update"]
