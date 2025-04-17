package com.grapevine.repository;

import com.grapevine.model.Thread;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThreadRepository extends JpaRepository<Thread, Long> {
    List<Thread> findByAuthorEmail(String authorEmail);
    List<Thread> findAllByOrderByCreatedAtDesc();
    List<Thread> findByAuthorEmailOrderByCreatedAtDesc(String authorEmail);
}