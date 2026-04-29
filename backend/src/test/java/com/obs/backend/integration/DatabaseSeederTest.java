package com.obs.backend.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import javax.sql.DataSource;

@SpringBootTest
public class DatabaseSeederTest {

    @Autowired
    private DataSource dataSource;

    @Test
    void seedDatabase() {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.addScript(new ClassPathResource("test_data_seeder.sql"));
        populator.execute(dataSource);
        System.out.println("TEST DATA SEEDED SUCCESSFULLY VIA JDBC! ✅");
    }
}
