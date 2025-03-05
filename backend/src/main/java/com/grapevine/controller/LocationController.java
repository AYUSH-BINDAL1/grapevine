package com.grapevine.controller;

import com.grapevine.model.Location;
import com.grapevine.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/locations")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class LocationController {
    private final LocationService locationService;

    @GetMapping("/all")
    public List<Location> getAllLocations(@RequestHeader(name = "Session-Id", required = true) String sessionId) {
        //Returns all the locations in our database
        return locationService.getAllLocations();
    }
}