package com.obs.backend.repository;

import com.obs.backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByTimestampDesc(Long userId);

    /**
     * One notification for every active user with one of the roles, in a single statement
     * (plan 4.2): no user rows are loaded and the database writes them in one pass.
     */
    @Modifying
    @Query(value = "INSERT INTO notifications (user_id, title, message, is_read, timestamp) "
            + "SELECT u.id, :title, :message, false, now() FROM users u "
            + "WHERE u.is_active AND u.role IN (:roles)", nativeQuery = true)
    int notifyAllWithRoles(@Param("title") String title, @Param("message") String message,
                           @Param("roles") Collection<String> roles);
}
