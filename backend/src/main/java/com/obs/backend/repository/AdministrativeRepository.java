package com.obs.backend.repository;

import com.obs.backend.model.Administrative;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdministrativeRepository extends JpaRepository<Administrative, Long> {
    Optional<Administrative> findByStaffNumber(String staffNumber);
    Optional<Administrative> findByUsername(String username);
    boolean existsByStaffNumber(String staffNumber);
}
