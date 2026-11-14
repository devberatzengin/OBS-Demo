package com.obs.backend.support;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.PersistenceContext;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.springframework.stereotype.Component;

/**
 * Counts the SQL statements a piece of code sends (plan 4.3), with Hibernate statistics.
 * The persistence context is flushed and cleared first: inside a @Transactional test the
 * entities created during setup are still cached, which would hide lazy loads.
 */
@Component
public class QueryCounter {

    @FunctionalInterface
    public interface Action {
        void run() throws Exception;
    }

    private final Statistics statistics;

    @PersistenceContext
    private EntityManager entityManager;

    public QueryCounter(EntityManagerFactory entityManagerFactory) {
        this.statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        this.statistics.setStatisticsEnabled(true);
    }

    public long count(Action action) throws Exception {
        entityManager.flush();
        entityManager.clear();
        statistics.clear();
        action.run();
        return statistics.getPrepareStatementCount();
    }
}
