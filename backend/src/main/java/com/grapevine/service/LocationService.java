package com.grapevine.service;

import com.grapevine.model.Location;
import com.grapevine.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationService {
    private final LocationRepository locationRepository;
    public List<Location> getAllLocations() {
        System.out.println(locationRepository.findAll());
        return locationRepository.findAll();
    }
}
