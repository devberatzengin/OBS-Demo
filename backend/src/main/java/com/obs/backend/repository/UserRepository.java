package com.obs.backend.repository;

import com.obs.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameOrEmail(String username, String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
    java.util.List<User> findAllByRoleIn(java.util.Collection<com.obs.backend.model.enums.Role> roles);
    java.util.List<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String q1, String q2);
}
