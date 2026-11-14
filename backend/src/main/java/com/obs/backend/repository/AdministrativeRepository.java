package com.obs.backend.repository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import com.obs.backend.model.Administrative;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdministrativeRepository extends JpaRepository<Administrative, Long> {
    Optional<Administrative> findByStaffNumber(String staffNumber);
    Optional<Administrative> findByUsername(String username);
    boolean existsByStaffNumber(String staffNumber);

    /** Admin list of staff and admin accounts (plan 4.2). */
    @Query("""
            select x from Administrative x
            where lower(concat(x.firstName, ' ', x.lastName)) like :q escape '\\'
               or lower(x.username) like :q escape '\\' or lower(x.email) like :q escape '\\'
               or lower(x.staffNumber) like :q escape '\\'""")
    Page<Administrative> search(@Param("q") String q, Pageable pageable);
}
