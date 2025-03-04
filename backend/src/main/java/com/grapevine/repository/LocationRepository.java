package com.grapevine.repository;

import com.grapevine.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<Location, Long> {
    Location findByShortName(String shortName);
}